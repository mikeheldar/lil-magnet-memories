# System Architecture Diagram

## 🏗️ High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACES                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │
│  │   Mobile    │    │   Tablet    │    │   Desktop   │               │
│  │   Browser   │    │   Browser   │    │   Browser   │               │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘               │
│         │                   │                   │                      │
│         └───────────────────┼───────────────────┘                      │
│                            │                                           │
└────────────────────────────┼───────────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────▼───────────────────────────────────────────┐
│                         CDN / HOSTING                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │                    VERCEL EDGE NETWORK                       │    │
│   ├──────────────────────────────────────────────────────────────┤    │
│   │  Environment Detection:                                      │    │
│   │  • test.lilmagnetmemories.com  → Test Firebase Project       │    │
│   │  • www.lilmagnetmemories.com   → Production Firebase         │    │
│   │                                                              │    │
│   │  Static Assets:                                              │    │
│   │  • Vue 3 SPA (index.html, JS bundles, CSS)                  │    │
│   │  • Images, fonts, favicon                                    │    │
│   │  • Easel gallery photos                                      │    │
│   │                                                              │    │
│   │  Serverless Functions:                                       │    │
│   │  • /api/google-reviews (Google Places API proxy)            │    │
│   └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
┌────────────────────────────┐  ┌────────────────────────────┐
│    FIREBASE (TEST)          │  │  FIREBASE (PRODUCTION)      │
│  lil-magnet-memories-test  │  │  lil-magnet-memories       │
├────────────────────────────┤  ├────────────────────────────┤
│                            │  │                            │
│  🔥 Firestore Database     │  │  🔥 Firestore Database     │
│  Collections:              │  │  Collections:              │
│  • orders                  │  │  • orders                  │
│  • products                │  │  • products                │
│  • user_roles              │  │  • user_roles              │
│  • admin_config            │  │  • admin_config            │
│  • market_events           │  │  • market_events           │
│  • reviews                 │  │  • reviews                 │
│  • user_preferences        │  │  • user_preferences        │
│  • user_carts              │  │  • user_carts              │
│  • errored_transactions    │  │  • errored_transactions    │
│  • test_history            │  │  • test_history            │
│                            │  │                            │
│  💾 Firebase Storage       │  │  💾 Firebase Storage       │
│  Buckets:                  │  │  Buckets:                  │
│  • orders/ (photos)        │  │  • orders/ (photos)        │
│  • products/ (images)      │  │  • products/ (images)      │
│  • reviews/ (avatars)      │  │  • reviews/ (avatars)      │
│                            │  │                            │
│  🔐 Authentication         │  │  🔐 Authentication         │
│  • Google OAuth            │  │  • Google OAuth            │
│  • Anonymous Auth          │  │  • Anonymous Auth          │
│  • Email/Password          │  │  • Email/Password          │
│                            │  │                            │
│  ⚡ Cloud Functions        │  │  ⚡ Cloud Functions        │
│  • /api/send-order-email   │  │  • /api/send-order-email   │
│  • /api/send-status-update │  │  • /api/send-status-update │
│  • /api/send-contact-email │  │  • /api/send-contact-email │
│  • /api/payments/create    │  │  • /api/payments/create    │
│                            │  │                            │
└────────────┬───────────────┘  └────────────┬───────────────┘
             │                               │
             └───────────┬───────────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │   EXTERNAL SERVICES          │
          ├──────────────────────────────┤
          │                              │
          │  💳 Square Payments API      │
          │  • Card processing           │
          │  • Apple Pay                 │
          │  • Google Pay                │
          │                              │
          │  📧 Gmail (via Nodemailer)   │
          │  • Order confirmations       │
          │  • Status updates            │
          │  • Contact form emails       │
          │                              │
          │  🌐 Google Places API        │
          │  • Business reviews          │
          │  • Place details             │
          │                              │
          └──────────────────────────────┘
