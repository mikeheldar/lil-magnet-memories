/**
 * GA4 boot — initializes gtag (no-op without VITE_GA_MEASUREMENT_ID)
 * and reports SPA page views on every route change.
 */

import { boot } from 'quasar/wrappers';
import { initAnalytics, trackPageView } from 'src/utils/analytics';

export default boot(({ router }) => {
  if (typeof window === 'undefined') return;
  initAnalytics();
  router.afterEach((to) => {
    // let the new page's meta/title settle before reporting
    setTimeout(() => trackPageView(to.fullPath), 0);
  });
});
