# Google Authentication Setup Guide

## Step 1: Enable Google Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `lil-magnet-memories-7f01d`
3. In the left sidebar, click **"Authentication"**
4. Click on **"Get started"** if you haven't set up Authentication yet
5. Go to the **"Sign-in method"** tab
6. Click on **"Google"** from the list of providers
7. Toggle **"Enable"** to turn on Google sign-in
8. Enter a **Project support email** (your email address)
9. Click **"Save"**

## Step 2: Configure OAuth Consent Screen

1. In the Google provider settings, you may need to configure the OAuth consent screen
2. If prompted, go to [Google Cloud Console](https://console.cloud.google.com/)
3. Select your project: `lil-magnet-memories-7f01d`
4. Go to **"APIs & Services"** > **"OAuth consent screen"**
5. Choose **"External"** user type and click **"Create"**
6. Fill in the required fields:
   - **App name**: Lil Magnet Memories
   - **User support email**: your email
   - **Developer contact information**: your email
7. Click **"Save and Continue"**
8. Skip **"Scopes"** for now and click **"Save and Continue"**
9. Add your email to **"Test users"** if needed
10. Click **"Save and Continue"**

## Step 3: Add Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings**
2. Scroll down to **"Authorized domains"**
3. Add your production domain:
   - `lil-magnet-memories-rd13pljgj-mikeheldars-projects.vercel.app`
4. Add your local development domain:
   - `localhost` (should already be there)
5. Click **"Save"**

## Step 4: Test the Setup

1. Run your app locally: `npm run dev`
2. Go to `http://localhost:9001/`
3. Click "Sign in with Google"
4. You should see the Google sign-in popup
5. After signing in, you should be redirected to the OrderList page

## Step 5: Verify Production Setup

1. Go to your production URL: https://lil-magnet-memories-rd13pljgj-mikeheldars-projects.vercel.app
2. Try signing in with Google
3. You should be able to access the admin pages (Orders, Customers)

## Troubleshooting

### Common Issues:

1. **"This app isn't verified" warning**:

   - This is normal for development. Click "Advanced" > "Go to [app name] (unsafe)"
   - For production, you'll need to verify your app with Google

2. **"Error 400: redirect_uri_mismatch"**:

   - Make sure your domain is added to authorized domains in Firebase
   - Check that the domain matches exactly (including https://)

3. **"Error 403: access_denied"**:

   - Check OAuth consent screen configuration
   - Make sure your email is added as a test user

4. **Authentication popup blocked**:
   - Check browser popup blockers
   - Make sure the popup is allowed for your domain

### Debug Steps:

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Try signing in and check for any error messages
4. Look for Firebase authentication errors

## Current Firebase Configuration

Your current Firebase config in `src/firebase/config.js`:

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

This configuration should work once Google Authentication is enabled in your Firebase project.

## Next Steps After Setup

Once Google Authentication is working:

1. Test the full flow: sign in → access admin pages → sign out
2. Test photo upload as a non-authenticated user
3. Verify that protected routes redirect to landing page when not authenticated
4. Check that the navigation updates correctly based on authentication state
