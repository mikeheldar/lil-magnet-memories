# Lil Magnet Memories - Photo Upload App

## 🎯 Project Overview

A simple, mobile-friendly photo upload form for your Lil Magnet Memories business at farmers markets. Customers can easily submit their photos and contact information to get custom magnets created.

## ✨ Features

### 📱 **Mobile-First Design**
- **Responsive layout** that works perfectly on phones, tablets, and desktops
- **Touch-friendly interface** optimized for customer use at farmers markets
- **Clean, professional design** with Lil Magnet Memories branding

### 📸 **Photo Upload**
- **Multiple photo selection** - customers can upload several photos at once
- **Photo preview** - see selected photos before submission
- **File validation** - only accepts image files (JPG, PNG, GIF, WebP)
- **Drag & drop support** for easy photo selection

### 👤 **Customer Information**
- **Required fields**: First name, Last name, Email
- **Optional fields**: Phone number, Special instructions
- **Form validation** ensures all required information is provided
- **Email validation** to ensure proper contact information

### 📧 **Email Integration**
- **EmailJS integration** for sending form submissions to your email
- **Professional email template** with customer details and photo count
- **Alternative backend option** for custom email handling
- **Error handling** with user-friendly notifications

### 🎨 **User Experience**
- **Loading states** during form submission
- **Success/error notifications** with clear messaging
- **Form reset** after successful submission
- **Progress indicators** for better user feedback

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation
1. Navigate to the project directory:
   ```bash
   cd /Users/michaelhelman-darley/projects/lil-magnet-memories
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 📧 Email Setup

### Option 1: EmailJS (Recommended)
1. Create account at [emailjs.com](https://www.emailjs.com/)
2. Set up email service (Gmail, Outlook, etc.)
3. Create email template
4. Update configuration in `src/services/emailService.js`

### Option 2: Custom Backend
- Set up your own email service
- Update the `sendViaBackend` method
- Deploy backend and update endpoint

See `EMAIL_SETUP_GUIDE.md` for detailed instructions.

## 🏪 Usage at Farmers Markets

### Setup
1. **Device**: Use a tablet or phone with the app
2. **Internet**: Ensure stable internet connection
3. **Testing**: Test form submission before the market

### Customer Flow
1. Customer approaches your booth
2. You direct them to the photo upload form
3. Customer fills out their information and uploads photos
4. Form submits automatically to your email
5. You follow up with quote and timeline

### Staff Training
- **Help customers** navigate the form if needed
- **Explain the process** - photos → email → quote → magnets
- **Verify contact info** before submission
- **Handle technical issues** (refresh page, check internet)

## 🛠️ Technical Details

### Technology Stack
- **Vue 3** - Modern JavaScript framework
- **Quasar** - Vue-based UI framework for mobile-first design
- **EmailJS** - Email service integration
- **Vite** - Fast build tool

### Project Structure
```
lil-magnet-memories/
├── src/
│   ├── layouts/
│   │   └── MainLayout.vue      # Main app layout
│   ├── pages/
│   │   ├── UploadPage.vue      # Photo upload form
│   │   └── ErrorNotFound.vue   # 404 page
│   ├── services/
│   │   └── emailService.js     # Email integration
│   └── router/
│       └── routes.ts           # App routing
├── dist/                       # Built files for deployment
├── EMAIL_SETUP_GUIDE.md        # Email configuration guide
├── PROJECT_SUMMARY.md          # This file
└── README.md                   # Basic project info
```

### Key Files
- **`src/pages/UploadPage.vue`** - Main photo upload form
- **`src/services/emailService.js`** - Email functionality
- **`quasar.config.js`** - Quasar configuration
- **`package.json`** - Project dependencies

## 🚀 Deployment

### Static Hosting (Recommended for EmailJS)
Deploy to any static hosting service:
- **Vercel**: `vercel --prod`
- **Netlify**: Connect GitHub repository
- **GitHub Pages**: Use GitHub Actions
- **Firebase Hosting**: `firebase deploy`

### Custom Backend Deployment
If using custom backend:
1. Deploy backend service
2. Update API endpoint in email service
3. Deploy frontend to static hosting

## 📱 Mobile Optimization

### Features
- **Responsive breakpoints** for all screen sizes
- **Touch-friendly buttons** and inputs
- **Optimized text sizes** for mobile readability
- **Fast loading** with minimal dependencies

### Testing
- Test on actual mobile devices
- Verify photo upload works on different phones
- Check form usability with touch input
- Ensure proper display on various screen sizes

## 🎨 Customization

### Branding
- Update company name in `MainLayout.vue` and `UploadPage.vue`
- Modify colors in `quasar.config.js`
- Add your logo to the header
- Customize email template

### Form Fields
- Add/remove fields in `UploadPage.vue`
- Update validation rules
- Modify email template to include new fields

### Styling
- Update CSS in component `<style>` sections
- Modify Quasar theme variables
- Add custom fonts or colors

## 🔧 Troubleshooting

### Common Issues
1. **Email not sending**: Check EmailJS configuration
2. **Photos not uploading**: Verify file size limits
3. **Form not submitting**: Check internet connection
4. **Mobile display issues**: Test on actual devices

### Debug Mode
- Open browser developer tools
- Check console for error messages
- Verify network requests in Network tab
- Test form validation

## 📞 Support

For technical issues:
1. Check the console for error messages
2. Verify all configuration settings
3. Test on different devices/browsers
4. Check internet connectivity

For business questions:
- Review the email setup guide
- Test the complete customer flow
- Practice with the form before the market

## 🎉 Success Metrics

### Customer Experience
- ✅ Easy photo upload process
- ✅ Clear form instructions
- ✅ Professional appearance
- ✅ Fast submission

### Business Benefits
- ✅ Automated customer data collection
- ✅ Professional email notifications
- ✅ Reduced manual data entry
- ✅ Improved customer experience

## 📋 Next Steps

1. **Set up EmailJS** account and configuration
2. **Test the form** with real photos and emails
3. **Deploy to hosting** service
4. **Train staff** on using the form
5. **Test at farmers market** with real customers

---

**Ready to use at your next farmers market!** 🌟

The app is fully functional and ready for deployment. Just follow the email setup guide to configure email notifications, and you'll be ready to collect customer photos for custom magnets!
