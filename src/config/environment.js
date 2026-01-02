// Environment configuration for test vs production
// Check environment variable first (available at build time), then fall back to window check at runtime
const getIsTest = () => {
  // First check if there's an environment variable set (for build time)
  if (import.meta.env.VITE_IS_TEST_ENVIRONMENT === 'true') {
    return true;
  }
  if (import.meta.env.VITE_IS_TEST_ENVIRONMENT === 'false') {
    return false;
  }
  // At runtime, check window location (only if window is available)
  try {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return window.location.hostname === 'test.lilmagnetmemories.com';
    }
  } catch {
    // Silently fail if window is not available
  }
  // Default to false if we can't determine
  return false;
};

export const config = {
  get isTest() {
    return getIsTest();
  },
  get environment() {
    return getIsTest() ? 'test' : 'production';
  },

  // Firebase configuration - will use different projects for test vs production
  get firebase() {
    const test = getIsTest();
    return {
      // Use test Firebase config if on test domain
      apiKey: test ? import.meta.env.VITE_FIREBASE_API_KEY_TEST : import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: test ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_TEST : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: test ? import.meta.env.VITE_FIREBASE_PROJECT_ID_TEST : import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: test ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_TEST : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: test ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_TEST : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: test ? import.meta.env.VITE_FIREBASE_APP_ID_TEST : import.meta.env.VITE_FIREBASE_APP_ID,
    };
  },

  // App configuration
  get app() {
    const test = getIsTest();
    return {
      name: test ? 'Lil Magnet Memories (TEST)' : 'Lil Magnet Memories',
      title: test ? 'Lil Magnet Memories - Test Environment' : 'Lil Magnet Memories',
      description: test ? 'Test environment for Lil Magnet Memories' : 'Photo upload form for Lil Magnet Memories custom magnets',
    };
  },

  // Email configuration
  get email() {
    const test = getIsTest();
    return {
      from: test ? 'test@lilmagnetmemories.com' : 'lilmagnetmemories@gmail.com',
      admin: test ? 'test-admin@lilmagnetmemories.com' : 'lilmagnetmemories@gmail.com',
    };
  }
};

export default config;
