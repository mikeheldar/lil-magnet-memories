# Comprehensive Firestore Configuration Check

## Issue: Operations Timing Out (90+ seconds)

All retry attempts are timing out, suggesting the Firestore SDK is stuck in an offline state that network resets aren't fixing.

## Step-by-Step Diagnostic Checklist

### 1. Verify Environment Variables in Vercel

**Production Environment** (www.lilmagnetmemories.com):
- Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
- Ensure these are set for **Production** environment:
  ```
  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN
  VITE_FIREBASE_PROJECT_ID
  VITE_FIREBASE_STORAGE_BUCKET
  VITE_FIREBASE_MESSAGING_SENDER_ID
  VITE_FIREBASE_APP_ID
  ```

**Test Environment** (test.lilmagnetmemories.com):
- Ensure these are set for **Preview** environment:
  ```
  VITE_FIREBASE_API_KEY_TEST
  VITE_FIREBASE_AUTH_DOMAIN_TEST
  VITE_FIREBASE_PROJECT_ID_TEST
  VITE_FIREBASE_STORAGE_BUCKET_TEST
  VITE_FIREBASE_MESSAGING_SENDER_ID_TEST
  VITE_FIREBASE_APP_ID_TEST
  ```

**Quick Check:**
1. Open browser console on production site
2. Look for: `Firebase Project ID: <expected-id>`
3. Verify it matches your production Firebase project ID
4. If it doesn't match, environment variables are wrong

### 2. Verify Firestore Security Rules

**Production Project** (`lil-magnet-memories`):
1. Go to: [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to: **Firestore Database** → **Rules**
4. Verify the rules match `production-firestore-rules.txt`

**Critical Rule Check:**
```javascript
match /admin_config/{document} {
  allow read: if request.auth != null;  // ✅ Must allow authenticated reads
  allow write: if request.auth != null;
}
```

**If rules are different:**
1. Copy rules from `production-firestore-rules.txt`
2. Paste into Firebase Console
3. Click **"Publish"**
4. Wait 1-2 minutes for rules to propagate

### 3. Check Firestore API Status

1. Go to: [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to: **APIs & Services** → **Enabled APIs**
4. Verify **"Cloud Firestore API"** is enabled
5. If not enabled, click **"Enable API"**

### 4. Check Billing Status

1. Go to: [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to: **Project Settings** → **Usage and billing**
4. Verify billing is enabled (required even for free tier)
5. If not enabled, click **"Upgrade"** and add payment method

### 5. Verify Domain Authorization

1. Go to: [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to: **Authentication** → **Settings** → **Authorized domains**
4. Verify these domains are listed:
   - `www.lilmagnetmemories.com`
   - `lilmagnetmemories.com`
   - `test.lilmagnetmemories.com`
   - Any Vercel preview domains you use

### 6. Check Browser Console for Actual Config

**On Production Site:**
1. Open browser console (F12)
2. Look for these log messages:
   ```
   Firebase Project ID: <should-be-lil-magnet-memories>
   Environment: production
   Firebase Storage Bucket: <should-match-vercel-env-var>
   ```
3. If Project ID doesn't match expected, environment variables are wrong

### 7. Test Firestore Connection Directly

**Using Browser Console:**
```javascript
// Paste this in browser console on production site
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
const db = getFirestore();
const testRef = collection(db, 'admin_config');
const testQuery = query(testRef, limit(1));
getDocs(testQuery)
  .then(snap => console.log('✅ Success:', snap.size, 'docs'))
  .catch(err => console.error('❌ Error:', err.code, err.message));
```

**Expected Results:**
- ✅ Success: Connection works, rules are fine
- ❌ Permission denied: Rules are blocking
- ❌ Timeout/offline: Connection issue (this is what we're seeing)

### 8. Run Diagnostic Scripts

**Check Environment Variables:**
```bash
node scripts/check-vercel-env.js
```

**Verify Firestore Rules:**
```bash
node scripts/verify-firestore-rules.js
```

**Full Diagnostic (requires service account):**
```bash
node scripts/diagnose-firestore-issue.js
```

## Most Likely Issues (in order)

1. **Environment Variables Not Set in Vercel**
   - Production site using wrong Firebase project
   - Check browser console for actual Project ID

2. **Firestore Rules Mismatch**
   - Rules in Firebase Console don't match `production-firestore-rules.txt`
   - Rules require `request.auth != null` but user might not be authenticated properly

3. **Firestore API Not Enabled**
   - API disabled in Google Cloud Console
   - Check APIs & Services → Enabled APIs

4. **Billing Not Enabled**
   - Firestore requires billing even for free tier
   - Check Project Settings → Usage and billing

5. **Domain Not Authorized**
   - Production domain not in authorized domains list
   - Check Authentication → Settings → Authorized domains

## Quick Fix Test

**Temporarily set permissive rules to test:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**If this fixes the timeout:**
- Rules are the issue
- Restore proper rules from `production-firestore-rules.txt`
- Make sure user is authenticated before operations

**If this doesn't fix the timeout:**
- Issue is not rules
- Check environment variables
- Check Firestore API status
- Check billing

## Next Steps

1. Run all diagnostic scripts
2. Check browser console on production site
3. Verify environment variables in Vercel
4. Compare Firebase Console rules with `production-firestore-rules.txt`
5. Test with permissive rules to isolate the issue

