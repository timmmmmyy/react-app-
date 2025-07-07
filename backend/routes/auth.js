const express = require('express');
const router = express.Router();
const { 
  createUser, 
  findUserByEmail, 
  verifyPassword,
  updateUserTrialStart,
  updateUserLifetimeAccess,
  updateUserEmailVerificationToken,
  verifyUserEmail,
  findAllUnverifiedUsers
} = require('../utils/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { generateVerificationToken, sendVerificationEmail } = require('../utils/email');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // Create user
    const user = await createUser(email, password);
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store verification token in database
    await updateUserEmailVerificationToken(user.id, verificationToken, expiresAt.toISOString());
    
    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      requiresEmailVerification: true,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'Email already exists') {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create account'
    });
  }
});

// Verify email address
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    // Verify the token and update user
    const user = await verifyUserEmail(token);
    
    // Generate login token for the verified user
    const loginToken = generateToken(user.id);

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: true
      },
      token: loginToken
    });

  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error.message === 'Invalid or expired verification token') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification link. Please request a new one.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Email verification failed'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email address before logging in. Check your email for the verification link.'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        email: user.email,
        trial_start_time: user.trial_start_time,
        has_lifetime_access: user.has_lifetime_access
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

// Start trial
router.post('/start-trial', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user already started trial
    if (req.user.trial_start_time) {
      return res.status(400).json({
        success: false,
        error: 'Trial has already been started'
      });
    }

    // Check if user has lifetime access
    if (req.user.has_lifetime_access) {
      return res.status(400).json({
        success: false,
        error: 'You already have lifetime access'
      });
    }

    const trialStartTime = Date.now();
    await updateUserTrialStart(userId, trialStartTime);

    res.json({
      success: true,
      message: 'Free trial started successfully!',
      trial_start_time: trialStartTime
    });

  } catch (error) {
    console.error('Start trial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start trial'
    });
  }
});

// Logout (for frontend to clear token)
router.post('/logout', (req, res) => {
  // Since we're using JWT, logout is handled on the frontend by removing the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Development-only route to list recent verification tokens
if (process.env.NODE_ENV === 'development') {
  router.get('/dev/tokens', async (req, res) => {
    try {
      const users = await findAllUnverifiedUsers();
      res.json({
        success: true,
        message: 'Recent verification tokens (development only)',
        tokens: users.map(user => ({
          email: user.email,
          token: user.email_verification_token,
          expires: user.email_verification_expires_at,
          verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${user.email_verification_token}`
        }))
      });
    } catch (error) {
      console.error('Dev tokens error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tokens'
      });
    }
  });

  // Development-only route to auto-verify the most recent user
  router.post('/dev/auto-verify', async (req, res) => {
    try {
      const users = await findAllUnverifiedUsers();
      if (users.length === 0) {
        return res.json({
          success: false,
          message: 'No unverified users found'
        });
      }

      const latestUser = users[0]; // Most recent unverified user
      const verifiedUser = await verifyUserEmail(latestUser.email_verification_token);
      
      // Generate login token for the verified user
      const loginToken = generateToken(verifiedUser.id);

      res.json({
        success: true,
        message: `Auto-verified user: ${verifiedUser.email}`,
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          emailVerified: true
        },
        token: loginToken
      });
    } catch (error) {
      console.error('Auto-verify error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to auto-verify user'
      });
    }
  });
}

module.exports = router;
