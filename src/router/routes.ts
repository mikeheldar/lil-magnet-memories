import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LandingPage.vue') },
      {
        path: 'at-market',
        redirect: { path: '/', query: { atMarket: '1' } },
      },
      // Unified photo upload form - handles both market event and online orders
      { path: 'upload', redirect: '/photo-upload' },
      { path: 'market-event-upload', redirect: '/photo-upload' },
      { path: 'online-order', redirect: '/photo-upload' },
      {
        path: 'photo-upload',
        name: 'photo-upload',
        component: () => import('pages/PhotoUploadPage.vue'),
      },
      {
        path: 'photo-upload-market',
        name: 'photo-upload-market',
        component: () => import('pages/PhotoUploadPage.vue'),
      },
      { path: 'cart', component: () => import('pages/CartPage.vue') },
      { path: 'checkout', component: () => import('pages/CheckoutPage.vue') },
      { path: 'thank-you', component: () => import('pages/ThankYouPage.vue') },
      { path: 'about', component: () => import('pages/AboutPage.vue') },
      {
        path: 'products/custom',
        component: () => import('pages/CustomProductsPage.vue'),
      },
      {
        path: 'products/novelty',
        name: 'products-novelty',
        component: () => import('pages/DesignerProductsPage.vue'),
      },
      {
        path: 'products/designer',
        redirect: '/products/novelty',
      },
      {
        path: 'product/designer/:productId',
        redirect: (to) => `/product/novelty/${to.params.productId}`,
      },
      {
        path: 'products/specialty',
        component: () => import('pages/SpecialtyProductsPage.vue'),
      },
      {
        path: 'product/:productType/:productId',
        component: () => import('pages/ProductDetailPage.vue'),
      },
      {
        path: 'contact-us',
        component: () => import('pages/ContactUsPage.vue'),
      },
      {
        path: 'shipping-info',
        component: () => import('pages/ShippingInfoPage.vue'),
      },
      {
        path: 'returns',
        component: () => import('pages/ReturnsPage.vue'),
      },
      {
        path: 'faq',
        component: () => import('pages/FAQPage.vue'),
      },
      {
        path: 'event-calendar',
        component: () => import('pages/EventCalendarPage.vue'),
      },
      {
        path: 'blog',
        component: () => import('pages/BlogPage.vue'),
      },
      {
        path: 'blog/:slug',
        component: () => import('pages/BlogPostPage.vue'),
      },
      {
        path: 'newsletter-signup',
        component: () => import('pages/NewsletterSignupPage.vue'),
      },
      {
        path: 'reviews-management',
        component: () => import('pages/ReviewsManagementPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'leave-review',
        component: () => import('pages/CustomerReviewPage.vue'),
      },
      {
        path: 'firebase-test',
        component: () => import('pages/FirebaseDiagnostic.vue'),
      },
      {
        path: 'firestore-debug',
        component: () => import('pages/FirestoreDebugPage.vue'),
      },
      {
        path: 'orders',
        component: () => import('pages/OrderList.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'print-template',
        name: 'print-template',
        component: () => import('pages/PrintTemplatePage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'photo-selector',
        component: () => import('pages/PhotoSelectorPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'photo-management',
        component: () => import('pages/PhotoManagementPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'customers',
        component: () => import('pages/CustomersPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'my-orders',
        component: () => import('pages/CustomerOrdersPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin',
        component: () => import('pages/AdminPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'admin/blog',
        component: () => import('pages/AdminBlogPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'admin/newsletter',
        component: () => import('pages/AdminNewsletterPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'admin/sales',
        component: () => import('pages/AdminSalesPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'email-test',
        component: () => import('pages/EmailTestPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'frame-library',
        component: () => import('pages/FrameLibraryPage.vue'),
        meta: { requiresAuth: true, requiresOperator: true },
      },
      {
        path: 'market-events',
        component: () => import('pages/MarketEventsPage.vue'),
        meta: { requiresAuth: true, requiresOperator: true },
      },
      {
        path: 'magnet-studio-select',
        component: () => import('pages/MagnetStudioSelectPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'magnet-studio',
        component: () => import('pages/MagnetStudioPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'pricing',
        component: () => import('pages/PricingPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'errored-transactions',
        component: () => import('pages/ErroredTransactionsPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'test-runner',
        component: () => import('pages/TestRunnerPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
