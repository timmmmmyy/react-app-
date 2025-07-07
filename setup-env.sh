#!/bin/bash

echo "🚀 Aura Posture - Quick Environment Setup"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the main project directory"
    exit 1
fi

echo
echo "📧 First, let's get your Stripe API keys..."
echo
echo "1. Go to: https://dashboard.stripe.com/test/apikeys"
echo "2. Sign up/login to Stripe (it's free)"
echo "3. Copy your keys and paste them below"
echo

# Get Stripe keys from user
read -p "Enter your Stripe Publishable Key (pk_test_...): " STRIPE_PK
read -p "Enter your Stripe Secret Key (sk_test_...): " STRIPE_SK

if [ -z "$STRIPE_PK" ] || [ -z "$STRIPE_SK" ]; then
    echo "❌ Both keys are required. Please run the script again."
    exit 1
fi

# Create backend .env
echo
echo "📝 Creating backend/.env..."
cd backend
cp env.example .env

# Replace the keys in backend .env
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/sk_test_your_stripe_secret_key_here/$STRIPE_SK/g" .env
    sed -i '' "s/pk_test_your_stripe_publishable_key_here/$STRIPE_PK/g" .env
else
    # Linux
    sed -i "s/sk_test_your_stripe_secret_key_here/$STRIPE_SK/g" .env
    sed -i "s/pk_test_your_stripe_publishable_key_here/$STRIPE_PK/g" .env
fi

echo "✅ Backend environment configured"

# Create frontend .env.local
cd ..
echo "REACT_APP_STRIPE_PUBLISHABLE_KEY=$STRIPE_PK" > .env.local
echo "✅ Frontend environment configured"

echo
echo "🎉 Setup Complete!"
echo
echo "Next steps:"
echo "1. Start the backend: cd backend && npm start"
echo "2. Start the frontend: npm start"
echo "3. (Optional) Create products in Stripe Dashboard for premium features"
echo
echo "Your app should now work with Stripe checkout! 🚀" 