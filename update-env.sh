#!/bin/bash

echo "🔧 Update Environment Configuration"
echo "=================================="

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Creating from template..."
    cp env.example .env
fi

# Get current values
CURRENT_API_URL=$(grep "REACT_APP_API_URL=" .env | cut -d'=' -f2)
CURRENT_STRIPE_KEY=$(grep "REACT_APP_STRIPE_PUBLISHABLE_KEY=" .env | cut -d'=' -f2)

echo ""
echo "📋 Current Configuration:"
echo "   API URL: $CURRENT_API_URL"
echo "   Stripe Key: $CURRENT_STRIPE_KEY"
echo ""

# Ask for new values
echo "🔄 Update Configuration"
echo ""

echo "📡 Enter your backend URL (ngrok URL or cloud URL):"
echo "   Current: $CURRENT_API_URL"
echo "   Example: https://abc123.ngrok.io"
read -p "   New API URL: " NEW_API_URL

echo ""
echo "💳 Enter your Stripe publishable key:"
echo "   Current: $CURRENT_STRIPE_KEY"
echo "   Example: pk_test_51RfFJT..."
read -p "   New Stripe Key: " NEW_STRIPE_KEY

# Update .env file
if [ ! -z "$NEW_API_URL" ]; then
    sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=$NEW_API_URL|" .env
    echo "✅ Updated API URL to: $NEW_API_URL"
fi

if [ ! -z "$NEW_STRIPE_KEY" ]; then
    sed -i "s|REACT_APP_STRIPE_PUBLISHABLE_KEY=.*|REACT_APP_STRIPE_PUBLISHABLE_KEY=$NEW_STRIPE_KEY|" .env
    echo "✅ Updated Stripe Key to: $NEW_STRIPE_KEY"
fi

echo ""
echo "🎉 Environment updated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Restart your React app: npm start"
echo "2. Deploy to Vercel: vercel"
echo "3. Set the same environment variables in Vercel dashboard"
echo ""
echo "📚 See VERCEL_DEPLOYMENT.md for detailed instructions" 