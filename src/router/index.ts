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

  // Theme preload script already applied cached theme synchronously before Vue mounted
  // Now we just need to:
  // 1. Initialize default themes (background)
  // 2. Update from Firebase if different (non-blocking)
  // 3. Set up real-time listener for future changes

  // Initialize themes (don't wait, let it happen in background)
  // This ensures themes are created even if Firebase is slow
  initializeDefaultThemes()
    .then(() => {
      console.log('[Router] Default themes initialized');
      // Check if Firebase theme is different from cached (non-blocking)
      return themeService.getActiveTheme();
    })
    .then((firebaseTheme) => {
      if (firebaseTheme) {
        // Check if Firebase theme is different from what's currently applied
        const storedTheme = localStorage.getItem('activeTheme');
        if (storedTheme) {
          const cachedTheme = JSON.parse(storedTheme);
          if (cachedTheme.id !== firebaseTheme.id || cachedTheme.styles !== firebaseTheme.styles) {
            console.log(`[Router] Updating theme from Firebase: ${firebaseTheme.name}`);
            themeService.applyTheme(firebaseTheme);
          } else {
            console.log(`[Router] Theme already matches Firebase: ${firebaseTheme.name}`);
          }
        } else {
          // No cached theme, apply Firebase theme
          console.log(`[Router] Applying theme from Firebase: ${firebaseTheme.name}`);
          themeService.applyTheme(firebaseTheme);
        }
      } else {
        console.log('[Router] No active theme in Firebase, using cached/preload theme');
      }

      // Set up real-time listener for theme changes after initial load
      // This ensures all users see theme changes immediately when an admin changes them
      console.log('[Router] Setting up real-time theme change listener');
      themeService.setupActiveThemeListener();
    })
    .catch((error) => {
      console.error('[Router] Error initializing themes:', error);
      // Theme preload already applied cached theme, so we're good
      // Still try to set up listener for future changes
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
