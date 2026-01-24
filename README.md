# Li'l Magnet Memories 🎯

A comprehensive e-commerce platform for custom photo magnets with market event support, online ordering, and admin management tools.

## 🌟 Overview

Li'l Magnet Memories is a full-featured Vue 3 application that enables customers to order custom photo magnets either online or at market events. The platform includes customer-facing ordering flows, admin management tools, payment processing, and automated email notifications.

## ✨ Key Features

### 🛒 **Customer Experience**
- **Landing Page** with product showcase, testimonials, and Google Reviews integration
- **Multiple Product Types**: Custom Photo Magnets, Designer Magnets, and Specialty Products
- **Dual Ordering Modes**: 
  - Online orders with shipping
  - Market event orders with pickup
- **Shopping Cart** with real-time sync across devices
- **Photo Upload** with progress tracking, WebP conversion, and Firebase Storage
- **Payment Options**: Square (Credit/Debit, Apple Pay, Google Pay) and Pay at Event
- **Order Tracking** for customers to view order status

### 📅 **Market Event Management**
- **Real-time Event System** with live/checked-in status
- **Event Calendar** for upcoming markets
- **Customer Mode Toggle** (online vs. at-event) with persistent preferences
- **Market Event Banner** on small screens when events are live
- **Automated workflows** specific to market vs. online orders

### 🎨 **Product Management**
- **Product Types**: Custom (photo upload), Designer (pre-made designs), Specialty items
- **Product Visibility Controls** by category
- **Testing Products** (visible only to admins)
- **Dynamic Pricing** based on quantity
- **Product Image Management** with Firebase Storage

### 👨‍💼 **Admin Tools**
- **Order Management**: View all orders, filter by status, update order status
- **Customer Management**: View customer list and order history
- **Market Event Management**: Create, edit, and manage market events
- **Product & Pricing Management**: Add/edit products, set pricing tiers, toggle visibility
- **Photo Management**: Delete old photos and orders
- **Reviews Management**: Approve/manage customer testimonials
- **Magnet Studio**: Crop and prepare photos for printing
- **Print Template Generator**: Create print layouts for magnets
- **Error Transaction Viewer**: Monitor failed payments and uploads

### 📧 **Email System**
- **Order Confirmation Emails** with photo thumbnails
- **Status Update Emails** with order progress
- **Contact Form Integration**
- **Firebase Cloud Functions** for reliable email delivery via Gmail/Nodemailer
- **Professional HTML templates** with responsive design

### 🔐 **Authentication & Security**
- **Google OAuth** for user authentication
- **Admin Role System** with email-based permissions
- **Anonymous Authentication** for browsing
- **Firestore Security Rules** protecting sensitive data
- **Environment-based Configuration** (test vs. production)

### 🎯 **Google Reviews Integration**
- **Google Places API** integration for fetching reviews
- **"Leave a Review" CTAs** on multiple pages
- **Google Reviews Display** on landing page (tabs for internal vs. Google reviews)
- **Vercel Serverless Function** to proxy Google API (CORS solution)

### 💳 **Payment Processing**
- **Square Payment Integration**
- **Apple Pay & Google Pay** support
- **Card payments** with 3D Secure
- **Pay at Event** option for market customers
- **Automatic receipt generation**

### 📱 **Responsive Design**
- **Mobile-first** approach with touch-friendly UI
- **Tablet-optimized** for market event use
- **Desktop layouts** for admin tools
- **Quasar Framework** for consistent cross-platform experience

## 🛠️ Technology Stack

### **Frontend**
- **Vue 3** (Composition API)
- **Quasar Framework** (v2) - UI components and responsive layouts
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Vue Router** - Client-side routing
- **Pinia** - State management (via composables)

### **Backend & Services**
- **Firebase**:
  - **Firestore** - NoSQL database for orders, products, users
  - **Firebase Storage** - Photo and image hosting
  - **Firebase Authentication** - Google OAuth and anonymous auth
  - **Firebase Cloud Functions** - Serverless email and API endpoints
- **Square API** - Payment processing
- **Google Places API** - Business reviews integration
- **Nodemailer** - Email delivery via Gmail

### **Deployment**
- **Vercel** - Frontend hosting with preview environments
- **Firebase Hosting** - Alternative hosting option
- **GitHub** - Version control and CI/CD

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Vitest** - Unit and integration testing

## 📁 Project Structure

