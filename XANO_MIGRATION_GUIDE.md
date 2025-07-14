# 🚀 Complete Migration Guide: Node.js Backend → Xano

## Overview
This guide will help you migrate your current Node.js/Express backend with SQLite to Xano, a no-code backend platform.

## Current Setup Analysis
Your current backend includes:
- ✅ User authentication (register/login)
- ✅ Email confirmation system
- ✅ SQLite database
- ✅ Stripe payment integration
- ✅ JWT token authentication
- ✅ Rate limiting
- ✅ CORS configuration

## Step 1: Set Up Xano Account

### 1.1 Create Xano Account
1. Go to [xano.com](https://xano.com)
2. Sign up for a free account
3. Create a new project (e.g., "Ascends Backend")

### 1.2 Initial Project Setup
1. **API Base URL**: Note your API base URL (e.g., `https://your-project.xano.app/api:main`)
2. **API Key**: Generate an API key in Settings → API Keys
3. **Database**: Xano uses PostgreSQL (automatically managed)

## Step 2: Database Migration

### 2.1 Create Database Tables in Xano

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmation_token VARCHAR(255),
    is_premium BOOLEAN DEFAULT FALSE,
    stripe_customer_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    premium_purchased_at TIMESTAMP,
    trial_start_time TIMESTAMP
);
```

#### Steps in Xano:
1. Go to **Database** → **Tables**
2. Click **"Add Table"**
3. Name it `users`
4. Add columns with these settings:

| Column Name | Type | Constraints |
|-------------|------|-------------|
| id | Integer | Primary Key, Auto Increment |
| email | Text | Unique, Not Null |
| password_hash | Text | Not Null |
| is_confirmed | Boolean | Default: false |
| confirmation_token | Text | Nullable |
| is_premium | Boolean | Default: false |
| stripe_customer_id | Text | Nullable |
| stripe_payment_intent_id | Text | Nullable |
| created_at | Timestamp | Default: now() |
| confirmed_at | Timestamp | Nullable |
| premium_purchased_at | Timestamp | Nullable |
| trial_start_time | Timestamp | Nullable |

### 2.2 Migrate Existing Data (Optional)
If you have existing users, you can export from SQLite and import to Xano:

```bash
# Export SQLite data
sqlite3 backend/database.sqlite ".dump users" > users_export.sql

# Convert to PostgreSQL format and import to Xano
# (You'll need to manually convert the INSERT statements)
```

## Step 3: API Endpoints Setup

### 3.1 Authentication Endpoints

#### Register Endpoint
1. Go to **API** → **Functions**
2. Create new function: `auth_register`
3. Set HTTP method to `POST`
4. Add this code:

```javascript
// Input validation
const { email, password, confirmPassword } = $request.body;

if (!email || !password || !confirmPassword) {
    return $response.json({
        error: 'All fields are required'
    }, 400);
}

if (password !== confirmPassword) {
    return $response.json({
        error: 'Passwords do not match'
    }, 400);
}

if (password.length < 8) {
    return $response.json({
        error: 'Password must be at least 8 characters long'
    }, 400);
}

// Check if user exists
const existingUser = await $db.get('users', {
    filter: {
        email: email
    }
});

if (existingUser) {
    if (!existingUser.is_confirmed) {
        // Resend confirmation email
        const newToken = $utils.uuid();
        await $db.update('users', {
            filter: { email: email },
            data: { confirmation_token: newToken }
        });
        
        // Send email (we'll set up email service later)
        await $email.send({
            to: email,
            subject: 'Confirm Your Account',
            template: 'email_confirmation',
            data: { token: newToken }
        });
        
        return $response.json({
            message: 'Account already exists. A new confirmation email has been sent.',
            emailVerificationSent: true
        });
    }
    
    return $response.json({
        error: 'User already exists and is confirmed. Please login.'
    }, 409);
}

// Hash password
const passwordHash = await $utils.bcrypt.hash(password, 12);

// Generate confirmation token
const confirmationToken = $utils.uuid();

// Create user
const user = await $db.create('users', {
    email: email,
    password_hash: passwordHash,
    confirmation_token: confirmationToken,
    is_confirmed: false
});

// Send confirmation email
await $email.send({
    to: email,
    subject: 'Confirm Your Account',
    template: 'email_confirmation',
    data: { token: confirmationToken }
});

