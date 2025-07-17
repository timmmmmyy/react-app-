// Ensure we always use a valid Stripe secret key in development
let SECRET = process.env.STRIPE_SECRET_KEY;
if (!SECRET || /sk_test_[\*a-zA-Z0-9]+here/.test(SECRET)) {
  SECRET = 'sk_test_51RfFJT1aP22gHUavKnZBaejbnKKiBuRwuxUidgdcaocpH2tlIzy4jlnsPal4wmIYxP6pHAzpp17VmBg2Y6gemdQw00d2lI1rZS';
  process.env.STRIPE_SECRET_KEY = SECRET;
}

const stripe = require('stripe')(SECRET);

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  trial: {
    id: 'trial',
    name: '1-Hour Free Trial',
    description: 'Access all premium features for 1 hour',
    features: [
      'Face touch detection',
      'Advanced posture calibration',
      'Custom alert sounds',
      'Detailed analytics',
      'Background monitoring',
      'All premium features for 1 hour'
    ],
    price: 0,
    priceId: null,
    popular: false,
    trialDuration: 3600000, // 1 hour in milliseconds
    limits: {
      trialOnly: true
    }
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Access',
    description: 'One-time payment for lifetime access to all premium features.',
    features: [
      'Everything in Free Trial',
      'Face touch detection',
      'Advanced posture calibration',
      'Custom alert sounds',
      'Detailed analytics',
      'Background monitoring',
      'Priority support',
      'Lifetime access - no recurring fees',
      'All future updates included'
    ],
    price: 999, // $9.99 in cents
    priceId: process.env.STRIPE_LIFETIME_PRICE_ID,
    popular: true,
    limits: {
      unlimited: true,
      customSounds: true,
      backgroundMonitoring: true,
      advancedCalibration: true,
      detailedAnalytics: true
    }
  }
};

// Helper functions
const formatPrice = (priceInCents) => {
  return (priceInCents / 100).toFixed(2);
};

const getPlanByPriceId = (priceId) => {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.priceId === priceId);
};

const validatePlan = (planId) => {
  return SUBSCRIPTION_PLANS.hasOwnProperty(planId);
};

const createStripeCustomer = async (email, name = null, metadata = {}) => {
  try {
    const customerData = {
      email,
      metadata: {
        ...metadata,
        created_via: 'ascends_app'
      }
    };

    if (name) {
      customerData.name = name;
    }

    const customer = await stripe.customers.create(customerData);
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
};

const findCustomerByEmail = async (email) => {
  try {
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    return customers.data.length > 0 ? customers.data[0] : null;
  } catch (error) {
    console.error('Error finding customer by email:', error);
    throw error;
  }
};

const getCustomerSubscriptions = async (customerId) => {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active'
    });

    return subscriptions.data;
  } catch (error) {
    console.error('Error fetching customer subscriptions:', error);
    throw error;
  }
};

module.exports = {
  stripe,
  SUBSCRIPTION_PLANS,
  formatPrice,
  getPlanByPriceId,
  validatePlan,
  createStripeCustomer,
  findCustomerByEmail,
  getCustomerSubscriptions
}; 