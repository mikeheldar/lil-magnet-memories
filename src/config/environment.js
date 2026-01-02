// Environment configuration for test vs production
// Use a getter function to avoid evaluating window during build time
const getIsTest = () => {
  try {
    return typeof window !== 'undefined' && window.location?.hostname === 'test.lilmagnetmemories.com';
  } catch {
    return false;
  }
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
