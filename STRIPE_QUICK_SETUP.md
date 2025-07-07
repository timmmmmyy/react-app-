# 🚀 Quick Stripe Setup (5 Minutes)

Your checkout is failing because Stripe isn't configured yet. Here's how to fix it:

## Step 1: Get Stripe Keys (2 minutes)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Click "Create account" if you don't have one (it's free)
3. Copy these keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

## Step 2: Configure Backend (1 minute)

Create `backend/.env` file:

```bash
cd backend
cp env.example .env
```

Edit `backend/.env` and replace:
```
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
```

## Step 3: Configure Frontend (1 minute)

Create `.env.local` file in the main directory:

```bash
# In /home/dminv/face-touch-detector/
echo "REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE" > .env.local
```

## Step 4: Create Products in Stripe (1 minute)

1. Go to [Stripe Products](https://dashboard.stripe.com/test/products)
2. Create 3 products:
   - **Premium Plan**: $9.97/month recurring
   - **Pro Plan**: $29.97/month recurring
3. Copy the Price IDs (start with `price_`) to your `backend/.env`

## Step 5: Restart Servers

```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
npm start
```

## 🎉 Done!

Your Stripe integration should now work. The checkout will redirect to Stripe's secure payment page.

---

## Quick Test Setup (Skip products for now)

If you just want to test the app without setting up products:

1. Only add the API keys to both `.env` files
2. The basic plan (free) will still work
3. Premium/Pro will show "Missing Price ID" but won't crash 