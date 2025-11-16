import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { config } from '../config/environment.js';

// Normalize storageBucket to the form `<project-id>.appspot.com`
function normalizeStorageBucket(projectId, rawInput) {
  const pid = (projectId || '').trim();
  const raw = (rawInput || '').trim();
  if (!raw) return pid ? `${pid}.appspot.com` : raw;
  // Extract bare bucket if a URL or gs:// is provided
  let bucket = raw
    .replace(/^https?:\/\/firebasestorage\.googleapis\.com\/v0\/b\//, '')
    .replace(/^gs:\/\//, '')
    .replace(/\/.*/, '')
    .trim();
  if (bucket.endsWith('.appspot.com')) return bucket;
  if (bucket.includes('firebasestorage.app')) {
    return pid ? `${pid}.appspot.com` : bucket.replace('firebasestorage.app', 'appspot.com');
  }
  // Fallback: if it doesn't look like an appspot host, build from projectId
  return pid ? `${pid}.appspot.com` : bucket;
}

// Firebase configuration - uses environment-specific config (with bucket normalization)
const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: normalizeStorageBucket(
    config.firebase.projectId,
    config.firebase.storageBucket
  ),
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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

// Initialize Firestore with environment-specific database name
export const db = getFirestore(app, config.firebase.projectId);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
