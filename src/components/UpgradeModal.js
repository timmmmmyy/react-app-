import React from 'react';
import { X, Crown, CheckCircle } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose, onUpgrade, trialTimeRemaining, isTrialExpired }) => {
  if (!isOpen) return null;

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
        <div className="flex justify-between items-start mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">
            {isTrialExpired ? 'Trial Expired' : 'Upgrade to Premium'}
          </h3>
          {!isTrialExpired && trialTimeRemaining > 0 && (
            <p className="text-yellow-400 text-sm mb-4">
              Trial ends in: {formatTime(trialTimeRemaining)}
            </p>
          )}
          <p className="text-gray-300">
            {isTrialExpired 
              ? 'Your free trial has ended. Upgrade to continue using all features.'
              : 'Unlock all premium features with lifetime access - no subscriptions!'
            }
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">AI-powered posture detection</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">Face touch prevention alerts</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">Custom sound alerts</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">Detailed analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">Lifetime access - pay once</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-lg mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">$10</div>
            <div className="text-sm text-white/90">One-time payment</div>
            <div className="text-xs text-white/75 mt-1">No subscriptions, yours forever</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onUpgrade}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Upgrade Now
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Later
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Secure payment powered by Stripe. 30-day money-back guarantee.
        </p>
      </div>
    </div>
  );
};

export default UpgradeModal; 