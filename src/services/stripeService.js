const API_BASE_URL = process.env.REACT_APP_API_URL || '';

class StripeService {
  // Get all subscription plans
  async getPlans() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/plans`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch plans');
      }
      
      return data.plans;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  }

  // Create a checkout session
  async createCheckoutSession(planId, priceId, customerEmail = null, customerName = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          priceId,
          customerEmail,
          customerName
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Get session details
  async getSessionDetails(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/session/${sessionId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch session details');
      }
      
      return data.session;
    } catch (error) {
      console.error('Error fetching session details:', error);
      throw error;
    }
  }

  // Create customer portal session
  async createPortalSession(sessionId = null, customerId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          customerId
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create portal session');
      }
      
      return data.url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  // Check subscription status by email
  async getSubscriptionStatus(customerEmail) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/subscription-status/${encodeURIComponent(customerEmail)}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to check subscription status');
      }
      
      return {
        hasSubscription: data.hasSubscription,
        plan: data.plan,
        planName: data.planName,
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        customerId: data.customerId
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      throw error;
    }
  }

  // Redirect to Stripe Checkout
  async redirectToCheckout(sessionId) {
    // This will be implemented with Stripe.js in the component
    const stripe = window.Stripe;
    if (!stripe) {
      throw new Error('Stripe.js not loaded');
    }
    
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw error;
    }
  }

  // Format price for display
  formatPrice(priceInCents) {
    return (priceInCents / 100).toFixed(2);
  }

  // Check if plan has feature
  planHasFeature(plan, feature) {
    const featureMap = {
      'customSounds': ['premium', 'pro'],
      'backgroundMonitoring': ['premium', 'pro'],
      'advancedCalibration': ['premium', 'pro'],
      'detailedAnalytics': ['premium', 'pro'],
      'apiAccess': ['pro'],
      'teamManagement': ['pro'],
      'whiteLabel': ['pro']
    };
    
    return featureMap[feature]?.includes(plan) || false;
  }
}

export default new StripeService(); 