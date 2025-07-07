#!/bin/bash

echo "🚀 Starting Aura Posture Development Environment"
echo "================================================"

# Check if .env files exist
if [ ! -f ".env" ]; then
    echo "⚠️  Frontend .env file not found!"
    echo "📝 Creating .env from template..."
    cp env.example .env
    echo "✅ Created .env file. Please edit it with your Stripe keys."
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found!"
    echo "📝 Creating backend/.env from template..."
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env file. Please edit it with your Stripe keys."
fi

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

echo ""
echo "🔑 Before continuing, make sure to:"
echo "   1. Set up your Stripe account and get API keys"
echo "   2. Create products in Stripe Dashboard (Premium & Pro plans)"
echo "   3. Update .env and backend/.env with your actual Stripe keys"
echo "   4. Run 'stripe listen --forward-to localhost:4000/webhook' in another terminal"
echo ""
echo "📚 See STRIPE_SETUP.md for detailed instructions"
echo ""

read -p "Press Enter to start the development servers..."

echo "🌟 Starting development servers..."
npm run dev:both 