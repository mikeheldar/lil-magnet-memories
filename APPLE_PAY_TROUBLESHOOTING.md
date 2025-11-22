# Apple Pay Not Showing - Troubleshooting Guide

## Quick Checks

### 1. Check Browser Console
Open browser DevTools (F12) and check the Console tab. Look for:
- `🍎 Initializing Apple Pay...`
- `🍎 Apple Pay canMakePayment result: true/false`
- `✅ Apple Pay is available` or `❌ Apple Pay not available`

### 2. Device & Browser Requirements
Apple Pay requires:
- **Safari** or **Chrome** browser (not Firefox, Edge, etc.)
- **Apple device** (iPhone, iPad, Mac) with Apple Pay set up
- **HTTPS** connection (required for Apple Pay)

### 3. Square Configuration
Check that these environment variables are set in Vercel:
- `VITE_SQUARE_APPLICATION_ID` (should start with `sq0idp-` for production)
- `VITE_SQUARE_LOCATION_ID`

### 4. Domain Verification
- Domain must be verified in Square Dashboard
- Verification file must be accessible at: `/.well-known/apple-developer-merchantid-domain-association`
- ✅ This was just fixed - domain is verified!

## Common Issues

### Issue: "Apple Pay not available on this device"
**Solution:** 
- Use Safari or Chrome (not Firefox/Edge)
- Make sure Apple Pay is set up on your device
- Try on an iPhone/iPad if testing on Mac

### Issue: Square SDK not loading
**Check:**
- Open browser console
- Look for errors about `window.Square`
- Verify `index.html` has: `<script src="https://web.squarecdn.com/v1/square.js"></script>`

### Issue: Square credentials missing
**Check:**
- Browser console will show: `Square credentials not configured`
- Verify environment variables in Vercel dashboard
- Make sure you're on the correct environment (test vs production)

### Issue: Domain not verified
**Check:**
- Go to Square Dashboard → Apple Pay
- Verify domain is listed: `test.lilmagnetmemories.com` or `www.lilmagnetmemories.com`
- Test file: `curl https://test.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association`
- Should return 9098 bytes (not 2026 bytes)

## Testing Steps

1. **Open checkout page**
2. **Open browser console** (F12)
3. **Look for these messages:**
   - `🔵 CheckoutPage mounted - Square configuration:`
   - `✅ Square SDK loaded, initializing payments...`
   - `🍎 Initializing Apple Pay...`
   - `🍎 Apple Pay canMakePayment result: true/false`

4. **If you see errors:**
   - Copy the error message
   - Check the troubleshooting steps above

## Debug Information

The code now logs:
- Square SDK loading status
- Apple Pay initialization steps
- `canMakePayment()` result
- Any errors during initialization

Check the browser console for detailed diagnostic information.

