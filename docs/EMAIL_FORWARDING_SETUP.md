# Email Forwarding Setup Guide
## info@lilmagnetmemories.com → Gmail

This guide covers how to receive emails at `info@lilmagnetmemories.com` and send from that address using your Gmail account.

---

## Part 1: Set Up Cloudflare Email Forwarding (Receive Emails)

### What This Does:
- Any email sent to `info@lilmagnetmemories.com` will automatically forward to `lilmagnetmemories@gmail.com`
- **Completely free** through Cloudflare
- Takes about 5 minutes to set up

### Steps:

1. **Log into Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com
   - Select your domain: `lilmagnetmemories.com`

2. **Navigate to Email Routing**
   - In the left sidebar, click **"Email"** or **"Email Routing"**
   - If you don't see it, search for "Email Routing" in the top search bar

3. **Enable Email Routing**
   - Click **"Get started"** or **"Enable Email Routing"**
   - Cloudflare will automatically create the necessary DNS records (MX records)
   - This may take a few minutes to propagate

4. **Verify Your Destination Email**
   - Click **"Add destination address"**
   - Enter: `lilmagnetmemories@gmail.com`
   - Click **"Send verification email"**
   - Check your Gmail inbox for the verification email from Cloudflare
   - Click the verification link in that email

5. **Create Email Forwarding Rule**
   - Once destination is verified, click **"Create address"**
   - **Custom address**: Enter `info`
   - **Action**: Select "Send to an email" → `lilmagnetmemories@gmail.com`
   - Click **"Save"**

6. **Test It!**
   - Send a test email from another email account to `info@lilmagnetmemories.com`
   - You should receive it in your `lilmagnetmemories@gmail.com` inbox within seconds

### Optional: Additional Forwarding Rules

You can add more email addresses that forward to your Gmail:
- `hello@lilmagnetmemories.com`
- `support@lilmagnetmemories.com`
- `orders@lilmagnetmemories.com`
- `contact@lilmagnetmemories.com`

Or enable **Catch-all** to forward ANY address (like `randomname@lilmagnetmemories.com`) to your Gmail.

---

## Part 2: Set Up Gmail "Send As" (Send FROM info@lilmagnetmemories.com)

### What This Does:
- Allows you to send emails FROM `info@lilmagnetmemories.com` using your Gmail account
- Recipients will see the email coming from `info@` instead of `lilmagnetmemories@gmail.com`
- **Note**: Gmail will add a small "via gmail.com" footer to outgoing emails

### Steps:

1. **Open Gmail Settings**
   - Log into Gmail: https://mail.google.com
   - Click the **gear icon** (⚙️) in the top right
   - Click **"See all settings"**

2. **Go to Accounts Tab**
   - Click the **"Accounts and Import"** tab
   - Find the section: **"Send mail as:"**

3. **Add Custom Email Address**
   - Click **"Add another email address"**
   - A popup window will appear

4. **Enter Your Information**
   - **Name**: `Lil Magnet Memories` (or whatever you want to appear as sender)
   - **Email address**: `info@lilmagnetmemories.com`
   - ☑️ **Check** "Treat as an alias"
   - Click **"Next Step"**

5. **Configure SMTP Server**
   - **SMTP Server**: `smtp.gmail.com`
   - **Port**: `587`
   - **Username**: `lilmagnetmemories@gmail.com` (your Gmail address)
   - **Password**: You need an **App Password** (see below)
   - ☑️ **Check** "Secured connection using TLS"
   - Click **"Add Account"**

6. **Verify the Email Address**
   - Gmail will send a verification code to `info@lilmagnetmemories.com`
   - Since that forwards to your Gmail, you'll receive it immediately
   - Copy the verification code from the email
   - Paste it in the confirmation popup
   - Click **"Verify"**

7. **Set as Default (Optional)**
   - Back in Gmail Settings → Accounts tab
   - Find `info@lilmagnetmemories.com` in the list
   - Click **"make default"** if you want all new emails to send from this address

---

## Part 3: Create Gmail App Password

Gmail requires an "App Password" instead of your regular password for third-party apps and "Send As" addresses.

### Steps:

1. **Enable 2-Factor Authentication (if not already enabled)**
   - Go to: https://myaccount.google.com/security
   - Under "Signing in to Google", click **"2-Step Verification"**
   - Follow the prompts to set it up if not already active

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Or Google "Gmail App Password" and click the first result
   - **Select app**: Choose "Mail" or "Other (Custom name)" → Enter "Send As Info"
   - **Select device**: Choose "Other (Custom name)" → Enter "MacBook" or your device
   - Click **"Generate"**

3. **Copy the App Password**
   - Gmail will show you a 16-character password (like: `abcd efgh ijkl mnop`)
   - Copy this password
   - **This is what you'll use in Step 5 of "Send As" setup above**

4. **Save the Password**
   - Store this password securely (you won't be able to see it again)
   - If you lose it, you can generate a new one

---

## Part 4: Using Your New Email Setup

### Sending Emails:

1. **Compose a new email** in Gmail
2. Click the **"From:"** dropdown (next to your email address)
3. Select `info@lilmagnetmemories.com`
4. Write and send your email normally

### Receiving Emails:

- All emails sent to `info@lilmagnetmemories.com` automatically appear in your Gmail inbox
- No action needed - it just works!

### Replying to Emails:

- When you reply to an email sent to `info@`, Gmail will automatically use that address as the "From" address
- You can change it using the "From:" dropdown if needed

---

## Troubleshooting

### Problem: "Couldn't verify that you own this email address"
**Solution**: 
- Make sure Cloudflare email forwarding is working (send a test email to info@)
- Wait a few minutes and try again
- Check spam folder for verification email

### Problem: "Authentication failed" when adding SMTP
**Solution**:
- Make sure you're using an **App Password**, not your regular Gmail password
- Verify 2-Factor Authentication is enabled on your Google account
- Generate a new App Password and try again

### Problem: Emails sent to info@ aren't arriving
**Solution**:
- Check Cloudflare Email Routing dashboard for delivery logs
- Verify DNS records are set correctly (MX records for mail.lilmagnetmemories.com)
- Wait 24 hours for DNS propagation if you just set it up

### Problem: "via gmail.com" appears in sent emails
**Solution**:
- This is normal for Gmail "Send As" - it's a Gmail limitation
- To remove it, you'd need to upgrade to:
  - Google Workspace ($6/month) - Full custom email
  - Another email service (Zoho, Microsoft 365, etc.)

---

## Summary

✅ **Receiving**: Cloudflare Email Routing forwards info@ to your Gmail (free)  
✅ **Sending**: Gmail "Send As" lets you send from info@ address  
⚠️ **Note**: Outgoing emails will show "via gmail.com" footer

### Services Used:
- **Cloudflare**: Email forwarding (free)
- **Gmail**: SMTP server for sending (free)
- **Domain**: lilmagnetmemories.com (already owned)

### No Monthly Costs!
Both Cloudflare Email Routing and Gmail "Send As" are completely free.

---

## Additional Resources

- [Cloudflare Email Routing Docs](https://developers.cloudflare.com/email-routing/)
- [Gmail Send As Guide](https://support.google.com/mail/answer/22370)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

**Last Updated**: January 2026  
**Configured By**: Mike  
**Status**: Pending setup