return $response.json({
    message: 'User registered successfully. Please check your email to confirm your account.',
    userId: user.id,
    email: user.email
}, 201);
```

#### Login Endpoint
1. Create function: `auth_login`
2. Set HTTP method to `POST`
3. Add this code:

```javascript
const { email, password } = $request.body;

if (!email || !password) {
    return $response.json({
        error: 'Email and password are required'
    }, 400);
}

// Find user
const user = await $db.get('users', {
    filter: { email: email }
});

if (!user) {
    return $response.json({
        error: 'Invalid credentials'
    }, 401);
}

// Verify password
const isValidPassword = await $utils.bcrypt.compare(password, user.password_hash);

if (!isValidPassword) {
    return $response.json({
        error: 'Invalid credentials'
    }, 401);
}

if (!user.is_confirmed) {
    return $response.json({
        error: 'Please confirm your email before logging in'
    }, 401);
}

// Generate JWT token
const token = $utils.jwt.sign({
    userId: user.id,
    email: user.email,
    isPremium: user.is_premium
}, $env.JWT_SECRET, { expiresIn: '7d' });

return $response.json({
    message: 'Login successful',
    token: token,
    user: {
        id: user.id,
        email: user.email,
        isPremium: user.is_premium
    }
});
```

#### Confirm Email Endpoint
1. Create function: `auth_confirm_email`
2. Set HTTP method to `GET`
3. Add this code:

```javascript
const { token } = $request.query;

if (!token) {
    return $response.json({
        error: 'Confirmation token required'
    }, 400);
}

// Find and confirm user
const result = await $db.update('users', {
    filter: { 
        confirmation_token: token,
        is_confirmed: false
    },
    data: {
        is_confirmed: true,
        confirmed_at: new Date(),
        confirmation_token: null
    }
});

if (result.affected_rows === 0) {
    return $response.json({
        error: 'Invalid or expired confirmation token'
    }, 400);
}

return $response.json({
    message: 'Email confirmed successfully. You can now login.'
});
```

### 3.2 Protected Routes
Create a middleware function for JWT authentication:

1. Create function: `auth_middleware`
2. Set as **Internal Function** (not exposed as endpoint)
3. Add this code:

```javascript
const authHeader = $request.headers.authorization;
const token = authHeader && authHeader.split(' ')[1];

if (!token) {
    return $response.json({
        error: 'Access token required'
    }, 401);
}

try {
    const decoded = $utils.jwt.verify(token, $env.JWT_SECRET);
    $request.user = decoded;
    return $response.next();
} catch (error) {
    return $response.json({
        error: 'Invalid token'
    }, 403);
}
```

### 3.3 User Profile Endpoint
1. Create function: `user_profile`
2. Set HTTP method to `GET`
3. Add middleware: `auth_middleware`
4. Add this code:

```javascript
const user = await $db.get('users', {
    filter: { id: $request.user.userId }
});

if (!user) {
    return $response.json({
        error: 'User not found'
    }, 404);
}

return $response.json({
    user: {
        id: user.id,
        email: user.email,
        isPremium: user.is_premium,
        createdAt: user.created_at,
        confirmedAt: user.confirmed_at,
        premiumPurchasedAt: user.premium_purchased_at
    }
});
```

## Step 4: Stripe Integration

### 4.1 Stripe Webhook Endpoint
1. Create function: `stripe_webhook`
2. Set HTTP method to `POST`
3. Add this code:

```javascript
const sig = $request.headers['stripe-signature'];
const endpointSecret = $env.STRIPE_WEBHOOK_SECRET;

let event;

try {
    event = $stripe.webhooks.constructEvent($request.body, sig, endpointSecret);
} catch (err) {
    return $response.json({
        error: 'Webhook signature verification failed'
    }, 400);
}

// Handle the event
switch (event.type) {
    case 'checkout.session.completed':
        const session = event.data.object;
        
        // Update user to premium
        await $db.update('users', {
            filter: { stripe_customer_id: session.customer },
            data: {
                is_premium: true,
                premium_purchased_at: new Date(),
                stripe_payment_intent_id: session.payment_intent
            }
        });
        break;
        
    case 'customer.subscription.deleted':
        const subscription = event.data.object;
        
        // Remove premium status
        await $db.update('users', {
            filter: { stripe_customer_id: subscription.customer },
            data: {
                is_premium: false
            }
        });
        break;
        
    default:
        console.log(`Unhandled event type ${event.type}`);
}

