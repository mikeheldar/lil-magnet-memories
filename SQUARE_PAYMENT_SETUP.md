# Square Payment Setup Guide

## Simple Steps to Enable Apple Pay & Payment Processing

### Step 1: Get Your Square Sandbox Credentials

1. **Sign up for a Square Developer Account**

   - Go to: https://developer.squareup.com/signup
   - Create a free account

2. **Get Your Application ID and Location ID**

   - After signing up, go to: https://developer.squareup.com/apps
   - Click "Create Application"
   - Name it: "Lil Magnet Memories"
   - Copy your **Application ID** (starts with `sandbox-` for testing)

3. **Get Location ID**
   - Still in Square Dashboard, go to: https://squareup.com/us/en/get/locations
   - Or go to your Square Dashboard → Locations
   - Copy your **Location ID** (or use your sandbox location for testing)

### Step 2: Enable Apple Pay (If Using Apple Pay)

1. **Register Your Domain with Apple**

   - In Square Dashboard → Apple Pay
   - Add your domain: `www.lilmagnetmemories.com` and `test.lilmagnetmemories.com`
   - Download the verification file
   - Upload it to: `https://www.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association`

2. **For Testing (Vercel)**
   - Add your Vercel domain to Square too
   - Upload the verification file to Vercel's `public/.well-known/` folder

### Step 3: Add Credentials to Your Project

1. **Update `.env` file:**

   ```
   VITE_SQUARE_APPLICATION_ID=sandbox-sq0idb-YOUR-ID-HERE
   VITE_SQUARE_LOCATION_ID=YOUR-LOCATION-ID-HERE
   ```

2. **Add PayPal Credentials (Optional)**

   ```
   VITE_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
   ```

3. **Update `env.example` with these new variables**

### Step 4: Initialize in Checkout Page

The code will automatically:

- Load Square SDK (already in `index.html`)
- Initialize payments when checkout page loads
- Show Apple Pay button if device supports it
- Show Google Pay button if device supports it
- Show credit card form as fallback

### Step 5: Test in Sandbox

1. Use Square's test card numbers: https://developer.squareup.com/docs/testing/test-values
2. Example test card: `4111 1111 1111 1111`
3. Any future expiration date
4. Any 3-digit CVV

### Step 6: Go Live

1. **Switch from Sandbox to Production**

   - Update `index.html` line 30: change `sandbox.web.squarecdn.com` to `web.squarecdn.com`
   - Update your `.env` with **production** Application ID and Location ID

2. **Request Access to Payment Processing**
   - In Square Dashboard → Apply for payments
   - Complete verification process

## Quick Reference

- **Sandbox**: https://developer.squareup.com/apps
- **Test Cards**: https://developer.squareup.com/docs/testing/test-values
- **Documentation**: https://developer.squareup.com/docs/web-payments/overview
- **Square Dashboard**: https://squareup.com/dashboard

## Troubleshooting

- **Apple Pay not showing?**

  - Device must be on Apple device with Safari or Chrome
  - Must have Apple Pay set up on device
  - Domain must be registered with Square

- **Payment button not working?**

  - Check browser console for errors
  - Verify Application ID and Location ID are correct
  - Make sure you're on HTTPS (localhost OK for testing)

- **Need to test without real device?**
  - Use "Credit Card" option instead
  - It works on all devices