```

## 📱 Application Layer

```
┌────────────────────────────────────────────────────────────────────┐
│                        VUE 3 APPLICATION                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📄 Pages (37 total):                                              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ CUSTOMER PAGES:                                               │ │
│  │ • LandingPage.vue          - Homepage with products           │ │
│  │ • CustomProductsPage.vue   - Custom photo magnets             │ │
│  │ • DesignerProductsPage.vue - Designer magnets                 │ │
│  │ • SpecialtyProductsPage.vue- Specialty products               │ │
│  │ • ProductDetailPage.vue    - Single product view              │ │
│  │ • PhotoUploadPage.vue      - Upload photos for custom         │ │
│  │ • CartPage.vue             - Shopping cart                    │ │
│  │ • CheckoutPage.vue         - Payment & shipping               │ │
│  │ • ThankYouPage.vue         - Order confirmation               │ │
│  │ • CustomerOrdersPage.vue   - View own orders                  │ │
│  │ • EventCalendarPage.vue    - Upcoming market events           │ │
│  │ • CustomerReviewPage.vue   - Leave a review                   │ │
│  │ • AboutPage.vue            - About the business               │ │
│  │ • ContactUsPage.vue        - Contact form                     │ │
│  │ • FAQPage.vue              - Frequently asked questions       │ │
│  │                                                               │ │
│  │ ADMIN PAGES:                                                  │ │
│  │ • OrderList.vue            - All orders management            │ │
│  │ • CustomersPage.vue        - Customer list                    │ │
│  │ • MarketEventsPage.vue     - Market event CRUD                │ │
│  │ • PricingPage.vue          - Product & pricing management     │ │
│  │ • PhotoManagementPage.vue  - Delete photos/orders             │ │
│  │ • ReviewsManagementPage.vue- Approve/manage reviews           │ │
│  │ • MagnetStudioPage.vue     - Photo cropping tool              │ │
│  │ • MagnetStudioSelectPage.vue- Select photos to crop           │ │
│  │ • PrintTemplatePage.vue    - Generate print layouts           │ │
│  │ • PhotoSelectorPage.vue    - Select photos for printing       │ │
│  │ • AdminPage.vue            - Admin settings                   │ │
│  │ • ErroredTransactionsPage.vue- Failed payments/uploads        │ │
│  │ • FirebaseDiagnostic.vue   - Firebase testing                 │ │
│  │ • TestRunnerPage.vue       - Automated test suites            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  🧩 Services (9 total):                                            │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ • firebaseService.js       - All Firestore operations         │ │
│  │ • authService.js           - Authentication & admin checks    │ │
│  │ • marketEventService.js    - Market event state management    │ │
│  │ • googlePlacesService.js   - Fetch Google reviews             │ │
│  │ • userPreferencesService.js- User settings sync               │ │
│  │ • themeService.js          - UI theme management              │ │
│  │ • notificationService.js   - Toast notifications              │ │
│  │ • testGridService.js       - Test result grid display         │ │
│  │ • testHistoryService.js    - Test run history                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  🎣 Composables (3 total):                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ • useCart.js               - Cart state & operations          │ │
│  │ • useCustomerType.js       - Market vs online mode            │ │
│  │ • useProductTypeVisibility.js- Category visibility            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  🛠️ Utils:                                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ • googleReviews.js         - Google review URL helpers        │ │
│  │ • environment.js           - Detect test vs production        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagrams

### Customer Order Flow (Online)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browse  │ --> │  Cart   │ --> │Checkout │ --> │ Payment │ --> │  Email  │
│Products │     │         │     │         │     │         │     │Confirm  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
 Firestore      localStorage    Firestore       Square        Cloud Function
 products       + Firestore      orders         Payment          Email
                   sync         (pending)        API          (with photos)
                                                   │
                                                   ▼
                                              Update order
                                               (paid/failed)
```

### Market Event Order Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Check In│ --> │ Upload  │ --> │ Cart +  │ --> │Pay @    │ --> │ Email   │
│ to Event│     │ Photos  │     │Review   │     │ Event   │     │Confirm  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
 Toggle in      Firebase        Firestore        No payment    Cloud Function
  Firestore     Storage         orders           just "pay         Email
  user_prefs    + progress      (pickup)         at event"
                tracking                          status
```

### Admin Order Management Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  View   │ --> │ Update  │ --> │  Send   │ --> │Customer │
│ Orders  │     │ Status  │     │ Email   │     │Receives │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
 Firestore      Update order    Cloud Function    Email with
  orders         status field    status update     photos
  (query)       (in_progress,    email API         shown
                 completed)
