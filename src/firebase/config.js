import { initializeApp } from 'firebase/app';
import { getFirestore, enableNetwork, disableNetwork, clearIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { config } from '../config/environment.js';

// Firebase configuration - uses environment-specific config (with bucket normalization)
// Lazy initialization to avoid accessing config during build time
let firebaseConfig = null;
let app = null;

const getFirebaseConfig = () => {
  if (!firebaseConfig) {
    firebaseConfig = {
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
  }
  return firebaseConfig;
};

const getApp = () => {
  // SSR Safety: Only initialize Firebase on client side
  if (typeof window === 'undefined') {
    console.log('🖥️ [Firebase] Server-side context detected, skipping Firebase initialization');
    return null;
  }
  
  if (!app) {
    const cfg = getFirebaseConfig();
    app = initializeApp(cfg);

// Log which bucket is being used (for debugging test vs prod)
    // Only log if window is available (runtime, not build time)
    if (typeof window !== 'undefined') {
      console.log('Firebase Storage Bucket:', cfg.storageBucket);
      console.log('Firebase Project ID:', cfg.projectId);
console.log('Environment:', config.environment);
      if (config.isTest && cfg.projectId !== 'lil-magnet-memories') {
        console.warn('⚠️ Test environment is using a different Firebase project:', cfg.projectId);
  console.warn('⚠️ Make sure this project exists and is configured, or set VITE_FIREBASE_PROJECT_ID_TEST=lil-magnet-memories to use the same project');
}
    }
  }
  return app;
};

// Optionally initialize Firebase App Check (reCAPTCHA v3) when a site key is provided
// Only initialize if window is available (runtime, not build time)
if (typeof window !== 'undefined') {
const appCheckSiteKey = import.meta.env?.VITE_FIREBASE_APPCHECK_SITE_KEY;
if (appCheckSiteKey) {
  // Lazy-load to avoid bundling in environments where App Check isn't used
  import('firebase/app-check')
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      try {
          initializeAppCheck(getApp(), {
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
}

// Initialize Firestore (use default database - Firebase creates it automatically)
// IMPORTANT: We're NOT enabling persistence to avoid offline mode issues
// Lazy initialization to avoid accessing config during build time
// SSR-Safe: Returns null on server, initializes on client
let dbInstance = null;
export const db = (() => {
  // SSR Safety: Don't initialize on server
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!dbInstance) {
    const firebaseApp = getApp();
    if (firebaseApp) {
      dbInstance = getFirestore(firebaseApp);
    }
  }
  return dbInstance;
})();

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
      // Try to clear persistence first (if possible) to reset any stuck state
      // This requires the database to not be in use, so we do it early
      try {
        // Note: clearIndexedDbPersistence requires all connections to be closed
        // We'll try it but it might fail if db is already in use
        await clearIndexedDbPersistence(db);
        console.log('✅ Cleared Firestore persistence');
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (persistenceError) {
        // Expected to fail if db is already in use - that's okay
        if (persistenceError.code !== 'failed-precondition') {
          console.log('Persistence clear attempt:', persistenceError.message);
        }
      }
      
      // Multiple disable/enable cycles to force reset
      for (let cycle = 0; cycle < 3; cycle++) {
        try {
          await disableNetwork(db);
          await new Promise(resolve => setTimeout(resolve, 300));
          await enableNetwork(db);
          await new Promise(resolve => setTimeout(resolve, 500));
          if (cycle === 0) {
            console.log('Network reset cycle', cycle + 1);
          }
        } catch (e) {
          // Ignore errors - might already be in desired state
        }
      }
      
      console.log('✅ Firestore network enabled');
      
      // Wait longer to ensure connection is established
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify connection by attempting to read from an existing collection
      // This actually tests if we can connect, not just trigger an attempt
      // Use a longer timeout since connection might be slow to establish
      try {
        const { collection, getDocs, query, limit } = await import('firebase/firestore');
        // Try to read from a collection that should exist (user_roles or admin_config)
        // This will succeed if online, fail if offline
        const testRef = collection(db, 'user_roles');
        const testQuery = query(testRef, limit(1));
        
        await Promise.race([
          getDocs(testQuery),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        
        console.log('✅ Connection verified - successfully read from Firestore');
      } catch (testError) {
        // If user_roles doesn't exist or times out, try admin_config
        try {
          const { collection, getDocs, query, limit } = await import('firebase/firestore');
          const testRef = collection(db, 'admin_config');
          const testQuery = query(testRef, limit(1));
          
          await Promise.race([
            getDocs(testQuery),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);
          
          console.log('✅ Connection verified - successfully read from Firestore');
        } catch (secondTestError) {
          // If both fail or timeout, it might be offline or connection is slow
          // But we'll still mark as initialized - the retry mechanism will handle it
          if (testError.message.includes('timeout') || secondTestError.message.includes('timeout')) {
            console.log('⏭️ Connection test timed out - will rely on retry mechanism');
          } else {
            console.warn('⚠️ Connection test inconclusive:', testError.message);
            console.log('⚠️ Will rely on retry mechanism for actual operations');
          }
        }
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
// Each attempt has its own timeout to detect hanging operations
export const retryOnOffline = async (operation, maxRetries = 5, perAttemptTimeout = 8000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wrap each attempt in its own timeout to detect hanging operations
      const attemptWithTimeout = Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Operation timeout after ${perAttemptTimeout}ms (attempt ${attempt + 1})`)), perAttemptTimeout)
        )
      ]);
      
      return await attemptWithTimeout;
    } catch (error) {
      // Check if it's an offline error OR a timeout (which indicates connection issues)
      const isOfflineError = error.code === 'unavailable' || error.message?.toLowerCase().includes('offline');
      const isTimeoutError = error.message?.toLowerCase().includes('timeout') || error.name === 'TimeoutError';
      
      if (isOfflineError || isTimeoutError) {
        const errorType = isTimeoutError ? 'timeout' : 'offline';
        console.warn(`⚠️ Operation failed with ${errorType} error (attempt ${attempt + 1}/${maxRetries}):`, error.message);
        
        if (attempt < maxRetries - 1) {
          // More aggressive network reset with multiple cycles
          try {
            console.log(`🔄 Resetting network connection (attempt ${attempt + 1})...`);
            
            // Try to clear persistence if possible (might fail if db is in use)
            try {
              await clearIndexedDbPersistence(db);
              console.log('✅ Cleared persistence during retry');
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (persistenceError) {
              // Expected to fail if db is in use - that's okay
            }
            
            // Multiple disable/enable cycles for more aggressive reset
            for (let cycle = 0; cycle < 2; cycle++) {
              await disableNetwork(db);
              await new Promise(resolve => setTimeout(resolve, 500));
              await enableNetwork(db);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            console.log('✅ Network re-enabled');
            
            // Wait longer for connection to establish (exponential backoff)
            const waitTime = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s, 16s
            console.log(`⏳ Waiting ${waitTime}ms for connection to stabilize...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Try to verify connection with a simple read (skip if it takes too long)
            // Don't block retries if verification is slow
            try {
              const { collection, getDocs, query, limit } = await import('firebase/firestore');
              const testRef = collection(db, 'user_roles');
              const testQuery = query(testRef, limit(1));
              await Promise.race([
                getDocs(testQuery),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
              ]);
              console.log('✅ Connection verified before retry');
            } catch (verifyError) {
              // Don't log timeout as warning - it's expected if connection is slow
              if (!verifyError.message.includes('timeout')) {
                console.warn('⚠️ Connection verification failed, but proceeding with retry:', verifyError.message);
              } else {
                console.log('⏭️ Skipping connection verification (timeout) - proceeding with retry');
              }
            }
          } catch (networkError) {
            console.warn('⚠️ Failed to reset network:', networkError);
          }
          
          // Continue to retry
          continue;
        }
      }
      
      // If not an offline/timeout error, throw immediately (don't retry)
      throw error;
    }
  }
  
  // If we get here, all retries failed
  throw new Error('Operation failed after all retries');
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

// Initialize Storage - lazy initialization using Proxy
// SSR-Safe: Returns dummy object on server
let storageInstance = null;
export const storage = new Proxy({}, {
  get(target, prop) {
    // SSR Safety: Return null/undefined for storage methods on server
    if (typeof window === 'undefined') {
      return () => null;
    }
    
    if (!storageInstance) {
      const firebaseApp = getApp();
      if (firebaseApp) {
        storageInstance = getStorage(firebaseApp);
      }
    }
    return storageInstance ? storageInstance[prop] : undefined;
  },
  getOwnPropertyDescriptor(target, prop) {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (!storageInstance) {
      const firebaseApp = getApp();
      if (firebaseApp) {
        storageInstance = getStorage(firebaseApp);
      }
    }
    return storageInstance ? Object.getOwnPropertyDescriptor(storageInstance, prop) : undefined;
  },
  ownKeys(target) {
    if (typeof window === 'undefined') {
      return [];
    }
    if (!storageInstance) {
      const firebaseApp = getApp();
      if (firebaseApp) {
        storageInstance = getStorage(firebaseApp);
      }
    }
    return storageInstance ? Object.keys(storageInstance) : [];
  }
});

// Initialize Auth - lazy initialization using Proxy
// Fixed to properly handle property descriptors and setters to avoid _canInitEmulator read-only error
// SSR-Safe: Returns dummy object on server
let authInstance = null;
export const auth = new Proxy({}, {
  get(target, prop) {
    // SSR Safety: Return null/dummy for auth on server
    if (typeof window === 'undefined') {
      if (prop === 'currentUser') return null;
      return () => null;
    }
    
    if (!authInstance) {
      const firebaseApp = getApp();
      if (firebaseApp) {
        authInstance = getAuth(firebaseApp);
      }
    }
    if (!authInstance) return undefined;
    
    const value = authInstance[prop];
    // If it's a function, bind it to the auth instance
    if (typeof value === 'function') {
      return value.bind(authInstance);
    }
    return value;
  },
  set(target, prop, value) {
    if (typeof window === 'undefined') {
      return true;
    }
    
    if (!authInstance) {
      const firebaseApp = getApp();
      if (firebaseApp) {
        authInstance = getAuth(firebaseApp);
      }
    }
    if (!authInstance) return false;
    
    // Check if property is read-only before trying to set it
    try {
      const descriptor = Object.getOwnPropertyDescriptor(authInstance, prop);
      // If property exists and is read-only, skip assignment (Firebase handles this internally)
      if (descriptor && !descriptor.writable && !descriptor.set) {
        return true; // Return true to indicate "success" even though we didn't set it
      }
      // Allow setting properties on the actual auth instance
      authInstance[prop] = value;
      return true;
    } catch (error) {
      // If setting fails (e.g., read-only property), just return true
      // Firebase will handle the property internally
      return true;
    }
  },
  getOwnPropertyDescriptor(target, prop) {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (!authInstance) {
      const firebaseApp = getApp();
      if (firebaseApp) {
        authInstance = getAuth(firebaseApp);
      }
    }
    return authInstance ? Object.getOwnPropertyDescriptor(authInstance, prop) : undefined;
  },
  ownKeys(target) {
    if (typeof window === 'undefined') {
      return [];
    }
    if (!authInstance) {
      const firebaseApp = getApp();
      if (firebaseApp) {
        authInstance = getAuth(firebaseApp);
      }
    }
    return authInstance ? Object.keys(authInstance) : [];
  },
  has(target, prop) {
    if (typeof window === 'undefined') {
      return false;
    }
    if (!authInstance) {
      const firebaseApp = getApp();
      if (firebaseApp) {
        authInstance = getAuth(firebaseApp);
      }
    }
    return authInstance ? (prop in authInstance) : false;
  },
  defineProperty(target, prop, descriptor) {
    if (typeof window === 'undefined') {
      return true;
    }
    if (!authInstance) {
      const firebaseApp = getApp();
      if (firebaseApp) {
        authInstance = getAuth(firebaseApp);
      }
    }
    if (!authInstance) return false;
    
    // Check if property is read-only before trying to define it
    try {
      const existingDescriptor = Object.getOwnPropertyDescriptor(authInstance, prop);
      // If property exists and is read-only, skip redefinition
      if (existingDescriptor && !existingDescriptor.writable && !existingDescriptor.set) {
        return true; // Return true to indicate "success"
      }
      return Object.defineProperty(authInstance, prop, descriptor);
    } catch (error) {
      // If defineProperty fails (e.g., read-only property), return true
      // Firebase will handle the property internally
      return true;
    }
  }
});

// Export app getter function
export { getApp as default };
