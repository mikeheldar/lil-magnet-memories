import { initializeApp } from 'firebase/app';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { config } from '../config/environment.js';

// Firebase configuration - uses environment-specific config (with bucket normalization)
const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  // Respect the storageBucket provided by environment without normalization.
  // This allows using either `<project-id>.appspot.com` or `<project-id>.firebasestorage.app`
  // depending on how the Firebase project is provisioned.
  storageBucket: (config.firebase.storageBucket || '').trim(),
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Log which bucket is being used (for debugging test vs prod)
console.log('Firebase Storage Bucket:', firebaseConfig.storageBucket);
console.log('Firebase Project ID:', firebaseConfig.projectId);
console.log('Environment:', config.environment);
if (config.isTest && firebaseConfig.projectId !== 'lil-magnet-memories') {
  console.warn('⚠️ Test environment is using a different Firebase project:', firebaseConfig.projectId);
  console.warn('⚠️ Make sure this project exists and is configured, or set VITE_FIREBASE_PROJECT_ID_TEST=lil-magnet-memories to use the same project');
}

// Optionally initialize Firebase App Check (reCAPTCHA v3) when a site key is provided
const appCheckSiteKey = import.meta.env?.VITE_FIREBASE_APPCHECK_SITE_KEY;
if (appCheckSiteKey) {
  // Lazy-load to avoid bundling in environments where App Check isn't used
  import('firebase/app-check')
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(appCheckSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
        // eslint-disable-next-line no-console
        console.log('✅ App Check initialized (reCAPTCHA v3).');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('App Check initialization failed:', err);
      }
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load firebase/app-check module:', e);
    });
} else {
  // eslint-disable-next-line no-console
  console.log(
    'ℹ️ App Check not initialized. Set VITE_FIREBASE_APPCHECK_SITE_KEY to enable.'
  );
}

// Initialize Firestore (use default database - Firebase creates it automatically)
export const db = getFirestore(app);

// Create a promise that resolves when network is enabled
// This ensures Firestore is online before any operations
let networkEnabledPromise = null;

const ensureNetworkEnabled = async () => {
  if (networkEnabledPromise) {
    return networkEnabledPromise;
  }
  
  networkEnabledPromise = (async () => {
    try {
      await enableNetwork(db);
      console.log('✅ Firestore network enabled');
      return true;
    } catch (error) {
      console.warn('⚠️ Could not enable Firestore network:', error);
      // Try again after a short delay
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        await enableNetwork(db);
        console.log('✅ Firestore network enabled (retry)');
        return true;
      } catch (retryError) {
        console.error('❌ Failed to enable Firestore network after retry:', retryError);
        // Reset promise so we can try again
        networkEnabledPromise = null;
        return false;
      }
    }
  })();
  
  return networkEnabledPromise;
};

// Immediately try to enable network
ensureNetworkEnabled();

// Log connection status periodically (for debugging)
if (typeof window !== 'undefined') {
  // Check if we can access navigator.onLine
  const checkConnection = () => {
    console.log('Network status:', navigator.onLine ? 'online' : 'offline');
  };
  
  // Check immediately
  checkConnection();
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('🟢 Browser came online - re-enabling Firestore network');
    enableNetwork(db).catch(err => console.warn('Failed to enable network:', err));
    checkConnection();
  });
  
  window.addEventListener('offline', () => {
    console.log('🔴 Browser went offline');
    checkConnection();
  });
}

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
