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

    // Check for market event upload page - require checked-in event
    if (to.path === '/market-event-upload') {
      // Detect refresh: from.path is empty (hard refresh) or same as to.path (soft refresh)
      const isRefresh = !from.path || from.path === '' || from.path === to.path;
      
      // First, check cache synchronously (fast check)
      const cachedCheckedInEvent = marketEventService.getCheckedInEvent();
      
      // If cache has a checked-in event, allow navigation immediately
      // This handles refresh cases where cache is already populated
      if (cachedCheckedInEvent) {
        console.log('Route guard: Checked-in event found in cache, allowing navigation');
        next();
        return;
      }
      
      // If this is a refresh, always allow it - the real-time listener will populate cache
      // The page won't redirect aggressively, so user can stay on page
      if (isRefresh) {
        console.log('Route guard: Refresh detected, allowing navigation (real-time listener will update cache)');
        next();
        return;
      }
      
      // For new navigation (not refresh), check if there's a checked-in event
      try {
        // Wait for real-time listener to connect and populate cache (if not already)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check cache again (should be populated by now if listener is working)
        const quickCheck = marketEventService.getCheckedInEvent();
        if (quickCheck) {
          console.log('Route guard: Checked-in event found after wait, allowing navigation');
          next();
          return;
        }
        
        // If still not in cache, do async check (fallback)
        const checkedInEvent = await marketEventService.getCheckedInEventAsync();
        
        if (!checkedInEvent) {
          console.log('Route guard: No checked-in market event found, redirecting to landing page');
          next('/');
          return;
        }
        
        console.log('Route guard: Checked-in market event found via async check, allowing navigation');
      } catch (error) {
        console.error('Route guard: Error checking market event:', error);
        // On error for new navigation, redirect to be safe
        next('/');
        return;
      }
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
