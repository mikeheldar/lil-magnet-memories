// Environment configuration for test vs production
const isTest = window.location.hostname === 'test.lilmagnetmemories.com';

export const config = {
  isTest,
  environment: isTest ? 'test' : 'production',
  
  // Firebase configuration - will use different projects for test vs production
  firebase: {
    // Use test Firebase config if on test domain
    apiKey: isTest ? import.meta.env.VITE_FIREBASE_API_KEY_TEST : import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: isTest ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_TEST : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: isTest ? import.meta.env.VITE_FIREBASE_PROJECT_ID_TEST : import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: isTest ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_TEST : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: isTest ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_TEST : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: isTest ? import.meta.env.VITE_FIREBASE_APP_ID_TEST : import.meta.env.VITE_FIREBASE_APP_ID,
  },
  
  // App configuration
  app: {
    name: isTest ? 'Lil Magnet Memories (TEST)' : 'Lil Magnet Memories',
    title: isTest ? 'Lil Magnet Memories - Test Environment' : 'Lil Magnet Memories',
    description: isTest ? 'Test environment for Lil Magnet Memories' : 'Photo upload form for Lil Magnet Memories custom magnets',
  },
  
  // Email configuration
  email: {
    from: isTest ? 'test@lilmagnetmemories.com' : 'lilmagnetmemories@gmail.com',
    admin: isTest ? 'test-admin@lilmagnetmemories.com' : 'lilmagnetmemories@gmail.com',
  }
};

export default config;
