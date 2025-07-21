console.log(`[${new Date().toISOString()}] SERVER.JS STARTING UP...`);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

// --- Stripe configuration -------------------------------------------------
// In development we fall back to the provided test keys if they are not
// supplied via environment variables or an external .env file.  This prevents
// "Invalid API Key provided" errors when the env file is missing in the
// coding sandbox.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID   = process.env.STRIPE_PRICE_ID || process.env.STRIPE_LIFETIME_PRICE_ID;

console.log('💳 Using Stripe secret key:', STRIPE_SECRET_KEY.slice(0,15)+'...');

const stripe = require('stripe')(STRIPE_SECRET_KEY);

const db = require('./database');
console.log(`[${new Date().toISOString()}] Instantiating EmailService...`);
const EmailService = require('./emailService');
const emailService = new EmailService(); // Create a single, shared instance

// Import routes
const adminRoutes = require('./routes/admin');
const stripeRoutes = require('./routes/stripe'); // Import Stripe routes

const app = express();

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS: Allow multiple origins passed via environment variable
// Use ALLOWED_ORIGINS="https://frontend.vercel.app,https://mydomain.com" for production
const allowedOrigins = [
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://ascends.me'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for testing
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Temporarily disabled rate limiting for development
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Very high limit for testing
    message: {
        error: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Validation middleware
const validateRegistration = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
];

const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
        status: 'healthy', 
    timestamp: new Date().toISOString(),
        version: '1.0.0'
  });
});

