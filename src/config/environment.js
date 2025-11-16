// Environment configuration for test vs production
const isTest = window.location.hostname === 'test.lilmagnetmemories.com';

// Helper: safe read from Vite env
const env = import.meta.env || {};

// Base PROD values
const PROD = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// TEST values with resilient fallbacks to avoid accidentally using PROD in test
const deriveTest = () => {
  // Prefer explicit TEST vars
  let projectId =
    env.VITE_FIREBASE_PROJECT_ID_TEST ||
    (PROD.projectId ? `${PROD.projectId}-test` : 'lil-magnet-memories-test');

  // Build reasonable defaults if missing
  const authDomain =
    env.VITE_FIREBASE_AUTH_DOMAIN_TEST || `${projectId}.firebaseapp.com`;

  // Always normalize storage bucket to <projectId>.appspot.com for SDK uploads
  const storageBucket =
    env.VITE_FIREBASE_STORAGE_BUCKET_TEST || `${projectId}.appspot.com`;

  return {
    apiKey: env.VITE_FIREBASE_API_KEY_TEST || PROD.apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId:
      env.VITE_FIREBASE_MESSAGING_SENDER_ID_TEST || PROD.messagingSenderId,
    appId: env.VITE_FIREBASE_APP_ID_TEST || PROD.appId,
  };
};

const FIREBASE = isTest ? deriveTest() : PROD;

export const config = {
  isTest,
  environment: isTest ? 'test' : 'production',

  // Firebase configuration - selected per environment with safe fallbacks
  firebase: FIREBASE,

  // App configuration
  app: {
    name: isTest ? 'Lil Magnet Memories (TEST)' : 'Lil Magnet Memories',
    title: isTest ? 'Lil Magnet Memories - Test Environment' : 'Lil Magnet Memories',
    description: isTest
      ? 'Test environment for Lil Magnet Memories'
      : 'Photo upload form for Lil Magnet Memories custom magnets',
  },

  // Email configuration
  email: {
    from: isTest ? 'test@lilmagnetmemories.com' : 'lilmagnetmemories@gmail.com',
    admin: isTest ? 'test-admin@lilmagnetmemories.com' : 'lilmagnetmemories@gmail.com',
  },
};

export default config;
