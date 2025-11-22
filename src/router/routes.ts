import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LandingPage.vue') },
      // Always use market event upload form; keep legacy /upload for compatibility
      { path: 'upload', redirect: '/market-event-upload' },
      { path: 'market-event-upload', component: () => import('pages/MarketEventUploadPage.vue') },
      { path: 'online-order', component: () => import('pages/OnlineOrderPage.vue') },
      { path: 'cart', component: () => import('pages/CartPage.vue') },
      { path: 'checkout', component: () => import('pages/CheckoutPage.vue') },
      { path: 'thank-you', component: () => import('pages/ThankYouPage.vue') },
      { path: 'about', component: () => import('pages/AboutPage.vue') },
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
        path: 'email-test',
        component: () => import('pages/EmailTestPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'market-events',
        component: () => import('pages/MarketEventsPage.vue'),
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
