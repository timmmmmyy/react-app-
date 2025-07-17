import React, { useRef, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Camera, AlertTriangle, Settings, Play, Pause, Volume2, VolumeX, Crown, Mail, Check, LogOut, User } from 'lucide-react';
import './App.css';
import PricingPage from './pages/PricingPage';
import SuccessPage from './pages/SuccessPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SubscriptionStatus from './components/SubscriptionStatus';
import stripeService from './services/stripeService';
import apiService from './services/apiService';

console.log('REACT_APP_API_URL from env:', process.env.REACT_APP_API_URL);

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
  const [faceTouchHoldTime, setFaceTouchHoldTime] = useState(2); // seconds - set to 2 for viz
  const [postureHoldTime, setPostureHoldTime] = useState(2); // seconds - set to 2 for viz

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
  const [faceAlertSound, setFaceAlertSound] = useState('chime'); // Face touch sound
  const [postureAlertSound, setPostureAlertSound] = useState('chime'); // Posture sound
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
          const data = await apiService.getProfile();
            setUser(data.user);
            setIsAuthenticated(true);
            checkSubscriptionStatus();
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

  // ---
  // TRIAL MANAGEMENT
  // ---

  // Persistent flag so a user can't restart the trial after it's been used on this device
  const [trialUsed, setTrialUsed] = useState(() => localStorage.getItem('ascends_trial_used') === 'true');

  // Whenever the trial successfully starts mark as used
  useEffect(() => {
    if (isTrialActive && !trialUsed) {
      setTrialUsed(true);
      localStorage.setItem('ascends_trial_used', 'true');
    }
  }, [isTrialActive, trialUsed]);

  // If the trial expires make sure it remains locked out indefinitely
  useEffect(() => {
    if (isTrialExpired && !trialUsed) {
      setTrialUsed(true);
      localStorage.setItem('ascends_trial_used', 'true');
    }
  }, [isTrialExpired, trialUsed]);

  // Trial Management Functions
  const startTrial = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setAuthMode('register');
      return;
    }
    // If trial already expired, show upgrade instead
    if (isTrialExpired) {
      setShowUpgradeModal(true);
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
      const data = await apiService.login(email, password);
      
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
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name, email, password, confirmPassword) => {
    try {
      console.log('🔄 Attempting registration for:', email);
      const data = await apiService.register(email, password, confirmPassword);

        // Registration successful - always show email verification message
        setEmailVerificationSent(true);
        console.log('✅ Account created - Email verification required');
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
      const data = await apiService.getSubscriptionStatus();
      
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
    } catch (error) {
      console.error('Error fetching subscription:', error);
         setHasLifetimePlan(false);
         setIsTrialActive(false);
         setIsTrialExpired(false);
    }
  };

  const startTrialAPI = async () => {
    if (!token) {
      setShowAuthModal(true);
      setAuthMode('register');
      return;
    }
    
    try {
      const data = await apiService.startTrial();
      
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
  const playAlert = (type) => {
    const { soundEnabled: soundEnabled_ref, faceAlertSound: faceAlertSound_ref, postureAlertSound: postureAlertSound_ref } = detectionStateRef.current;
    
    if (!soundEnabled_ref) return;

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const context = audioContextRef.current;
        if (context.state === 'suspended') {
          context.resume();
        }

    const soundToPlay = type === 'face' ? faceAlertSound_ref : postureAlertSound_ref;

    try {
      if (soundToPlay === 'chime') {
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
      console.error('[PLAY ALERT] Error playing sound:', error);
    }
  };

  // Start continuous face touch alert sound
  const startFaceTouchSound = () => {
    const { soundEnabled: soundEnabled_ref, faceAlertSound: faceAlertSound_ref } = detectionStateRef.current;
    if (!soundEnabled_ref) return;
    
    if (faceWebAudioRef.current) return; // Already playing

        startWebAudioLoop(faceAlertSound_ref, 'face');
  };

  // Stop continuous face touch alert sound
  const stopFaceTouchSound = () => {
    if (faceWebAudioRef.current) {
      clearInterval(faceWebAudioRef.current);
      faceWebAudioRef.current = null;
    }
  };

  // Start continuous posture alert sound
  const startPostureSound = () => {
    const { soundEnabled: soundEnabled_ref, postureAlertSound: postureAlertSound_ref } = detectionStateRef.current;
    if (!soundEnabled_ref) return;

    if (postureWebAudioRef.current) return; // Already playing

        startWebAudioLoop(postureAlertSound_ref, 'posture');
  };

  // Stop continuous posture alert sound
  const stopPostureSound = () => {
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
    const leftFace = denormalize(faceLandmarks[234], width, height);   // Left face outline
    const rightFace = denormalize(faceLandmarks[454], width, height);  // Right face outline
    const topFace = denormalize(faceLandmarks[10], width, height);     // Top of forehead
    const bottomFace = denormalize(faceLandmarks[152], width, height); // Bottom of chin
    
    const faceWidth = pointDistance(leftFace, rightFace);
    const faceHeight = pointDistance(topFace, bottomFace);
    
    return faceWidth * faceHeight;
  };

  // Face size calibration handler
  function handleCalibrateFaceSize() {
    if (!window.currentFaceLandmarks) return;
    
    const faceSize = calculateFaceSize(window.currentFaceLandmarks);
    if (faceSize > 0) {
      setCalibratedFaceSize(faceSize);
      setIsFaceSizeCalibrated(true);
    }
  }

  // Reset face size calibration
  function handleResetFaceSize() {
    setCalibratedFaceSize(null);
    setIsFaceSizeCalibrated(false);
    setCurrentFaceSize(0);
    setFaceSizeIncrease(0);
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
    
    setCurrentFaceSize(currentSize);
    setFaceSizeIncrease(increase);
    
    return { isExtended, increase };
  }

  // Calibration handler for coordinates
  function handleCalibratePosture() {
    const video = videoRef.current;
    if (!video || !window.currentPoseLandmarks) return;
    
    const width = video.videoWidth;
    const height = video.videoHeight;
    const keyPoints = getKeyPoints(window.currentPoseLandmarks, width, height);
    
    setCalibratedLandmarks(keyPoints);
    setIsCalibrated(true);
    
    if (window.currentFaceLandmarks && neckExtensionEnabled) {
      const faceSize = calculateFaceSize(window.currentFaceLandmarks);
      if (faceSize > 0) {
        setCalibratedFaceSize(faceSize);
        setIsFaceSizeCalibrated(true);
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
    
    setCalibratedFaceSize(null);
    setIsFaceSizeCalibrated(false);
    setCurrentFaceSize(0);
    setFaceSizeIncrease(0);
  }

  // Updated posture check logic to use coordinate calibration if set
  function checkPosture(poseLandmarks) {
    if (!poseLandmarks || poseLandmarks.length < 33) return { isBad: false, maxDeviation: 0 };
    const video = videoRef.current;
    if (!video) return { isBad: false, maxDeviation: 0 };
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    const keyPoints = getKeyPoints(poseLandmarks, width, height);
    
    let isBadBodyPosture = false;
    let maxDeviation = 0;

    const { isCalibrated: isCalibrated_ref, calibratedLandmarks: calibratedLandmarks_ref, allowedCoordDeviation: allowedCoordDeviation_ref } = detectionStateRef.current;
    
    if (isCalibrated_ref && calibratedLandmarks_ref) {
      for (const key of Object.keys(keyPoints)) {
        const dist = pointDistance(keyPoints[key], calibratedLandmarks_ref[key]);
        if (dist > maxDeviation) maxDeviation = dist;
        if (dist > allowedCoordDeviation_ref) {
          isBadBodyPosture = true;
          break;
        }
      }
    }

    let isNeckExtended = false;
    if (window.currentFaceLandmarks) {
      const { isExtended } = checkNeckExtension(window.currentFaceLandmarks);
      isNeckExtended = isExtended;
    }

    const isBadPosture = isBadBodyPosture || isNeckExtended;
    
    setMaxPostureDeviation(maxDeviation);
    return { isBad: isBadPosture, maxDeviation };
  }

  // Handle posture detection with continuous timing and sound
  const handlePosture = (isBad, deviation) => {
    if (isBad) {
      setBadPosture(true);
      
      if (!postureStartTimeRef.current) {
        postureStartTimeRef.current = Date.now();
        postureAlertTriggeredRef.current = false;
      }
        
      const badPostureDuration = (Date.now() - postureStartTimeRef.current) / 1000;
        const { postureHoldTime: holdTime_ref } = detectionStateRef.current;

      // If duration exceeds hold time, activate all alerts
      if (badPostureDuration >= holdTime_ref) {
        setPostureAlertActive(true); // Activate visualization
        
        // Trigger sound alert only once per continuous event
        if (!postureAlertTriggeredRef.current) {
          postureAlertTriggeredRef.current = true;
        setPostureCount(prev => prev + 1);
          setBadPostureAlert(true); // For text pop-up
          setTimeout(() => setBadPostureAlert(false), 1000);
            startPostureSound();
          }
        }
      
      } else {
      // Good posture, reset everything
      if (postureStartTimeRef.current) {
        postureStartTimeRef.current = null;
        postureAlertTriggeredRef.current = false;
      }
      setBadPosture(false);
      stopPostureSound();
      setPostureAlertActive(false); // Deactivate visualization
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

    const nosePoint = faceLandmarks[1];
    const chinPoint = faceLandmarks[152];
    if (!nosePoint || !chinPoint) {
      return { isTouching: false, minDist: 999 };
    }
    const nosePx = { x: nosePoint.x * W, y: nosePoint.y * H };
    const chinPx = { x: chinPoint.x * W, y: chinPoint.y * H };
    
    const faceHeightPx = Math.abs(chinPx.y - nosePx.y) * (100/60);
    const dynamicThreshold = Math.max(THRESHOLD, faceHeightPx * 0.6);

    const candidatePoints = [];

    if (handLandmarks && handLandmarks.length) {
      handLandmarks.forEach(lms => {
        lms.forEach(pt => pt && candidatePoints.push({ x: pt.x * W, y: pt.y * H }));
      });
    }

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

    for (const pt of candidatePoints) {
      const distNose = Math.hypot(nosePx.x - pt.x, nosePx.y - pt.y);
      const distChin = Math.hypot(chinPx.x - pt.x, chinPx.y - pt.y);
      const dist = Math.min(distNose, distChin);
        
      if (dist < minDist) minDist = dist;

      if (dist < dynamicThreshold) {
          return { isTouching: true, minDist: dist };
      }
    }
    
    return { isTouching: false, minDist };
  }

  // Draw results on canvas (optimized for low CPU)
  const drawResults = () => {
    const canvas = canvasRef.current;
    if (!canvas || !postureAlertActiveRef.current) { // Visualization only for posture alerts (use ref for freshest value)
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

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
    const toCanvas = (lm) => ({
      x: offsetX + (lm.x * drawWidth),
      y: offsetY + (lm.y * drawHeight),
    });

    const isNeckExtended = faceSizeIncrease > detectionStateRef.current.faceSizeThreshold;

    // GUIDANCE VISUALIZATION LOGIC
    if (postureAlertActiveRef.current) {
      // Case 1: Neck Extension Alert
      if (isNeckExtended && window.currentFaceLandmarks && detectionStateRef.current.isFaceSizeCalibrated) {
        const nose = window.currentFaceLandmarks[1];
        if (nose) {
          const p = toCanvas(nose);
          const baselineSize = detectionStateRef.current.calibratedFaceSize;
          const currentSize = currentFaceSize;
          
          // Convert face area → radius of equivalent circle for intuitive scaling
          const videoToCanvasScale = Math.min(drawWidth / video.videoWidth, drawHeight / video.videoHeight);
          
          const radiusGood = Math.sqrt(baselineSize / Math.PI) * videoToCanvasScale * 1.2;    // Baseline (green) – slightly enlarged for visibility
          const radiusCurrent = Math.sqrt(currentSize / Math.PI) * videoToCanvasScale * 1.2;  // Live (red)
          
          // Draw green "target" ring (baseline)
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)'; // Green
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radiusGood, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Draw red filled circle for current size so difference is obvious
          ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'; // Red
          ctx.beginPath();
          ctx.arc(p.x, p.y, radiusCurrent, 0, 2 * Math.PI);
          ctx.fill();
        }
      // Case 2: Body Posture Alert
      } else if (detectionStateRef.current.isCalibrated && window.currentPoseLandmarks) {
        const baseline = detectionStateRef.current.calibratedLandmarks;
        const currentKeys = getKeyPoints(window.currentPoseLandmarks, video.videoWidth, video.videoHeight);
        
        // Draw green "good" position dots
        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)'; // Green
        Object.values(baseline).forEach(pt => {
          const p = toCanvas({ x: pt.x / video.videoWidth, y: pt.y / video.videoHeight });
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Draw red "current" position dots
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'; // Red
        Object.values(currentKeys).forEach(pt => {
          const p = toCanvas({ x: pt.x / video.videoWidth, y: pt.y / video.videoHeight });
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    }
    
        ctx.restore();
  };

  // Timer refs for 2-second delays - REMOVED
  // const faceTimerRef = useRef(null);
  // const postureTimerRef = useRef(null);

  // Timer refs and start times for continuous detection
  const faceStartTimeRef = useRef(null);
  const postureStartTimeRef = useRef(null);
  const faceAlertTriggeredRef = useRef(false);
  const postureAlertTriggeredRef = useRef(false);

  // Frame skipping for performance
  const frameCountRef = useRef(0);
  const PROCESS_EVERY_N_FRAMES = 2;
  const lastProcessTimeRef = useRef(0);
  const IDLE_PROCESSING_INTERVAL = 500;

  // Pose detection results
  const onPoseResults = (results) => {
    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      setPoseDetected(true);
      window.currentPoseLandmarks = results.poseLandmarks;
      
      const { isBad, maxDeviation } = checkPosture(results.poseLandmarks);
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
      window.currentFaceLandmarks = results.multiFaceLandmarks[0];
      
      const faceSize = calculateFaceSize(results.multiFaceLandmarks[0]);
      setCurrentFaceSize(faceSize);
      
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
          
          if (!faceStartTimeRef.current) {
            faceStartTimeRef.current = Date.now();
            faceAlertTriggeredRef.current = false;
          }
            
          const touchDuration = (Date.now() - faceStartTimeRef.current) / 1000;
            const { faceTouchHoldTime: holdTime_ref } = detectionStateRef.current;

          // If duration exceeds hold time, activate all alerts
          if (touchDuration >= holdTime_ref) {
            setFaceAlertActive(true); // Activate visualization

            // Trigger sound alert only once per continuous event
            if (!faceAlertTriggeredRef.current) {
              faceAlertTriggeredRef.current = true;
              setTouchCount(prev => prev + 1);
              setFaceTouchAlert(true);
              setTimeout(() => setFaceTouchAlert(false), 1000);
                startFaceTouchSound();
              }
            }

    } else {
          // Not touching - reset timer and stop sound
          if (faceStartTimeRef.current) {
            faceStartTimeRef.current = null;
            faceAlertTriggeredRef.current = false;
          }
          setIsTouchingFace(false);
          stopFaceTouchSound();
          setFaceAlertActive(false); // Deactivate visualization
        }
      }
    } else {
      if (faceStartTimeRef.current) {
        faceStartTimeRef.current = null;
        faceAlertTriggeredRef.current = false;
      }
      setHandsDetected(0);
      window.currentHandLandmarks = null;
      setIsTouchingFace(false);
      stopFaceTouchSound();
      setFaceAlertActive(false); // Deactivate visualization
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
      
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
      ];

      for (const script of scripts) {
        await loadMediaPipeScript(script);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!window.FaceMesh || !window.Hands || !window.Pose) {
        throw new Error('MediaPipe classes not available after loading scripts');
      }

        poseRef.current = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });
        poseRef.current.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });
        poseRef.current.onResults(onPoseResults);

      await new Promise(resolve => setTimeout(resolve, 1000));

        handsRef.current = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
        handsRef.current.setOptions({
        maxNumHands: 2,
          modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
        });
        handsRef.current.onResults(onHandsResults);

      await new Promise(resolve => setTimeout(resolve, 1000));

        faceMeshRef.current = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
        faceMeshRef.current.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });
        faceMeshRef.current.onResults(onFaceResults);

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      setDebugInfo(`MediaPipe error: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  };

  // Request camera permission
  const requestCamera = async () => {
    try {
      setDebugInfo('Requesting camera access...');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!videoRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!videoRef.current) {
          setDebugInfo('Video element still not found');
          return false;
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 320,
          height: 240,
          facingMode: 'user',
          frameRate: { ideal: 15, max: 20 }
        }
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      await new Promise((resolve) => {
        const video = videoRef.current;
        if (!video) {
          resolve();
          return;
        }
        
        video.onloadedmetadata = () => {
          video.play().then(resolve).catch(err => {
            console.error('Error playing video:', err);
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

  const initAudio = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    } else if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  // Start detection
  const startDetection = async () => {
    initAudio();

    if (!videoRef.current || !videoRef.current.srcObject) {
      initAudio();
      const success = await requestCamera();
      if (!success) {
        return;
      }
    }
    
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setAuthMode('register');
      return;
    }
    
    if (!isTrialActive && !hasLifetimePlan) {
      if (isTrialExpired) {
        setShowUpgradeModal(true);
        return;
      }
      
      try {
        await startTrialAPI();
      } catch (error) {
        return;
      }
    }
    
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

    try {
      const modelsReady = faceMeshRef.current && handsRef.current && poseRef.current;
      
      if (!modelsReady) {
        const success = await initializeMediaPipe();
        if (!success) return;
      }
      
      setIsActive(true);
      setSessionStart(new Date());
      setTouchCount(0);
      setCurrentTouchStart(null);
      setIsTouchingFace(false);
      
      if (videoRef.current && !cameraRef.current) {
        try {
          let modelToggle = 0;
          cameraRef.current = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (faceMeshRef.current && handsRef.current && poseRef.current && videoRef.current) {
                try {
                  frameCountRef.current++;
                  if (frameCountRef.current % PROCESS_EVERY_N_FRAMES !== 0) return;
                  
                  const now = Date.now();
                  const isIdle = !faceStartTimeRef.current && !postureStartTimeRef.current && !faceDetected && handsDetected === 0;
                  if (isIdle && (now - lastProcessTimeRef.current) < IDLE_PROCESSING_INTERVAL) return;
                  lastProcessTimeRef.current = now;
                  
                  modelToggle = (modelToggle + 1) % 8;
                  
                  if (modelToggle === 0 || modelToggle === 4) {
                    await poseRef.current.send({ image: videoRef.current });
                  } else if (modelToggle === 1 || modelToggle === 2 || modelToggle === 5 || modelToggle === 6) {
                    await handsRef.current.send({ image: videoRef.current });
                  } else if (modelToggle === 3 || modelToggle === 7) {
                    await faceMeshRef.current.send({ image: videoRef.current });
                  }
                } catch (error) {
                  console.warn('Error processing frame:', error);
                }
              }
            },
            width: 320,
            height: 240
          });
          await cameraRef.current.start();
        } catch (cameraError) {
          console.error('Camera initialization error:', cameraError);
          setIsActive(false);
          return;
        }
      } else if (cameraRef.current) {
        await cameraRef.current.start();
      } else {
        setIsActive(false);
        return;
      }
      
    } catch (error) {
      console.error('Error starting detection:', error);
      setIsActive(false);
      alert('Failed to start detection. Please check your camera and try again.');
    }
  };

  // Stop detection
  const stopDetection = () => {
    setIsActive(false);
    
    stopFaceTouchSound();
    stopPostureSound();
    
    setIsTouchingFace(false);
    setBadPosture(false);
    
    faceStartTimeRef.current = null;
    postureStartTimeRef.current = null;
    faceAlertTriggeredRef.current = false;
    postureAlertTriggeredRef.current = false;
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (cameraRef.current) cameraRef.current.stop();
    if (poseRef.current) poseRef.current.close();
  };

  // Initialize video element
  useEffect(() => {
    // Empty
  }, []);

  // Keep-alive mechanism for background processing
  const keepAliveIntervalRef = useRef(null);
  const backgroundAudioRef = useRef(null);
  
  // Cleanup
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);
      
      if (isVisible) {
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }
      } else {
        keepAliveIntervalRef.current = setInterval(() => {
          if (isActive && cameraRef.current && videoRef.current) {
            try {
              const canvas = canvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'transparent';
                ctx.fillRect(0, 0, 1, 1);
              }
              
              if (!backgroundAudioRef.current && audioContextRef.current) {
                const context = audioContextRef.current;
                if (context.state !== 'suspended') {
                  const oscillator = context.createOscillator();
                  const gainNode = context.createGain();
                  oscillator.connect(gainNode);
                  gainNode.connect(context.destination);
                  gainNode.gain.value = 0;
                  oscillator.frequency.value = 1;
                  oscillator.start();
                  backgroundAudioRef.current = { oscillator, gainNode };
                }
              }
            } catch (e) {
              // Ignore errors
            }
          }
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
      
      if (backgroundAudioRef.current) {
        try {
          backgroundAudioRef.current.oscillator.stop();
          backgroundAudioRef.current.oscillator.disconnect();
          backgroundAudioRef.current.gainNode.disconnect();
          backgroundAudioRef.current = null;
        } catch (e) {
          // Ignore
        }
      }
      
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') audioContextRef.current.close();
        } catch (error) {
          // Ignore
        } finally {
          audioContextRef.current = null;
        }
      }
      if (cameraRef.current) cameraRef.current.stop();
      if (poseRef.current) poseRef.current.close();
    };
  }, [isActive]);

  const formatTime = (date) => {
    if (!date) return '0:00';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return () => {
      faceStartTimeRef.current = null;
      postureStartTimeRef.current = null;
      stopFaceTouchSound();
      stopPostureSound();
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') audioContextRef.current.close();
        } catch (error) {
          // Ignore
        } finally {
          audioContextRef.current = null;
        }
      }
    };
  }, []);

  // Start looping Web Audio sound (for beep/chime)
  const startWebAudioLoop = (soundType, alertType) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const context = audioContextRef.current;
    if (context.state === 'suspended') {
      context.resume();
    }
    
    const webAudioRef = alertType === 'face' ? faceWebAudioRef : postureWebAudioRef;
    
    if (webAudioRef.current) clearInterval(webAudioRef.current);
    
    const playSound = () => {
      try {
        if (soundType === 'chime') {
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
    
    playSound();
    webAudioRef.current = setInterval(playSound, 1000);
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
    // Show trial button only if it has not started and not expired
    if (!trialStartTime && !isTrialExpired) {
    return (
      <button onClick={startTrial} className="bg-blue-500 text-white px-4 py-2 rounded">
        Start Free Trial Now
        </button>
      );
    }

    // Otherwise suggest upgrade
    return (
      <button onClick={() => setShowUpgradeModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded">
        Upgrade to Continue
      </button>
    );
  };

  const [faceAlertActive, setFaceAlertActive] = useState(false);
  const [postureAlertActive, setPostureAlertActive] = useState(false);
  // Keep latest posture alert state available inside MediaPipe callbacks
  const postureAlertActiveRef = useRef(false);
  useEffect(() => {
    postureAlertActiveRef.current = postureAlertActive;
  }, [postureAlertActive]);

  // Modal for confirming posture recalibration
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

              <div className="relative bg-gray-900/50 rounded-xl overflow-hidden aspect-video" style={{border: `4px solid ${ (faceAlertActive || postureAlertActive) ? '#ef4444' : '#10b981'}`}}>
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
                    display: 'block',
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
                        Upgrade Now - $9.99 Lifetime
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
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="sound-enabled" className="flex items-center cursor-pointer">
                      <span className="text-sm font-medium text-gray-300">Enable Alert Sounds</span>
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="sound-enabled" id="sound-enabled" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                        <label htmlFor="sound-enabled" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                  </div>
                    </div>
                        <div>
                    <label htmlFor="face-alert-sound" className="block text-sm font-medium text-gray-300 mb-2">Face Touch Alert Sound</label>
                      <select
                      id="face-alert-sound"
                        value={faceAlertSound}
                      onChange={(e) => setFaceAlertSound(e.target.value)}
                      className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    >
                        <option value="chime">Chime</option>
                      {/* <option value="beep">Beep</option> */}
                      </select>
                    </div>
                  <div>
                    <label htmlFor="posture-alert-sound" className="block text-sm font-medium text-gray-300 mb-2">Posture Alert Sound</label>
                      <select
                      id="posture-alert-sound"
                        value={postureAlertSound}
                      onChange={(e) => setPostureAlertSound(e.target.value)}
                      className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      >
                        <option value="chime">Chime</option>
                      {/* <option value="beep">Beep</option> */}
                      </select>
                    </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="neck-extension-enabled" className="flex items-center cursor-pointer">
                      <span className="text-sm font-medium text-gray-300">Enable Neck Extension Detection</span>
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="neck-extension-enabled" id="neck-extension-enabled" checked={neckExtensionEnabled} onChange={(e) => setNeckExtensionEnabled(e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                        <label htmlFor="neck-extension-enabled" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                    </div>
                  </div>
                  {neckExtensionEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Neck Extension Threshold: <span className="text-blue-400 font-semibold">{faceSizeThreshold}%</span>
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={faceSizeThreshold}
                        onChange={(e) => setFaceSizeThreshold(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      </div>
                    )}
                  <div>
                    <button onClick={handleForceRecalibrate} className="text-blue-400 hover:text-blue-300 text-sm">Force Recalibrate Posture</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>
      </main>

      {/* Modals */}
        <AuthModal 
          isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
          mode={authMode}
          onModeChange={setAuthMode}
          onLogin={login}
          onRegister={register}
          emailVerificationSent={emailVerificationSent}
          setEmailVerificationSent={setEmailVerificationSent}
        />
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
                    window.location.href = '/pricing';
        }}
      />
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          handleForceRecalibrate();
          setShowConfirmModal(false);
        }}
        title="Confirm Recalibration"
        message="Are you sure you want to reset your posture calibration? This will clear your current settings."
      />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FaceTouchDetector />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
    </Router>
  );
};

export default App;
