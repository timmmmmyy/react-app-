#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
    console.log('🚀 Setting up Ascends Backend...\n');
    
    // Generate JWT secret
    const jwtSecret = crypto.randomBytes(64).toString('hex');
    
    console.log('Let\'s configure your backend environment:\n');
    
    // Get email configuration
    const emailUser = await question('Enter your Gmail address (for sending emails): ');
    const emailPass = await question('Enter your Gmail App Password: ');
    
    // Get Stripe configuration
    const stripeSecretKey = await question('Enter your Stripe Secret Key (sk_test_...): ');
    const stripePublishableKey = await question('Enter your Stripe Publishable Key (pk_test_...): ');
    const stripeWebhookSecret = await question('Enter your Stripe Webhook Secret (whsec_...): ');
    
    // Get premium price
    const premiumPriceInput = await question('Enter premium price in dollars (default: 29.97): ');
    const premiumPrice = premiumPriceInput || '29.97';
    const premiumPriceCents = Math.round(parseFloat(premiumPrice) * 100);
    
    // Get admin email
    const adminEmail = await question('Enter admin email: ');
    
    // Get frontend URL
    const frontendUrl = await question('Enter frontend URL (default: http://localhost:3000): ');
    
    // Create .env file
    const envContent = `# Server Configuration
NODE_ENV=development
PORT=4000
FRONTEND_URL=${frontendUrl || 'http://localhost:3000'}

# JWT Secret (automatically generated)
JWT_SECRET=${jwtSecret}

# Email Configuration (Gmail SMTP)
EMAIL_USER=${emailUser}
EMAIL_PASS=${emailPass}

# Stripe Configuration
STRIPE_SECRET_KEY=${stripeSecretKey}
STRIPE_PUBLISHABLE_KEY=${stripePublishableKey}
STRIPE_WEBHOOK_SECRET=${stripeWebhookSecret}

# Premium Price (in cents)
PREMIUM_PRICE_CENTS=${premiumPriceCents}

# Admin Email
ADMIN_EMAIL=${adminEmail}
`;
    
    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ Environment file created successfully!');
    console.log('✅ JWT secret generated automatically');
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('✅ Data directory created');
    }
    
    console.log('\n🎉 Backend setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm start');
    console.log('2. Set up Stripe webhook endpoint: http://localhost:4000/api/webhooks/stripe');
    console.log('3. Test registration at: http://localhost:4000/health');
    
    rl.close();
}

setup().catch(console.error); 