// User registration endpoint
app.post('/api/auth/register', authLimiter, validateRegistration, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await db.findUserByEmail(email);
        
        if (existingUser) {
            // If user exists but is not confirmed, resend confirmation email
            if (!existingUser.is_confirmed) {
                const newConfirmationToken = uuidv4();
                await db.updateConfirmationToken(existingUser.id, newConfirmationToken);
                await emailService.sendConfirmationEmail(email, newConfirmationToken);
                
                return res.status(200).json({ 
                    message: 'Account already exists. A new confirmation email has been sent. Please check your inbox.',
                    emailVerificationSent: true 
                });
            }
            
            // If user is already confirmed
            return res.status(409).json({ 
                error: 'User already exists and is confirmed. Please login.' 
            });
        }
        
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Generate confirmation token
        const confirmationToken = uuidv4();
        
        // Create user in database
        const user = await db.createUser(email, passwordHash, confirmationToken);
        
        try {
            await emailService.sendConfirmationEmail(email, confirmationToken);
        } catch (emailError) {
            console.error('Critical: Failed to send confirmation email, but user was created (ID:', user.id, '). Error:', emailError);
            // Even if email fails, we don't want to block registration.
            // The user can request a new confirmation email later.
        }
        
        res.status(201).json({
            message: 'User registered successfully. Please check your email to confirm your account.',
            userId: user.id,
            email: user.email
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Email confirmation endpoint
app.get('/api/auth/confirm-email', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({ 
                error: 'Confirmation token required'
            });
        }
        
        console.log('Attempting to confirm email with token:', token);
        
        // Find user by confirmation token
        const user = await db.findUserByConfirmationToken(token);

        // If no user is found, token is invalid or has already been used
        if (!user) {
            console.log('No user found with this token. It may be invalid or already used.');
            return res.status(400).json({ 
                error: 'Invalid or expired confirmation link.',
                message: 'This link may have already been used or a newer one has been issued. Please try logging in or registering again to get a new link.'
            });
        }
        
        console.log('Found unconfirmed user:', user.email);
        
        // Confirm user in the database
        const confirmed = await db.confirmUser(token);
        if (!confirmed) {
            console.log('Failed to confirm user in database:', user.email);
            return res.status(500).json({ 
                error: 'Failed to update user confirmation status.'
            });
        }
        
        console.log('Successfully confirmed user:', user.email);

        // Instead of redirecting, send a clear JSON success response.
        // The frontend will be responsible for navigating the user.
        return res.status(200).json({
            message: 'Email confirmed successfully.',
            user: {
                id: user.id,
                email: user.email,
                is_confirmed: 1 // or true
            }
        });

    } catch (error) {
        console.error('Email confirmation error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
});

// User login endpoint
app.post('/api/auth/login', authLimiter, validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { email, password } = req.body;
        
        // Find user
        const user = await db.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check if email is confirmed
        if (!user.is_confirmed) {
            return res.status(401).json({ error: 'Please confirm your email before logging in' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                isPremium: user.is_premium 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                isPremium: user.is_premium,
                is_confirmed: user.is_confirmed,
                confirmedAt: user.confirmed_at,
                premiumPurchasedAt: user.premium_purchased_at
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const user = await db.findUserByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            id: user.id,
            email: user.email,
            isPremium: user.is_premium,
            confirmedAt: user.confirmed_at,
            premiumPurchasedAt: user.premium_purchased_at,
            createdAt: user.created_at
        });
        
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create Stripe payment intent for premium upgrade
app.post('/api/payments/create-payment-intent', authenticateToken, async (req, res) => {
    try {
        const user = await db.findUserByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.is_premium) {
            return res.status(400).json({ error: 'User is already premium' });
        }
        
        // Create or retrieve Stripe customer
        let customer;
        if (user.stripe_customer_id) {
            customer = await stripe.customers.retrieve(user.stripe_customer_id);
        } else {
            customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id.toString() }
            });
        }
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: parseInt(process.env.PREMIUM_PRICE_CENTS) || 2997, // Default $29.97
            currency: 'usd',
            customer: customer.id,
            metadata: {
                userId: user.id.toString(),
                email: user.email,
                product: 'lifetime_premium'
            },
            description: 'Ascends Lifetime Premium Access'
        });
        
        res.json({
            clientSecret: paymentIntent.client_secret,
            customerId: customer.id
        });
        
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/stripe/subscription-status', authenticateToken, async (req, res) => {
    try {
        const user = await db.findUserByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Case 1: User has lifetime access
        if (user.is_premium) {
            return res.json({
                success: true,
                hasLifetimeAccess: true,
            });
        }

        // Case 2: User has started a trial
        if (user.trial_start_time) {
            const trialStartTime = Number(user.trial_start_time);
            const now = Date.now();
            const elapsed = now - trialStartTime;
            const oneHourInMs = 3600000;
            const remaining = oneHourInMs - elapsed;

            if (remaining > 0) {
                // Trial is active
                return res.json({
                    success: true,
                    hasLifetimeAccess: false,
                    trialActive: true,
                    trialExpired: false,
                    trialStartTime: trialStartTime,
                    trialTimeRemaining: remaining,
                });
            } else {
                // Trial has expired
                return res.json({
                    success: true,
                    hasLifetimeAccess: false,
                    trialActive: false,
                    trialExpired: true,
                    trialStartTime: trialStartTime,
                    trialTimeRemaining: 0,
                });
            }
        }
        
        // Case 3: User has not started a trial
        res.json({
            success: true,
            hasLifetimeAccess: false,
            trialActive: false,
            trialExpired: false,
            trialStartTime: null,
            trialTimeRemaining: null, // Send null instead of 0
        });

    } catch (error) {
        console.error('Error fetching subscription status:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Stripe webhook endpoint
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
        // In development mode, allow bypassing signature verification for testing
        if (process.env.NODE_ENV === 'development' && (!sig || sig === 'test_signature' || sig.includes('test'))) {
            console.log('🔧 Development mode: Bypassing webhook signature verification');
            event = JSON.parse(req.body.toString());
        } else {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        // In development, still try to parse the body for testing
        if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Development mode: Attempting to parse webhook body anyway');
            try {
                event = JSON.parse(req.body.toString());
            } catch (parseErr) {
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }
        } else {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }
    
    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('🎉 Checkout session completed:', session.id);
            
            try {
                // Get customer email from session
                const customerEmail = session.customer_details?.email || session.customer_email;
                const customerId = session.customer;
                const paymentIntentId = session.payment_intent;
                
                if (!customerEmail) {
                    console.error('No customer email found in session');
                    break;
                }
                
                console.log(`Upgrading user to premium: ${customerEmail}`);
                
                // Find user by email and upgrade to premium
                const user = await db.findUserByEmail(customerEmail);
                if (user) {
                    // Use the new updateUserLifetimeAccess function with userId
                    await db.updateUserLifetimeAccess(user.id, true);
                    
                    // Also update stripe customer ID if not set
                    if (customerId && !user.stripe_customer_id) {
                        await db.updateUserStripeCustomerId(user.id, customerId);
                    }
                    
                    // Create purchase record
                    if (session.amount_total) {
                        await db.createPurchase(
                            user.id, 
                            paymentIntentId || session.id, 
                            customerId, 
                            session.amount_total, 
                            session.currency || 'usd', 
                            'completed'
                        );
                    }
                    
                    // Send confirmation email
                    try {
                        await emailService.sendPremiumConfirmationEmail(customerEmail);
                        console.log('✅ Premium confirmation email sent to:', customerEmail);
                    } catch (emailError) {
                        console.error('❌ Failed to send confirmation email:', emailError);
                    }
                    
                    console.log('✅ User successfully upgraded to premium:', customerEmail);
                } else {
                    console.error('❌ User not found for email:', customerEmail);
                }
            } catch (error) {
                console.error('❌ Error processing checkout session:', error);
            }
            break;
            
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            
            // Upgrade user to premium
            const email = paymentIntent.metadata.email;
            const customerId = paymentIntent.customer;
            
            try {
                await db.upgradeToPremium(email, customerId, paymentIntent.id);
                await emailService.sendPremiumConfirmationEmail(email);
                console.log('User upgraded to premium:', email);
            } catch (error) {
                console.error('Error upgrading user to premium:', error);
            }
            break;
            
        case 'payment_intent.payment_failed':
            console.log('Payment failed:', event.data.object.last_payment_error?.message);
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
});

// Admin stats endpoint (optional)
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        // Simple admin check (you might want to add proper admin roles)
        if (req.user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const stats = await db.getUserStats();
        res.json(stats);
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start Free Trial endpoint
app.post('/api/auth/start-trial', authenticateToken, async (req, res) => {
    try {
        const user = await db.findUserByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.trial_start_time) {
            return res.status(400).json({ error: 'Trial has already been started' });
        }
        const now = Date.now(); // milliseconds since epoch
        await db.startTrial(user.email, now);
        res.json({ success: true, trial_start_time: now });
    } catch (error) {
        console.error('Start trial error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete all users (Development only)
app.post('/api/dev/delete-all-users', async (req, res) => {
    console.log('Received request to delete all users');
    
    if (process.env.NODE_ENV === 'production') {
        console.log('Rejecting request: endpoint not available in production');
        return res.status(403).json({ error: 'This endpoint is not available in production' });
    }

    try {
        // Get current user count
        console.log('Getting current user stats...');
        const stats = await db.getUserStats();
        const userCount = stats.total_users;
        console.log(`Current user count: ${userCount}`);

        // Delete all users
        console.log('Attempting to delete all users...');
        const deletedCount = await db.deleteAllUsers();
        console.log(`Successfully deleted ${deletedCount} users`);

        res.json({ 
            message: 'All users deleted successfully',
            deletedCount: deletedCount
        });
    } catch (error) {
        console.error('Error deleting users:', error);
        res.status(500).json({ 
            error: 'Failed to delete users',
            details: error.message
        });
    }
});

// Mount admin routes
app.use('/api/admin', authenticateToken, adminRoutes);

// Use Stripe routes
app.use('/api/stripe', stripeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ error: 'Route not found' });
});

// Add route debugging
console.log('\nRegistered Routes:');
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log(`${Object.keys(r.route.methods).join(', ').toUpperCase()}\t${r.route.path}`);
    }
});

module.exports = { app, emailService }; // Export both app and emailService 