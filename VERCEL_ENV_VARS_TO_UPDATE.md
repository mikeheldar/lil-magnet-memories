# Vercel Environment Variables to Update

## Test Environment Variables

Update these in Vercel → Your Project → Settings → Environment Variables

Make sure to select **"Test"** environment (or "All Environments" if you want it for both):

```
VITE_FIREBASE_API_KEY_TEST=AIzaSyBkp1fHvfjB6Vv9c4JIq-4XqbG6orHDnVY
VITE_FIREBASE_AUTH_DOMAIN_TEST=lil-magnet-memories-test.firebaseapp.com
VITE_FIREBASE_PROJECT_ID_TEST=lil-magnet-memories-test
VITE_FIREBASE_STORAGE_BUCKET_TEST=lil-magnet-memories-test.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID_TEST=616216794499
VITE_FIREBASE_APP_ID_TEST=1:616216794499:web:91cb7c3d45b245181812b6
```

## Steps:
1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. For each variable above:
   - Click "Add New" or edit existing
   - Set Environment to "Test" (or "All Environments")
   - Paste the value
   - Click "Save"
3. After updating all variables:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - OR push a new commit to trigger rebuild

## Verify:
After redeploy, check the browser console on test.lilmagnetmemories.com:
- Should see: `Firebase Project ID: lil-magnet-memories-test`
- Should NOT see permission errors (after rules are also fixed)

