import { initializeApp } from 'firebase/app';
import { getFirestore, enableNetwork, disableNetwork, clearIndexedDbPersistence, waitForPendingWrites } from 'firebase/firestore';
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
// IMPORTANT: We're NOT enabling persistence to avoid offline mode issues
export const db = getFirestore(app);

// Track network initialization status
let networkInitialized = false;
let networkInitializingPromise = null;

// Initialize network connection - disable then enable to force online state
const initializeNetwork = async () => {
  if (networkInitialized) return;
  
  // If already initializing, return that promise
  if (networkInitializingPromise) {
    return networkInitializingPromise;
  }
  
  networkInitializingPromise = (async () => {
    try {
      // First, try to disable to reset any stuck offline state
      try {
        await disableNetwork(db);
        console.log('Network disabled (reset)');
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        // Ignore - might already be disabled or not initialized yet
        console.log('Network disable attempt:', e.message);
      }
      
      // Now enable network
      await enableNetwork(db);
      console.log('✅ Firestore network enabled');
      
      // Wait longer to ensure connection is established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify connection by attempting a simple operation
      // This helps ensure the connection is actually established
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const testRef = collection(db, '_test_connection');
        // This will fail if offline, but we just want to trigger connection attempt
        await Promise.race([
          getDocs(testRef),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]).catch(() => {
          // Expected to fail (collection doesn't exist), but connection attempt was made
          console.log('Connection test completed - network is active');
        });
      } catch (testError) {
        console.log('Connection test:', testError.message);
      }
      
      networkInitialized = true;
      networkInitializingPromise = null;
      console.log('✅ Network initialization complete');
    } catch (error) {
      console.error('❌ Failed to initialize network:', error);
      networkInitializingPromise = null;
      
      // Retry after delay
      setTimeout(() => {
        networkInitialized = false;
        initializeNetwork();
      }, 2000);
    }
  })();
  
  return networkInitializingPromise;
};

// Start network initialization immediately
initializeNetwork();

// Export function to ensure network is ready before operations
export const ensureNetworkReady = async () => {
  // Wait for initialization to complete
  let attempts = 0;
  while (!networkInitialized && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 200));
    attempts++;
  }
  
  if (!networkInitialized) {
    // Force initialization if not already started
    console.log('Network not initialized, forcing initialization...');
    await initializeNetwork();
  }
  
  // Additional wait to ensure connection is stable
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

// Helper function to retry Firestore operations when offline
export const retryOnOffline = async (operation, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Check if it's an offline error
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        console.warn(`Operation failed with offline error (attempt ${attempt + 1}/${maxRetries}):`, error.message);
        
        if (attempt < maxRetries - 1) {
          // Force network enable again
          try {
            await disableNetwork(db);
            await new Promise(resolve => setTimeout(resolve, 200));
            await enableNetwork(db);
            console.log('Network re-enabled after offline error');
            // Wait longer for connection to establish
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          } catch (networkError) {
            console.warn('Failed to re-enable network:', networkError);
          }
          
          // Continue to retry
          continue;
        }
      }
      
      // If not an offline error, or we've exhausted retries, throw
      throw error;
    }
  }
};

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
