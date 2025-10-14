# Facebook OAuth Setup Guide

## The Problem

You're seeing this error:

> "This redirect failed because the redirect URI is not whitelisted in the app's Client OAuth Settings."

## The Solution

### Step 1: Go to Facebook Developers Console

1. Visit: https://developers.facebook.com/apps/
2. Click on your app (App ID: **4054337747943866**)

### Step 2: Navigate to Facebook Login Settings

1. In the left sidebar, find **"Facebook Login"** under **"Products"**
2. Click on **"Settings"** under Facebook Login

### Step 3: Configure Valid OAuth Redirect URIs

Add these URLs to **"Valid OAuth Redirect URIs"**:

```
https://quasar-spoileralert.vercel.app/
https://quasar-spoileralert-ot13zridn-mikeheldars-projects.vercel.app/
http://localhost:9000/
```

**Note:** Make sure to include the trailing slash `/` at the end of each URL!

### Step 4: Configure App Domains

1. Scroll to **"App Domains"** in the Basic Settings
2. Add these domains:
   ```
   quasar-spoileralert.vercel.app
   quasar-spoileralert-ot13zridn-mikeheldars-projects.vercel.app
   localhost
   ```

### Step 5: Make Sure These Settings Are Enabled

1. **"Client OAuth Login"** - Should be **ON**
2. **"Web OAuth Login"** - Should be **ON**
3. **"Use Strict Mode for Redirect URIs"** - Should be **ON**

### Step 6: Add Website Platform (if not already added)

1. Scroll down in Settings to **"Add Platform"**
2. Select **"Website"**
3. Add your Site URL: `https://quasar-spoileralert.vercel.app/`

### Step 7: Save Changes

Click **"Save Changes"** button at the bottom of the page.

### Step 8: Test the Integration

1. Clear your browser cache/cookies
2. Go to your login page
3. Click "Continue with Facebook"
4. You should now be able to log in successfully!

## Additional Notes

### If You Deploy to a New Vercel URL

Whenever Vercel gives you a new deployment URL, you'll need to add it to:

- Valid OAuth Redirect URIs
- App Domains

### Permissions Required

Your app is requesting these permissions:

- `email` - To get the user's email address
- `public_profile` - To get basic profile information (name, ID)

### Testing Locally

When testing on `localhost:9000`, make sure:

1. You've added `http://localhost:9000/` to Valid OAuth Redirect URIs
2. You've added `localhost` to App Domains

## Modern Facebook SDK Implementation

Your app now uses:

- **Facebook JavaScript SDK v21.0** (the latest version)
- **Modern OAuth 2.0 flow**
- **Better error handling**
- **Official Facebook blue styling (#1877f2)**

The old `hellojs` library has been removed and replaced with the official Facebook SDK.

## Troubleshooting

### Error: "Given URL is not allowed by the Application configuration"

- Double-check that your domain is in "App Domains"
- Make sure the redirect URI exactly matches (including trailing slash)

### Error: "App Not Set Up: This app is still in development mode"

- Go to App Settings > Basic
- Add a Privacy Policy URL
- Add a Terms of Service URL (optional)
- Switch the app to "Live" mode when ready

### No Email Returned

- Check that your app has been approved for `email` permission
- During development, test with users who have a role in your app (Admin, Developer, Tester)

## Need Help?

If you still see errors after following these steps, check:

1. Browser console for detailed error messages
2. Facebook's App Dashboard > Alerts & Diagnostics
3. Make sure your app is not restricted or limited

