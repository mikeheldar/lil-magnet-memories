import { initializeApp } from 'firebase/app';
import { getFirestore, enableNetwork, disableNetwork, clearIndexedDbPersistence } from 'firebase/firestore';
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

// Force Firestore to be online - enable network immediately
// This prevents "client is offline" errors
// If persistence is causing issues, we'll try to clear it first
(async () => {
  try {
    // First, try to enable network
    await enableNetwork(db);
    console.log('✅ Firestore network enabled');
  } catch (error) {
    console.warn('⚠️ Could not enable Firestore network:', error);
    // If enabling network fails, it might be due to persistence issues
    // Try clearing persistence and then enabling network
    if (error.code === 'failed-precondition') {
      try {
        console.log('Attempting to clear Firestore persistence...');
        await clearIndexedDbPersistence(db);
        console.log('✅ Cleared Firestore persistence');
        // Try enabling network again after clearing persistence
        await enableNetwork(db);
        console.log('✅ Firestore network enabled after clearing persistence');
      } catch (clearError) {
        console.warn('⚠️ Could not clear persistence (may require page reload):', clearError);
        // Try enabling network anyway
        setTimeout(async () => {
          try {
            await enableNetwork(db);
            console.log('✅ Firestore network enabled (delayed retry)');
          } catch (retryError) {
            console.error('❌ Failed to enable Firestore network after all retries:', retryError);
          }
        }, 1000);
      }
    } else {
      // For other errors, just retry after a delay
      setTimeout(async () => {
        try {
          await enableNetwork(db);
          console.log('✅ Firestore network enabled (retry)');
        } catch (retryError) {
          console.error('❌ Failed to enable Firestore network after retry:', retryError);
        }
      }, 1000);
    }
  }
})();

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