```

## 🔐 Authentication & Authorization

```
┌────────────────────────────────────────────────────────────┐
│              AUTHENTICATION FLOW                            │
└────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │   Browser    │
     └──────┬───────┘
            │
            │ 1. Navigate to site
            ▼
     ┌──────────────┐
     │ Anonymous    │
     │ Auth         │ <-- Automatic for browsing
     └──────┬───────┘
            │
            │ 2. Click "Sign In"
            ▼
     ┌──────────────┐
     │ Google OAuth │
     │ Popup        │
     └──────┬───────┘
            │
            │ 3. Sign in with Google
            ▼
     ┌──────────────┐
     │ Authenticated│
     │ User         │
     └──────┬───────┘
            │
            │ 4. Check admin status
            ▼
     ┌──────────────────────────────────┐
     │ Query Firestore: user_roles      │
     │ WHERE email == user.email        │
     │                                  │
     │ If found → Admin = true          │
     │ If not   → Admin = false         │
     └──────────────────────────────────┘
```

### Admin Authorization

```
admin_config/settings
└── adminEmails: [
      "michael.helmandarley@gmail.com",
      "lilmagnetmemories@gmail.com",
      "amydanielleheldar@gmail.com"
    ]

↓ (checked on every auth state change)

authService.isAdmin() 
  → Check if user.email in adminEmails
  → Return true/false
  → Controls access to admin pages
```

## 📊 Firestore Data Model

```
Firebase Firestore
│
├── 📁 orders/
│   └── {orderId}
│       ├── orderNumber: "LMM-123456-7890"
│       ├── customerName: "John Doe"
│       ├── email: "john@example.com"
│       ├── phone: "555-1234"
│       ├── photos: [
│       │     {name, url, quantity, fileName}
│       │   ]
│       ├── cartItems: []
│       ├── totalMagnets: 12
│       ├── subtotal: 24.00
│       ├── shipping: 8.00
│       ├── tax: 2.56
│       ├── totalAmount: 34.56
│       ├── status: "new" | "in_progress" | "completed" | "cancelled"
│       ├── customerType: "online_customer" | "market_customer"
│       ├── shippingOption: {type, label, address}
│       ├── paymentOption: {type, billingAddress}
│       ├── photosAlreadyUploaded: true
│       └── timestamp: Timestamp
│
├── 📁 products/
│   └── {productId}
│       ├── name: "2x3 Magnet"
│       ├── description: "Custom 2x3 inch photo magnet"
│       ├── category: "custom" | "designer" | "specialty"
│       ├── pricingTiers: [
│       │     {minQty, maxQty, pricePerUnit}
│       │   ]
│       ├── testing: false
│       ├── visible: true
│       ├── imageUrl: "https://..."
│       └── updatedAt: Timestamp
│
├── 📁 user_roles/
│   └── {userId}
│       ├── email: "user@example.com"
│       ├── role: "admin" | "user"
│       └── createdAt: Timestamp
│
├── 📁 admin_config/
│   └── settings
│       ├── adminEmails: ["email1@...", "email2@..."]
│       └── updatedAt: Timestamp
│
├── 📁 market_events/
│   └── {eventId}
│       ├── name: "Dunwoody Farmers Market"
│       ├── location: "Brook Run Park"
│       ├── date: Timestamp
│       ├── startTime: "9:00 AM"
│       ├── endTime: "1:00 PM"
│       ├── status: "upcoming" | "live" | "completed"
│       ├── isLive: false
│       ├── checkedIn: false
│       ├── eventLink: "https://..."
│       └── createdAt: Timestamp
│
├── 📁 reviews/
│   └── {reviewId}
│       ├── customerName: "Jane Smith"
│       ├── reviewText: "Amazing magnets!"
│       ├── rating: 5
│       ├── verified: true
│       ├── displayOnSite: true
│       ├── profilePicUrl: "https://..."
│       └── createdAt: Timestamp
│
├── 📁 user_preferences/
│   └── {userId}
│       ├── customerType: "online_customer" | "market_customer"
│       ├── isAtEvent: false
│       └── updatedAt: Timestamp
│
├── 📁 user_carts/
│   └── {userId}
│       ├── items: []
│       ├── updatedAt: Timestamp
│       └── itemCount: 0
│
├── 📁 errored_transactions/
│   └── {transactionId}
│       ├── type: "payment" | "upload"
│       ├── error: "..."
│       ├── orderData: {...}
│       └── timestamp: Timestamp
│
└── 📁 test_history/
    └── {runId}
        ├── testSuite: "Order Flow"
        ├── results: [...]
        ├── passed: 8
        ├── failed: 2
        └── timestamp: Timestamp
