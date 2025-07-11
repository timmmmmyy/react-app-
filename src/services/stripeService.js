import apiService from './apiService';

class StripeService {
  // Get all subscription plans
  async getPlans() {
    try {
      const response = await apiService.fetch('/api/stripe/plans');
      return response.plans;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  }

  // Create a checkout session
  async createCheckoutSession(planId, priceId, customerEmail = null, customerName = null) {
    try {
      const data = await apiService.createCheckoutSession(planId, priceId, customerEmail, customerName);
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Get session details
  async getSessionDetails(sessionId) {
    try {
      const data = await apiService.fetch(`/api/stripe/session/${sessionId}`);
      return data.session;
    } catch (error) {
      console.error('Error fetching session details:', error);
      throw error;
    }
  }

  // Create customer portal session
  async createPortalSession(sessionId = null, customerId = null) {
    try {
      const data = await apiService.fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          customerId
        }),
      });
      return data.url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  // Check subscription status by email
  async getSubscriptionStatus(customerEmail) {
    try {
      const data = await apiService.fetch(`/api/stripe/subscription-status/${encodeURIComponent(customerEmail)}`);
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

const stripeService = new StripeService();
export default stripeService; 