import React, { useState, useEffect, useCallback } from 'react';
import { Check, Crown, Zap, AlertCircle } from 'lucide-react';

const PricingPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('aura_auth_token') || '');
  const [canceled, setCanceled] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    if (token) {
      try {
        const response = await fetch('http://localhost:4000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
        } else {
          // Token is invalid
          localStorage.removeItem('aura_auth_token');
          setToken('');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('aura_auth_token');
        setToken('');
      }
    }
  }, [token]);

  useEffect(() => {
    checkAuthStatus();
    setLoading(false); // No longer fetching plans
    
    // Check if user was redirected from canceled checkout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('canceled') === 'true') {
      setCanceled(true);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [checkAuthStatus]);

  // Note: Old subscription plans removed - now only supporting trial + lifetime model

  const handleLifetimePurchase = async () => {
    if (!isAuthenticated) {
      // Redirect to main page to sign in
      alert('Please sign in first to purchase lifetime access.');
      window.location.href = '/';
      return;
    }

    try {
      setProcessingPlan('lifetime');
      setError(null);

      // Create checkout session for lifetime plan
      const response = await fetch('http://localhost:4000/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: 'lifetime',
          priceId: 'price_lifetime' // Backend creates pricing dynamically
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError(`Failed to start checkout: ${err.message}`);
      console.error('Checkout error:', err);
    } finally {
      setProcessingPlan(null);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Aura Posture</h1>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
          >
            ← Back to App
          </button>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-6 pb-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
            Get Lifetime Access
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Start with a FREE 1-hour trial, then upgrade to lifetime access for just $10. No recurring fees, no subscriptions - own it forever!
          </p>
          
          {canceled && (
            <div className="mb-8 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-200 max-w-md mx-auto">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              Payment was canceled. No charges were made.
            </div>
          )}
          
          {error && (
            <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 max-w-md mx-auto">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              {error}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Trial Card */}
          <div className="relative bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-lg border border-green-500/20 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <Zap className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Free Trial</h3>
              <p className="text-gray-300 mb-4">Try all premium features for 1 hour</p>
              <div className="text-4xl font-bold mb-2 text-green-400">
                FREE
              </div>
              <p className="text-sm text-gray-400">1 hour full access</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-sm">Face touch detection</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-sm">Advanced posture calibration</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-sm">Custom alert sounds</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-sm">All premium features</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-sm">No payment required</span>
              </li>
            </ul>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 rounded-lg transition-all"
            >
              Start Free Trial
            </button>
          </div>

          {/* Lifetime Plan Card */}
          <div className="relative bg-gradient-to-br from-yellow-500/10 to-purple-500/10 backdrop-blur-lg border border-yellow-500/20 rounded-2xl p-8 ring-2 ring-yellow-400 scale-105">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-1 rounded-full text-sm font-bold">
                BEST VALUE
                    </span>
                  </div>
                
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                <Crown className="w-12 h-12 text-yellow-400" />
                  </div>
              <h3 className="text-2xl font-bold mb-2">Lifetime Access</h3>
              <p className="text-gray-300 mb-4">Own it forever - no recurring fees!</p>
              <div className="text-4xl font-bold mb-2 text-yellow-400">
                $10
                  </div>
              <p className="text-sm text-gray-400">One-time payment</p>
                </div>

                <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-sm">Everything in Free Trial</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-sm">Unlimited usage</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-sm">Priority support</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-sm">All future updates included</span>
              </li>
              <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-sm">No monthly fees ever</span>
                    </li>
                </ul>

                      <button
              onClick={handleLifetimePurchase}
              disabled={processingPlan === 'lifetime'}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg transition-all"
                  >
              {processingPlan === 'lifetime' ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent mr-2"></div>
                        Processing...
                      </div>
              ) : (
                isAuthenticated ? 'Buy Lifetime Access' : 'Sign In to Purchase'
              )}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
              <h4 className="font-bold mb-3">What happens after the free trial?</h4>
              <p className="text-gray-300">After your 1-hour trial expires, you'll need to purchase lifetime access for $10 to continue using premium features. No recurring fees!</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
              <h4 className="font-bold mb-3">Is my data secure?</h4>
              <p className="text-gray-300">Absolutely. All video processing happens locally in your browser. Your video data never leaves your device.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
              <h4 className="font-bold mb-3">What payment methods do you accept?</h4>
              <p className="text-gray-300">We accept all major credit cards and debit cards through our secure Stripe payment processor.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
              <h4 className="font-bold mb-3">Is this really a one-time payment?</h4>
              <p className="text-gray-300">Yes! Pay $10 once and own Aura Posture forever. No monthly fees, no hidden costs, and all future updates are included.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 