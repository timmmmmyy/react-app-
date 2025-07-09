require('dotenv').config({ path: './backend/.env' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products...\n');

  try {
    // Create Premium Product
    console.log('📦 Creating Premium Product...');
    const premiumProduct = await stripe.products.create({
      name: 'Ascends Premium',
      description: 'Advanced AI-powered posture analysis with custom features',
      metadata: {
        plan: 'premium',
        features: 'Advanced posture calibration, Custom alert sounds, Detailed analytics, Background monitoring'
      }
    });

    const premiumPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 997, // $9.97
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'premium'
      }
    });

    console.log(`✅ Premium Product created: ${premiumProduct.id}`);
    console.log(`✅ Premium Price ID: ${premiumPrice.id}\n`);

    // Create Pro Product
    console.log('📦 Creating Pro Product...');
    const proProduct = await stripe.products.create({
      name: 'Ascends Pro',
      description: 'Complete wellness suite for professionals and teams',
      metadata: {
        plan: 'pro',
        features: 'Multi-device sync, Team management, API access, Custom integrations, White-label options'
      }
    });

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 2997, // $29.97
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'pro'
      }
    });

    console.log(`✅ Pro Product created: ${proProduct.id}`);
    console.log(`✅ Pro Price ID: ${proPrice.id}\n`);

    // Update environment file
    console.log('⚙️  Updating backend/.env with Price IDs...');
    const fs = require('fs');
    let envContent = fs.readFileSync('./backend/.env', 'utf8');
    
    envContent = envContent.replace(
      'STRIPE_PREMIUM_PRICE_ID=price_premium_plan_id_here',
      `STRIPE_PREMIUM_PRICE_ID=${premiumPrice.id}`
    );
    
    envContent = envContent.replace(
      'STRIPE_PRO_PRICE_ID=price_pro_plan_id_here',
      `STRIPE_PRO_PRICE_ID=${proPrice.id}`
    );

    fs.writeFileSync('./backend/.env', envContent);
    
    console.log('✅ Environment file updated!\n');
    
    console.log('🎉 Stripe setup complete!');
    console.log('📋 Summary:');
    console.log(`   Premium Plan: $9.97/month (${premiumPrice.id})`);
    console.log(`   Pro Plan: $29.97/month (${proPrice.id})`);
    console.log('\n🚀 Ready to start your servers and test payments!');

  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('Make sure your STRIPE_SECRET_KEY is correct in backend/.env');
    }
  }
}

setupStripeProducts(); 