return $response.json({ received: true });
```

### 4.2 Create Checkout Session
1. Create function: `stripe_create_checkout`
2. Set HTTP method to `POST`
3. Add middleware: `auth_middleware`
4. Add this code:

```javascript
const { priceId } = $request.body;

if (!priceId) {
    return $response.json({
        error: 'Price ID is required'
    }, 400);
}

// Get user
const user = await $db.get('users', {
    filter: { id: $request.user.userId }
});

let customerId = user.stripe_customer_id;

// Create customer if doesn't exist
if (!customerId) {
    const customer = await $stripe.customers.create({
        email: user.email
    });
    
    customerId = customer.id;
    
    // Update user with customer ID
    await $db.update('users', {
        filter: { id: user.id },
        data: { stripe_customer_id: customerId }
    });
}

// Create checkout session
const session = await $stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{
        price: priceId,
        quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${$env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${$env.FRONTEND_URL}/payment/cancel`,
});

return $response.json({
    sessionId: session.id,
    url: session.url
});
```

## Step 5: Email Service Setup

### 5.1 Configure Email Provider
1. Go to **Settings** → **Email**
2. Choose your email provider (SendGrid, Mailgun, etc.)
3. Configure SMTP settings

### 5.2 Email Templates
Create email templates in Xano:

#### Confirmation Email Template
1. Go to **Email** → **Templates**
2. Create template: `email_confirmation`
3. HTML content:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Confirm Your Account</title>
</head>
<body>
    <h2>Welcome to Ascends!</h2>
    <p>Please confirm your email address by clicking the link below:</p>
    <a href="{{$env.FRONTEND_URL}}/confirm-email?token={{token}}">
        Confirm Email
    </a>
    <p>If you didn't create this account, you can safely ignore this email.</p>
</body>
</html>
```

## Step 6: Environment Variables

### 6.1 Set Up Environment Variables
Go to **Settings** → **Environment Variables** and add:

```
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-frontend.vercel.app
```

## Step 7: Update Frontend

### 7.1 Update API Base URL
Replace your current backend URL with Xano's API URL:

```javascript
// Before
const API_BASE_URL = 'http://localhost:5000/api';

// After
const API_BASE_URL = 'https://your-project.xano.app/api:main';
```

### 7.2 Update API Calls
Your API calls should work with minimal changes since we're maintaining the same endpoint structure.

## Step 8: Testing & Deployment

### 8.1 Test All Endpoints
1. Test registration: `POST /auth_register`
2. Test login: `POST /auth_login`
3. Test email confirmation: `GET /auth_confirm_email?token=...`
4. Test protected routes: `GET /user_profile`
5. Test Stripe integration: `POST /stripe_create_checkout`

### 8.2 Update Frontend Environment
Update your frontend environment variables:

```env
REACT_APP_API_BASE_URL=https://your-project.xano.app/api:main
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Step 9: Clean Up

### 9.1 Backup Current Backend
```bash
# Create backup
cp -r backend backend-backup-$(date +%Y%m%d)

# Export database
sqlite3 backend/database.sqlite ".dump" > backend-backup.sql
```

### 9.2 Remove Old Backend (Optional)
Once everything is working:

```bash
# Remove old backend
rm -rf backend/

# Update package.json to remove backend dependencies
# Update deployment scripts
```

## Benefits of Xano Migration

✅ **No Server Management**: No more server maintenance, scaling, or deployment issues
✅ **Built-in Security**: Automatic rate limiting, CORS, authentication
✅ **Real-time Features**: WebSocket support out of the box
✅ **Database Management**: PostgreSQL with automatic backups
✅ **API Documentation**: Auto-generated docs
✅ **Monitoring**: Built-in analytics and monitoring
✅ **Cost Effective**: Free tier available, pay as you scale

## Next Steps

1. **Set up Xano account** and create project
2. **Migrate database schema** using the provided SQL
3. **Create API endpoints** one by one
4. **Test thoroughly** before removing old backend
5. **Update frontend** to use new API URLs
6. **Deploy and monitor**

## Support

- Xano Documentation: [docs.xano.com](https://docs.xano.com)
- Xano Community: [community.xano.com](https://community.xano.com)
- Migration Help: Check Xano's migration guides

---

**Estimated Migration Time**: 2-4 hours for complete setup
**Difficulty Level**: Medium (requires understanding of current API structure) 