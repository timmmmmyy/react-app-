# Aura Posture - Stripe Payment Integration Setup Guide

This guide will walk you through setting up the complete Stripe payment integration for the Aura Posture application.

## 🏗️ Project Structure

```
face-touch-detector/
├── backend/                 # Node.js/Express backend
│   ├── server.js           # Main server file
│   ├── routes/stripe.js    # Stripe API routes
│   ├── utils/stripe-config.js # Stripe configuration
│   ├── package.json        # Backend dependencies
│   └── env.example         # Backend environment template
├── src/                    # React frontend
│   ├── services/stripeService.js # Stripe API client
│   ├── pages/PricingPage.js     # Pricing plans page
│   ├── pages/SuccessPage.js     # Payment success page
│   ├── components/SubscriptionStatus.js # Subscription widget
│   └── App.js              # Main app with routing
├── env.example             # Frontend environment template
└── package.json            # Frontend dependencies
```

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Set Up Stripe Account

1. **Create a Stripe Account**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get API Keys**: Navigate to `Developers > API keys` in your Stripe Dashboard
3. **Enable Test Mode**: Make sure you're in test mode (toggle in the left sidebar)

### 3. Create Stripe Products

In your Stripe Dashboard, create the following products:

#### Premium Plan
- **Name**: Premium Plan
- **Price**: $9.97/month (recurring)
- **Price ID**: Copy this (starts with `price_...`)

#### Pro Plan
- **Name**: Pro Plan  
- **Price**: $29.97/month (recurring)
- **Price ID**: Copy this (starts with `price_...`)

### 4. Configure Environment Variables

#### Backend Configuration
```bash
# Create backend environment file
cp backend/env.example backend/.env
```

Edit `backend/.env`:
```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (from step 3)
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here

# Frontend URLs
FRONTEND_URL=http://localhost:3000
SUCCESS_URL=http://localhost:3000/success
CANCEL_URL=http://localhost:3000/cancel
```

#### Frontend Configuration
```bash
# Create frontend environment file
cp env.example .env
```

Edit `.env`:
```env
# Stripe Configuration (Frontend)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here

# Backend API URL
REACT_APP_API_URL=http://localhost:4000
```

### 5. Set Up Stripe CLI (for webhooks)

```bash
# Install Stripe CLI
# macOS with Homebrew
brew install stripe/stripe-cli/stripe

# Or download from https://github.com/stripe/stripe-cli/releases

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:4000/webhook
```

**Important**: Copy the webhook signing secret from the CLI output and add it to your `backend/.env` file as `STRIPE_WEBHOOK_SECRET`.

### 6. Run the Application

```bash
# Terminal 1: Start the backend server
cd backend
npm run dev

# Terminal 2: Start the React frontend
npm start

# Terminal 3: Keep Stripe webhook forwarding running
stripe listen --forward-to localhost:4000/webhook
```

## 🧪 Testing the Integration

### Test Cards
Use Stripe's test card numbers:

- **Successful payment**: `4242 4242 4242 4242`
- **Payment fails**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### Test Flow
1. Open `http://localhost:3000`
2. Click "Sign In" and enter an email
3. Click "Pricing" in the header
4. Select a plan and click "Subscribe"
5. Complete payment with test card
6. Verify webhook logs in Terminal 3
7. Check success page and return to app

## 🔧 API Endpoints

### Backend Endpoints (`http://localhost:4000`)

- `GET /health` - Health check
- `GET /api/stripe/plans` - Get subscription plans
- `POST /api/stripe/create-checkout-session` - Create payment session
- `GET /api/stripe/session/:sessionId` - Get session details
- `POST /api/stripe/create-portal-session` - Customer portal
- `GET /api/stripe/subscription-status/:email` - Check subscription
- `POST /webhook` - Stripe webhook handler

### Frontend Routes (`http://localhost:3000`)

- `/` - Main application
- `/pricing` - Subscription plans
- `/success` - Payment success page
- `/cancel` - Payment cancellation (redirects to home)

## 💳 Subscription Plans

### Basic Plan (Free)
- Face touch detection
- Basic posture alerts  
- Session statistics
- Standard audio alerts

### Premium Plan ($9.97/month)
- Everything in Basic
- Advanced posture calibration
- Custom alert sounds
- Detailed analytics
- Background monitoring
- Priority support

### Pro Plan ($29.97/month)
- Everything in Premium
- Multi-device sync
- Team management
- API access
- Custom integrations
- White-label options
- 24/7 priority support

## 🔒 Security Features

- **Environment Variables**: All secrets stored in `.env` files
- **Webhook Signatures**: Stripe webhook verification
- **Rate Limiting**: Express rate limiting middleware
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers middleware

## 🐛 Troubleshooting

### Common Issues

#### "Stripe webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Restart the backend server after setting the webhook secret
- Make sure Stripe CLI is forwarding to the correct endpoint

#### "Failed to create checkout session"
- Verify `STRIPE_SECRET_KEY` is correct and has `sk_test_` prefix
- Check that price IDs exist in your Stripe dashboard
- Ensure price IDs are correctly set in `backend/.env`

#### Frontend can't connect to backend
- Verify backend is running on port 4000
- Check `REACT_APP_API_URL` in frontend `.env`
- Ensure CORS is configured for `http://localhost:3000`

#### Payment success but user not redirected
- Check `SUCCESS_URL` and `CANCEL_URL` in backend `.env`
- Verify frontend routing is working (`/success` route)

### Debug Commands

```bash
# Check backend environment
cd backend && node -e "console.log(process.env.STRIPE_SECRET_KEY ? 'Stripe key loaded' : 'Missing Stripe key')"

# Test backend health
curl http://localhost:4000/health

# Check Stripe CLI events
stripe events list --limit 10

# Verify webhook endpoints
stripe listen --print-json
```

## 🚀 Production Deployment

### Environment Variables for Production

```env
# Backend Production
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
FRONTEND_URL=https://your-domain.com

# Frontend Production  
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
REACT_APP_API_URL=https://api.your-domain.com
```

### Production Checklist

- [ ] Switch to Stripe live keys
- [ ] Update webhook endpoint in Stripe Dashboard
- [ ] Configure production webhook secret
- [ ] Set up proper domain for CORS
- [ ] Enable HTTPS for all endpoints
- [ ] Set up database for user/subscription management
- [ ] Configure proper error monitoring (Sentry)
- [ ] Set up backup strategy
- [ ] Test with live cards (very small amounts)

## 📚 Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [React Stripe.js Documentation](https://stripe.com/docs/stripe-js/react)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Stripe logs in your dashboard
3. Check browser console for frontend errors
4. Review backend server logs
5. Test with Stripe CLI event forwarding

For additional help, contact the development team or create an issue in the repository. 