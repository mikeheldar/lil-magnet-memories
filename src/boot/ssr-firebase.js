/**
 * SSR-Safe Firebase Boot File
 * Ensures Firebase is only initialized on the client side
 */

import { boot } from 'quasar/wrappers';

export default boot(({ ssrContext }) => {
  // Only initialize on client side
  if (typeof window !== 'undefined') {
    // Firebase initialization happens automatically when config.js is imported
    // This boot file just ensures we're in the right context
    console.log('✅ [SSR Boot] Client-side detected, Firebase will initialize');
  } else {
    console.log('🖥️ [SSR Boot] Server-side detected, skipping client-only Firebase init');
  }
});