```
lil-magnet-memories/
├── src/
│   ├── layouts/
│   │   └── MainLayout.vue           # Main app layout with header, nav, footer
│   ├── pages/
│   │   ├── LandingPage.vue          # Homepage with products and reviews
│   │   ├── PhotoUploadPage.vue      # Photo upload for custom magnets
│   │   ├── CartPage.vue             # Shopping cart
│   │   ├── CheckoutPage.vue         # Payment and shipping
│   │   ├── ThankYouPage.vue         # Order confirmation
│   │   ├── OrderList.vue            # Admin: All orders
│   │   ├── CustomersPage.vue        # Admin: Customer list
│   │   ├── MarketEventsPage.vue     # Admin: Manage events
│   │   ├── PricingPage.vue          # Admin: Product management
│   │   ├── PhotoManagementPage.vue  # Admin: Delete photos
│   │   ├── MagnetStudioPage.vue     # Admin: Photo cropping
│   │   └── ... (30+ pages total)
│   ├── services/
│   │   ├── firebaseService.js       # All Firebase operations
│   │   ├── authService.js           # Authentication logic
│   │   ├── marketEventService.js    # Market event state
│   │   ├── googlePlacesService.js   # Google Reviews API
│   │   └── userPreferencesService.js # User settings sync
│   ├── composables/
│   │   ├── useCart.js               # Shopping cart state
│   │   ├── useCustomerType.js       # Market vs online mode
│   │   └── useProductTypeVisibility.js # Product category visibility
│   ├── utils/
│   │   └── googleReviews.js         # Google review URL helpers
│   ├── router/
│   │   └── routes.ts                # All app routes
│   └── config/
│       └── environment.js           # Environment detection
├── functions/
│   └── src/
│       └── index.ts                 # Firebase Cloud Functions
│           ├── /send-order-email    # Order confirmation emails
│           ├── /send-status-update-email # Status updates
│           ├── /send-contact-email  # Contact form
│           └── /payments/create     # Square payment processing
├── api/
│   └── google-reviews.js            # Vercel serverless function for Google API
├── docs/
│   ├── SYSTEM_ARCHITECTURE_DIAGRAM.md
│   ├── GOOGLE_REVIEWS_SETUP.md
│   ├── FIREBASE_SETUP.md
│   ├── SQUARE_PAYMENT_SETUP.md
│   └── ... (60+ documentation files)
├── public/
│   └── easel-gallery/               # Landing page image carousel
├── tests/
│   └── ... (test suites)
├── package.json
├── quasar.config.js                 # Quasar configuration
├── firebase.json                    # Firebase project config
└── vercel.json                      # Vercel deployment config
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **npm** or **yarn**
- **Firebase Account** (for database and storage)
- **Square Account** (for payments)
- **Google Cloud Project** (for Places API)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mikeheldar/lil-magnet-memories.git
   cd lil-magnet-memories
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Fill in all required API keys and configuration
   - See `docs/FIREBASE_SETUP.md` for Firebase configuration
   - See `docs/SQUARE_PAYMENT_SETUP.md` for Square setup
   - See `GOOGLE_REVIEWS_SETUP.md` for Google Reviews

4. **Start development server**:
   ```bash
   npm run dev
   # or
   quasar dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   # or
   quasar build
   ```

### Firebase Setup

1. Create Firebase projects (one for test, one for production)
2. Enable services: Firestore, Storage, Authentication
3. Set up security rules
4. Deploy Cloud Functions:
   ```bash
   cd functions
   npm install
   npm run build
   cd ..
   firebase deploy --only functions
   ```

See `docs/FIREBASE_SETUP.md` for detailed instructions.

### Deployment

#### Vercel (Recommended)
```bash
vercel --prod
```

- Connect GitHub repository for automatic deployments
- Set environment variables in Vercel dashboard
- Configure test and production environments

#### Firebase Hosting
```bash
firebase deploy --only hosting
```

## 📊 Key Workflows

### Customer Orders Online
1. Browse products on landing page
2. Add items to cart or upload photos
3. Proceed to checkout
4. Enter shipping information
5. Complete payment via Square
6. Receive order confirmation email
7. Track order status

### Customer Orders at Market Event
1. Check "I'm at the event" toggle
2. Upload photos or select products
3. Choose "Pay at Event"
4. Receive order confirmation
5. Pick up at market booth

### Admin Processes
1. **Order Fulfillment**:
   - View new orders
   - Update status (in progress → completed)
   - Send status update emails

2. **Event Management**:
   - Create market event
   - Set live/checked-in status
   - Customers automatically see event options

3. **Product Management**:
   - Add new products
   - Set pricing tiers
   - Toggle category visibility

## 🔑 Environment Variables

Required environment variables (see `.env.example` for full list):

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Test Environment (separate Firebase project)
VITE_FIREBASE_API_KEY_TEST=
VITE_FIREBASE_AUTH_DOMAIN_TEST=
# ... (test environment vars)

# Square Payment
VITE_SQUARE_APPLICATION_ID=
VITE_SQUARE_LOCATION_ID=

# Google Reviews
VITE_GOOGLE_REVIEW_URL=
VITE_GOOGLE_PLACE_ID=
VITE_GOOGLE_PLACES_API_KEY=
```

## 📚 Documentation

Comprehensive documentation available in the `docs/` directory:

- **Setup Guides**: Firebase, Square, Google Reviews, Email
- **Architecture**: System diagrams, data flow
- **Features**: Detailed feature documentation
- **Troubleshooting**: Common issues and solutions
- **API Reference**: Cloud Functions and endpoints

## 🧪 Testing

### Test Environment
- **URL**: test.lilmagnetmemories.com
- **Purpose**: Safe environment for testing without affecting production
- **Features**: Separate Firebase project, test data isolation

### Running Tests
```bash
npm run test
# or
npm run test:unit
```

## 🔒 Security

- Firestore security rules protect sensitive data
- Admin access controlled via email whitelist
- Environment-specific configurations
- Secure payment processing via Square
- HTTPS enforced on all deployments

## 📧 Support & Contact

- **Issues**: GitHub Issues
- **Business**: lilmagnetmemories@gmail.com

## 📄 License

All rights reserved © 2025 Li'l Magnet Memories

---

**Built with ❤️ for creating lasting memories**
