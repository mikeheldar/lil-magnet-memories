# System Architecture Diagram - Test vs Production

## 🔍 Environment Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEST ENVIRONMENT                                   │
│                    test.lilmagnetmemories.com                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌──────────────┐         ┌──────────────────────┐
│   User Browser  │ ──────► │   Vercel     │ ──────► │  Firebase Test       │
│                 │         │  (CDN/Edge)  │         │  Project             │
│                 │         │              │         │                      │
│  - Same Code    │         │  - test-env   │         │  Project ID:         │
│  - Same Build   │         │    branch     │         │  lil-magnet-         │
│                 │         │              │         │    memories-test     │
│                 │         │  Env Vars:    │         │                      │
│                 │         │  - VITE_*_TEST│        │  Storage:            │
│                 │         │              │         │  *.firebasestorage.app│
└─────────────────┘         └──────────────┘         └──────────────────────┘
                                      │
                                      │ ✅ WORKS
                                      │
                                      ▼
                            ┌──────────────────────┐
                            │  Firestore Test DB   │
                            │  - user_roles        │
                            │  - admin_config     │
                            │  - orders           │
                            └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION ENVIRONMENT                                │
│                 www.lilmagnetmemories.com                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌──────────────┐         ┌──────────────────────┐
│   User Browser  │ ──────► │   Vercel     │ ──────► │  Firebase Production │
│                 │         │  (CDN/Edge)  │         │  Project             │
│                 │         │              │         │                      │
│  - Same Code    │         │  - main       │         │  Project ID:         │
│  - Same Build   │         │    branch     │         │  lil-magnet-memories │
│                 │         │              │         │                      │
│                 │         │  Env Vars:    │         │  Storage:            │
│                 │         │  - VITE_*     │         │  *.firebasestorage.app│
│                 │         │  (no _TEST)   │         │                      │
└─────────────────┘         └──────────────┘         └──────────────────────┘
                                      │
                                      │ ❌ FAILS
                                      │ "client is offline"
                                      ▼
                            ┌──────────────────────┐
                            │  Firestore Prod DB   │
                            │  - user_roles        │
                            │  - admin_config     │
                            │  - orders           │
                            └──────────────────────┘
```

## 🔑 Key Differences

### 1. **Domain Detection**
```
Test:    window.location.hostname === 'test.lilmagnetmemories.com'
Prod:    window.location.hostname === 'www.lilmagnetmemories.com' 
         OR 'lilmagnetmemories.com'
```

### 2. **Firebase Configuration**

#### TEST Environment Variables:
```
VITE_FIREBASE_API_KEY_TEST=AIzaSyBkp1fHvfjB6Vv9c4JIq-4XqbG6orHDnVY
VITE_FIREBASE_AUTH_DOMAIN_TEST=lil-magnet-memories-test.firebaseapp.com
VITE_FIREBASE_PROJECT_ID_TEST=lil-magnet-memories-test
VITE_FIREBASE_STORAGE_BUCKET_TEST=lil-magnet-memories-test.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID_TEST=616216794499
VITE_FIREBASE_APP_ID_TEST=1:616216794499:web:91cb7c3d45b245181812b6
```

#### PRODUCTION Environment Variables:
```
VITE_FIREBASE_API_KEY=AIzaSyDFIwa_pv5vne3-WJDzB0D4JVQBPzkv0IQ
VITE_FIREBASE_AUTH_DOMAIN=lil-magnet-memories.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lil-magnet-memories
VITE_FIREBASE_STORAGE_BUCKET=lil-magnet-memories.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=849050019895
VITE_FIREBASE_APP_ID=1:849050019895:web:4600965ea2f49a396877b2
```

### 3. **Firebase Projects**

```
┌─────────────────────────────────────┐
│   TEST Firebase Project              │
│   lil-magnet-memories-test           │
├─────────────────────────────────────┤
│ ✅ Firestore: Works                  │
│ ✅ Storage: Works                     │
│ ✅ Auth: Works                        │
│ ✅ CORS: Configured                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   PRODUCTION Firebase Project        │
│   lil-magnet-memories               │
├─────────────────────────────────────┤
│ ❌ Firestore: "client is offline"   │
│ ✅ Storage: Works (CORS fixed)        │
│ ✅ Auth: Works                       │
│ ❓ CORS: ??? (for Firestore?)        │
└─────────────────────────────────────┘
```

## 🔄 Data Flow Comparison

### TEST Environment Flow (WORKING):
```
1. Browser loads test.lilmagnetmemories.com
   ↓
