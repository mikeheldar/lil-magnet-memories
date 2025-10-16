# Lil Magnet Memories

A simple photo upload form for customers to submit photos for custom magnet creation at farmers markets.

## Features

- **Mobile-friendly photo upload form** - Perfect for customers using their phones
- **Customer information collection** - Name, email, phone, and special instructions
- **Multiple photo upload** - Customers can upload multiple photos at once
- **Photo preview** - See selected photos before submission
- **Responsive design** - Works great on phones, tablets, and desktops
- **Beautiful UI** - Clean, professional design with Lil Magnet Memories branding

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Email Integration

The form currently simulates photo submission. To integrate with email service:

1. Set up an email service (like EmailJS, Formspree, or custom backend)
2. Update the `onSubmit` function in `src/pages/UploadPage.vue`
3. Configure the email template to include customer info and photo attachments

## Usage at Farmers Markets

1. Set up a tablet or phone with the app
2. Customers can easily upload their photos and contact info
3. Photos and customer details are sent to your email
4. Follow up with customers to provide quotes and timelines

## Technology Stack

- **Vue 3** - Modern JavaScript framework
- **Quasar** - Vue-based UI framework for mobile-first design
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
