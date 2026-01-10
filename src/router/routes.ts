import { RouteRecordRaw } from 'vue-router';

// Helper function to handle dynamic imports with retry on failure
const dynamicImportWithRetry = (importFn: () => Promise<any>, retries = 3): Promise<any> => {
  return importFn().catch((error) => {
    console.error('Failed to dynamically import module:', error);
    if (retries > 0) {
      console.log(`Retrying dynamic import (${retries} retries left)...`);
      // Wait a bit before retrying
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(dynamicImportWithRetry(importFn, retries - 1));
        }, 1000);
      });
    }
    // If all retries fail, try reloading the page to get fresh assets
    console.error('All retries failed, reloading page to fetch fresh assets...');
    window.location.reload();
    throw error;
  });
};

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => dynamicImportWithRetry(() => import('layouts/MainLayout.vue')),
    children: [
      { path: '', component: () => dynamicImportWithRetry(() => import('pages/LandingPage.vue')) },
      // Unified photo upload form - handles both market event and online orders
      { path: 'upload', redirect: '/photo-upload' },
      { path: 'market-event-upload', redirect: '/photo-upload' },
      { path: 'online-order', redirect: '/photo-upload' },
      {
        path: 'photo-upload',
        component: () => dynamicImportWithRetry(() => import('pages/PhotoUploadPage.vue')),
      },
      { path: 'cart', component: () => dynamicImportWithRetry(() => import('pages/CartPage.vue')) },
      { path: 'checkout', component: () => dynamicImportWithRetry(() => import('pages/CheckoutPage.vue')) },
      { path: 'thank-you', component: () => dynamicImportWithRetry(() => import('pages/ThankYouPage.vue')) },
      { path: 'about', component: () => dynamicImportWithRetry(() => import('pages/AboutPage.vue')) },
      {
        path: 'firebase-test',
        component: () => dynamicImportWithRetry(() => import('pages/FirebaseDiagnostic.vue')),
      },
      {
        path: 'firestore-debug',
        component: () => dynamicImportWithRetry(() => import('pages/FirestoreDebugPage.vue')),
      },
      {
        path: 'orders',
        component: () => dynamicImportWithRetry(() => import('pages/OrderList.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'print-template',
        name: 'print-template',
        component: () => dynamicImportWithRetry(() => import('pages/PrintTemplatePage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'photo-selector',
        component: () => dynamicImportWithRetry(() => import('pages/PhotoSelectorPage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'photo-management',
        component: () => dynamicImportWithRetry(() => import('pages/PhotoManagementPage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'customers',
        component: () => dynamicImportWithRetry(() => import('pages/CustomersPage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'my-orders',
        component: () => dynamicImportWithRetry(() => import('pages/CustomerOrdersPage.vue')),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin',
        component: () => dynamicImportWithRetry(() => import('pages/AdminPage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'email-test',
        component: () => dynamicImportWithRetry(() => import('pages/EmailTestPage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'market-events',
        component: () => dynamicImportWithRetry(() => import('pages/MarketEventsPage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'magnet-studio-select',
        component: () => dynamicImportWithRetry(() => import('pages/MagnetStudioSelectPage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'magnet-studio',
        component: () => dynamicImportWithRetry(() => import('pages/MagnetStudioPage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'pricing',
        component: () => dynamicImportWithRetry(() => import('pages/PricingPage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'errored-transactions',
        component: () => dynamicImportWithRetry(() => import('pages/ErroredTransactionsPage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'test-runner',
        component: () => dynamicImportWithRetry(() => import('pages/TestRunnerPage.vue')),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => dynamicImportWithRetry(() => import('pages/ErrorNotFound.vue')),
  },
];

export default routes;
