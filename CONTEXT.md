# Lil Magnet Memories - Project Context

## 🎯 Project Overview

**Lil Magnet Memories** is a Vue 3 + Quasar web application for a custom magnet business that operates at farmers markets. The app allows customers to upload photos and place orders for custom photo magnets, with both online ordering and market event ordering capabilities.

## 🏗️ Architecture

### Technology Stack
- **Frontend Framework**: Vue 3 with Composition API
- **UI Framework**: Quasar Framework v2.6.0
- **Build Tool**: Vite (via Quasar CLI)
- **Backend**: Firebase (Firestore, Storage, Authentication)
- **Payment Processing**: Square API
- **Deployment**: Vercel
- **Testing**: Playwright for E2E tests

### Project Structure
```
lil-magnet-memories/
├── src/
│   ├── pages/              # Main application pages
│   │   ├── LandingPage.vue          # Homepage with hero section
│   │   ├── PhotoUploadPage.vue       # Unified photo upload form
│   │   ├── CartPage.vue              # Shopping cart
│   │   ├── CheckoutPage.vue           # Checkout with Square payment
│   │   ├── ThankYouPage.vue           # Order confirmation
│   │   ├── OrderList.vue              # Admin order management
│   │   ├── CustomersPage.vue          # Customer management
│   │   ├── MarketEventsPage.vue       # Market event management
│   │   ├── MagnetStudioPage.vue       # Magnet design studio
│   │   ├── PricingPage.vue            # Pricing management
│   │   └── AdminPage.vue              # Admin dashboard
│   ├── services/           # Business logic services
│   │   ├── firebase-service.ts        # Firebase operations
│   │   ├── authService.js             # Authentication
│   │   ├── marketEventService.js      # Market events
│   │   └── notificationService.js     # Notifications
│   ├── stores/             # Pinia stores (if used)
│   ├── router/             # Vue Router configuration
│   ├── layouts/            # App layouts
│   └── config/             # Configuration files
├── functions/               # Firebase Cloud Functions
├── public/                 # Static assets
├── scripts/                # Utility scripts
└── tests/                  # E2E tests (Playwright)
```

## 🔑 Key Features

### 1. Photo Upload System
- **Unified Upload Form**: Single form handles both market event and online orders
- **Multiple Photo Support**: Customers can upload multiple photos
- **Photo Preview**: Real-time preview before submission
- **Storage**: Photos stored in Firebase Storage
- **Validation**: File type and size validation

### 2. Order Management
- **Cart System**: Add multiple items to cart
- **Order Tracking**: Customers can view their orders
- **Admin Dashboard**: Full order management interface
- **Status Management**: Track order status (pending, processing, completed, etc.)
- **Print Templates**: Generate print-ready templates for orders

### 3. Market Events
- **Event Management**: Create and manage market events
- **Event Detection**: Automatic detection when customers are at events
- **Event-Specific Pricing**: Different pricing for market events vs online
- **Banner Notifications**: Display active market events on homepage

### 4. Payment Processing
- **Square Integration**: Secure payment processing via Square API
- **Apple Pay Support**: Native Apple Pay integration
- **Transaction Tracking**: Monitor successful and failed transactions
- **Error Handling**: Comprehensive error handling for payment failures

### 5. Customer Management
- **Customer Profiles**: Store customer information
- **Order History**: View all orders by customer
- **Contact Information**: Email and phone number management

### 6. Magnet Studio
- **Design Tools**: Create custom magnet designs
- **Template Selection**: Choose from pre-made templates
- **Photo Selection**: Select photos for magnet creation

## 🔐 Authentication & Authorization

### Authentication Methods
- **Anonymous Authentication**: For guest orders (no sign-in required)
- **Google OAuth**: For admin and customer accounts
- **Email/Password**: Traditional authentication (if configured)

### Authorization Levels
- **Public**: Landing page, photo upload, checkout (no auth required)
- **Authenticated**: Customer orders page (requires login)
- **Admin**: Order management, customer management, pricing, etc. (requires admin role)

