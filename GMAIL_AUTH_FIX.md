# Gmail Authentication Fix for Firebase Cloud Functions

## 🚨 Current Issue

The Firebase Cloud Function is returning a **500 Internal Server Error** with this message:

```
535-5.7.8 Username and Password not accepted. For more information, go to
535 5.7.8  https://support.google.com/mail/?p=BadCredentials
```

This means the Gmail app password is either expired or incorrect.

## 🔧 Solution Steps

### 1. Generate a New Gmail App Password

1. **Go to Google Account Settings**:

   - Visit: https://myaccount.google.com/
   - Sign in with `lilmagnetmemories@gmail.com`

2. **Enable 2-Factor Authentication** (if not already enabled):

   - Go to "Security" → "2-Step Verification"
   - Follow the setup process

3. **Generate App Password**:
   - Go to "Security" → "App passwords"
   - Select "Mail" as the app
   - Select "Other" as the device
   - Enter "Lil Magnet Memories Firebase Function"
   - Copy the generated 16-character password (format: `xxxx xxxx xxxx xxxx`)

### 2. Update Firebase Functions Configuration

Run this command with the new app password:

```bash
firebase functions:config:set email.user="lilmagnetmemories@gmail.com" email.password="NEW_APP_PASSWORD_HERE" email.service="gmail" --project lil-magnet-memories
```

Replace `NEW_APP_PASSWORD_HERE` with the actual app password from step 1.

### 3. Deploy the Updated Configuration

```bash
firebase deploy --only functions --project lil-magnet-memories
```

### 4. Test the Email Function

1. Go to the Email Test page: https://lil-magnet-memories.vercel.app/email-test
2. Sign in as admin
3. Enter a test email address
4. Click "Send Test Email"

## 🔍 Troubleshooting

### If App Passwords Option is Not Available:

- Make sure 2-Factor Authentication is enabled
- Wait a few minutes after enabling 2FA
- Try signing out and back into Google Account

### If Still Getting 535 Error:

- Double-check the app password (no spaces, exact characters)
- Ensure the Gmail account has "Less secure app access" disabled (it should be disabled for app passwords to work)
- Try generating a new app password

### Alternative: Use OAuth2 (More Complex)

If app passwords continue to fail, we can implement OAuth2 authentication, but this requires more setup.

## 📧 Expected Behavior After Fix

When working correctly, the email test should:

1. Show "Test email sent successfully!" notification
2. Display a Message ID
3. Send an actual email to the destination address
4. The email should arrive at `lilmagnetmemories@gmail.com` (as configured in the function)

## 🎯 Current Configuration

- **From Email**: `lilmagnetmemories@gmail.com`
- **To Email**: `lilmagnetmemories@gmail.com`
- **Service**: Gmail SMTP
- **Function URL**: `https://us-central1-lil-magnet-memories.cloudfunctions.net/api/send-order-email`
