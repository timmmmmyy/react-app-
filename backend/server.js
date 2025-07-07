require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { initDatabase } = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 4000;

// --- Security & Middleware ---
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Logging
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// --- Webhook endpoint (must be before express.json()) ---
app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`❌ Webhook signature verification failed.`, err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('✅ Payment was successful for session:', session.id);
      console.log('📧 Customer email:', session.customer_details?.email);
      console.log('💰 Amount paid:', session.amount_total / 100, session.currency.toUpperCase());
      
      // This is where you would fulfill the order:
      // - Save the purchase to your database
      // - Grant the user access to premium features
      // - Send a confirmation email
      await fulfillOrder(session);
      break;
    
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('💳 Recurring payment succeeded:', invoice.id);
      // Handle successful recurring payment
      break;
    
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      console.log('❌ Subscription cancelled:', subscription.id);
      // Handle subscription cancellation
      break;
    
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log('⚠️ Payment failed:', failedInvoice.id);
      // Handle failed payment
      break;
    
    default:
      console.log(`🔄 Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

// Regular JSON parsing middleware for other routes
app.use(express.json());

// --- Routes ---
const stripeRoutes = require('./routes/stripe');
const authRoutes = require('./routes/auth');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Aura Posture Backend'
  });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);

// --- Helper Functions ---

async function fulfillOrder(session) {
  try {
    // Log the successful payment
    console.log('🎉 Fulfilling order for session:', session.id);
    
    // In a real application, you would:
    // 1. Save the customer and subscription to your database
    // 2. Send a welcome email
    // 3. Grant access to premium features
    // 4. Set up any integrations
    
    // For now, we'll just log the details
    console.log('Customer Details:', {
      email: session.customer_details?.email,
      name: session.customer_details?.name,
      plan: session.metadata?.plan,
      subscriptionId: session.subscription,
      customerId: session.customer
    });

    // You could send a webhook to your frontend or trigger other actions here
    
  } catch (error) {
    console.error('❌ Error fulfilling order:', error);
  }
}

// --- Error Handling ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// --- Start Server ---
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    console.log('📊 Database initialized successfully');

app.listen(PORT, () => {
  console.log(`🚀 Aura Posture Backend running on http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💳 Stripe integration: ${process.env.STRIPE_SECRET_KEY ? '✅ Configured' : '❌ Missing keys'}`);
      console.log(`🔐 Authentication: ✅ Enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
}); 