import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { authService } from '../services/authService';
import { marketEventService } from '../services/marketEventService';
import { themeService, initializeDefaultThemes } from '../services/themeService';

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

  // Initialize themes (don't wait, let it happen in background)
  // This ensures themes are created even if Firebase is slow
  initializeDefaultThemes()
    .then(() => {
      console.log('[Router] Default themes initialized, applying active theme');
      return themeService.initializeTheme();
    })
    .then((theme) => {
      if (theme) {
        console.log(`[Router] Theme initialized: ${theme.name}`);
      } else {
        console.log('[Router] No theme found, using fallback');
      }
      
      // Set up real-time listener for theme changes after initial load
      // This ensures all users see theme changes immediately when an admin changes them
      console.log('[Router] Setting up real-time theme change listener');
      themeService.setupActiveThemeListener();
    })
    .catch((error) => {
      console.error('[Router] Error initializing themes:', error);
      // Still try to apply cached theme
      themeService.initializeTheme().catch((initError) => {
        console.error('[Router] Error applying cached theme:', initError);
      });
      
      // Still try to set up listener even if initialization failed
      try {
        themeService.setupActiveThemeListener();
      } catch (listenerError) {
        console.error('[Router] Error setting up theme listener:', listenerError);
      }
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
    if (to.path === '/photo-upload') {
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
