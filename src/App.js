import React, { useRef, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Camera, AlertTriangle, Settings, Play, Pause, Volume2, VolumeX, Crown, Mail, Check, LogOut, User } from 'lucide-react';
import './App.css';
import PricingPage from './pages/PricingPage';
import SuccessPage from './pages/SuccessPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SubscriptionStatus from './components/SubscriptionStatus';
import stripeService from './services/stripeService';
// Removed Firebase imports - using custom backend authentication

// Authentication Modal Component
const AuthModal = ({ isOpen, onClose, mode, onModeChange, onLogin, onRegister, emailVerificationSent, setEmailVerificationSent }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        // Validate password confirmation for registration
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        
        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          setIsLoading(false);
          return;
        }
        
        await onRegister(name, email, password, confirmPassword);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const switchMode = () => {
    resetForm();
    onModeChange(mode === 'login' ? 'register' : 'login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p className="text-gray-300">
            {mode === 'login' 
              ? 'Sign in to access your posture dashboard' 
              : 'Start your journey to better posture and focused work habits'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
            {mode === 'register' && (
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {emailVerificationSent ? (
          <div className="mt-6 text-center">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center mb-2">
                <Mail className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-green-400 font-medium">Email Verification Sent!</span>
              </div>
              <p className="text-green-300 text-sm">
                We've sent a verification link to <strong>{email}</strong>. 
                Please check your email and click the link to activate your account.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={switchMode}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        )}

        {mode === 'register' && (
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <div className="border-t border-gray-600 relative">
                <span className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-gray-900 px-3 text-xs text-gray-400">
                  What you get
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>1-hour free trial with full access</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>AI-powered posture & face touch detection</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span>$10 lifetime access (no subscriptions)</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4 text-center">
          Your privacy is protected. All processing happens locally in your browser.
        </p>
      </div>
    </div>
  );
};

// Professional Upgrade Modal Component
const UpgradeModal = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Free Trial Complete!
          </h3>
          <p className="text-gray-300">
            Ready to unlock unlimited access?
          </p>
        </div>

        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h4 className="text-lg font-semibold text-white">Lifetime Access Plan</h4>
            <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">BEST VALUE</span>
          </div>
          
          <div className="space-y-3 text-sm text-gray-300 mb-4">
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>Unlimited face-touch detection</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>Advanced posture monitoring</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>Custom alert sounds & settings</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>All premium features forever</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-600">
            <span className="text-2xl font-bold text-white">$10</span>
            <span className="text-gray-400">one-time payment</span>
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">NO SUBSCRIPTION</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onUpgrade}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/25"
          >
            Upgrade Now - $10
          </button>
          <button
            onClick={onClose}
            className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          One-time payment • No monthly fees • Lifetime access
        </p>
      </div>
    </div>
  );
};

// Simple Confirm Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Continue", cancelText = "Cancel" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-300">{message}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

const FaceTouchDetector = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const handsRef = useRef(null);
  const poseRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const cameraRef = useRef(null);

  // Audio context for sound alerts
  const faceAudioRef = useRef(null);
  const postureAudioRef = useRef(null);
  const faceWebAudioRef = useRef(null);
  const postureWebAudioRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTouchingFace, setIsTouchingFace] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const [sessionStart, setSessionStart] = useState(null);
  const [currentTouchStart, setCurrentTouchStart] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [isTabVisible, setIsTabVisible] = useState(true); // Tab visibility for background optimization
  
  // Authentication & User Management
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ascends_auth_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);
  
  // Trial Management - initialize based on backend state
  const [trialStartTime, setTrialStartTime] = useState(null);
  const [trialTimeRemaining, setTrialTimeRemaining] = useState(0);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [hasLifetimePlan, setHasLifetimePlan] = useState(false);
  
  // Settings
  const [threshold, setThreshold] = useState(50); // pixels - default distance for face touch
  const [alertInterval, setAlertInterval] = useState(5); // seconds
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [powerSaveMode, setPowerSaveMode] = useState(true);
  // New: Hold times - REDUCED for faster response
  const [faceTouchHoldTime, setFaceTouchHoldTime] = useState(1.5); // seconds - reduced from 2
  const [postureHoldTime, setPostureHoldTime] = useState(1.5); // seconds - reduced from 2

  // Detection data
  const [faceDetected, setFaceDetected] = useState(false);
  const [handsDetected, setHandsDetected] = useState(0);
  const [minDistance, setMinDistance] = useState(999);

  // Posture tracking
  const [poseDetected, setPoseDetected] = useState(false);
  const [badPosture, setBadPosture] = useState(false);
  const [postureCount, setPostureCount] = useState(0);
  const [currentPostureStart, setCurrentPostureStart] = useState(null);
  const [maxPostureDeviation, setMaxPostureDeviation] = useState(0); // NEW: max deviation in px
  const [postureAlertInterval, setPostureAlertInterval] = useState(10); // seconds

  // Add state for alert sound selection
  const [faceAlertSound, setFaceAlertSound] = useState('slap'); // Face touch sound
  const [postureAlertSound, setPostureAlertSound] = useState('tuntun'); // Posture sound
  const [customSoundUrl, setCustomSoundUrl] = useState('/alert.mp4'); // Set default custom sound

  // Add state for UI feedback
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [detectionActive, setDetectionActive] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Calibration state
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibratedLandmarks, setCalibratedLandmarks] = useState(null); // {nose, leftShoulder, rightShoulder, neck}
  const [allowedCoordDeviation, setAllowedCoordDeviation] = useState(15); // px, back to 15 for practical detection

  // Neck extension detection (face size based)
  const [neckExtensionEnabled, setNeckExtensionEnabled] = useState(true);
  const [calibratedFaceSize, setCalibratedFaceSize] = useState(null);
  const [currentFaceSize, setCurrentFaceSize] = useState(0);
  const [faceSizeIncrease, setFaceSizeIncrease] = useState(0); // percentage increase
  const [faceSizeThreshold, setFaceSizeThreshold] = useState(15); // % increase threshold
  const [isFaceSizeCalibrated, setIsFaceSizeCalibrated] = useState(false);

  // Face touch alert indicator for debugging
  const [faceTouchAlert, setFaceTouchAlert] = useState(false);
  const [badPostureAlert, setBadPostureAlert] = useState(false);

  // Face touch detection: require hand to be close for at least faceTouchHoldTime seconds
  const [touchCandidateStart, setTouchCandidateStart] = useState(null);
  const [faceTouchRegistered, setFaceTouchRegistered] = useState(false);

  // Bad posture detection: require bad posture for at least postureHoldTime seconds - REDUCED TIME
  const [postureCandidateStart, setPostureCandidateStart] = useState(null);
  const [postureRegistered, setPostureRegistered] = useState(false);

  // Detection state ref for MediaPipe callbacks
  const detectionStateRef = useRef({
    threshold,
    faceTouchHoldTime,
    postureHoldTime,
    allowedCoordDeviation,
    alertInterval,
    soundEnabled,
    faceAlertSound,
    postureAlertSound,
    customSoundUrl,
    isCalibrated,
    calibratedLandmarks,
    neckExtensionEnabled,
    calibratedFaceSize,
    faceSizeThreshold,
    isFaceSizeCalibrated
  });

  // Keep the detection state ref updated with the latest state
  useEffect(() => {
    detectionStateRef.current = {
      threshold,
      faceTouchHoldTime,
      postureHoldTime,
      allowedCoordDeviation,
      alertInterval,
      soundEnabled,
      faceAlertSound,
      postureAlertSound,
      customSoundUrl,
      isCalibrated,
      calibratedLandmarks,
      neckExtensionEnabled,
      calibratedFaceSize,
      faceSizeThreshold,
      isFaceSizeCalibrated
    };
  }, [
    threshold,
    faceTouchHoldTime,
    postureHoldTime,
    allowedCoordDeviation,
    alertInterval,
    soundEnabled,
    faceAlertSound,
    postureAlertSound,
    customSoundUrl,
    isCalibrated,
    calibratedLandmarks,
    neckExtensionEnabled,
    calibratedFaceSize,
    faceSizeThreshold,
    isFaceSizeCalibrated
  ]);

  // Authentication check on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (token) {
        try {
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setIsAuthenticated(true);
            checkSubscriptionStatus();
          } else {
            // Token is invalid, clear it and show auth modal
            logout();
            setShowAuthModal(true);
            setAuthMode('login');
          }
        } catch (error) {
          console.error('Auth check error:', error);
          // On error, clear token and show auth modal
          logout();
          setShowAuthModal(true);
          setAuthMode('login');
        } finally {
            setIsAuthCheckComplete(true);
        }
      } else {
        setIsAuthCheckComplete(true);
      }
    };

    checkAuthStatus();
  }, [token]);

  // Trial management effects - REMOVED, now handled by checkSubscriptionStatus
  useEffect(() => {
    // Set up trial timer
    const trialTimer = setInterval(() => {
      if (isTrialActive && !isTrialExpired) {
        // Recalculate remaining time
        if (trialStartTime) {
          const elapsed = Date.now() - trialStartTime;
          const newRemaining = 3600000 - elapsed;
          if (newRemaining <= 0) {
            setIsTrialExpired(true);
            setIsTrialActive(false);
            setTrialTimeRemaining(0);
          } else {
            setTrialTimeRemaining(newRemaining);
          }
        }
      }
    }, 1000);
    
    return () => {
      clearInterval(trialTimer);
    };
  }, [isTrialActive, isTrialExpired, trialStartTime]);

  // User Management Functions (now handled by authentication)

  const isPremiumFeature = (feature) => {
    // If user has lifetime plan, all features are available
    if (hasLifetimePlan) {
      return false;
    }
    
    // If trial is active, all features are available
    if (isTrialActive && !isTrialExpired) {
      return false;
    }
    
    // Otherwise, all features are locked (premium only)
    return true;
  };

  const showPremiumUpgrade = (featureName) => {
    if (isPremiumFeature(featureName)) {
      setShowUpgradeModal(true);
      return true;
    }
    return false;
  };

  // Trial Management Functions
  const startTrial = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setAuthMode('register');
      return;
    }
    
    // Use API to start trial
    startTrialAPI();
  };

  const checkTrialStatus = () => {
    if (!trialStartTime) return;
    
    const now = Date.now();
    const elapsed = now - trialStartTime;
    const remaining = 3600000 - elapsed; // 1 hour - elapsed time
    
    if (remaining <= 0) {
      setIsTrialExpired(true);
      setIsTrialActive(false);
      setTrialTimeRemaining(0);
      console.log('⏰ Trial expired! Upgrade to continue using premium features.');
    } else {
      setTrialTimeRemaining(remaining);
      setIsTrialActive(true);
      setIsTrialExpired(false);
    }
  };

  const formatTrialTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Authentication Functions
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        // First update token and user state
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('ascends_auth_token', data.token);
        
        // Then close the modal
        setShowAuthModal(false);
        console.log('✅ Logged in successfully');
        
        // Finally check subscription status to sync trial/premium state
        await checkSubscriptionStatus();
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name, email, password, confirmPassword) => {
    try {
      console.log('🔄 Attempting registration for:', email);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      console.log('📡 Response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('📋 Response data:', data);
      } catch (jsonError) {
        console.error('❌ JSON parsing error:', jsonError);
        throw new Error('Server response was not valid JSON');
      }
      
      if (response.ok) {
        // Registration successful - always show email verification message
        setEmailVerificationSent(true);
        console.log('✅ Account created - Email verification required');
      } else {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => err.msg).join(', ');
          console.log('❌ Validation errors:', errorMessages);
          throw new Error(errorMessages);
        } else {
          console.log('❌ Registration error:', data.error);
          throw new Error(data.error || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('🚨 Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Stop all media streams and processing
    stopDetection();

    // Reset authentication and user state
    setToken('');
    setUser(null);
    setIsAuthenticated(false);
    
    // Reset subscription state but keep trial info so it persists across sessions
    setHasLifetimePlan(false);
    setTrialStartTime(null);
    setTrialTimeRemaining(0);
    setIsTrialActive(false);
    setIsTrialExpired(false);
    
    // Clear authentication token only
    localStorage.removeItem('ascends_auth_token');

    // Reset UI and internal state
    setIsCameraOn(false);
    setDetectionActive(false);
    setAlert({ type: '', message: '' });
    setShowAuthModal(false);
    setShowUpgradeModal(false);

    console.log('✅ Logged out successfully and reset application state.');
  };

  const checkSubscriptionStatus = async () => {
    if (!token) {
      return;
    }
    
    try {
      const response = await fetch('/api/stripe/subscription-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setHasLifetimePlan(data.hasLifetimeAccess);
        
        // Sync trial state from backend
        const backendRemaining = typeof data.trialTimeRemaining === 'number' ? data.trialTimeRemaining : null;
        const backendStart     = data.trialStartTime ?? data.trial_start_time;

        if (backendRemaining !== null && backendRemaining >= 0) {
          // Trust the backend-supplied remaining time
          const start = Date.now() - (3600000 - backendRemaining);
          setTrialStartTime(start);
          setTrialTimeRemaining(backendRemaining);
          setIsTrialActive(backendRemaining > 0);
          setIsTrialExpired(backendRemaining <= 0);
        } else if (backendStart) {
          const startTime = new Date(backendStart).getTime();
          const now = Date.now();
          const elapsed = now - startTime;
          const remaining = 3600000 - elapsed;
          
          if (remaining > 0) {
          setTrialStartTime(startTime);
          setTrialTimeRemaining(remaining);
            setIsTrialActive(true);
            setIsTrialExpired(false);
        } else {
            setTrialStartTime(startTime);
            setTrialTimeRemaining(0);
            setIsTrialActive(false);
            setIsTrialExpired(true);
          }
        } else {
            setTrialStartTime(null);
          setTrialTimeRemaining(0);
          setIsTrialActive(false);
          setIsTrialExpired(false);
        }
      } else {
         console.error('Failed to get subscription status:', data.error || 'Unknown error');
         setHasLifetimePlan(false);
         setIsTrialActive(false);
         setIsTrialExpired(false);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const startTrialAPI = async () => {
    if (!token) {
      setShowAuthModal(true);
      setAuthMode('register');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/start-trial', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update state based on successful API call
        const rawStart = data.trial_start_time ?? data.trialStartTime;
        const startTime = rawStart ? Number(rawStart) : Date.now();
        setTrialStartTime(startTime);
        setIsTrialActive(true);
        setIsTrialExpired(false);
        setTrialTimeRemaining(3600000); // Reset to full hour
        console.log('🎉 Free trial started via API!');
        
        // Re-check status to get the exact remaining time from server
        await checkSubscriptionStatus();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('API trial start error:', error);
      
      // Handle specific case where trial has already been used
      if (error.message === 'Trial has already been started') {
        setShowUpgradeModal(true);
      } else {
        // Generic error handling for other errors
        alert(`Failed to start trial: ${error.message}`);
      }
    }
  };

  // Calculate distance between two 3D points
  const calculateDistance = (point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = (point1.z || 0) - (point2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  // Convert normalized coordinates to pixel coordinates
  const denormalize = (landmark, width, height) => ({
    x: landmark.x * width,
    y: landmark.y * height,
    z: landmark.z || 0
  });

  // Calculate angle between three points
  const calculateAngle = (point1, point2, point3) => {
    const angle1 = Math.atan2(point2.y - point1.y, point2.x - point1.x);
    const angle2 = Math.atan2(point3.y - point2.y, point3.x - point2.x);
    let angle = (angle2 - angle1) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
  };

  // Update playAlert to support multiple sounds
  const playAlert = () => {
    console.log('[PLAY ALERT] Function called');
    const { soundEnabled: soundEnabled_ref, alertSound: alertSound_ref, customSoundUrl: customSoundUrl_ref } = detectionStateRef.current;
    console.log('[PLAY ALERT] Settings:', { soundEnabled: soundEnabled_ref, alertSound: alertSound_ref, customSoundUrl: customSoundUrl_ref });
    
    if (!soundEnabled_ref) {
      console.log('[PLAY ALERT] Sound disabled, skipping');
      return;
    }

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      console.log('[PLAY ALERT] AudioContext not ready, creating now.');
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const context = audioContextRef.current;
        if (context.state === 'suspended') {
          context.resume();
        }

    try {
      console.log('[PLAY ALERT] Playing sound:', alertSound_ref);
      if (alertSound_ref === 'beep') {
        // Create beep sound using Web Audio API
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.15);
        console.log('[PLAY ALERT] Beep sound played');
      } else if (alertSound_ref === 'chime') {
        // Create chime sound using Web Audio API (since chime.mp3 is missing)
        const oscillator1 = context.createOscillator();
        const oscillator2 = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(context.destination);
        
        // Create a pleasant chime sound with two frequencies
        oscillator1.frequency.setValueAtTime(523.25, context.currentTime); // C5
        oscillator2.frequency.setValueAtTime(659.25, context.currentTime); // E5
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.8);
        
        oscillator1.start(context.currentTime);
        oscillator2.start(context.currentTime);
        oscillator1.stop(context.currentTime + 0.8);
        oscillator2.stop(context.currentTime + 0.8);
        
        console.log('[PLAY ALERT] Chime sound played (Web Audio API)');
      } else if (alertSound_ref === 'custom' && customSoundUrl_ref) {
        // Play custom uploaded sound (including MP4)
        console.log('[PLAY ALERT] Playing custom sound:', customSoundUrl_ref);
        const audio = new window.Audio(customSoundUrl_ref);
        audio.volume = 0.7; // Slightly louder for custom sounds
        audio.play().then(() => {
          console.log('[PLAY ALERT] Custom sound played successfully');
        }).catch((e) => {
          console.log('[PLAY ALERT] Custom sound failed, falling back to beep:', e);
          // Fallback to beep if custom sound fails
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          oscillator.frequency.setValueAtTime(800, context.currentTime);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, context.currentTime);
          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.15);
        });
        console.log('[PLAY ALERT] Custom sound initiated');
      } else {
        // Fallback to beep if no valid sound selected
        console.log('[PLAY ALERT] No valid sound, using beep fallback');
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.15);
      }
    } catch (error) {
      console.error('[PLAY ALERT] Error playing sound:', error);
    }
  };

  // Start continuous face touch alert sound
  const startFaceTouchSound = () => {
    const { soundEnabled: soundEnabled_ref, faceAlertSound: faceAlertSound_ref, customSoundUrl: customSoundUrl_ref } = detectionStateRef.current;
    console.log('[FACE SOUND] startFaceTouchSound called, soundEnabled:', soundEnabled_ref, 'faceAlertSound:', faceAlertSound_ref);
    if (!soundEnabled_ref) {
      console.log('[FACE SOUND] Sound disabled, returning');
      return;
    }
    
    console.log('[FACE SOUND] Starting continuous face touch sound:', faceAlertSound_ref);
    if (faceAudioRef.current) {
      console.log('[FACE SOUND] Stopping existing face audio');
      faceAudioRef.current.pause();
      faceAudioRef.current = null;
    }
    
    try {
      let audioUrl;
      if (faceAlertSound_ref === 'slap') {
        audioUrl = '/slap.mp3';
      } else if (faceAlertSound_ref === 'tuntun') {
        audioUrl = '/alert.mp4';
      } else if (faceAlertSound_ref === 'custom' && customSoundUrl_ref) {
        audioUrl = customSoundUrl_ref;
      } else {
        // Fallback to Web Audio API for beep/chime
        console.log('[FACE SOUND] Using Web Audio API for:', faceAlertSound_ref);
        startWebAudioLoop(faceAlertSound_ref, 'face');
        return;
      }
      
      console.log('[FACE SOUND] Creating new Audio object for:', audioUrl);
      faceAudioRef.current = new Audio(audioUrl);
      faceAudioRef.current.loop = true;
      faceAudioRef.current.volume = 0.6;
      
      console.log('[FACE SOUND] Attempting to play face touch sound');
      faceAudioRef.current.play().then(() => {
        console.log('[FACE SOUND] Face touch sound started successfully');
      }).catch(e => {
        console.error('[FACE SOUND] Play failed:', e);
        faceAudioRef.current = null;
      });
    } catch (error) {
      console.error('[FACE SOUND] Error starting face touch sound:', error);
      faceAudioRef.current = null;
    }
  };

  // Stop continuous face touch alert sound
  const stopFaceTouchSound = () => {
    console.log('[FACE SOUND] Stopping face touch sound');
    if (faceAudioRef.current) {
      faceAudioRef.current.pause();
      faceAudioRef.current.currentTime = 0;
      faceAudioRef.current = null;
    }
    if (faceWebAudioRef.current) {
      clearInterval(faceWebAudioRef.current);
      faceWebAudioRef.current = null;
    }
  };

  // Start continuous posture alert sound
  const startPostureSound = () => {
    const { soundEnabled: soundEnabled_ref, postureAlertSound: postureAlertSound_ref, customSoundUrl: customSoundUrl_ref } = detectionStateRef.current;
    console.log('[POSTURE SOUND] startPostureSound called, soundEnabled:', soundEnabled_ref, 'postureAlertSound:', postureAlertSound_ref);
    if (!soundEnabled_ref) {
      console.log('[POSTURE SOUND] Sound disabled, returning');
      return;
    }
    
    console.log('[POSTURE SOUND] Starting continuous posture sound:', postureAlertSound_ref);
    if (postureAudioRef.current) {
      console.log('[POSTURE SOUND] Stopping existing posture audio');
      postureAudioRef.current.pause();
      postureAudioRef.current = null;
    }
    
    try {
      let audioUrl;
      if (postureAlertSound_ref === 'slap') {
        audioUrl = '/slap.mp3';
      } else if (postureAlertSound_ref === 'tuntun') {
        audioUrl = '/alert.mp4';
      } else if (postureAlertSound_ref === 'custom' && customSoundUrl_ref) {
        audioUrl = customSoundUrl_ref;
      } else {
        // Fallback to Web Audio API for beep/chime
        console.log('[POSTURE SOUND] Using Web Audio API for:', postureAlertSound_ref);
        startWebAudioLoop(postureAlertSound_ref, 'posture');
        return;
      }
      
      console.log('[POSTURE SOUND] Creating new Audio object for:', audioUrl);
      postureAudioRef.current = new Audio(audioUrl);
      postureAudioRef.current.loop = true;
      postureAudioRef.current.volume = 0.6;
      
      console.log('[POSTURE SOUND] Attempting to play posture sound');
      postureAudioRef.current.play().then(() => {
        console.log('[POSTURE SOUND] Posture sound started successfully');
      }).catch(e => {
        console.error('[POSTURE SOUND] Play failed:', e);
        postureAudioRef.current = null;
      });
    } catch (error) {
      console.error('[POSTURE SOUND] Error starting posture sound:', error);
      postureAudioRef.current = null;
    }
  };

  // Stop continuous posture alert sound
  const stopPostureSound = () => {
    console.log('[POSTURE SOUND] Stopping posture sound');
    if (postureAudioRef.current) {
      postureAudioRef.current.pause();
      postureAudioRef.current.currentTime = 0;
      postureAudioRef.current = null;
    }
    if (postureWebAudioRef.current) {
      clearInterval(postureWebAudioRef.current);
      postureWebAudioRef.current = null;
    }
  };

  // Helper to get key points from pose landmarks
  const getKeyPoints = (poseLandmarks, width, height) => {
    const nose = denormalize(poseLandmarks[0], width, height);
    const leftShoulder = denormalize(poseLandmarks[11], width, height);
    const rightShoulder = denormalize(poseLandmarks[12], width, height);
    const neck = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    return { nose, leftShoulder, rightShoulder, neck };
  };

  // Helper to calculate Euclidean distance
  const pointDistance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  // Face size calculation for neck extension detection
  const calculateFaceSize = (faceLandmarks) => {
    const canvas = canvasRef.current;
    if (!canvas || !faceLandmarks || faceLandmarks.length === 0) return 0;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Key face landmarks for size calculation
    // Using face outline points for better size measurement
    const leftFace = denormalize(faceLandmarks[234], width, height);   // Left face outline
    const rightFace = denormalize(faceLandmarks[454], width, height);  // Right face outline
    const topFace = denormalize(faceLandmarks[10], width, height);     // Top of forehead
    const bottomFace = denormalize(faceLandmarks[152], width, height); // Bottom of chin
    
    // Calculate face width and height
    const faceWidth = pointDistance(leftFace, rightFace);
    const faceHeight = pointDistance(topFace, bottomFace);
    
    // Use face area as size metric (more robust than individual dimensions)
    const faceArea = faceWidth * faceHeight;
    
    console.log(`[FACE SIZE] Width: ${faceWidth.toFixed(1)}px, Height: ${faceHeight.toFixed(1)}px, Area: ${faceArea.toFixed(1)}px²`);
    return faceArea;
  };

  // Face size calibration handler
  function handleCalibrateFaceSize() {
    console.log('[FACE SIZE CALIBRATION] Button clicked!');
    if (!window.currentFaceLandmarks) {
      console.log('[FACE SIZE CALIBRATION] No face landmarks available');
      return;
    }
    
    const faceSize = calculateFaceSize(window.currentFaceLandmarks);
    if (faceSize > 0) {
      setCalibratedFaceSize(faceSize);
      setIsFaceSizeCalibrated(true);
      console.log('[FACE SIZE CALIBRATION] Baseline face size set:', faceSize);
    } else {
      console.log('[FACE SIZE CALIBRATION] Failed to calculate face size');
    }
  }

  // Reset face size calibration
  function handleResetFaceSize() {
    setCalibratedFaceSize(null);
    setIsFaceSizeCalibrated(false);
    setCurrentFaceSize(0);
    setFaceSizeIncrease(0);
    console.log('[FACE SIZE CALIBRATION] Face size calibration reset');
  }

  // Check for neck extension based on face size
  function checkNeckExtension(faceLandmarks) {
    const { neckExtensionEnabled: enabled_ref, calibratedFaceSize: baseline_ref, faceSizeThreshold: threshold_ref, isFaceSizeCalibrated: isCalibrated_ref } = detectionStateRef.current;
    
    if (!enabled_ref || !isCalibrated_ref || !baseline_ref || !faceLandmarks) {
      return { isExtended: false, increase: 0 };
    }
    
    const currentSize = calculateFaceSize(faceLandmarks);
    if (currentSize === 0) return { isExtended: false, increase: 0 };
    
    const increase = ((currentSize - baseline_ref) / baseline_ref) * 100;
    const isExtended = increase > threshold_ref;
    
    console.log(`[NECK EXTENSION] Current: ${currentSize.toFixed(1)}, Baseline: ${baseline_ref.toFixed(1)}, Increase: ${increase.toFixed(1)}%, Threshold: ${threshold_ref}%, Extended: ${isExtended}`);
    
    setCurrentFaceSize(currentSize);
    setFaceSizeIncrease(increase);
    
    return { isExtended, increase };
  }

  // Calibration handler for coordinates
  function handleCalibratePosture() {
    console.log('[CALIBRATION] Button clicked!');
    const video = videoRef.current;
    if (!video) {
      console.log('[CALIBRATION] No video element found');
      return;
    }
    if (!window.currentPoseLandmarks) {
      console.log('[CALIBRATION] No pose landmarks available');
      return;
    }
    console.log('[CALIBRATION] Video dimensions:', video.videoWidth, video.videoHeight);
    console.log('[CALIBRATION] Pose landmarks available:', window.currentPoseLandmarks.length);
    
    const width = video.videoWidth;
    const height = video.videoHeight;
    const keyPoints = getKeyPoints(window.currentPoseLandmarks, width, height);
    console.log('[CALIBRATION] Key points calculated:', keyPoints);
    
    setCalibratedLandmarks(keyPoints);
    setIsCalibrated(true);
    console.log('[CALIBRATION] Baseline set successfully:', keyPoints);
    
    // Also calibrate face size if face is detected and neck extension is enabled
    if (window.currentFaceLandmarks && neckExtensionEnabled) {
      const faceSize = calculateFaceSize(window.currentFaceLandmarks);
      if (faceSize > 0) {
        setCalibratedFaceSize(faceSize);
        setIsFaceSizeCalibrated(true);
        console.log('[FACE SIZE CALIBRATION] Face size baseline set alongside posture:', faceSize);
      }
    }
  }

  function handleForceRecalibrate() {
    setCalibratedLandmarks(null);
    setIsCalibrated(false);
    setBadPosture(false);
    setPostureCandidateStart(null);
    setPostureRegistered(false);
    setMaxPostureDeviation(0);
    setPostureCount(0);
    
    // Also reset face size calibration
    setCalibratedFaceSize(null);
    setIsFaceSizeCalibrated(false);
    setCurrentFaceSize(0);
    setFaceSizeIncrease(0);
    
    console.log('[FORCE RECALIBRATE] All calibration and posture state reset.');
  }

  // Updated posture check logic to use coordinate calibration if set
  function checkPosture(poseLandmarks) {
    if (!poseLandmarks || poseLandmarks.length < 33) return { isBad: false, maxDeviation: 0 };
    const video = videoRef.current;
    if (!video) return { isBad: false, maxDeviation: 0 };
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    console.log(`[POSTURE CHECK] Video dimensions: ${width}x${height}`);
    
    // Key points for body posture
    const keyPoints = getKeyPoints(poseLandmarks, width, height);
    console.log(`[POSTURE CHECK] Current keyPoints:`, keyPoints);
    
    let isBadBodyPosture = false;
    let maxDeviation = 0;

    // Read from the ref to get the LATEST state
    const { isCalibrated: isCalibrated_ref, calibratedLandmarks: calibratedLandmarks_ref, allowedCoordDeviation: allowedCoordDeviation_ref } = detectionStateRef.current;
    
    console.log(`[POSTURE CHECK] Calibration state: isCalibrated=${isCalibrated_ref}, hasLandmarks=${!!calibratedLandmarks_ref}`);
    if (calibratedLandmarks_ref) {
      console.log(`[POSTURE CHECK] Calibrated landmarks:`, calibratedLandmarks_ref);
    }

    // Check body posture based on coordinate calibration
    if (isCalibrated_ref && calibratedLandmarks_ref) {
      for (const key of Object.keys(keyPoints)) {
        const dist = pointDistance(keyPoints[key], calibratedLandmarks_ref[key]);
        if (dist > maxDeviation) maxDeviation = dist;
        console.log(`[POSTURE DEBUG] ${key}: current=(${keyPoints[key].x.toFixed(1)},${keyPoints[key].y.toFixed(1)}) baseline=(${calibratedLandmarks_ref[key].x.toFixed(1)},${calibratedLandmarks_ref[key].y.toFixed(1)}) dist=${dist.toFixed(2)} allowed=${allowedCoordDeviation_ref}`);
        if (dist > allowedCoordDeviation_ref) {
          isBadBodyPosture = true;
          break;
        }
      }
    } else {
      console.log(`[POSTURE CHECK] No body posture calibration - skipping body posture check`);
    }

    // Check neck extension based on face size (if face landmarks are available)
    let isNeckExtended = false;
    if (window.currentFaceLandmarks) {
      const { isExtended } = checkNeckExtension(window.currentFaceLandmarks);
      isNeckExtended = isExtended;
    }

    // Overall bad posture is true if either body posture is bad OR neck is extended
    const isBadPosture = isBadBodyPosture || isNeckExtended;
    
    console.log(`[POSTURE CHECK] Body posture bad: ${isBadBodyPosture}, Neck extended: ${isNeckExtended}, Overall bad: ${isBadPosture}`);
    
    setMaxPostureDeviation(maxDeviation);
    return {
      isBad: isBadPosture,
      maxDeviation
    };
  }

  // Handle posture detection with continuous timing and sound
  const handlePosture = (isBad, deviation) => {
    console.log(`[HANDLE POSTURE] isBad=${isBad}, deviation=${deviation.toFixed(2)}`);
    
    if (isBad) {
      setBadPosture(true);
      
      // Start timing if not already started
      if (!postureStartTimeRef.current) {
        console.log('[POSTURE] Started continuous bad posture timing');
        postureStartTimeRef.current = Date.now();
        postureAlertTriggeredRef.current = false;
      } else {
        // Check if we've had bad posture continuously for postureHoldTime
        const badPostureDuration = (Date.now() - postureStartTimeRef.current) / 1000;
        console.log(`[POSTURE] Continuous bad posture duration: ${badPostureDuration.toFixed(2)}s`);
        
        const { postureHoldTime: holdTime_ref } = detectionStateRef.current;
        if (badPostureDuration >= holdTime_ref && !postureAlertTriggeredRef.current) {
          console.log(`[POSTURE] CONTINUOUS bad posture for ${badPostureDuration.toFixed(2)}s - STARTING CONTINUOUS SOUND!`);
          
          // Mark alert as triggered and increment counter
          postureAlertTriggeredRef.current = true;
        setPostureCount(prev => prev + 1);
          setBadPostureAlert(true);
          setTimeout(() => setBadPostureAlert(false), 1000);
          
          // Start continuous sound
          startPostureSound();
        } else if (badPostureDuration >= holdTime_ref) {
          // Keep sound playing if it's not already playing
          if (!postureAudioRef.current) {
            console.log('[POSTURE] Restarting posture sound');
            startPostureSound();
          }
        }
      }
      } else {
      // Good posture - reset timer and stop sound
      if (postureStartTimeRef.current) {
        console.log('[POSTURE] Good posture - resetting timer and stopping sound');
        postureStartTimeRef.current = null;
        postureAlertTriggeredRef.current = false;
      }
      setBadPosture(false);
      stopPostureSound();
    }
  };

  // FULL HAND-BASED: Checks all hand landmarks against the nose.
  function checkFaceTouch(faceLandmarks, handLandmarks) {
    if (!faceLandmarks || !handLandmarks || handLandmarks.length === 0) {
      return { isTouching: false, minDist: 999 };
    }
    
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      return { isTouching: false, minDist: 999 };
    }
    
    const W = video.videoWidth;
    const H = video.videoHeight;
    const { threshold: THRESHOLD } = detectionStateRef.current;

    // Key reference points: nose (1) and chin (152)
    const nosePoint = faceLandmarks[1];
    const chinPoint = faceLandmarks[152];
    if (!nosePoint || !chinPoint) {
      return { isTouching: false, minDist: 999 };
    }
    const nosePx = { x: nosePoint.x * W, y: nosePoint.y * H };
    const chinPx = { x: chinPoint.x * W, y: chinPoint.y * H };
    
    // Dynamic distance threshold – 60 % of face height, but never below user slider (THRESHOLD)
    const faceHeightPx = Math.abs(chinPx.y - nosePx.y) * (100/60); // approximate full face height from nose-chin gap
    const dynamicThreshold = Math.max(THRESHOLD, faceHeightPx * 0.6);

    // Build list of candidate hand points: all hand landmarks plus pose wrists as fallback
    const candidatePoints = [];

    // 1. From MediaPipe Hands (full hand landmarks)
    if (handLandmarks && handLandmarks.length) {
      handLandmarks.forEach(lms => {
        lms.forEach(pt => pt && candidatePoints.push({ x: pt.x * W, y: pt.y * H }));
      });
    }

    // 2. Fallback: pose wrists (landmarks 15 & 16) – useful when Hands loses a static hand
    if (window.currentPoseLandmarks && window.currentPoseLandmarks.length >= 17) {
      [15, 16].forEach(idx => {
        const w = window.currentPoseLandmarks[idx];
        if (w && w.visibility > 0.4) {
          candidatePoints.push({ x: w.x * W, y: w.y * H });
        }
      });
    }

    if (candidatePoints.length === 0) {
      return { isTouching: false, minDist: 999 };
    }

    let minDist = 999;

    // Check each candidate point
    for (const pt of candidatePoints) {
      const distNose = Math.hypot(nosePx.x - pt.x, nosePx.y - pt.y);
      const distChin = Math.hypot(chinPx.x - pt.x, chinPx.y - pt.y);
      const dist = Math.min(distNose, distChin);
        
      if (dist < minDist) minDist = dist;

      if (dist < dynamicThreshold) {
        console.log(`[TOUCH] Hand/wrist near face: ${dist.toFixed(1)}px (dynThresh ${dynamicThreshold.toFixed(1)}px)`);
          return { isTouching: true, minDist: dist };
      }
    }
    
    console.log(`[NO TOUCH] Min distance: ${minDist.toFixed(1)}px (need < ${dynamicThreshold.toFixed(1)}px)`);
    return { isTouching: false, minDist };
  }

  // Draw results on canvas (optimized for low CPU)
  const drawResults = () => {
    if (!isTabVisible) return;
    
    // Skip drawing more aggressively for performance
    if (frameCountRef.current % DRAW_EVERY_N_FRAMES !== 0) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    // DEBUG: Log at the start of drawResults
    console.log('drawResults called. poseDetected:', poseDetected, 'window.currentPoseLandmarks:', window.currentPoseLandmarks);

    // Get the actual rendered size of the canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale and offset for object-fit: cover
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = canvas.width / canvas.height;
    let drawWidth, drawHeight, offsetX, offsetY;
    if (canvasAspect > videoAspect) {
      drawWidth = canvas.width;
      drawHeight = canvas.width / videoAspect;
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2;
    } else {
      drawHeight = canvas.height;
      drawWidth = canvas.height * videoAspect;
      offsetY = 0;
      offsetX = (canvas.width - drawWidth) / 2;
    }

    // Debug: Log sizing
    console.log('VIDEO:', video.videoWidth, video.videoHeight, 'CANVAS:', canvas.width, canvas.height, 'DRAW:', drawWidth, drawHeight, 'OFFSET:', offsetX, offsetY);

    // Helper to transform normalized landmark to object-cover-mapped canvas coordinates (no mirroring)
    const toCanvas = (lm) => {
      return {
        x: offsetX + lm.x * drawWidth,
        y: offsetY + lm.y * drawHeight
      };
    };

    // MINIMAL TEST: Draw just the nose landmark as a red circle
    if (window.currentPoseLandmarks && window.currentPoseLandmarks.length > 0) {
      console.log('POSE LANDMARKS FOUND:', window.currentPoseLandmarks.length);
      const landmarks = window.currentPoseLandmarks;
      
      // CHECK POSTURE DIRECTLY HERE FOR IMMEDIATE COLOR RESPONSE
      const { isBad: currentlyBadPosture } = checkPosture(landmarks);
      const color = currentlyBadPosture ? '#ef4444' : '#10b981'; // Red for bad posture, green for good
      const lineWidth = currentlyBadPosture ? 3 : 2;
      
      console.log(`[SKELETON COLOR] currentlyBadPosture=${currentlyBadPosture}, color=${color}, lineWidth=${lineWidth}`);

      // NOW ADD BACK THE SKELETON (simplified for performance)
      const POSE_CONNECTIONS = [
        // Essential connections only (reduced from full skeleton)
        [11,12], // Shoulders
        [11,13],[13,15], // Left arm
        [12,14],[14,16], // Right arm
        [11,23],[12,24],[23,24], // Torso
        [23,25],[25,27], // Left leg
        [24,26],[26,28]  // Right leg
        // Removed face and hand connections for performance
      ];

      // Draw pose connections
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      POSE_CONNECTIONS.forEach(([start, end]) => {
        const lmStart = landmarks[start];
        const lmEnd = landmarks[end];
        if (lmStart && lmEnd) {
          const p1 = toCanvas(lmStart);
          const p2 = toCanvas(lmEnd);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      // Draw key landmarks as circles (reduced set for performance)
      const keyLandmarks = [11, 12, 23, 24]; // Only shoulders and hips
      ctx.fillStyle = color;
      keyLandmarks.forEach(index => {
        const landmark = landmarks[index];
        if (landmark) {
          const { x, y } = toCanvas(landmark);
          const radius = 2; // Smaller radius for performance
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      ctx.restore();
      console.log('DREW FULL SKELETON');
    } else {
      console.log('NO POSE LANDMARKS FOUND');
    }
    
    // VISUALIZE FACE TOUCH DETECTION POINTS
    // Draw tracked face points as blue circles
    if (window.currentFaceLandmarks && window.currentFaceLandmarks.length > 0) {
      const faceLandmarks = window.currentFaceLandmarks;
      const FACE_POINTS = [1, 10, 151, 234, 454]; // Same as in checkFaceTouch
      
      ctx.save();
      ctx.fillStyle = '#3b82f6'; // Blue for face points
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 2;
      
      FACE_POINTS.forEach(idx => {
        if (idx < faceLandmarks.length) {
          const point = toCanvas(faceLandmarks[idx]);
          ctx.beginPath();
          ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      });
      ctx.restore();
    }
    
    // Draw tracked wrist points as orange circles
    if (window.currentPoseLandmarks && window.currentPoseLandmarks.length > 0) {
      const WRIST_POINTS = [15, 16]; // Left and right wrists from pose
      
      // Get face boundaries for filtering visualization
      let faceTop = 1, faceBottom = 0;
      if (window.currentFaceLandmarks && window.currentFaceLandmarks.length > 0) {
        const FACE_POINTS = [1, 10, 151, 234, 454];
        FACE_POINTS.forEach(fIdx => {
          if (fIdx < window.currentFaceLandmarks.length) {
            const face = window.currentFaceLandmarks[fIdx];
            faceTop = Math.min(faceTop, face.y);
            faceBottom = Math.max(faceBottom, face.y);
          }
        });
      }
      
      const faceBottomY = faceBottom * video.videoHeight;
      const faceTopY = faceTop * video.videoHeight;
      const faceHeight = faceBottomY - faceTopY;
      const allowedBelowFace = faceHeight * 0.3;
      
      ctx.save();
      ctx.lineWidth = 3;
      
      WRIST_POINTS.forEach(idx => {
        const wrist = window.currentPoseLandmarks[idx];
        if (wrist && wrist.visibility > 0.5) {
          const point = toCanvas(wrist);
          const wristY = wrist.y * video.videoHeight;
          
          // Color based on whether wrist is filtered or active
          const isFiltered = wristY > faceBottomY + allowedBelowFace;
          ctx.fillStyle = isFiltered ? '#6b7280' : '#f97316'; // Gray for filtered, orange for active
          ctx.strokeStyle = isFiltered ? '#4b5563' : '#ea580c';
          
          ctx.beginPath();
          ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          
          // Add text label
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Inter';
          ctx.textAlign = 'center';
          const label = `${idx === 15 ? 'L' : 'R'} ${isFiltered ? '(filtered)' : ''}`;
          ctx.fillText(label, point.x, point.y - 15);
        }
      });
      ctx.restore();
    }
    
    // Draw detection threshold circles around face points if wrists are detected
    if (window.currentFaceLandmarks && window.currentPoseLandmarks && window.currentPoseLandmarks.length > 0) {
      const faceLandmarks = window.currentFaceLandmarks;
      const FACE_POINTS = [1, 10, 151, 234, 454];
      const threshold = detectionStateRef.current.threshold;
      
      // Convert threshold from video pixels to canvas pixels
      const video = videoRef.current;
      if (video && video.videoWidth > 0) {
        const scaleX = drawWidth / video.videoWidth;
        const scaleY = drawHeight / video.videoHeight;
        const canvasThreshold = threshold * Math.min(scaleX, scaleY);
        
        ctx.save();
        ctx.strokeStyle = '#ef4444'; // Red for detection zones
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Dashed line
        
        FACE_POINTS.forEach(idx => {
          if (idx < faceLandmarks.length) {
            const point = toCanvas(faceLandmarks[idx]);
            ctx.beginPath();
            ctx.arc(point.x, point.y, canvasThreshold, 0, 2 * Math.PI);
            ctx.stroke();
          }
        });
        ctx.restore();
      }
    }
  };

  // Timer refs for 2-second delays
  const faceTimerRef = useRef(null);
  const postureTimerRef = useRef(null);

  // Timer refs and start times for continuous detection
  const faceStartTimeRef = useRef(null);
  const postureStartTimeRef = useRef(null);
  const faceAlertTriggeredRef = useRef(false);
  const postureAlertTriggeredRef = useRef(false);

  // Frame skipping for performance
  const frameCountRef = useRef(0);
  const PROCESS_EVERY_N_FRAMES = 2; // Back to every 2nd frame for better detection
  const DRAW_EVERY_N_FRAMES = 3; // Keep drawing optimization
  const lastProcessTimeRef = useRef(0);
  const IDLE_PROCESSING_INTERVAL = 500; // Reduced from 1000ms for better responsiveness

  // Pose detection results
  const onPoseResults = (results) => {
    console.log('[POSE RESULTS] Function called with results:', !!results, 'poseLandmarks:', results?.poseLandmarks?.length);
    console.log('[POSE RESULTS] Calibration status - isCalibrated:', detectionStateRef.current.isCalibrated, 'calibratedLandmarks:', !!detectionStateRef.current.calibratedLandmarks);
    
    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      setPoseDetected(true);
      window.currentPoseLandmarks = results.poseLandmarks;
      
      // Use the proper checkPosture function
      const { isBad, maxDeviation } = checkPosture(results.poseLandmarks);
      console.log(`[POSTURE CHECK] maxDeviation=${maxDeviation.toFixed(2)}, allowed=${detectionStateRef.current.allowedCoordDeviation}, isBad=${isBad}, isCalibrated=${detectionStateRef.current.isCalibrated}, holdTime=${detectionStateRef.current.postureHoldTime}`);
      handlePosture(isBad, maxDeviation);
    } else {
      setPoseDetected(false);
      window.currentPoseLandmarks = null;
      setBadPosture(false);
      setMaxPostureDeviation(0);
    }
    drawResults();
  };

  // Face detection results
  const onFaceResults = (results) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      setFaceDetected(true);
      // Store face landmarks for distance calculation
      window.currentFaceLandmarks = results.multiFaceLandmarks[0];
      
      // Calculate face size for neck extension detection
      const faceSize = calculateFaceSize(results.multiFaceLandmarks[0]);
      setCurrentFaceSize(faceSize);
      
      // Check neck extension if calibrated
      const { neckExtensionEnabled, calibratedFaceSize, isFaceSizeCalibrated } = detectionStateRef.current;
      if (neckExtensionEnabled && isFaceSizeCalibrated && calibratedFaceSize) {
        const increase = ((faceSize - calibratedFaceSize) / calibratedFaceSize) * 100;
        setFaceSizeIncrease(increase);
      }
    } else {
      setFaceDetected(false);
      window.currentFaceLandmarks = null;
      setCurrentFaceSize(0);
      setFaceSizeIncrease(0);
    }
    drawResults();
  };

  // Hand detection results
  const onHandsResults = (results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandsDetected(results.multiHandLandmarks.length);
      window.currentHandLandmarks = results.multiHandLandmarks;
      
      if (window.currentFaceLandmarks) {
        const { isTouching, minDist } = checkFaceTouch(
          window.currentFaceLandmarks,
          results.multiHandLandmarks
        );
        setMinDistance(minDist);
        
        if (isTouching) {
          setIsTouchingFace(true);
          
          // Start timing if not already started
          if (!faceStartTimeRef.current) {
            console.log('[FACE TOUCH] Started continuous touch timing');
            faceStartTimeRef.current = Date.now();
            faceAlertTriggeredRef.current = false;
          } else {
            // Check if we've been touching continuously for faceTouchHoldTime
            const touchDuration = (Date.now() - faceStartTimeRef.current) / 1000;
            console.log(`[FACE TOUCH] Continuous touch duration: ${touchDuration.toFixed(2)}s`);
            
            const { faceTouchHoldTime: holdTime_ref } = detectionStateRef.current;
            if (touchDuration >= holdTime_ref && !faceAlertTriggeredRef.current) {
              console.log(`[FACE TOUCH] CONTINUOUS for ${touchDuration.toFixed(2)}s - STARTING CONTINUOUS SLAP SOUND!`);
              
              // Mark alert as triggered and increment counter
              faceAlertTriggeredRef.current = true;
              setTouchCount(prev => prev + 1);
              setFaceTouchAlert(true);
              setTimeout(() => setFaceTouchAlert(false), 1000);
              
              // Start continuous slap sound
              startFaceTouchSound();
            } else if (touchDuration >= holdTime_ref) {
              // Keep sound playing if it's not already playing
              if (!faceAudioRef.current) {
                console.log('[FACE TOUCH] Restarting face touch sound');
                startFaceTouchSound();
              }
            }
      }
    } else {
          // Not touching - reset timer and stop sound
          if (faceStartTimeRef.current) {
            console.log('[FACE TOUCH] Touch broken - resetting timer and stopping sound');
            faceStartTimeRef.current = null;
            faceAlertTriggeredRef.current = false;
          }
          setIsTouchingFace(false);
          stopFaceTouchSound();
        }
      }
    } else {
      // No hands detected - reset timer and stop sound
      if (faceStartTimeRef.current) {
        console.log('[FACE TOUCH] No hands - resetting timer and stopping sound');
        faceStartTimeRef.current = null;
        faceAlertTriggeredRef.current = false;
      }
      setHandsDetected(0);
      window.currentHandLandmarks = null;
      setIsTouchingFace(false);
      stopFaceTouchSound();
    }
    drawResults();
  };

  // Load MediaPipe script dynamically
  const loadMediaPipeScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Initialize MediaPipe models
  const initializeMediaPipe = async () => {
    try {
      setIsLoading(true);
      setDebugInfo('Loading MediaPipe scripts...');
      console.log('Starting MediaPipe initialization...');
      
      // Load MediaPipe scripts from CDN
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
      ];

      setDebugInfo('Loading scripts from CDN...');
      for (const script of scripts) {
        console.log('Loading script:', script);
        await loadMediaPipeScript(script);
      }
      
      console.log('All MediaPipe scripts loaded');
      setDebugInfo('Scripts loaded, initializing models...');
      
      // Wait a bit for scripts to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if MediaPipe is available
      if (!window.FaceMesh || !window.Hands || !window.Pose) {
        throw new Error('MediaPipe classes not available after loading scripts');
      }

      // Initialize Pose first
      setDebugInfo('Initializing Pose...');
      console.log('Creating Pose instance...');
      try {
        poseRef.current = new window.Pose({
          locateFile: (file) => {
            const url = `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            console.log('Loading Pose file:', file, '→', url);
            return url;
          }
        });

        console.log('Setting Pose options...');
        poseRef.current.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        poseRef.current.onResults(onPoseResults);
        console.log('Pose model initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Pose model:', error);
        throw error;
      }

      // Wait a bit before initializing other models
      setDebugInfo('Waiting before initializing other models...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Initialize Hands
      setDebugInfo('Initializing Hands...');
      console.log('Creating Hands instance...');
      try {
        handsRef.current = new window.Hands({
          locateFile: (file) => {
            const url = `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            console.log('Loading Hands file:', file, '→', url);
            return url;
          }
        });

        console.log('Setting Hands options...');
        handsRef.current.setOptions({
          maxNumHands: 2, // Allow both hands for better face touch detection
          modelComplexity: 0,
          minDetectionConfidence: 0.5, // Lowered from 0.6 for better detection
          minTrackingConfidence: 0.5   // Lowered from 0.6 for better tracking
        });

        handsRef.current.onResults(onHandsResults);
        console.log('Hands model initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Hands model:', error);
        throw error;
      }

      // Wait a bit before initializing Face Mesh
      setDebugInfo('Waiting before initializing Face Mesh...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Initialize Face Mesh
      setDebugInfo('Initializing Face Mesh...');
      console.log('Creating Face Mesh instance...');
      try {
        faceMeshRef.current = new window.FaceMesh({
          locateFile: (file) => {
            const url = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            console.log('Loading Face Mesh file:', file, '→', url);
            return url;
          }
        });

        console.log('Setting Face Mesh options...');
        faceMeshRef.current.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        // Set up result handlers
        setDebugInfo('Setting up result handlers...');
        console.log('Setting up result handlers...');
        faceMeshRef.current.onResults(onFaceResults);
        console.log('Face Mesh model initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Face Mesh model:', error);
        throw error;
      }

      console.log('MediaPipe models initialized successfully');
      setDebugInfo('MediaPipe models loaded successfully');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setDebugInfo(`MediaPipe error: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  };

  // Request camera permission
  const requestCamera = async () => {
    try {
      setDebugInfo('Requesting camera access...');
      console.log('Requesting camera access...');
      
      // Wait a bit to ensure video element is mounted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!videoRef.current) {
        console.error('Video ref is null - element not mounted yet');
        setDebugInfo('Video element not mounted yet, retrying...');
        // Try again after a short delay
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!videoRef.current) {
          setDebugInfo('Video element still not found');
          return false;
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 320,  // Increased resolution for better detection
          height: 240, // Increased from 180 for better detection
          facingMode: 'user',
          frameRate: { ideal: 15, max: 20 } // Allow up to 20fps for better detection
        }
      });
      
      console.log('Camera stream obtained:', stream);
      setDebugInfo('Camera stream obtained');
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        const video = videoRef.current;
        if (!video) {
          resolve();
          return;
        }
        
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded, starting playback');
          setDebugInfo('Video ready, starting playback');
          video.play().then(() => {
            console.log('Video playing successfully');
            setDebugInfo('Video playing successfully');
            resolve();
          }).catch(err => {
            console.error('Error playing video:', err);
            setDebugInfo(`Video play error: ${err.message}`);
            resolve();
          });
        };
      });
      
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Camera access denied:', error);
      setDebugInfo(`Camera error: ${error.message}`);
      alert('Camera access is required for face touch detection!');
      return false;
    }
  };

  // Start detection
  const startDetection = async () => {
    // Require authentication before starting any detection
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setAuthMode('register');
      return;
    }
    
    // Check if user has trial/premium access
    if (!isTrialActive && !hasLifetimePlan) {
      // If trial has expired, show upgrade message
      if (isTrialExpired) {
        setShowUpgradeModal(true);
        return;
      }
      
      // If trial hasn't been started yet, automatically start it
      try {
        await startTrialAPI();
        // The trial state will be updated by the API response
        // Continue with detection after trial starts
      } catch (error) {
        console.error('Failed to start trial:', error);
        // The startTrialAPI function will handle the specific error cases
        return;
      }
    }
    
    // Resume audio context on user interaction
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      console.log('[START DETECTION] Resuming suspended audio context');
      await audioContextRef.current.resume();
    }
    
    // Ensure audio context is ready
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      console.log('[START DETECTION] Creating audio context');
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    console.log('[START DETECTION] Audio context state:', audioContextRef.current.state);
    
    if (!videoRef.current || !videoRef.current.srcObject) {
      console.log('No video stream, requesting camera...');
        const success = await requestCamera();
        if (!success) {
          setDebugInfo('Camera permission failed');
          return;
        }
      }

    try {
      console.log('Starting detection...');
      setDebugInfo('Starting detection...');

      setDebugInfo('Checking MediaPipe models...');
      const modelsReady = faceMeshRef.current && handsRef.current && poseRef.current;
      console.log('Models ready:', modelsReady, {
        faceMesh: !!faceMeshRef.current,
        hands: !!handsRef.current,
        pose: !!poseRef.current
      });
      
      if (!modelsReady) {
        setDebugInfo('Loading MediaPipe models...');
        const success = await initializeMediaPipe();
        if (!success) {
          setDebugInfo('MediaPipe initialization failed');
          return;
        }
      }
      
      setDebugInfo('Setting up detection...');
      setIsActive(true);
      setSessionStart(new Date());
      setTouchCount(0);
      setCurrentTouchStart(null);
      setIsTouchingFace(false);
      
      // Initialize camera for MediaPipe (original, robust approach)
      if (videoRef.current && !cameraRef.current) {
        setDebugInfo('Initializing MediaPipe camera...');
        console.log('Initializing MediaPipe camera...');
        try {
          let modelToggle = 0;
          // Use MediaPipe Camera class for robust video/model processing
          cameraRef.current = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (faceMeshRef.current && handsRef.current && poseRef.current && videoRef.current) {
                try {
                  // Frame skipping for performance
                  frameCountRef.current++;
                  if (frameCountRef.current % PROCESS_EVERY_N_FRAMES !== 0) {
                    return; // Skip this frame
                  }
                  
                  // Smart processing: reduce frequency when no alerts are active
                  const now = Date.now();
                  const isIdle = !faceStartTimeRef.current && !postureStartTimeRef.current && !faceDetected && handsDetected === 0;
                  if (isIdle && (now - lastProcessTimeRef.current) < IDLE_PROCESSING_INTERVAL) {
                    return; // Skip processing when truly idle (no face, no hands, no alerts)
                  }
                  lastProcessTimeRef.current = now;
                  
                  // Rebalanced model rotation - prioritize face touch detection
                  modelToggle = (modelToggle + 1) % 8; // 8-frame cycle for better balance
                  
                  if (modelToggle === 0 || modelToggle === 4) {
                    // Pose detection 25% of processed frames (2 out of 8)
                    await poseRef.current.send({ image: videoRef.current });
                  } else if (modelToggle === 1 || modelToggle === 2 || modelToggle === 5 || modelToggle === 6) {
                    // Hands detection 50% of processed frames (4 out of 8) - prioritized for face touch
                    await handsRef.current.send({ image: videoRef.current });
                  } else if (modelToggle === 3 || modelToggle === 7) {
                    // Face detection 25% of processed frames (2 out of 8)
                    await faceMeshRef.current.send({ image: videoRef.current });
                  }
                  // Skip processing on other frames (50% of frames skipped entirely)
                } catch (error) {
                  console.warn('Error processing frame:', error);
                }
              } else {
                console.log('Models not ready:', {
                  faceMesh: !!faceMeshRef.current,
                  hands: !!handsRef.current,
                  pose: !!poseRef.current,
                  video: !!videoRef.current
                });
              }
            },
            width: 320,  // Increased resolution for better detection
            height: 240
          });
          await cameraRef.current.start();
          setDebugInfo('Detection active - MediaPipe running');
          console.log('MediaPipe camera started successfully');
        } catch (cameraError) {
          console.error('Camera initialization error:', cameraError);
          setDebugInfo(`Camera init error: ${cameraError.message}`);
          setIsActive(false);
          return;
        }
      } else if (cameraRef.current) {
        setDebugInfo('Restarting existing camera...');
        await cameraRef.current.start();
        setDebugInfo('Detection active - MediaPipe restarted');
      } else {
        setDebugInfo('Error: No video element found');
        setIsActive(false);
        return;
      }
      
    } catch (error) {
      console.error('Error starting detection:', error);
      setDebugInfo(`Detection error: ${error.message}`);
      setIsActive(false);
      alert('Failed to start detection. Please check your camera and try again.');
    }
  };

  // Stop detection
  const stopDetection = () => {
    console.log('Stopping detection...');
    setIsActive(false);
    
    // Stop all continuous sounds
    stopFaceTouchSound();
    stopPostureSound();
    
    // Reset detection state
    setDebugInfo('Detection stopped');
    setIsTouchingFace(false);
    setBadPosture(false);
    
    // Clear timers
    faceStartTimeRef.current = null;
    postureStartTimeRef.current = null;
    faceAlertTriggeredRef.current = false;
    postureAlertTriggeredRef.current = false;
    
    // Stop camera and cleanup
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    if (poseRef.current) {
      poseRef.current.close();
    }
  };

  // Initialize video element
  useEffect(() => {
    console.log('Component mounted, video ref:', videoRef.current);
    setDebugInfo('Component loaded');
  }, []);

  // Keep-alive mechanism for background processing
  const keepAliveIntervalRef = useRef(null);
  const backgroundAudioRef = useRef(null);
  
  // Cleanup
  useEffect(() => {
    // Aggressive background processing to prevent browser throttling
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);
      
      if (isVisible) {
        setDebugInfo('Tab active - normal processing');
        
        // Clear keep-alive when tab is visible
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }
      } else {
        setDebugInfo('Running in background - forcing active processing');
        
        // Force browser to keep processing with multiple keep-alive techniques
        keepAliveIntervalRef.current = setInterval(() => {
          // Small operations to prevent browser from throttling
          if (isActive && cameraRef.current && videoRef.current) {
            try {
              // 1. Force a small canvas operation to keep GPU active
              const canvas = canvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'transparent';
                ctx.fillRect(0, 0, 1, 1);
              }
              
              // 2. Silent audio trick to prevent throttling (very common technique)
              if (!backgroundAudioRef.current && audioContextRef.current) {
                const context = audioContextRef.current;
                if (context.state !== 'suspended') {
                  const oscillator = context.createOscillator();
                  const gainNode = context.createGain();
                  oscillator.connect(gainNode);
                  gainNode.connect(context.destination);
                  gainNode.gain.value = 0; // Silent
                  oscillator.frequency.value = 1; // Very low frequency
                  oscillator.start();
                  backgroundAudioRef.current = { oscillator, gainNode };
                }
              }
              
              // 3. Force DOM updates to keep main thread active
              const debugElement = document.querySelector('.text-blue-600');
              if (debugElement) {
                debugElement.style.opacity = debugElement.style.opacity === '0.99' ? '1' : '0.99';
              }
              
              // Log activity to prove we're running
              console.log('Background heartbeat:', new Date().toLocaleTimeString());
            } catch (e) {
              // Ignore errors
            }
          }
        }, 500); // More frequent (every 500ms) to aggressively prevent throttling
      }
      
      // Don't stop the camera - just adjust processing frequency
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clear keep-alive interval and background audio
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      
      if (backgroundAudioRef.current) {
        try {
          backgroundAudioRef.current.oscillator.stop();
          backgroundAudioRef.current.oscillator.disconnect();
          backgroundAudioRef.current.gainNode.disconnect();
          backgroundAudioRef.current = null;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
          }
        } catch (error) {
          // Ignore AudioContext close errors
          console.log('AudioContext close error (ignored):', error.message);
        } finally {
          audioContextRef.current = null;
        }
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
    };
  }, [isActive]);

  const formatTime = (date) => {
    if (!date) return '0:00';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add debug logs for state changes
  useEffect(() => {
    console.log('[DEBUG] isTouchingFace changed:', isTouchingFace);
  }, [isTouchingFace]);
  useEffect(() => {
    console.log('[DEBUG] badPosture changed:', badPosture);
  }, [badPosture]);

  useEffect(() => {
    // Only create AudioContext if it doesn't exist
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return () => {
      // Cleanup timer references
      faceStartTimeRef.current = null;
      postureStartTimeRef.current = null;
      // Stop continuous sounds first
      stopFaceTouchSound();
      stopPostureSound();
      // Cleanup audio context safely
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
        } catch (error) {
          // Ignore errors when closing AudioContext (it might already be closed)
          console.log('AudioContext cleanup error (ignored):', error.message);
        } finally {
          audioContextRef.current = null;
        }
      }
    };
  }, []);

  // Start looping Web Audio sound (for beep/chime)
  const startWebAudioLoop = (soundType, alertType) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      console.log('[WEB AUDIO] AudioContext not ready, creating now.');
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const context = audioContextRef.current;
    if (context.state === 'suspended') {
      context.resume();
    }
    
    const webAudioRef = alertType === 'face' ? faceWebAudioRef : postureWebAudioRef;
    
    // Stop existing loop
    if (webAudioRef.current) {
      clearInterval(webAudioRef.current);
      webAudioRef.current = null;
    }
    
    const playSound = () => {
      try {
        if (soundType === 'beep') {
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          oscillator.frequency.setValueAtTime(800, context.currentTime);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, context.currentTime);
          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.15);
        } else if (soundType === 'chime') {
          const oscillator1 = context.createOscillator();
          const oscillator2 = context.createOscillator();
          const gainNode = context.createGain();
          
          oscillator1.connect(gainNode);
          oscillator2.connect(gainNode);
          gainNode.connect(context.destination);
          
          oscillator1.frequency.setValueAtTime(523.25, context.currentTime); // C5
          oscillator2.frequency.setValueAtTime(659.25, context.currentTime); // E5
          oscillator1.type = 'sine';
          oscillator2.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.2, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.8);
          
          oscillator1.start(context.currentTime);
          oscillator2.start(context.currentTime);
          oscillator1.stop(context.currentTime + 0.8);
          oscillator2.stop(context.currentTime + 0.8);
        }
      } catch (error) {
        console.error('[WEB AUDIO] Error playing sound:', error);
      }
    };
    
    // Play immediately and then loop
    playSound();
    webAudioRef.current = setInterval(playSound, soundType === 'chime' ? 1000 : 500);
    console.log(`[WEB AUDIO] Started looping ${soundType} for ${alertType}`);
  };

  // UI Logic for displaying trial status
  const renderTrialStatus = () => {
    if (isTrialActive && !isTrialExpired) {
      return (
        <div className="text-center">
          <span className="text-green-400">Trial Active: {formatTrialTime(trialTimeRemaining)} remaining</span>
        </div>
      );
    }
    return (
      <button onClick={startTrial} className="bg-blue-500 text-white px-4 py-2 rounded">
        Start Free Trial Now
      </button>
    );
  };

  if (!isAuthCheckComplete) {
    return (
        <div className="gradient-bg text-gray-200 flex items-center justify-center h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-lg font-semibold">Loading Ascends...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="gradient-bg text-gray-200">
      {/* Header */}
      <header className="container mx-auto px-6 py-4">
        <div className="flex justify-center items-center relative">
          {/* Left side */}
          <div className="absolute left-0">
            <h1 className="text-2xl font-bold text-white">Ascends</h1>
          </div>
          
          {/* Center */}
          <nav className="flex items-center">
            <button
              onClick={() => window.location.href = '/pricing'}
              className="text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1 font-semibold"
            >
              <Crown className="w-4 h-4" />
              Pricing
            </button>
          </nav>
          
          {/* Right side */}
          <div className="absolute right-0 flex items-center gap-3">
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Get Started</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4" />
                  <span className="text-sm hidden md:inline">{user?.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section with Live Detection */}
        <section className="container mx-auto px-6 pt-8 pb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
              Unlock Clear Skin & <br /> Perfect Posture with AI
            </h2>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
              Get real-time feedback on your posture and subconscious habits. Ascends uses your webcam to help you build confidence and stay healthy.
              <span className="block mt-2 font-semibold text-blue-400">Your camera data never leaves your device.</span>
            </p>
            {debugInfo && (
              <div className="mt-4 p-3 glass-card rounded-lg text-blue-400 text-sm max-w-2xl mx-auto">
                {debugInfo}
              </div>
            )}
          </div>
          {/* Video Detection Panel */}
          <div className="mx-auto max-w-6xl">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Live AI Analysis</h3>
                {isActive && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 text-sm font-medium">DETECTING</span>
                  </div>
                )}
              </div>

              <div className="relative bg-gray-900/50 rounded-xl overflow-hidden aspect-video border border-gray-700/50">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ 
                    transform: 'scaleX(-1)',
                    display: hasPermission ? 'block' : 'none'
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full face-touch-overlay"
                  style={{ 
                    transform: 'scaleX(-1)',
                    display: 'block', // Always show for debugging
                    border: '3px solid red', // Debug border
                    pointerEvents: 'none',
                    zIndex: 20,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                />
                
                {!isAuthenticated ? (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <User className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <p className="text-xl font-semibold text-white mb-2">Sign Up Required</p>
                      <p className="text-gray-400 mb-4">Create a free account to start your AI-powered posture analysis</p>
                      <button
                        onClick={() => {
                          setShowAuthModal(true);
                          setAuthMode('register');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                      >
                        Create Free Account
                      </button>
                    </div>
                  </div>
                ) : !hasPermission ? (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                      <p className="text-xl font-semibold text-white mb-2">Camera Permission Required</p>
                      <p className="text-gray-400">Enable your camera to start your AI-powered posture analysis</p>
                    </div>
                  </div>
                ) : null}

                {isLoading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                      <p className="text-lg font-semibold">Initializing AI Models...</p>
                      <p className="text-sm text-gray-400 mt-2">Loading MediaPipe for real-time detection</p>
                    </div>
                  </div>
                )}

                {isTouchingFace && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600/90 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-xl alert-animation z-50 border border-red-500/50">
                    <AlertTriangle className="w-6 h-6 inline mr-3" />
                    STOP TOUCHING FACE!
                  </div>
                )}

                {faceTouchAlert && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600/90 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-xl alert-animation z-50 border border-blue-500/50">
                    <AlertTriangle className="w-6 h-6 inline mr-3" />
                    FACE TOUCH DETECTED
                  </div>
                )}

                {badPostureAlert && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-600/90 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-xl alert-animation z-50 border border-orange-500/50">
                    <AlertTriangle className="w-6 h-6 inline mr-3" />
                    IMPROVE YOUR POSTURE!
                  </div>
                )}

                {poseDetected && (
                  <div className="absolute top-4 left-4 glass-card text-white px-4 py-3 rounded-lg z-50 text-sm">
                    <div className="space-y-1">
                      <div>Posture Deviation: <span className={maxPostureDeviation > detectionStateRef.current.allowedCoordDeviation ? 'text-red-400' : 'text-green-400'}>{maxPostureDeviation.toFixed(1)}px</span></div>
                      <div>Allowed: <span className="text-blue-400">{detectionStateRef.current.allowedCoordDeviation}px</span></div>
                      <div>Status: <span className={badPosture ? 'text-red-400' : 'text-green-400'}>{badPosture ? 'POOR' : 'GOOD'}</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Authentication Required Banner */}
              {!isAuthenticated && (
                <div className="mt-6 max-w-2xl mx-auto">
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <User className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-semibold">Account Required</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">
                      Create a free account to start your 1-hour trial with full access to all premium features!
                    </p>
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        setAuthMode('register');
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-6 py-2 rounded-lg transition-all shadow-lg"
                    >
                      Create Free Account
                    </button>
                  </div>
                </div>
              )}

              {/* Trial Status Banner */}
              {isAuthenticated && !hasLifetimePlan && (
                <div className="mt-6 max-w-2xl mx-auto">
                  {!isTrialActive && !isTrialExpired && !trialStartTime ? (
                    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-semibold">Get 1 Hour FREE Trial!</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        Access all premium features for 1 hour - no payment required!
                      </p>
                      {renderTrialStatus()}
                    </div>
                  ) : isTrialActive && !isTrialExpired ? (
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-white font-semibold">Trial Active</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Time remaining: <span className="text-yellow-400 font-bold">{formatTrialTime(trialTimeRemaining)}</span>
                      </p>
                    </div>
                  ) : isTrialExpired ? (
                    <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span className="text-white font-semibold">Trial Expired</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        Upgrade to the lifetime plan to continue using all premium features!
                      </p>
                      <button
                        onClick={() => window.location.href = '/pricing'}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-6 py-2 rounded-lg transition-all shadow-lg"
                      >
                        Upgrade Now - $10 Lifetime
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="flex justify-center mt-8 gap-4">
                <button
                  onClick={isActive ? stopDetection : startDetection}
                  disabled={isLoading}
                  className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-lg ${
                    isActive
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isActive ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Stop Analysis
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      {!isAuthenticated ? 'Sign Up to Start' : hasLifetimePlan ? 'Begin Analysis' : isTrialActive ? 'Begin Trial Analysis' : 'Start Free Trial'}
                    </>
                  )}
                </button>
                {isActive && (
                  <button
                    onClick={handleCalibratePosture}
                    className="px-6 py-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-yellow-500/20"
                  >
                    Set Good Posture
                  </button>
                )}

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* Real-time Statistics Dashboard */}
        <section className="container mx-auto px-6 pb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Detection Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Face Detected:</span>
                  <span className={faceDetected ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {faceDetected ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Hands Detected:</span>
                  <span className="text-blue-400 font-semibold">{handsDetected}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Pose Detected:</span>
                  <span className={poseDetected ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {poseDetected ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Min Distance:</span>
                  <span className={minDistance < threshold ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                    {minDistance.toFixed(1)}px
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Face Touch:</span>
                  <span className={isTouchingFace ? 'text-red-400 font-bold' : 'text-green-400 font-semibold'}>
                    {isTouchingFace ? '⚠ TOUCHING' : '✓ Safe'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Posture:</span>
                  <span className={badPosture ? 'text-orange-400 font-bold' : 'text-green-400 font-semibold'}>
                    {badPosture ? '⚠ Poor' : '✓ Good'}
                  </span>
                </div>
                {poseDetected && (
                  <div className="flex justify-between items-center border-t border-gray-700/50 pt-3">
                    <span className="text-gray-300">Deviation:</span>
                    <span className={maxPostureDeviation > detectionStateRef.current.allowedCoordDeviation ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                      {maxPostureDeviation.toFixed(1)}px
                    </span>
                  </div>
                )}

              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Session Progress</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Session Time:</span>
                  <span className="text-blue-400 font-semibold">{formatTime(sessionStart)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Face Touches:</span>
                  <span className="text-red-400 font-bold text-xl">{touchCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Posture Alerts:</span>
                  <span className="text-orange-400 font-bold text-xl">{postureCount}</span>
                </div>
              </div>
            </div>

            {showSettings && (
              <div className="glass-card p-6 rounded-2xl lg:col-span-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Advanced Settings</h3>
                  {isAuthenticated && user && (
                    <span className="text-sm text-gray-400">
                      Signed in as: {user.email}
                    </span>
                  )}
                </div>
                
                {/* Subscription Status */}
                <div className="mb-6">
                  <SubscriptionStatus 
                    user={user} 
                    onUpgrade={() => window.location.href = '/pricing'}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Allowed Posture Deviation: <span className="text-blue-400 font-semibold">{allowedCoordDeviation}px</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={allowedCoordDeviation}
                      onChange={(e) => setAllowedCoordDeviation(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Face Touch Distance Threshold: <span className="text-blue-400 font-semibold">{threshold}px</span>
                    </label>
                    <input
                      type="range"
                      min="35"
                      max="150"
                      value={threshold}
                      onChange={(e) => setThreshold(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Lower values = more sensitive face touch detection (minimum 35px for reliability)
                    </p>
                  </div>
                  
                  {/* Neck Extension Detection Settings */}
                  <div className="border-t border-gray-600/50 pt-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        id="neck-extension-enabled"
                        checked={neckExtensionEnabled}
                        onChange={(e) => setNeckExtensionEnabled(e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="neck-extension-enabled" className="text-sm font-medium text-gray-300">
                        Enable Neck Extension Detection
                      </label>
                    </div>

                    {neckExtensionEnabled && (
                      <div className="space-y-4 ml-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Face Size Increase Threshold: <span className="text-blue-400 font-semibold">{faceSizeThreshold}%</span>
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="30"
                            value={faceSizeThreshold}
                            onChange={(e) => setFaceSizeThreshold(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Higher values = less sensitive to neck extension
                          </p>
                        </div>

                        {isFaceSizeCalibrated && (
                          <div className="bg-gray-800/50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Face Size Status</h4>
                            <div className="text-xs text-gray-400 space-y-1">
                              <div>Baseline Face Size: {calibratedFaceSize?.toFixed(1)}px²</div>
                              <div>Current Face Size: {currentFaceSize?.toFixed(1)}px²</div>
                              <div className={faceSizeIncrease > faceSizeThreshold ? 'text-red-400' : 'text-green-400'}>
                                Size Increase: {faceSizeIncrease?.toFixed(1)}% 
                                {faceSizeIncrease > faceSizeThreshold ? ' (Neck Extended!)' : ' (Good)'}
                              </div>
                              <button 
                                className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors" 
                                onClick={handleResetFaceSize}
                              >
                                Reset Face Size
                              </button>
                            </div>
                          </div>
                        )}

                        {!isFaceSizeCalibrated && faceDetected && (
                          <div className="bg-yellow-600/20 border border-yellow-500/30 p-3 rounded-lg">
                            <p className="text-yellow-400 text-sm">
                              Face size not calibrated. Click "Set Good Posture" button to calibrate.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-600/50 pt-4">
                    <div className="flex items-center space-x-3 mb-4">
                    <input
                        type="checkbox"
                        id="sound-enabled"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="sound-enabled" className="text-sm font-medium text-gray-300">
                        Enable Sound Alerts
                    </label>
                  </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Face Touch Alert Sound
                      {isPremiumFeature('customSounds') && (
                        <Crown className="w-4 h-4 inline ml-2 text-yellow-400" title="Premium Feature" />
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={faceAlertSound}
                        onChange={e => {
                          if (e.target.value === 'custom' && showPremiumUpgrade('Custom Sounds')) {
                            return;
                          }
                          setFaceAlertSound(e.target.value);
                        }}
                        className="bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="slap">Slap</option>
                        <option value="tuntun">TUNTUN SAHURRRRRRR</option>
                        <option value="beep">Beep</option>
                        <option value="chime">Chime</option>
                        <option value="custom" disabled={isPremiumFeature('customSounds')}>
                          Custom {isPremiumFeature('customSounds') ? '(Premium)' : ''}
                        </option>
                      </select>
                    <button
                        type="button"
                        onClick={() => {
                          // Test face touch sound
                          if (faceAlertSound === 'slap' || faceAlertSound === 'tuntun') {
                            const audio = new Audio(faceAlertSound === 'slap' ? '/slap.mp3' : '/alert.mp4');
                            audio.volume = 0.6;
                            audio.play().catch(e => console.log('Test failed:', e));
                          } else {
                            playAlert();
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Test
                    </button>
                    </div>
                    {faceAlertSound === 'custom' && (
                      <input
                        type="file"
                        accept="audio/*"
                        className="mt-2 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setCustomSoundUrl(url);
                          }
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bad Posture Alert Sound</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={postureAlertSound}
                        onChange={e => setPostureAlertSound(e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="tuntun">TUNTUN SAHURRRRRRR</option>
                        <option value="slap">Slap</option>
                        <option value="beep">Beep</option>
                        <option value="chime">Chime</option>
                        <option value="custom">Custom</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          // Test posture sound
                          if (postureAlertSound === 'slap' || postureAlertSound === 'tuntun') {
                            const audio = new Audio(postureAlertSound === 'slap' ? '/slap.mp3' : '/alert.mp4');
                            audio.volume = 0.6;
                            audio.play().catch(e => console.log('Test failed:', e));
                          } else {
                            playAlert();
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Test
                      </button>
                    </div>
                    {postureAlertSound === 'custom' && (
                      <input
                        type="file"
                        accept="audio/*"
                        className="mt-2 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setCustomSoundUrl(url);
                          }
                        }}
                      />
                    )}
                  </div>

                    {/* Show calibration info if calibrated */}
                    {isCalibrated && calibratedLandmarks && (
                      <div className="border-t border-gray-600/50 pt-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Calibration Info</h4>
                        <div className="text-xs text-gray-400 space-y-1">
                          <div>Baseline Nose: ({calibratedLandmarks.nose.x.toFixed(1)}, {calibratedLandmarks.nose.y.toFixed(1)})</div>
                          <div>Baseline Left Shoulder: ({calibratedLandmarks.leftShoulder.x.toFixed(1)}, {calibratedLandmarks.leftShoulder.y.toFixed(1)})</div>
                          <div>Baseline Right Shoulder: ({calibratedLandmarks.rightShoulder.x.toFixed(1)}, {calibratedLandmarks.rightShoulder.y.toFixed(1)})</div>
                          <div>Baseline Neck: ({calibratedLandmarks.neck.x.toFixed(1)}, {calibratedLandmarks.neck.y.toFixed(1)})</div>
                          <button 
                            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors" 
                            onClick={handleForceRecalibrate}
                          >
                            Force Recalibrate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isActive && !isCalibrated && (
              <div className="lg:col-span-3 flex justify-center">
                <div className="px-6 py-3 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm font-medium">
                  Please calibrate your good posture for accurate detection!
                </div>
              </div>
            )}
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="container mx-auto px-6 py-8 text-center text-gray-500">
          <p>&copy; 2025 Ascends. All rights reserved.</p>
        </div>
      </footer>

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setEmailVerificationSent(false);
          }}
          mode={authMode}
          onModeChange={setAuthMode}
          onLogin={login}
          onRegister={register}
          emailVerificationSent={emailVerificationSent}
          setEmailVerificationSent={setEmailVerificationSent}
        />
      )}

      {/* Professional Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
                    window.location.href = '/pricing';
        }}
      />
    </div>
  );
};

// Main App component with routing
const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<FaceTouchDetector />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/cancel" element={<FaceTouchDetector />} />
        <Route path="/login" element={<FaceTouchDetector />} />
      </Routes>
    </Router>
  );
};

export default App;