### Role Management
- Roles stored in Firestore `user_roles` collection
- Admin access controlled via Firestore security rules
- Role checking in route guards and components

## 🗄️ Database Structure (Firestore)

### Collections

#### `orders`
- Customer orders with photos, quantities, pricing
- Status tracking (pending, processing, completed, etc.)
- Payment information and transaction IDs

#### `user_roles`
- User authentication and authorization
- Admin flags and permissions
- User metadata

#### `admin_config`
- Application configuration
- Pricing settings
- Feature flags

#### `market_events`
- Active and past market events
- Event details, dates, locations
- Event-specific settings

#### `customers`
- Customer profiles
- Contact information
- Order history references

## 🌐 Environment Configuration

### Test Environment
- **Domain**: `test.lilmagnetmemories.com`
- **Firebase Project**: `lil-magnet-memories-test`
- **Environment Variables**: `VITE_FIREBASE_*_TEST`

### Production Environment
- **Domain**: `www.lilmagnetmemories.com` / `lilmagnetmemories.com`
- **Firebase Project**: `lil-magnet-memories`
- **Environment Variables**: `VITE_FIREBASE_*` (no _TEST suffix)

### Environment Detection
The app automatically detects the environment based on `window.location.hostname`:
- Test: `test.lilmagnetmemories.com` → uses `*_TEST` env vars
- Production: `www.lilmagnetmemories.com` or `lilmagnetmemories.com` → uses production env vars

## 🔧 Firebase Configuration

### Services Used
1. **Firestore**: Database for orders, users, events, config
2. **Storage**: Photo storage for customer uploads
3. **Authentication**: User authentication and authorization
4. **Cloud Functions**: Backend API endpoints (if used)

### Security Rules
- **Firestore Rules**: Located in `production-firestore-rules.txt` and `test-firestore-rules.txt`
- **Storage Rules**: Configured in Firebase Console
- **CORS**: Configured for Storage bucket access

### Known Issues
- **Production Firestore**: Has had "client is offline" issues (see `SYSTEM_ARCHITECTURE_DIAGRAM.md`)
- **Authentication**: Anonymous auth required for public access
- **CORS**: Storage CORS has been fixed, but Firestore doesn't use CORS

## 💳 Payment Integration

### Square API
- **Payment Processing**: Secure card payments
- **Apple Pay**: Native mobile payment support
- **Transaction Management**: Track and manage transactions
- **Error Handling**: Comprehensive error tracking

### Payment Flow
1. Customer adds items to cart
2. Proceeds to checkout
3. Enters payment information
4. Square processes payment
5. Order created in Firestore
6. Confirmation page displayed

## 📱 Mobile Optimization

- **Responsive Design**: Mobile-first approach with Quasar
- **Touch-Friendly**: Optimized for tablet use at farmers markets
- **Progressive Web App**: PWA capabilities via Quasar
- **Offline Support**: Firebase offline persistence (when configured)

## 🧪 Testing

### E2E Testing
- **Framework**: Playwright
- **Test Files**: Located in `tests/` directory
- **Test Runner**: Custom test runner page in app
- **Test Database**: Separate test database for E2E tests

### Test Scripts
- `npm run test` - Run Playwright tests
- `npm run test:e2e:headed` - Run with browser visible
- `npm run test:e2e:debug` - Debug mode
- `npm run test:server` - Start test server

## 🚀 Deployment

### Vercel Deployment
- **Platform**: Vercel
- **Build Command**: `npm run build`
- **Output Directory**: `dist/spa`
- **Environment Variables**: Configured in Vercel dashboard

### Deployment Scripts
- `deploy.sh` - Deployment script
- `vercel.json` - Vercel configuration

### Cloudflare Workers
- Apple Pay support via Cloudflare Workers
- Worker code in `cloudflare-worker-apple-pay.js`
- Deployment guide in `DEPLOY_CLOUDFLARE_WORKER.md`