2. Code detects: isTest = true
   ↓
3. Uses VITE_FIREBASE_*_TEST env vars
   ↓
4. Connects to: lil-magnet-memories-test Firebase project
   ↓
5. Firestore: ✅ Connects successfully
   ↓
6. Operations: ✅ Work normally
```

### PRODUCTION Environment Flow (FAILING):
```
1. Browser loads www.lilmagnetmemories.com
   ↓
2. Code detects: isTest = false
   ↓
3. Uses VITE_FIREBASE_* env vars (no _TEST)
   ↓
4. Connects to: lil-magnet-memories Firebase project
   ↓
5. Firestore: ❌ Reports "client is offline"
   ↓
6. Operations: ❌ Fail with offline errors
   ↓
7. Retries: ❌ All retries fail (5 attempts)
```

## 🚨 Potential Differences to Check

### 1. **Firestore Security Rules** ⚠️ **LIKELY ROOT CAUSE**
```
Test Project Rules:     ??? (Need to check - but works)
                        Probably permissive: allow read, write: if true;

Production Rules:       See production-firestore-rules.txt
                        ⚠️ CRITICAL: user_roles requires authentication!
                        Line 20: allow read: if request.auth != null;
                        Line 29: admin_config: allow read: if request.auth != null;
                        
                        If user is NOT authenticated, Firestore might report
                        this as "offline" instead of "permission denied"!
```

### 2. **Firestore API Status**
```
Test Project:           ✅ Enabled (works)
Production Project:     ❓ Enabled? (might be disabled or restricted)
```

### 3. **Domain Authorization**
```
Test:                   test.lilmagnetmemories.com ✅
Production:             www.lilmagnetmemories.com ❓
                        lilmagnetmemories.com ❓
