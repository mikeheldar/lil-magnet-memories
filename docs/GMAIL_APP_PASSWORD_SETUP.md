# Gmail App Password Setup Guide

## 🚨 Current Issue

The Firebase Cloud Function is failing with:

```
535-5.7.8 Username and Password not accepted. For more information, go to
535 5.7.8  https://support.google.com/mail/?p=BadCredentials
```

## 🔧 Solution: Generate New Gmail App Password

### Step 1: Access Google Account Settings

1. Go to: https://myaccount.google.com/
2. Sign in with: `lilmagnetmemories@gmail.com`

### Step 2: Enable 2-Factor Authentication

1. Click on **"Security"** in the left sidebar
2. Find **"2-Step Verification"** and click on it
3. Follow the setup process if not already enabled
4. **Important**: You MUST have 2FA enabled to use app passwords

### Step 3: Generate App Password

1. In **Security** settings, find **"App passwords"**
2. Click on **"App passwords"**
3. Select **"Mail"** as the app type
4. Select **"Other"** as the device
5. Enter name: **"Lil Magnet Memories Firebase Function"**
6. Click **"Generate"**
7. **Copy the 16-character password** (format: `xxxx xxxx xxxx xxxx`)

### Step 4: Update Firebase Configuration

Run this command with your new app password:

```bash
firebase functions:config:set email.user="lilmagnetmemories@gmail.com" email.password="YOUR_NEW_APP_PASSWORD_HERE" email.service="gmail" --project lil-magnet-memories
```

**Replace `YOUR_NEW_APP_PASSWORD_HERE` with the actual 16-character password from Step 3.**

### Step 5: Deploy the Updated Configuration

```bash
firebase deploy --only functions --project lil-magnet-memories
```

### Step 6: Test the Email Function

1. Go to: https://lil-magnet-memories.vercel.app/email-test
2. Sign in as admin (`lilmagnetmemories@gmail.com`)
3. Enter a test email address
4. Click **"Send Test Email"**

## 🔍 Troubleshooting

### If "App passwords" option is not visible:

- Make sure 2-Factor Authentication is enabled
- Wait a few minutes after enabling 2FA
- Try refreshing the Google Account page
- Sign out and sign back in to Google Account

### If still getting 535 error:

- Double-check the app password (no extra spaces, exact 16 characters)
- Make sure you're using the app password, not your regular Gmail password
- Try generating a new app password
- Ensure the Gmail account is not locked or suspended

### If the function still fails:

- Check Firebase function logs: `firebase functions:log --project lil-magnet-memories`
- Verify the configuration: `firebase functions:config:get --project lil-magnet-memories`

## 📧 Expected Behavior After Fix

When working correctly:

1. ✅ Email test shows "Test email sent successfully!"
2. ✅ Displays a Message ID
3. ✅ Sends actual email to destination address
4. ✅ Email arrives at `lilmagnetmemories@gmail.com`

## 🎯 Current Configuration

- **Firebase Project**: `lil-magnet-memories`
- **From Email**: `lilmagnetmemories@gmail.com`
- **To Email**: `lilmagnetmemories@gmail.com`
- **Function URL**: `https://us-central1-lil-magnet-memories.cloudfunctions.net/api/send-order-email`

## 📝 Notes

- App passwords are more secure than regular passwords
- App passwords expire and need to be regenerated periodically
- Each app password is unique and should only be used for this specific application
- Keep the app password secure and don't share it
