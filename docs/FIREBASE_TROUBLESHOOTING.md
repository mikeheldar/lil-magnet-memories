# Firebase 400 Bad Request Troubleshooting Guide

## Current Issue

Your application is experiencing `400 (Bad Request)` errors when trying to write to Firebase Firestore. This prevents orders from being saved to the database.

## Error Details

```
GET https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel?gsessionid=...
400 (Bad Request)
WebChannelConnection RPC 'Write' stream transport errored
```

## Diagnostic Steps

### 1. Use the Firebase Diagnostic Tool

Visit: `https://your-app-url/firebase-test`

This tool will test:

- Basic Firebase connection
- Simple Firestore writes
- Minimal order writes

### 2. Check Firestore Security Rules

Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Firestore Database → Rules

**Current rules should be:**

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

**If rules are restrictive, temporarily use the above for testing.**

### 3. Verify Firebase Project Status

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `lil-magnet-memories`
3. **Check project status**:
   - Is the project active?
   - Is billing enabled? (Required for Firestore)
   - Are there any quota issues?

### 4. Check Domain Authorization

1. **Go to Firebase Console** → **Authentication** → **Settings**
2. **Scroll to "Authorized domains"**
3. **Ensure these domains are listed**:
   - `localhost` (for development)
   - Your current Vercel URL (e.g., `lil-magnet-memories-g42k1kt9b-mikeheldars-projects.vercel.app`)

### 5. Verify API Keys and Configuration

Your current configuration:

```javascript
const firebaseConfig = {
  apiKey: 'AIzaSyDFIwa_pv5vne3-WJDzB0D4JVQBPzkv0IQ',
  authDomain: 'lil-magnet-memories.firebaseapp.com',
  projectId: 'lil-magnet-memories',
  storageBucket: 'lil-magnet-memories.firebasestorage.app',
  messagingSenderId: '849050019895',
  appId: '1:849050019895:web:4600965ea2f49a396877b2',
};
```

**Verify this matches your Firebase Console project settings.**

## Common Solutions

### Solution 1: Enable Billing

Firestore requires billing to be enabled even for the free tier.

1. Go to Firebase Console → Project Settings → Usage and billing
2. Enable billing if not already enabled
3. Add a payment method (you won't be charged for free tier usage)

### Solution 2: Reset Firestore Rules

If rules are causing issues:

1. Go to Firestore Database → Rules
2. Replace with permissive rules:

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

3. Click "Publish"

### Solution 3: Check Firestore API Status

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to APIs & Services → Enabled APIs
4. Ensure "Cloud Firestore API" is enabled

### Solution 4: Verify Project Quotas

1. Go to Google Cloud Console
2. Navigate to IAM & Admin → Quotas
3. Search for "Firestore"
4. Check if you've hit any quotas

## Alternative Solutions

### Option 1: Use Firebase Emulator (Development)

If the issue persists, you can use Firebase emulators for development:

```bash
npm install -g firebase-tools
firebase init emulators
firebase emulators:start
```

### Option 2: Implement Offline-First Approach

The current implementation already handles Firebase failures gracefully, but you could enhance it with:

1. **Local storage backup**
2. **Retry mechanisms**
3. **Offline queue**

### Option 3: Switch to Different Database

If Firebase continues to have issues, consider:

- **Supabase** (PostgreSQL-based)
- **PlanetScale** (MySQL-based)
- **Airtable** (No-code database)

## Testing the Fix

After implementing any solution:

1. **Visit the diagnostic tool**: `/firebase-test`
2. **Run all tests** to verify connectivity
3. **Test order submission** on the upload page
4. **Check browser console** for any remaining errors

## Current Workaround

The application now handles Firebase failures gracefully:

- Orders proceed even if Firebase fails
- Users get redirected to thank you page
- Appropriate notifications are shown
- Local storage backup is maintained

## Next Steps

1. **Run the diagnostic tool** to identify the specific issue
2. **Check Firebase Console** for any error messages
3. **Verify billing and quotas**
4. **Update Firestore rules** if needed
5. **Test with the diagnostic tool** after each fix

## Contact Information

If issues persist after following this guide:

- Check Firebase Status: https://status.firebase.google.com/
- Firebase Support: https://firebase.google.com/support
- Community Forums: https://firebase.google.com/community