## 📚 Key Documentation Files

### Setup & Configuration
- `FIREBASE_SETUP.md` - Firebase configuration guide
- `SQUARE_SETUP_INSTRUCTIONS.md` - Square payment setup
- `EMAIL_SETUP_GUIDE.md` - Email service configuration
- `GOOGLE_AUTH_SETUP.md` - Google OAuth setup

### Troubleshooting
- `FIREBASE_TROUBLESHOOTING.md` - Firebase issues and solutions
- `APPLE_PAY_TROUBLESHOOTING.md` - Apple Pay issues
- `FIRESTORE_TIMEOUT_DIAGNOSIS.md` - Firestore connection issues
- `SYSTEM_ARCHITECTURE_DIAGRAM.md` - Environment comparison

### Feature Documentation
- `PROJECT_SUMMARY.md` - High-level project overview
- `RECENT_UPDATES_SUMMARY.md` - Recent changes and improvements
- `NAVIGATION_CHANGES.md` - Navigation structure
- `BEFORE_AND_AFTER.md` - UI/UX improvements

## 🔄 Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Access at: `http://localhost:9000` (or configured port)

### Building for Production
1. Build: `npm run build`
2. Output: `dist/spa/` directory
3. Deploy to Vercel or other static host

### Code Quality
- **ESLint**: Configured via `.eslintrc.js`
- **Prettier**: Code formatting via `.prettierrc`
- **TypeScript**: Type checking for `.ts` files

## 🎨 UI/UX Design

### Design System
- **Framework**: Quasar Material Design components
- **Color Scheme**: Purple primary color (`text-purple`, `color="purple"`)
- **Layout**: Card-based design for consistency
- **Icons**: Material Icons and Ionicons

### Key Pages
- **Landing Page**: Hero section with easel image carousel, CTA buttons
- **Photo Upload**: Unified form for market events and online orders
- **Cart**: Shopping cart with item management
- **Checkout**: Payment processing with Square
- **Admin Dashboard**: Order management, customer management, pricing

## 🔍 Common Issues & Solutions

### Firestore "Client is Offline"
- **Symptom**: Production environment shows offline errors
- **Likely Causes**:
  - Anonymous authentication not enabled
  - Firestore security rules too restrictive
  - Environment variables misconfigured
- **See**: `SYSTEM_ARCHITECTURE_DIAGRAM.md` for detailed diagnosis

### CORS Issues
- **Storage**: CORS configured via Firebase Console
- **Firestore**: Doesn't use CORS (uses WebSocket/HTTP)
- **See**: `FIREBASE_STORAGE_CORS_FIX.md`

### Apple Pay Issues
- **Cache Issues**: See `APPLE_PAY_CACHE_FIX.md`
- **Troubleshooting**: See `APPLE_PAY_TROUBLESHOOTING.md`
- **Status**: See `APPLE_PAY_STATUS.md`

## 📝 Important Notes

1. **No CONTEXT.md existed**: This file was created to document project context
2. **Environment Detection**: Automatic based on hostname
3. **Anonymous Auth**: Required for public photo upload functionality
4. **Admin Access**: Controlled via Firestore `user_roles` collection
5. **Payment Processing**: Square API integration for secure payments
6. **Photo Storage**: Firebase Storage with CORS configured
7. **Order Management**: Full CRUD operations via admin interface

## 🔗 Related Projects

This project appears to be part of a larger workspace that includes:
- `spoileralert-unified/` - Related Spoiler Alert application
- `quasar-spoileralert/` - Another Quasar-based project
- `hapi-spoileralert/` - Backend API project

## 📞 Support & Resources

- **Firebase Console**: https://console.firebase.google.com/
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Square Dashboard**: https://squareup.com/dashboard
- **Quasar Documentation**: https://quasar.dev/

---

**Last Updated**: Generated from project analysis
**Project Status**: Active development
**Primary Use Case**: Farmers market photo magnet ordering system

