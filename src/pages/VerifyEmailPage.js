import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      // Prevent multiple verification attempts with the same token
      if (verificationAttempted.current) {
        console.log('Verification already attempted, skipping...');
        return;
      }
      
      if (!token) {
        setVerificationStatus('error');
        setMessage('Invalid verification link. Please check your email for the correct link.');
        setIsLoading(false);
        return;
      }

      try {
        verificationAttempted.current = true;
        console.log('Attempting to verify email with token:', token);
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/confirm-email?token=${token}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // Add this header to bypass the ngrok browser warning page
            'ngrok-skip-browser-warning': 'true',
          },
        });
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed response data:', data);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          setVerificationStatus('error');
          setMessage('Server response format error. Please contact support.');
          return;
        }

        if (response.ok) {
          setVerificationStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          
          // Redirect to login page after 5 seconds
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 5000);
        } else {
          if (data.alreadyConfirmed) {
            setVerificationStatus('already-verified');
            setMessage(data.message || 'Your email has already been verified. You can proceed to login.');
          } else {
            setVerificationStatus('error');
            setMessage(data.error || 'Email verification failed. Please try again or contact support.');
            console.error('Verification failed:', data);
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setMessage('Unable to connect to the server. Please check your internet connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Verification</h1>
                          <p className="text-gray-300">Verifying your Ascends account</p>
        </div>

        {/* Verification Status */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
          {isLoading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="text-white">Verifying your email...</p>
            </div>
          ) : verificationStatus === 'success' ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Email Verified!</h2>
                <p className="text-green-400 mb-4">{message}</p>
                <p className="text-gray-300 text-sm">
                  You'll be redirected to the app in a few seconds...
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Go to App Now
              </button>
            </div>
          ) : verificationStatus === 'already-verified' ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Already Verified</h2>
                <p className="text-blue-400 mb-4">{message}</p>
                <p className="text-gray-300 text-sm">
                  You can proceed to login with your account.
                </p>
              </div>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
                <p className="text-red-400 mb-4">{message}</p>
                <p className="text-gray-300 text-sm mb-4">
                  The verification link may have expired or been used already. 
                  Please try creating a new account or contact support.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to App
                </button>
                <button
                  onClick={() => window.location.href = 'mailto:support@ascends.me'}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
                      <p>© 2025 Ascends. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage; 