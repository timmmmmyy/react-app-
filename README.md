# 🧘‍♀️ Ascends - AI-Powered Focus & Posture Coach

**Transform your workday with AI-powered posture monitoring and habit tracking.**

## 🎯 What is Ascends?

Ascends is an intelligent web application that uses your webcam and AI to:
- **Monitor your posture** in real-time with advanced calibration
- **Detect face touching** to break unconscious habits
- **Provide gentle alerts** to keep you focused and healthy
- **Track your progress** with detailed session analytics

**🔒 Privacy First**: All video processing happens locally in your browser. Your data never leaves your device.

## ✨ New: Subscription Plans & Premium Features

### 🆓 Basic Plan (Free)
- Face touch detection
- Basic posture alerts
- Session statistics
- Standard audio alerts

### 👑 Premium Plan ($9.97/month)
- Everything in Basic
- **Advanced posture calibration**
- **Custom alert sounds**
- **Detailed analytics**
- **Background monitoring**
- Priority support

### 🚀 Pro Plan ($29.97/month)
- Everything in Premium
- **Multi-device sync**
- **Team management**
- **API access**
- **Custom integrations**
- **White-label options**
- 24/7 priority support

## 🚀 Quick Start

### Option 1: One-Command Start
```bash
./start.sh
```

### Option 2: Manual Setup
```bash
# Install dependencies
npm run setup

# Start both frontend and backend
npm run dev:both

# Or start separately
npm run dev:frontend  # React app on :3000
npm run dev:backend   # Node.js API on :4000
```

## 💳 Stripe Integration Setup

### 1. Get Stripe Keys
1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Developers > API keys
3. Create Premium ($9.97/month) and Pro ($29.97/month) products
4. Copy the Price IDs

### 2. Configure Environment
```bash
# Backend environment
cp backend/env.example backend/.env
# Edit backend/.env with your Stripe keys

# Frontend environment  
cp env.example .env
# Edit .env with your publishable key
```

### 3. Test Webhooks
```bash
# Install Stripe CLI and run:
stripe listen --forward-to localhost:4000/webhook
```

## 🌐 Application URLs

- **Main App**: http://localhost:3000
- **Pricing Page**: http://localhost:3000/pricing
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Stripe.js** - Secure payment processing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Stripe SDK** - Payment processing
- **CORS** - Cross-origin requests
- **Helmet** - Security headers
- **Rate Limiting** - API protection

### AI/ML
- **MediaPipe** - Google's ML framework
- **Face Mesh** - Facial landmark detection
- **Hands** - Hand tracking
- **Pose** - Body posture analysis

## 📱 Features

### 🤖 AI-Powered Detection
- **Real-time face touch detection** with customizable sensitivity
- **Advanced posture analysis** with coordinate-based calibration
- **Continuous monitoring** with optimized performance

### 🔔 Smart Alerts
- **Multiple alert sounds** (slap, tuntun, beep, chime, custom)
- **Timing controls** (2-second hold times prevent false positives)
- **Visual indicators** with beautiful UI animations

### 📊 Analytics & Tracking
- **Session statistics** (time, touches, posture alerts)
- **Progress tracking** across sessions
- **Premium analytics** with detailed insights

### 💰 Monetization
- **Stripe Checkout** for secure payments
- **Customer Portal** for subscription management
- **Feature gating** based on subscription tier
- **Webhook processing** for real-time updates

## 🔧 API Endpoints

### Stripe Integration
- `GET /api/stripe/plans` - Get subscription plans
- `POST /api/stripe/create-checkout-session` - Create payment session
- `GET /api/stripe/session/:id` - Get session details
- `POST /api/stripe/create-portal-session` - Customer portal
- `GET /api/stripe/subscription-status/:email` - Check subscription

### System
- `GET /health` - Server health check
- `POST /webhook` - Stripe webhook handler

## 🧪 Testing

### Test Cards (Stripe)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### Test Flow
1. Open app at http://localhost:3000
2. Click "Sign In" and enter test email
3. Navigate to pricing page
4. Select a plan and test checkout
5. Verify webhook events in console

## 🚀 Production Deployment

### Environment Variables
Set these in production:
```env
# Backend
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-domain.com

# Frontend
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
REACT_APP_API_URL=https://api.your-domain.com
```

### Deployment Checklist
- [ ] Switch to Stripe live keys
- [ ] Configure production webhook endpoint
- [ ] Set up SSL certificates
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Test with small live payments

## 📋 Scripts

```bash
npm start              # Start React development server
npm run build         # Build for production
npm run dev:both      # Start both frontend and backend
npm run dev:backend   # Start Node.js backend only
npm run dev:frontend  # Start React frontend only
npm run setup         # Install all dependencies
npm run stripe:listen # Forward Stripe webhooks
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the integration
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 💡 Support

- **Documentation**: See `STRIPE_SETUP.md` for detailed setup
- **Status**: Check `INTEGRATION_STATUS.md` for current implementation
- **Issues**: Create GitHub issues for bugs or feature requests

---

**🎉 The Stripe integration is 100% complete and ready for testing!**

Just add your Stripe keys and you'll have a fully functional subscription-based SaaS application.