```

## 🌐 API Endpoints

### Firebase Cloud Functions
```
https://us-central1-lil-magnet-memories.cloudfunctions.net/api/

├── POST /send-order-email
│   ├── Body: {firstName, lastName, email, orderNumber, photos, ...}
│   └── Returns: {success: true, messageId: "..."}
│
├── POST /send-status-update-email
│   ├── Body: {firstName, lastName, email, orderNumber, status, ...}
│   └── Returns: {success: true, messageId: "..."}
│
├── POST /send-contact-email
│   ├── Body: {name, email, subject, message}
│   └── Returns: {success: true, messageId: "..."}
│
└── POST /payments/create
    ├── Body: {sourceId, amount, orderNumber, buyerEmail, ...}
    └── Returns: {success: true, payment: {...}}
```

### Vercel Serverless Functions
```
https://www.lilmagnetmemories.com/api/

└── GET /google-reviews?placeId={placeId}
    ├── Proxies Google Places API (solves CORS)
    └── Returns: {status: "OK", result: {name, reviews: [...]}}
```

## 🔄 Real-time Updates

### Market Events
- Real-time listener on `market_events` collection
- Updates propagate to all clients instantly
- Triggers UI updates (banners, toggles, navigation)

### Shopping Cart
- Synced between localStorage and Firestore
- Real-time updates across devices for logged-in users
- Conflict resolution: Firestore takes precedence

### User Preferences
- Customer type (market vs online) synced in real-time
- Persists across sessions and devices

### Admin Views
- Order list updates automatically when new orders arrive
- Product visibility changes reflect immediately

## 🧪 Test vs Production Environments

```
┌─────────────────────────────────────────────────────────┐
│                 ENVIRONMENT DETECTION                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  const isTest = window.location.hostname                │
│                 .includes('test.lilmagnetmemories.com') │
│                                                          │
│  if (isTest) {                                          │
│    Use: VITE_FIREBASE_*_TEST env vars                   │
│    Project: lil-magnet-memories-test                    │
│    Display: "Test Environment" pill                     │
│  } else {                                               │
│    Use: VITE_FIREBASE_* env vars (no _TEST)            │
│    Project: lil-magnet-memories                         │
│    Display: Normal UI                                   │
│  }                                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 🎨 UI/UX Architecture

### Responsive Breakpoints
```
xs:  < 600px   (Mobile phones)
sm:  600-1024px (Tablets)
md:  1024-1440px (Small desktops)
lg:  1440-1920px (Large desktops)
xl:  > 1920px   (Extra large screens)
```

### Layout System
```
MainLayout.vue
├── Header
│   ├── Hamburger Menu (always visible)
│   ├── Logo (hidden < 800px)
│   ├── Title (always centered, responsive font)
│   ├── Shopping Cart Icon (if items > 0)
│   └── User Avatar / Sign In (right side)
├── Sub-Navigation Bar (medium+ screens only)
│   ├── Product Category Dropdowns
│   ├── Event Calendar Link
│   ├── About Link
│   └── Market Event Dropdown (if event live)
├── Page Content
│   └── <router-view />
└── Footer
    ├── Brand Column
    ├── Shop Column
    ├── Support Column
    └── Follow Us Column
```

### State Management
```
Vue 3 Composition API + Composables
│
├── Reactive State
│   ├── ref() - Simple reactive values
│   ├── reactive() - Complex reactive objects
│   └── computed() - Derived state
│
├── Composables (Shared State)
│   ├── useCart - Shopping cart across pages
│   ├── useCustomerType - Market vs online mode
│   └── useProductTypeVisibility - Category visibility
│
└── Services (Singletons)
    ├── marketEventService - Event listeners
    ├── authService - Auth state
    └── firebaseService - Database operations
```

## 📈 Performance Optimizations

### Frontend
- Code splitting by route
- Lazy loading of admin pages
- Image optimization (WebP conversion)
- Quasar tree-shaking
- Vite's optimized build

### Backend
- Firebase indexes for common queries
- Storage CORS configuration
- CDN for static assets
- Serverless functions for scalability

### Caching
- Google Reviews cached 1 hour
- Product data cached in memory
- Static assets cached by Vercel CDN

---

**Last Updated**: January 2025  
**Version**: 2.0  
**Status**: Production Ready 🚀
