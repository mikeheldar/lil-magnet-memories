# Firestore Timeout Issue - Comprehensive Diagnosis

## Problem Summary
Operations are timing out after 90+ seconds (5 retry attempts × 8s each). The Firestore SDK appears stuck in an offline state that network resets aren't fixing.

## Key Findings from Code Analysis

### ✅ Rules Configuration (CORRECT)
The production Firestore rules in `production-firestore-rules.txt` are correctly configured:
```javascript
match /admin_config/{document} {
  allow read: if request.auth != null;  // ✅ Correct
  allow write: if request.auth != null;
}
```

### ⚠️ Potential Issues to Check

## 1. Environment Variables in Vercel (MOST LIKELY)

**Critical Check:** The app determines environment based on hostname:
- `test.lilmagnetmemories.com` → Uses `_TEST` variables
- `www.lilmagnetmemories.com` → Uses production variables (no `_TEST` suffix)

**Action Items:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify **ALL** production variables are set for **Production** environment:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID` ← **CRITICAL: Must be `lil-magnet-memories`**
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

3. **Verify in Browser Console:**
   - Open `www.lilmagnetmemories.com`
   - Open browser console (F12)
   - Look for: `Firebase Project ID: lil-magnet-memories`
   - If it shows a different project ID, environment variables are wrong!

## 2. Firestore Rules in Firebase Console

**Action Items:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to: **Firestore Database** → **Rules**
4. **Copy the entire rules section** and compare with `production-firestore-rules.txt`
5. Make sure `admin_config` rule matches exactly:
   ```javascript
   match /admin_config/{document} {
     allow read: if request.auth != null;
     allow write: if request.auth != null;
   }
   ```
6. If different, copy from `production-firestore-rules.txt` and click **"Publish"**

## 3. Firestore API Status

**Action Items:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to: **APIs & Services** → **Enabled APIs**
4. Search for: `Cloud Firestore API`
5. If not enabled, click **"Enable API"**
6. Wait 1-2 minutes for propagation

## 4. Billing Status

**Action Items:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to: **Project Settings** → **Usage and billing**
4. Verify billing is enabled (required even for free tier)
5. If not, click **"Upgrade"** and add payment method

## 5. Domain Authorization

**Action Items:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to: **Authentication** → **Settings** → **Authorized domains**
4. Verify these domains are listed:
   - `www.lilmagnetmemories.com`
   - `lilmagnetmemories.com`
   - Any Vercel preview domains

## Quick Diagnostic Test

**In Browser Console on Production Site:**
```javascript
// Check what Firebase config is actually being used
console.log('Project ID:', firebase.app().options.projectId);
console.log('Auth Domain:', firebase.app().options.authDomain);
console.log('Storage Bucket:', firebase.app().options.storageBucket);

// Test direct Firestore read
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
const db = getFirestore();
const testRef = collection(db, 'admin_config');
const testQuery = query(testRef, limit(1));
getDocs(testQuery)
  .then(snap => {
    console.log('✅ SUCCESS: Read', snap.size, 'documents');
    console.log('Rules are working, connection is fine');
  })
  .catch(err => {
    console.error('❌ ERROR:', err.code, err.message);
    if (err.code === 'permission-denied') {
      console.error('→ Rules are blocking the operation');
    } else if (err.code === 'unavailable' || err.message.includes('offline')) {
      console.error('→ Connection issue (this is what we\'re seeing)');
    } else {
      console.error('→ Unknown error:', err);
    }
  });
```

## Most Likely Root Cause

Based on the symptoms (timeout, not permission error), the issue is likely:

1. **Wrong Firebase Project ID in Vercel** (60% probability)
   - Production site connecting to wrong project
   - Check browser console for actual Project ID

2. **Firestore API Not Enabled** (20% probability)
   - API disabled in Google Cloud Console
   - Check APIs & Services → Enabled APIs

3. **Billing Not Enabled** (10% probability)
   - Firestore requires billing even for free tier
   - Check Project Settings → Usage and billing

4. **Rules Mismatch** (10% probability)
   - Rules in Firebase Console don't match expected
   - Compare with `production-firestore-rules.txt`

## Next Steps (In Order)

1. ✅ **Check browser console on production site** - Verify actual Project ID
2. ✅ **Verify environment variables in Vercel** - All production vars must be set
3. ✅ **Check Firestore API status** - Must be enabled in Google Cloud Console
4. ✅ **Verify billing is enabled** - Required for Firestore
5. ✅ **Compare rules in Firebase Console** - Must match `production-firestore-rules.txt`

## Diagnostic Scripts Available

Run these to help diagnose:
```bash
# Check environment variable requirements
node scripts/check-vercel-env.mjs

# Verify rules configuration
node scripts/verify-firestore-rules.mjs

# Full diagnostic (requires service account)
node scripts/diagnose-firestore-issue.mjs
```

