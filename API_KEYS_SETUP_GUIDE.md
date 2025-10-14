# API Keys Setup Guide - Get Real Google & Facebook Integration Working

## 🎯 Overview

This guide will help you get API keys to enable real Google Contacts and Facebook Friends integration.

---

## 📧 Google People API Setup

### Step 1: Go to Google Cloud Console

Visit: https://console.cloud.google.com/

### Step 2: Create or Select a Project

1. Click the project dropdown at the top
2. Click "New Project"
3. Name it: "Spoiler Alert" or similar
4. Click "Create"

### Step 3: Enable Google People API

1. In the left sidebar, go to **"APIs & Services" → "Library"**
2. Search for "**Google People API**"
3. Click on it
4. Click **"Enable"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services" → "Credentials"**
2. Click **"Create Credentials" → "OAuth client ID"**
3. If prompted, configure OAuth consent screen first:
   - Choose **"External"** user type
   - Fill in app name: "Spoiler Alert"
   - Add your email as support email
   - Add authorized domain: `vercel.app`
   - Save and continue
4. Back to Create OAuth client ID:
   - Application type: **"Web application"**
   - Name: "Spoiler Alert Web Client"
   - **Authorized JavaScript origins**:
     ```
     http://localhost:9000
     https://quasar-spoileralert.vercel.app
     https://quasar-spoileralert-[your-hash].vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:9000
     https://quasar-spoileralert.vercel.app
     https://quasar-spoileralert-[your-hash].vercel.app
     ```
