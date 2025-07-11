#!/bin/bash

echo "🚀 Vercel Environment Setup"
echo "=========================="

# Get ngrok URL
echo "📡 Enter your ngrok URL (e.g., https://abc123.ngrok.io):"
read -r NGROK_URL

# Get Stripe publishable key
echo "💳 Enter your Stripe publishable key (starts with pk_test_ or pk_live_):"
read -r STRIPE_KEY

# Create .env file
cat > .env << EOF
# Backend API URL
REACT_APP_API_URL=${NGROK_URL}

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=${STRIPE_KEY}

# Optional: Analytics/Monitoring
# REACT_APP_SENTRY_DSN=your_sentry_dsn_here
# REACT_APP_GA_TRACKING_ID=your_google_analytics_id_here
EOF

echo "✅ Created .env file with your configuration"
echo ""
echo "📋 Next steps:"
echo "1. Deploy to Vercel: vercel"
echo "2. Set environment variables in Vercel dashboard:"
echo "   - REACT_APP_API_URL=${NGROK_URL}"
echo "   - REACT_APP_STRIPE_PUBLISHABLE_KEY=${STRIPE_KEY}"
echo ""
echo "3. Update your backend CORS settings to include your Vercel domain"
echo "4. Configure Stripe webhooks to point to your backend"
echo ""
echo "📚 See VERCEL_DEPLOYMENT.md for detailed instructions" 