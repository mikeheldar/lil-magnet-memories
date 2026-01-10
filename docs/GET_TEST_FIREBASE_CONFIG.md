# How to Get Test Firebase Configuration

## Step 1: Go to Firebase Console
1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/settings/general
2. Make sure you're in the **`lil-magnet-memories-test`** project (check the project name at the top)

## Step 2: Get Web App Configuration
1. Scroll down to **"Your apps"** section
2. Look for a web app (icon: `</>`)
3. If you don't see one, click **"Add app"** → Select **Web icon (`</>`)** → Register app
4. Copy the **config object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",  // ← This is VITE_FIREBASE_API_KEY_TEST
  authDomain: "lil-magnet-memories-test.firebaseapp.com",  // ← VITE_FIREBASE_AUTH_DOMAIN_TEST
  projectId: "lil-magnet-memories-test",  // ← VITE_FIREBASE_PROJECT_ID_TEST
  storageBucket: "lil-magnet-memories-test.firebasestorage.app",  // ← VITE_FIREBASE_STORAGE_BUCKET_TEST
  messagingSenderId: "123456789",  // ← VITE_FIREBASE_MESSAGING_SENDER_ID_TEST
  appId: "1:123456789:web:abc123"  // ← VITE_FIREBASE_APP_ID_TEST
};
```

## Step 3: Update Vercel Environment Variables
1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Make sure you're editing variables for the **test environment** (or "All Environments")
3. Update these variables with values from the config above:

- `VITE_FIREBASE_API_KEY_TEST` = `apiKey` value
- `VITE_FIREBASE_AUTH_DOMAIN_TEST` = `authDomain` value
- `VITE_FIREBASE_PROJECT_ID_TEST` = `projectId` value (should be `lil-magnet-memories-test`)
- `VITE_FIREBASE_STORAGE_BUCKET_TEST` = `storageBucket` value
- `VITE_FIREBASE_MESSAGING_SENDER_ID_TEST` = `messagingSenderId` value
- `VITE_FIREBASE_APP_ID_TEST` = `appId` value

## Step 4: Redeploy
After updating environment variables:
1. Go to Vercel → Your Project → Deployments
2. Click the "..." menu on the latest deployment
3. Click "Redeploy"
4. Or push a new commit to trigger a rebuild

## Important Notes:
- The API key is **NOT** a secret - it's safe to expose in client-side code
- The API key is **project-specific** - using the wrong one will cause permission errors
- Make sure you're copying from the **test project**, not production
- The `projectId` MUST match: `lil-magnet-memories-test`

