const express = require('express');
const router = express.Router();
const { 
  stripe, 
  SUBSCRIPTION_PLANS, 
  formatPrice, 
  getPlanByPriceId,
  validatePlan,
  createStripeCustomer,
  findCustomerByEmail,
  getCustomerSubscriptions
} = require('../utils/stripe-config');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { 
  findUserByEmail, 
  updateUserLifetimeAccess, 
  updateUserStripeCustomerId,
  createPurchase
} = require('../utils/database');

// Get all subscription plans
router.get('/plans', (req, res) => {
  try {
    const plans = Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      ...plan,
      formattedPrice: plan.price > 0 ? `$${formatPrice(plan.price)}` : 'Free'
    }));

    res.json({ 
      success: true,
      plans 
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch subscription plans' 
    });
  }
});

// Create checkout session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { priceId, planId } = req.body;
    const user = req.user;

    // Validate required fields
    if (!priceId) {
      return res.status(400).json({ 
        success: false,
        error: 'Price ID is required' 
      });
    }

    if (!validatePlan(planId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid plan selected' 
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[planId];

    // Get authenticated user's email
    const customerEmail = req.user.email;
    const customerName = req.user.username;

    // Development mode bypass for invalid Stripe keys
    const isDevelopmentMode = process.env.NODE_ENV === 'development' && 
                              (process.env.STRIPE_SECRET_KEY?.includes('here') || 
                               process.env.STRIPE_SECRET_KEY?.includes('bypass') ||
                               !process.env.STRIPE_SECRET_KEY?.startsWith('sk_'));
    
    if (isDevelopmentMode) {
      console.log('🔧 Development mode: Bypassing Stripe, simulating successful payment');
      
      // Update user with lifetime access in database
      const db = require('../utils/database');
      await db.updateUserLifetimeAccess(req.user.id, true);
      
      return res.json({
        success: true,
        sessionId: 'dev_session_' + Date.now(),
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id=dev_mode&plan=${planId}`,
        plan: selectedPlan.name,
        developmentMode: true
      });
    }

    // Handle customer creation/retrieval
    let customer = null;
    if (customerEmail) {
      try {
        // Check if customer already exists
        customer = await findCustomerByEmail(customerEmail);
        
        if (!customer) {
          customer = await createStripeCustomer(
            customerEmail, 
            customerName,
            { 
              plan: planId,
              source: 'ascends_checkout'
            }
          );
        }
      } catch (customerError) {
        console.log('Customer handling failed:', customerError.message);
        // Continue without customer - Stripe will handle email collection
      }
    }

    // Handle trial plan (free)
    if (selectedPlan.price === 0 || planId === 'trial') {
      const db = require('../utils/database');
      // Prevent users from starting multiple trials
      const existingUser = await db.findUserById(req.user.id);
      if (existingUser && existingUser.trial_start_time) {
        return res.status(400).json({
          success: false,
          error: 'Free trial has already been used.'
        });
      }

      // Record trial start time
      await db.updateUserTrialStart(req.user.id, Date.now());

      return res.json({
        success: true,
        sessionId: null,
        url: `${process.env.FRONTEND_URL}/success?session_id=free_trial&plan=${planId}`,
        plan: selectedPlan.name
      });
    }

    // Create checkout session for lifetime plan (one-time payment)
    const sessionData = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment instead of subscription
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        plan: planId,
        planName: selectedPlan.name,
        plan_type: 'lifetime'
      },
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'auto'
    };

    // Add customer information
    if (customer) {
      sessionData.customer = customer.id;
    } else if (customerEmail) {
      sessionData.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log(`🛒 Checkout session created for ${selectedPlan.name}:`, session.id);
    
    res.json({ 
      success: true,
      sessionId: session.id,
      url: session.url,
      plan: selectedPlan.name
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get session details
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });
    
    const plan = getPlanByPriceId(session.line_items?.data[0]?.price?.id);
    
    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.payment_status,
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
        amountTotal: session.amount_total,
        currency: session.currency.toUpperCase(),
        plan: plan ? plan.name : 'Unknown',
        planId: session.metadata?.plan,
        subscriptionId: session.subscription?.id,
        subscriptionStatus: session.subscription?.status
      }
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve session details' 
    });
  }
});

// Create customer portal session
router.post('/create-portal-session', async (req, res) => {
  try {
    const { sessionId, customerId } = req.body;

    let customerIdToUse = customerId;

    // If no customer ID provided, try to get it from the checkout session
    if (!customerIdToUse && sessionId) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      customerIdToUse = checkoutSession.customer;
    }

    if (!customerIdToUse) {
      return res.status(400).json({ 
        success: false,
        error: 'Customer ID or Session ID is required' 
      });
    }

    // Create the portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerIdToUse,
      return_url: `${process.env.FRONTEND_URL}/account`,
    });

    res.json({ 
      success: true,
      url: portalSession.url 
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create customer portal session' 
    });
  }
});

// Get current user's subscription status (requires authentication)
router.get('/subscription-status', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user has lifetime access in our database
    if (user.has_lifetime_access) {
      return res.json({
        success: true,
        hasSubscription: true,
        hasLifetimeAccess: true,
        plan: 'lifetime',
        planName: 'Lifetime Access',
        status: 'active'
      });
    }

    // Check trial status
    if (user.trial_start_time) {
      const trialStartTimestamp = Number(user.trial_start_time);
      const trialElapsed = trialStartTimestamp ? (Date.now() - trialStartTimestamp) : 0;
      const trialExpired = trialElapsed > 3600000; // 1 hour
      
      return res.json({
        success: true,
        hasSubscription: false,
        hasLifetimeAccess: false,
        plan: 'trial',
        planName: 'Free Trial',
        trialActive: !trialExpired,
        trialTimeRemaining: trialExpired ? 0 : (3600000 - trialElapsed),
        trialStartTime: user.trial_start_time
      });
    }

    // No trial started, no lifetime access
    res.json({
      success: true,
      hasSubscription: false,
      hasLifetimeAccess: false,
      plan: 'trial',
      planName: 'Free Trial'
    });

  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check subscription status' 
    });
  }
});

module.exports = router; 