5. Click **"Create"**
6. Copy the **Client ID** (you'll need this!)

### Step 5: Add Required Scopes

1. Go to **"OAuth consent screen"**
2. Scroll to **"Scopes"**
3. Click **"Add or Remove Scopes"**
4. Add these scopes:
   ```
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   https://www.googleapis.com/auth/contacts.readonly
   ```
5. Save

### Step 6: Update Your Code

In `src/boot/google-login.js` or wherever you initialize Google login:

```javascript
// Add the contacts scope
const googleClientId = 'YOUR_GOOGLE_CLIENT_ID_HERE';

// Initialize with contacts scope
google.accounts.id.initialize({
  client_id: googleClientId,
  scope: 'email profile https://www.googleapis.com/auth/contacts.readonly',
  callback: handleCredentialResponse,
});
```

### Step 7: Load the People API Library

Add to your `index.html` or load dynamically:

```html
<script src="https://apis.google.com/js/api.js"></script>
```

### Step 8: Implement Real Contact Loading

Update `loadGoogleContacts()` method:

```javascript
async loadGoogleContacts() {
  this.isLoadingContacts = true;

  try {
    // Initialize the API client
    await gapi.client.init({
      apiKey: 'YOUR_API_KEY', // Get from Google Cloud Console
      discoveryDocs: ['https://people.googleapis.com/$discovery/rest?version=v1'],
    });

    // Get the access token from your Google login
    const accessToken = sessionStorage.getItem('googleAccessToken');
    gapi.client.setToken({ access_token: accessToken });

    // Fetch contacts
    const response = await gapi.client.people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 100,
      personFields: 'names,emailAddresses,photos',
    });

    // Map to your format
    this.allContacts = response.result.connections.map(person => ({
      name: person.names?.[0]?.displayName || 'Unknown',
      email: person.emailAddresses?.[0]?.value || '',
      avatar: person.photos?.[0]?.url || '',
      source: 'google'
    })).filter(contact => contact.email); // Only keep contacts with emails

    console.log('✅ Real Google contacts loaded:', this.allContacts.length);
  } catch (error) {
    console.error('Error loading Google contacts:', error);
    // Fall back to demo data
  } finally {
    this.isLoadingContacts = false;
  }
}
```

---

## 📘 Facebook Graph API Setup

### Step 1: Go to Facebook Developers

Visit: https://developers.facebook.com/apps/

### Step 2: Select Your Existing App

You already have App ID: **4054337747943866**

1. Click on your app
2. Go to dashboard

### Step 3: Add Facebook Login Product (if not added)

1. In left sidebar, click **"Add Product"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Choose **"Web"**
4. Enter site URL: `https://quasar-spoileralert.vercel.app`

### Step 4: Configure Facebook Login Settings

1. Go to **"Facebook Login" → "Settings"**
2. **Valid OAuth Redirect URIs** - Add:
   ```
   http://localhost:9000/
   https://quasar-spoileralert.vercel.app/
   https://quasar-spoileralert-[your-hash].vercel.app/
   ```
3. **Client OAuth Login**: **ON**
4. **Web OAuth Login**: **ON**
5. Save changes

### Step 5: Request Advanced Permissions

**IMPORTANT:** Facebook restricts the `user_friends` permission!

1. Go to **"App Review" → "Permissions and Features"**
2. Request **"user_friends"** permission
3. You'll need to:
   - Explain why you need it (e.g., "To help users find and connect with friends on our TV show tracking platform")
   - Provide screencast demonstrating the feature
   - Wait for Facebook approval (can take days/weeks)

**Note:** Without approval, you'll only see friends who also use your app!

### Step 6: Configure App Domains

1. Go to **"Settings" → "Basic"**
2. **App Domains** - Add:
   ```
   localhost
   quasar-spoileralert.vercel.app
   ```
3. Save changes

### Step 7: Make App Live (when ready)

1. Go to **"Settings" → "Basic"**
2. Toggle **"App Mode"** from "Development" to "Live"
3. (Do this only when fully tested)

### Step 8: Update Permissions in Code

Already done in `src/boot/hello.js`:

```javascript
window.FB.init({
  appId: '4054337747943866',
  cookie: true,
  xfbml: true,
  version: 'v21.0',
});
```

And in login request (update if needed):

```javascript
window.FB.login(
  (response) => {
    // ... your code
  },
  {
    scope: 'email,public_profile,user_friends', // user_friends requires approval!
    return_scopes: true,
  }
);
```

### Step 9: Handle Limited Friends Data

```javascript
async loadFacebookFriends() {
  this.isLoadingContacts = true;

  window.FB.api('/me/friends', { fields: 'name,email,picture' }, (response) => {
    if (response && !response.error && response.data) {
      // Only returns friends who also use your app!
      this.allContacts = response.data.map(friend => ({
        name: friend.name,
        email: friend.email || '', // May be empty
        avatar: friend.picture?.data?.url || '',
        facebookId: friend.id,
        source: 'facebook'
      }));

      console.log('✅ Facebook friends loaded:', this.allContacts.length);

      // Show message if empty
      if (this.allContacts.length === 0) {
        console.warn('No Facebook friends found. They may not use this app yet.');
      }
    } else {
      console.error('Error:', response?.error);
    }
    this.isLoadingContacts = false;
  });
}
```

---

## 📧 Email Service Setup (SendGrid)

To send actual invitation emails, you need an email service.

### Option 1: SendGrid (Recommended)

1. **Sign up**: https://sendgrid.com/
2. **Free tier**: 100 emails/day
3. **Get API Key**:

   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it "Spoiler Alert"
   - Choose "Full Access"
   - Copy the key (show it only once!)

4. **Verify Sender Email**:
   - Go to Settings → Sender Authentication
   - Verify your email address
   - Or set up domain authentication (more professional)

### Option 2: AWS SES

1. **Sign up**: https://aws.amazon.com/ses/
2. **Verify email** or domain
3. **Request production access** (starts in sandbox mode)
4. **Get credentials** from IAM

### Option 3: Resend (Modern Alternative)

1. **Sign up**: https://resend.com/
2. **Free tier**: 3,000 emails/month
3. **Very developer-friendly API**

---

## 🔥 Firebase Cloud Functions Setup

To send emails from your Firebase backend:

### Step 1: Install Firebase Tools

```bash
npm install -g firebase-tools
firebase login
```

### Step 2: Go to Your Functions Directory

```bash
cd /Users/michaelhelman-darley/projects/hapi-spoileralert/functions
```

### Step 3: Install Email Dependencies

```bash
npm install nodemailer @sendgrid/mail
```

### Step 4: Set Environment Variables

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
firebase functions:config:set app.email="noreply@yourdomain.com"
```

### Step 5: Create Email Functions

In `functions/src/index.ts`, add:

```typescript
import * as sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = functions.config().sendgrid.key;
sgMail.setApiKey(SENDGRID_API_KEY);

export const sendFriendRequest = functions.https.onCall(
  async (data, context) => {
    const { to, from, fromName, toName, siteUrl } = data;

    const msg = {
      to: to,
      from: functions.config().app.email,
      subject: `${fromName} wants to connect on Spoiler Alert!`,
      html: `
      <h2>Friend Request</h2>
      <p>Hi ${toName},</p>
      <p><strong>${fromName}</strong> sent you a friend request on Spoiler Alert!</p>
      <a href="${siteUrl}/friends" style="background:#1976d2;color:white;padding:12px 24px;">
        Accept Request
      </a>
    `,
    };

    await sgMail.send(msg);
    return { success: true };
  }
);

export const sendSiteInvitation = functions.https.onCall(
  async (data, context) => {
    const { to, from, fromName, toName, siteUrl } = data;

    const msg = {
      to: to,
      from: functions.config().app.email,
      subject: `${fromName} invited you to join Spoiler Alert!`,
      html: `
      <h2>You're Invited!</h2>
      <p>Hi ${toName},</p>
      <p><strong>${fromName}</strong> invited you to join Spoiler Alert!</p>
      <a href="${siteUrl}/register?invitedBy=${from}" style="background:#1976d2;color:white;padding:12px 24px;">
        Sign Up Now
      </a>
    `,
    };

    await sgMail.send(msg);
    return { success: true };
  }
);
```

### Step 6: Deploy Functions

```bash
firebase deploy --only functions
```

### Step 7: Update Frontend to Call Functions

In `FriendsPage.vue`:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

async sendInvitationEmail(friend, userExists) {
  const functions = getFunctions();

  const invitationData = {
    to: friend.email,
    from: this.userEmail,
    fromName: sessionStorage.getItem('userName'),
    toName: friend.name,
    siteUrl: window.location.origin
  };

  try {
    if (userExists) {
      const sendFriendRequest = httpsCallable(functions, 'sendFriendRequest');
      await sendFriendRequest(invitationData);
    } else {
      const sendSiteInvitation = httpsCallable(functions, 'sendSiteInvitation');
      await sendSiteInvitation(invitationData);
    }
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
```

---

## ✅ Quick Start Checklist

### For Testing (Demo Mode - Already Works!):

- [ ] Log in with Google or Facebook
- [ ] Go to Friends page
- [ ] Wait for "contacts loading" spinner
- [ ] See "8 contacts loaded" message
- [ ] Type "Jane" or "John" in search
- [ ] See demo results appear
- [ ] Click "Send Request"
- [ ] Check browser console for logs

### For Production (Real APIs):

- [ ] Get Google Client ID from Google Cloud Console
- [ ] Enable Google People API
- [ ] Add contacts.readonly scope
- [ ] Update Facebook OAuth settings
- [ ] Request user_friends permission from Facebook
- [ ] Sign up for SendGrid/Email service
- [ ] Get API key from email service
- [ ] Deploy Firebase Cloud Functions
- [ ] Set environment variables
- [ ] Update frontend to call real APIs

---

## 🎯 Current Status vs Production

| Feature              | Demo Mode (Current)  | Production (Needs Setup)        |
| -------------------- | -------------------- | ------------------------------- |
| Google Contacts      | ✅ 8 demo contacts   | ⏳ Real contacts via People API |
| Facebook Friends     | ✅ 6 demo contacts   | ⏳ Real friends via Graph API   |
| Search Functionality | ✅ Working           | ✅ Working                      |
| Send Request Button  | ✅ Working           | ✅ Working                      |
| Email Sending        | ⏳ Console logs only | ⏳ Real emails via SendGrid     |
| User Existence Check | ✅ Demo data         | ⏳ Real Firebase query          |

---

## 💡 Tips

1. **Start with Demo Mode**: Test the UI flow first (already working!)
2. **Google First**: Easier to set up than Facebook
3. **Facebook Approval**: Takes time, so apply early
4. **Email Service**: SendGrid free tier is perfect to start
5. **Test Locally**: Use localhost URLs first
6. **Check Console**: All API calls log to browser console

---

## 🆘 Troubleshooting

### "No contacts loading"

- Check browser console for errors
- Verify you're logged in with Google/Facebook
- Refresh the page

### "Google API not working"

- Check Client ID is correct
- Verify domains in OAuth consent screen
- Check scopes include contacts.readonly

### "Facebook returns empty list"

- Normal! Requires app approval
- Only shows friends who use your app
- Request user_friends permission

### "Emails not sending"

- Check SendGrid API key
- Verify sender email
- Check Firebase Functions logs
- Verify functions are deployed

---

Need help? Check the browser console for detailed logs!