```

### 4. **CORS Configuration**
```
Test Storage Bucket:    ✅ CORS configured
Production Storage:     ✅ CORS configured (we fixed this)
Production Firestore:   ❓ No CORS (Firestore doesn't use CORS)
```

### 5. **Billing/Quotas**
```
Test Project:           ✅ Billing enabled? (works)
Production Project:     ❓ Billing enabled? (might be issue)
```

### 6. **Network/Persistence**
```
Test:                   ✅ No persistence issues
Production:             ❌ Stuck in offline mode
                        (might be browser cache, IndexedDB, or Firebase SDK state)
```

## 🔍 What to Check in Production

### 1. **Firebase Console - Production Project**
- [ ] Firestore Database → Rules (are they permissive enough?)
- [ ] Firestore Database → Usage (is it active?)
- [ ] APIs & Services → Cloud Firestore API (is it enabled?)
- [ ] IAM & Admin → Quotas (any exceeded?)

### 2. **Vercel Environment Variables**
- [ ] Are all `VITE_FIREBASE_*` vars set (without _TEST)?
- [ ] Do they match the production Firebase project?
- [ ] Are they set for "Production" environment (not just "All")?

### 3. **Browser/Network**
- [ ] Check browser console for CORS errors
- [ ] Check Network tab for failed Firestore requests
- [ ] Check if requests are being blocked
- [ ] Try incognito mode (rules out cache)

### 4. **Firebase Project Settings**
- [ ] Authentication → Settings → Authorized domains
  - Is `www.lilmagnetmemories.com` listed?
  - Is `lilmagnetmemories.com` listed?
- [ ] Project Settings → General
  - Does the config match your env vars?

## 🎯 Most Likely Causes (Ranked by Probability)

Based on the symptoms (works in test, fails in prod):

### 1. **Authentication Issue** ⚠️ **MOST LIKELY**
```
Production Rules require: request.auth != null
- user_roles: allow read: if request.auth != null;
- admin_config: allow read: if request.auth != null;

If user is NOT authenticated in production:
- Firestore might report "offline" instead of "permission denied"
- Anonymous auth might not be working in production
- Auth might be failing silently

Check:
- Is anonymous authentication enabled in production Firebase?
- Is the user actually authenticated when making requests?
- Check browser console for auth errors
```

### 2. **Firestore Rules Difference**
```
Test:     Probably permissive (allow read, write: if true;)
Production: Requires authentication (request.auth != null)

If test has permissive rules and prod has restrictive rules,
that explains why test works and prod doesn't!
```

### 3. **Anonymous Authentication Not Enabled**
```
Test Project:     ✅ Anonymous auth enabled (works)
Production:       ❓ Anonymous auth enabled? (might not be)

If anonymous auth is disabled in production, users can't
authenticate, so request.auth == null, so rules block access,
which might appear as "offline" error.
```

### 4. **Domain Authorization**
```
Test:     test.lilmagnetmemories.com ✅ authorized
Production: www.lilmagnetmemories.com ❓ authorized?
            lilmagnetmemories.com ❓ authorized?
```

### 5. **Environment Variables**
```
Production env vars might be:
- Missing
- Incorrect
- Not set for "Production" environment in Vercel
```

### 6. **API Status / Billing**
```
Production Firestore API might be:
- Disabled
- Billing not enabled
- Quota exceeded
```

## 📊 Connection Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       │ 1. Initialize Firebase
       │    - Read env vars
       │    - Create Firestore instance
       │
       ▼
┌─────────────────────────┐
│  Firebase SDK            │
│  - getFirestore()        │
│  - enableNetwork()       │
│  - disableNetwork()      │
└──────┬──────────────────┘
       │
       │ 2. Connect to Firestore
       │
       ▼
┌─────────────────────────┐
│  Firestore Client        │
│  Status: ???            │
│  - Test: ✅ Online       │
│  - Prod: ❌ Offline      │
└──────┬──────────────────┘
       │
       │ 3. Make Request
       │
       ▼
┌─────────────────────────┐
│  Network Layer           │
│  - WebSocket/HTTP        │
│  - CORS (if needed)      │
└──────┬──────────────────┘
       │
       │ 4. Firebase Servers
       │
       ▼
┌─────────────────────────┐
│  Firebase Backend        │
│  - Test: ✅ Responds     │
│  - Prod: ❓ ???           │
└─────────────────────────┘
```

## 🔧 Next Steps to Diagnose (In Priority Order)

### 1. **Check Anonymous Authentication** ⚠️ **DO THIS FIRST**
```
1. Go to Firebase Console → Production Project
2. Authentication → Sign-in method
3. Check if "Anonymous" is ENABLED
4. If NOT enabled, ENABLE IT
5. This is likely the root cause!
```

### 2. **Check User Authentication Status**
```
In browser console on production site, run:
firebase.auth().currentUser

If it returns null, user is not authenticated!
This would explain why rules block access.
```

### 3. **Compare Firestore Rules**
```
Test Project Rules:
1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore/rules
2. Copy the rules

Production Rules:
1. Go to: https://console.firebase.google.com/project/lil-magnet-memories/firestore/rules
2. Compare with test rules
3. Are they different? That's the issue!
```

### 4. **Check Domain Authorization**
```
Firebase Console → Production Project → Authentication → Settings
Scroll to "Authorized domains"
- Is www.lilmagnetmemories.com listed?
- Is lilmagnetmemories.com listed?
```

### 5. **Verify Environment Variables**
```
Vercel → Production Project → Settings → Environment Variables
- Are all VITE_FIREBASE_* vars set (without _TEST)?
- Are they set for "Production" environment?
- Do they match production Firebase project?
```

### 6. **Check Firestore API Status**
```
Google Cloud Console → Production Project
APIs & Services → Enabled APIs
- Is "Cloud Firestore API" enabled?
```

## 🎯 Quick Test

Run this in browser console on production site:

```javascript
// Check if user is authenticated
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('Current user:', auth.currentUser);
console.log('Is anonymous:', auth.currentUser?.isAnonymous);

// Try to read user_roles
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const db = getFirestore();
const ref = collection(db, 'user_roles');
getDocs(ref).then(snap => {
  console.log('✅ Success!', snap.size, 'docs');
}).catch(err => {
  console.error('❌ Error:', err.code, err.message);
});
```

If this shows `currentUser: null`, that's the problem!

