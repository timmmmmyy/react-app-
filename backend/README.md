# 🚀 Ascends Backend

A complete backend system for AI-powered posture coaching SaaS with email confirmation and Stripe integration.

## ✨ Features

- **User Registration & Authentication** with email confirmation
- **JWT-based Authentication** with secure token management
- **Email Service** for confirmation and welcome emails
- **Stripe Integration** for one-time lifetime premium payments
- **SQLite Database** for user data storage
- **Rate Limiting** for API protection
- **Input Validation** with comprehensive error handling
- **Security Middleware** (Helmet, CORS, etc.)

## 🛠️ Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Run the interactive setup script
node setup.js

# Or manually copy and edit the environment file
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start the Server
```bash
npm start
# or for development with auto-restart
npm run dev
```

## 📋 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `4000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `EMAIL_USER` | Gmail address | `your-email@gmail.com` |
| `EMAIL_PASS` | Gmail app password | `your-app-password` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `PREMIUM_PRICE_CENTS` | Premium price in cents | `2997` |
| `ADMIN_EMAIL` | Admin email address | `admin@example.com` |

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/confirm-email?token=...` - Email confirmation
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires auth)

### Payments
- `POST /api/payments/create-payment-intent` - Create payment intent (requires auth)
- `POST /api/webhooks/stripe` - Stripe webhook handler

### System
- `GET /health` - Health check
- `GET /api/admin/stats` - Admin statistics (requires admin auth)

## 💳 Stripe Setup

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your API keys from the Dashboard

### 2. Configure Webhooks
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `http://localhost:4000/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook secret

### 3. Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and generate password
   - Use this password in `EMAIL_PASS`

### Other Email Services
Modify `emailService.js` to use your preferred email service:
- SendGrid
- Mailgun
- AWS SES
- etc.

## 🗄️ Database Schema

The system uses SQLite with the following user table:

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_confirmed BOOLEAN DEFAULT 0,
    confirmation_token TEXT,
    is_premium BOOLEAN DEFAULT 0,
    stripe_customer_id TEXT,
    stripe_payment_intent_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME,
    premium_purchased_at DATETIME
);
```

## 🧪 Testing

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:4000/health

# Test registration
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Test login (after email confirmation)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Flow Testing
1. Register a new user
2. Check email for confirmation link
3. Click confirmation link
4. Login with credentials
5. Create payment intent
6. Complete payment with test card
7. Verify premium upgrade

## 🔐 Security Features

- **Rate Limiting**: 100 requests per 15 minutes, 5 auth attempts per 15 minutes
- **Input Validation**: Comprehensive validation with express-validator
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **CORS Protection**: Configured for specific origins
- **Helmet**: Security headers middleware
- **SQL Injection Protection**: Parameterized queries

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use live Stripe keys
3. Configure production database
4. Set up SSL certificates
5. Configure reverse proxy (nginx/Apache)

### Database Migration
For production, consider using:
- PostgreSQL or MySQL
- Database migrations
- Connection pooling
- Backup strategies

### Monitoring
- Log rotation
- Error tracking (Sentry)
- Performance monitoring
- Health checks

## 📝 Example Usage

```javascript
// Register user
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword',
    confirmPassword: 'securepassword'
  })
});

// Login user
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword'
  })
});

const { token } = await loginResponse.json();

// Create payment intent
const paymentResponse = await fetch('/api/payments/create-payment-intent', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { clientSecret } = await paymentResponse.json();
```

## 🆘 Troubleshooting

### Common Issues

**Email not sending**
- Check Gmail app password
- Verify 2FA is enabled
- Check email service configuration

**Stripe webhook not working**
- Verify webhook URL is accessible
- Check webhook secret
- Ensure raw body parsing for webhook endpoint

**Database connection errors**
- Check if data directory exists
- Verify SQLite permissions
- Check database file path

**JWT token errors**
- Verify JWT_SECRET is set
- Check token expiration
- Validate token format

## 📞 Support

For issues or questions:
1. Check the logs for error details
2. Verify environment configuration
3. Test API endpoints individually
4. Check Stripe dashboard for payment issues

---

**Status**: ✅ **Production Ready**
**Version**: 1.0.0
**Last Updated**: 2024 