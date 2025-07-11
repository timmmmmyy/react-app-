# Vercel Deployment Guide

## Prerequisites
1. A Vercel account (free at vercel.com)
2. Your backend running on ngrok or a cloud service
3. Stripe account with API keys

## Step 1: Prepare Your Backend

### Option A: Using ngrok (Development/Testing)
1. Start your backend server on port 4000
2. Run ngrok to expose it:
   ```bash
   ngrok http 4000
   ```
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

### Option B: Deploy Backend to Cloud (Production)
Deploy your backend to a service like:
- Railway
- Render
- Heroku
- DigitalOcean App Platform
- AWS/GCP/Azure

## Step 2: Deploy Frontend to Vercel

### Method 1: Using Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project directory:
   ```bash
   vercel
   ```

### Method 2: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project settings

## Step 3: Configure Environment Variables

In your Vercel project dashboard, go to Settings → Environment Variables and add:

### Required Variables:
```
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
```

### Optional Variables:
```
REACT_APP_SENTRY_DSN=your_sentry_dsn_here
REACT_APP_GA_TRACKING_ID=your_google_analytics_id_here
```

## Step 4: Update Backend CORS Settings

In your backend's environment variables, add your Vercel domain to allowed origins:

```
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app,https://yourdomain.com
```

## Step 5: Configure Stripe Webhooks

1. Go to your Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-backend-url.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Step 6: Test Your Deployment

1. Visit your Vercel URL
2. Test user registration/login
3. Test Stripe checkout flow
4. Verify webhook events in Stripe dashboard

## Environment Variables Reference

### Frontend (.env file or Vercel Environment Variables)
```bash
# Backend API URL - Update with your actual backend URL
REACT_APP_API_URL=https://your-backend-url.com

# Stripe publishable key
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Optional analytics
REACT_APP_SENTRY_DSN=your_sentry_dsn
REACT_APP_GA_TRACKING_ID=your_ga_id
```

### Backend (.env file)
```bash
# Database
DATABASE_URL=your_database_url

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (Mailgun)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# JWT
JWT_SECRET=your_jwt_secret_key
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your backend's `ALLOWED_ORIGINS` includes your Vercel domain
2. **API 404**: Verify `REACT_APP_API_URL` is correct and backend is running
3. **Stripe Errors**: Check that `REACT_APP_STRIPE_PUBLISHABLE_KEY` is set correctly
4. **Build Failures**: Ensure all dependencies are in `package.json`

### Debugging:
1. Check Vercel function logs in the dashboard
2. Use browser dev tools to see network requests
3. Verify environment variables are set correctly
4. Test API endpoints directly with curl/Postman

## Production Checklist

- [ ] Backend deployed and accessible
- [ ] Environment variables configured in Vercel
- [ ] CORS settings updated with production domains
- [ ] Stripe webhooks configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificates working
- [ ] Error monitoring set up (Sentry)
- [ ] Analytics configured (Google Analytics)
- [ ] Performance monitoring enabled

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test API endpoints independently
4. Check browser console for errors
5. Review Stripe webhook logs 