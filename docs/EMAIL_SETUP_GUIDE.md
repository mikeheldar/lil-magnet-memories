# Email Setup Guide for Lil Magnet Memories

This guide will help you set up email functionality for your photo upload form.

## Option 1: EmailJS (Recommended - Free & Easy)

EmailJS is a free service that allows you to send emails directly from your frontend without a backend server.

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Set Up Email Service
1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID**

### Step 3: Create Email Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Use this template content:

```
Subject: New Photo Submission from {{customer_name}}

Hello!

You have a new photo submission for custom magnets:

Customer Details:
- Name: {{customer_name}}
- Email: {{customer_email}}
- Phone: {{customer_phone}}
- Photos: {{photo_count}} photos uploaded
- Submission Date: {{submission_date}}

Special Instructions:
{{special_instructions}}

Please contact the customer within 24 hours with a quote and timeline.

Best regards,
Lil Magnet Memories System
```

4. Save the template and note down your **Template ID**

### Step 4: Get Public Key
1. Go to "Account" → "General"
2. Copy your **Public Key**

### Step 5: Update Configuration
1. Open `src/services/emailService.ts`
2. Replace the placeholder values:
   ```typescript
   const EMAILJS_SERVICE_ID = 'your_service_id'; // Your Service ID
   const EMAILJS_TEMPLATE_ID = 'your_template_id'; // Your Template ID
   const EMAILJS_PUBLIC_KEY = 'your_public_key'; // Your Public Key
   ```

### Step 6: Test
1. Run your app: `npm run dev`
2. Submit a test form with your email
3. Check your email inbox

## Option 2: Custom Backend (Advanced)

If you prefer to use your own backend:

### Step 1: Create Backend Endpoint
Create a backend service that accepts form data and sends emails using:
- Node.js with Nodemailer
- Python with SMTP
- PHP with mail()
- Any other backend technology

### Step 2: Update Email Service
1. Open `src/services/emailService.ts`
2. Use the `sendViaBackend` method instead of `sendCustomerSubmission`
3. Update the endpoint URL in the fetch call

### Example Backend (Node.js + Express + Nodemailer)

```javascript
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const upload = multer();

// Configure your email service
const transporter = nodemailer.createTransporter({
  service: 'gmail', // or your email service
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password' // Use app password for Gmail
  }
});

app.post('/api/submit-photos', upload.array('photos'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, specialInstructions } = req.body;
    const photos = req.files;

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: 'your-business-email@gmail.com',
      subject: `New Photo Submission from ${firstName} ${lastName}`,
      html: `
        <h2>New Photo Submission</h2>
        <p><strong>Customer:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Photos:</strong> ${photos.length} photos uploaded</p>
        <p><strong>Special Instructions:</strong> ${specialInstructions || 'None'}</p>
        <p><strong>Submission Date:</strong> ${new Date().toLocaleString()}</p>
      `,
      attachments: photos.map((photo, index) => ({
        filename: `photo_${index + 1}.jpg`,
        content: photo.buffer
      }))
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Deployment

### For EmailJS Setup:
1. Build your app: `npm run build`
2. Deploy to any static hosting (Vercel, Netlify, GitHub Pages, etc.)
3. No backend required!

### For Custom Backend:
1. Deploy your backend to a hosting service
2. Update the API endpoint in your frontend
3. Deploy your frontend

## Testing at Farmers Markets

1. Set up a tablet or phone with your app
2. Test the form with a real photo upload
3. Verify emails are received correctly
4. Train staff on how to help customers use the form

## Troubleshooting

### EmailJS Issues:
- Check that all IDs are correct in the configuration
- Verify your email service is properly connected
- Check the EmailJS dashboard for error logs

### General Issues:
- Ensure all required fields are filled
- Check file size limits (EmailJS has limits)
- Verify internet connection at farmers market

## Support

For issues with this app, check:
- EmailJS documentation: https://www.emailjs.com/docs/
- Quasar documentation: https://quasar.dev/
- Vue.js documentation: https://vuejs.org/
