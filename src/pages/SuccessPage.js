import React, { useState, useEffect } from 'react';
import { CheckCircle, Sparkles, ArrowRight, CreditCard, Mail, Settings } from 'lucide-react';
import stripeService from '../services/stripeService';

const SuccessPage = () => {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const planId = urlParams.get('plan');

        if (!sessionId) {
          setError('No session ID found. Please check your email for confirmation.');
          return;
        }

        // Handle development mode
        if (sessionId === 'dev_mode') {
          setSessionData({
            id: 'dev_session',
            plan: 'Lifetime Access',
            planName: 'Lifetime Access - Development Mode',
            amountTotal: 999, // $9.99 in cents
            currency: 'USD',
            status: 'paid',
            customerEmail: 'development@example.com',
            developmentMode: true
          });
          setLoading(false);
          return;
        }

        const session = await stripeService.getSessionDetails(sessionId);
        setSessionData(session);
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError('Unable to load payment details. Please check your email for confirmation.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, []);

  const handleManageSubscription = async () => {
    try {
      if (sessionData?.id) {
        const portalUrl = await stripeService.createPortalSession(sessionData.id);
        window.location.href = portalUrl;
      }
    } catch (err) {
      console.error('Error creating portal session:', err);
      alert('Unable to open subscription management. Please contact support.');
    }
  };

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency?.toUpperCase() || 'USD',
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-6 py-12">
        {error ? (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-8 mb-8">
              <CreditCard className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-4">Payment Status Unknown</h1>
              <p className="text-gray-300 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Continue to App
                </button>
                <button
                  onClick={() => window.location.href = '/pricing'}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  View Pricing
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-12">
              <div className="relative">
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
                <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-8 animate-pulse" />
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
                Welcome to Premium!
              </h1>
              {sessionData?.developmentMode && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-4 inline-block">
                  <p className="text-yellow-300 font-semibold">🔧 Development Mode - No Real Payment</p>
                </div>
              )}
              <p className="text-xl text-gray-300 mb-8">
                {sessionData?.developmentMode 
                  ? 'Development mode: You now have access to all premium features for testing!'
                  : 'Your payment was successful. You now have access to all premium features.'
                }
              </p>
            </div>

            {/* Payment Details */}
            {sessionData && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <CreditCard className="w-6 h-6 mr-3 text-blue-400" />
                  Payment Confirmation
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 mb-1">Plan</p>
                    <p className="text-xl font-semibold">{sessionData.plan || 'Premium Plan'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Amount Paid</p>
                    <p className="text-xl font-semibold text-green-400">
                      {formatAmount(sessionData.amountTotal, sessionData.currency)}
                    </p>
                  </div>
                  {sessionData.customerEmail && (
                    <div>
                      <p className="text-gray-400 mb-1">Email</p>
                      <p className="text-lg">{sessionData.customerEmail}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400 mb-1">Status</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {sessionData.status === 'paid' ? 'Paid' : sessionData.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold mb-6">What's Next?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Start Using Premium Features</h3>
                  <p className="text-gray-300 text-sm">Access advanced posture calibration, custom alerts, and detailed analytics.</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Check Your Email</h3>
                  <p className="text-gray-300 text-sm">We've sent you a confirmation email with your receipt and account details.</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Manage Subscription</h3>
                  <p className="text-gray-300 text-sm">Update payment methods, view invoices, or cancel anytime.</p>
                </div>
              </div>
            </div>

            {/* Premium Features Highlight */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold mb-6">Your Premium Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Advanced posture calibration',
                  'Custom alert sounds',
                  'Detailed session analytics',
                  'Background monitoring',
                  'Priority support',
                  'Continuous improvements'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105"
              >
                Start Using Ascends
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              
              {sessionData && (
                <button
                  onClick={handleManageSubscription}
                  className="flex items-center justify-center px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Manage Subscription
                </button>
              )}
            </div>

            {/* Support */}
            <div className="mt-12 text-center">
              <p className="text-gray-400 mb-4">
                Need help getting started or have questions about your subscription?
              </p>
              <a
                                  href="mailto:support@ascends.me"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Contact our support team →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessPage; 