const express = require('express');
const router = express.Router();
const db = require('../database'); // Use a single db object
const { 
  createUser, 
  findUserByEmail, 
  verifyPassword,
  updateUserTrialStart,
  updateUserLifetimeAccess,
  updateUserEmailVerificationToken,
  // Removed verifyUserEmail as it's not directly exported like this
  findAllUnverifiedUsers
} = db;
const { generateToken, authenticateToken } = require('../middleware/auth');
const { emailService } = require('../server'); // Import the shared email service
const crypto = require('crypto');

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

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

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      if (!existingUser.is_confirmed) {
        // User exists but is not confirmed, regenerate token and resend email
        const newVerificationToken = generateVerificationToken();
        await updateUserEmailVerificationToken(existingUser.id, newVerificationToken, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
        await emailService.sendConfirmationEmail(email, newVerificationToken);
        return res.status(200).json({
          success: true,
          message: 'Account already exists but is unverified. A new verification email has been sent. Please check your inbox.',
          requiresEmailVerification: true
        });
      } else {
        // User exists and is confirmed
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists and is verified. Please log in.'
        });
      }
    }

    // Create user
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user with token and expiry
    const user = await createUser(email, passwordHash, verificationToken);
    
    // Send verification email
    await emailService.sendConfirmationEmail(email, verificationToken);

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
    res.status(500).json({
      success: false,
      error: 'Failed to create account'
    });
  }
});

// Verify email address
router.get('/confirm-email', async (req, res) => {
  try {
    const { token } = req.query;

    console.log(`[CONFIRM-EMAIL] Received token: ${token}`);

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    // First, find the user by token to get their email before confirming
    console.log(`[CONFIRM-EMAIL] Searching for user with token...`);
    const userWithToken = await db.findUserByConfirmationToken(token);
    if (!userWithToken) {
      console.log(`[CONFIRM-EMAIL] No user found with token: ${token}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired confirmation link.',
        message: 'This link may have already been used or a newer one has been issued. Please try logging in or registering again to get a new link.'
      });
    }

    console.log(`[CONFIRM-EMAIL] Found user: ${userWithToken.email}`);

    // Verify the token and update user
    console.log(`[CONFIRM-EMAIL] Confirming user...`);
    const confirmed = await db.confirmUser(token);
    
    if (!confirmed) {
      console.log(`[CONFIRM-EMAIL] Failed to confirm user`);
        return res.status(400).json({
            success: false,
            error: 'Invalid or expired verification link.',
            message: 'This link may have already been used or a newer one has been issued. Please try logging in or registering again to get a new link.'
        });
    }

    console.log(`[CONFIRM-EMAIL] User confirmed successfully`);

    // Find the user by email since the token is now cleared
    const user = await db.findUserByEmail(userWithToken.email);
    if (!user) {
      console.log(`[CONFIRM-EMAIL] User not found after confirmation`);
      return res.status(500).json({
        success: false,
        error: 'User not found after confirmation'
      });
    }

    const loginToken = generateToken(user.id);

    console.log(`[CONFIRM-EMAIL] Email verification successful for: ${user.email}`);

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
    if (!user.is_confirmed) { // Changed from email_verified to is_confirmed
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
        trial_start_time: user.trial_start_time ? Number(user.trial_start_time) : null,
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
    // Refetch user from DB to get the latest info
    const user = await findUserByEmail(req.user.email);
    
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
      
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        trial_start_time: user.trial_start_time ? Number(user.trial_start_time) : null,
        has_lifetime_access: user.has_lifetime_access,
      }
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
    const userEmail = req.user.email;
    
    // Check if user already started trial
    const freshUser = await findUserByEmail(userEmail);
    if (freshUser.trial_start_time) {
      return res.status(400).json({
        success: false,
        error: 'Trial has already been started'
      });
    }

    // Check if user has lifetime access
    if (freshUser.has_lifetime_access) {
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
          token: user.confirmation_token, // Corrected to confirmation_token
          expires: user.email_verification_expires_at,
          verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${user.confirmation_token}` // Corrected to confirmation_token
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
      const confirmed = await db.confirmUser(latestUser.confirmation_token); // Use db.confirmUser and confirmation_token
      
      if (!confirmed) {
        return res.status(500).json({
          success: false,
          error: 'Failed to auto-verify user in database'
        });
      }

      // Retrieve the user again to get the updated status
      const verifiedUser = await findUserByEmail(latestUser.email); // Retrieve by email as token is now null
      
      // Generate login token for the verified user
      const loginToken = generateToken(verifiedUser.id);

      res.json({
        success: true,
        message: `Auto-verified user: ${verifiedUser.email}`,
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          is_confirmed: true // Use is_confirmed
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
