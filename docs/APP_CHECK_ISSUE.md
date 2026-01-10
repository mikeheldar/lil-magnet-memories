# App Check May Be Blocking Firestore Requests

## Issue Identified

From the Firebase Console screenshots:
- **App Check** is monitoring Firestore with **100% unverified requests**
- This means **all Firestore requests are unverified** and could be blocked if App Check enforcement is enabled

## What is App Check?

[Firebase App Check](https://firebase.google.com/docs/app-check) helps protect your backend resources from abuse. When enabled and enforced, it requires valid App Check tokens for all requests.

## Current Status

From your Firebase Console:
- **Cloud Firestore**: 0% verified, 100% unverified requests
- **Status**: "Monitoring" (not enforcing yet, but could be)

## Potential Problem

If App Check enforcement is enabled for Firestore (even if not visible in the UI), **all unverified requests will be rejected**, causing timeouts.

## Solution Options

### Option 1: Register Your App with App Check (Recommended)

This is the proper long-term solution:

1. **Go to Firebase Console** → **App Check** → **Apps** tab
2. **Click "Register app"**
3. **Select your web app**
4. **Choose a provider:**
   - **reCAPTCHA v3** (recommended for web)
   - You'll need a reCAPTCHA site key
5. **Complete registration**
6. **Update your code** to initialize App Check (see below)

### Option 2: Disable App Check Enforcement (Temporary)

If App Check is enforcing (blocking requests):

1. **Go to Firebase Console** → **App Check** → **APIs** tab
2. **Find "Cloud Firestore"** in the list
3. **Check if there's an "Enforce" toggle** or settings
4. **Disable enforcement** (keep monitoring if you want)

**Note:** The enforcement might be at the Security Rules level, not in App Check UI.

### Option 3: Check Security Rules for App Check

App Check can also be enforced in Firestore Security Rules:

1. **Go to Firebase Console** → **Firestore Database** → **Rules**
2. **Look for rules that check `request.app`**:
   ```javascript
   // Example of App Check enforcement in rules
   allow read: if request.auth != null && request.app != null;
   ```
3. **If present, temporarily remove the App Check check**:
   ```javascript
   allow read: if request.auth != null; // Remove App Check requirement
   ```

## Code Changes Needed (If Registering App)

If you choose Option 1 (register app), update your code:

### 1. Get reCAPTCHA Site Key

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Create a new site (reCAPTCHA v3)
3. Add your domains: `www.lilmagnetmemories.com`, `test.lilmagnetmemories.com`
4. Copy the **Site Key**

### 2. Add to Vercel Environment Variables

Add to Vercel → Environment Variables:
```
VITE_FIREBASE_APPCHECK_SITE_KEY=<your-recaptcha-site-key>
```

### 3. Code Already Supports App Check

Looking at `src/firebase/config.js`, your code already initializes App Check if the site key is provided:

```javascript
const appCheckSiteKey = import.meta.env?.VITE_FIREBASE_APPCHECK_SITE_KEY;
if (appCheckSiteKey) {
  // App Check will be initialized automatically
}
```

So you just need to:
1. Get reCAPTCHA site key
2. Add `VITE_FIREBASE_APPCHECK_SITE_KEY` to Vercel
3. Redeploy

## Quick Test: Disable App Check Temporarily

To test if App Check is the issue:

1. **Check Firestore Security Rules** for App Check requirements
2. **Temporarily remove any `request.app` checks**
3. **Test if operations work**
4. **If they do, App Check is the problem**

## Missing Production Environment Variables

I notice you only showed one production variable (`VITE_FIREBASE_API_KEY`). Make sure ALL of these are set in Vercel for **Production** environment:

- ✅ `VITE_FIREBASE_API_KEY` (you have this)
- ❓ `VITE_FIREBASE_AUTH_DOMAIN` (need to verify)
- ❓ `VITE_FIREBASE_PROJECT_ID` (need to verify)
- ❓ `VITE_FIREBASE_STORAGE_BUCKET` (need to verify)
- ❓ `VITE_FIREBASE_MESSAGING_SENDER_ID` (need to verify)
- ❓ `VITE_FIREBASE_APP_ID` (need to verify)

**Action:** Verify all 6 production variables are set in Vercel.

## Next Steps

1. **Check Firestore Security Rules** for App Check enforcement
2. **Verify all production environment variables** are set
3. **Either register app with App Check OR disable enforcement**
4. **Test operations again**

