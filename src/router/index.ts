import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { authService } from '../services/authService';

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
  Router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    const requiresAdmin = to.matched.some(
      (record) => record.meta.requiresAdmin
    );
    const isAuthenticated = authService.isAuthenticated();
    const isAdmin = authService.isAdmin();

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
