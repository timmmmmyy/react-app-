import React, { useState, useEffect } from 'react';
import { Crown, ArrowRight, Settings, AlertCircle, AlertTriangle } from 'lucide-react';
import stripeService from '../services/stripeService';
import apiService from '../services/apiService';

const SubscriptionStatus = ({ user, onUpgrade }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('ascends_auth_token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const status = await apiService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (err) {
      setError('Failed to check subscription status');
      console.error('Error checking subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      if (subscriptionStatus?.customerId) {
        const portalUrl = await stripeService.createPortalSession(null, subscriptionStatus.customerId);
        window.open(portalUrl, '_blank');
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      alert('Unable to open subscription management. Please try again.');
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'trial':
        return 'text-green-400';
      case 'lifetime':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPlanIcon = (plan) => {
    switch (plan) {
      case 'lifetime':
        return <Crown className="w-4 h-4" />;
      case 'trial':
        return <Crown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getFeatureAccess = (plan) => {
    const features = {
      trial: ['Face touch detection', 'Advanced calibration', 'Custom sounds', 'All premium features for 1 hour'],
      lifetime: ['All premium features', 'Unlimited usage', 'Priority support', 'Lifetime access - no recurring fees']
    };
    return features[plan] || features.trial;
  };

  if (!user) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mr-2" />
          <h3 className="font-semibold text-blue-400">Get Premium Access</h3>
        </div>
        <p className="text-gray-300 text-sm mb-3">
          Sign in to check your subscription status and unlock premium features.
        </p>
        <button
          onClick={() => window.location.href = '/pricing'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          View Pricing Plans
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/5 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="flex items-center mb-3">
            <div className="w-5 h-5 bg-gray-600 rounded mr-2"></div>
            <div className="w-32 h-4 bg-gray-600 rounded"></div>
          </div>
          <div className="w-full h-3 bg-gray-600 rounded mb-2"></div>
          <div className="w-3/4 h-3 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
          <h3 className="font-semibold text-red-400">Error</h3>
        </div>
        <p className="text-gray-300 text-sm mb-3">{error}</p>
        <button
          onClick={checkSubscriptionStatus}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!subscriptionStatus) {
    return null;
  }

  const { hasSubscription, plan, planName, status } = subscriptionStatus;

  if (plan === 'trial_expired') {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Free Trial Expired</h3>
        <p className="text-gray-300 mb-6">Upgrade to the lifetime plan to continue using all premium features.</p>
        <button
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg"
        >
          Upgrade Now - $9.99
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 border border-white/10 rounded-lg p-4 ${hasSubscription ? 'bg-gradient-to-r from-blue-500/5 to-purple-500/5' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {getPlanIcon(plan)}
          <h3 className={`font-semibold ml-2 ${getPlanColor(plan)}`}>
            {planName || `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`}
          </h3>
        </div>
        {hasSubscription && status === 'active' && (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="mb-4">
        <p className="text-gray-300 text-sm mb-2">Current features:</p>
        <ul className="text-xs text-gray-400 space-y-1">
          {getFeatureAccess(plan).map((feature, index) => (
            <li key={index} className="flex items-center">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        {!hasSubscription || plan === 'trial' ? (
          <button
            onClick={() => window.location.href = '/pricing'}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center"
          >
            Get Lifetime Access - $9.99
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        ) : (
          <button
            onClick={handleManageSubscription}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center"
          >
            <Settings className="w-4 h-4 mr-1" />
            Manage Account
          </button>
        )}
      </div>

      {hasSubscription && subscriptionStatus.currentPeriodEnd && (
        <p className="text-xs text-gray-500 mt-2">
          {status === 'active' ? 'Renews' : 'Expires'} on{' '}
          {new Date(subscriptionStatus.currentPeriodEnd * 1000).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default SubscriptionStatus; 