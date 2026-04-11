import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { authService } from '../services/authService';
import { useProductTypeVisibility } from '../composables/useProductTypeVisibility.js';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
    ? createWebHistory
    : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Initialize auth service
  authService.init();

  // Initialize product type visibility settings early to prevent menu flash
  // Note: This is fire-and-forget - MainLayout will await it in onMounted
  // Starting it early helps reduce load time, but we don't block router initialization
  const { initializeVisibility } = useProductTypeVisibility();
  initializeVisibility().catch(err => {
    console.error('Error initializing visibility in router:', err);
  });

  // Add authentication and admin guards
  Router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    const requiresAdmin = to.matched.some(
      (record) => record.meta.requiresAdmin
    );
    const isAuthenticated = authService.isAuthenticated();

    // Use async admin check for better accuracy, but fallback to sync if needed
    let isAdmin = authService.isAdmin(); // Quick sync check first
    if (requiresAdmin && !isAdmin) {
      // If sync check says not admin but route requires admin, do async check
      try {
        isAdmin = await authService.isAdminAsync();
      } catch (error) {
        console.error('Error in async admin check, using sync result:', error);
      }
    }

    // Photo upload page - always allow navigation (handles both market events and online orders)
    // The page itself adapts based on market event status, so no need to block navigation
    if (to.path === '/photo-upload' || to.path === '/photo-upload-market') {
      console.log('Route guard: Allowing navigation to photo upload page');
      next();
      return;
    }

    console.log('Route guard:', {
      to: to.path,
      from: from.path,
      requiresAuth,
      requiresAdmin,
      isAuthenticated,
      isAdmin,
    });

    if (requiresAuth && !isAuthenticated) {
      // Redirect to landing page if trying to access protected route without auth
      console.log('Redirecting to home page - not authenticated');
      next('/');
    } else if (requiresAdmin && !isAdmin) {
      // Redirect to orders page if trying to access admin route without admin privileges
      console.log('Redirecting to orders page - not admin');
      next('/orders');
    } else {
      console.log('Route guard: allowing navigation');
      next();
    }
  });

  return Router;
});
