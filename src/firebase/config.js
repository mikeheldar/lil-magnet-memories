import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
let initializeAppCheckFn = null;
try {
  // Dynamically require to avoid bundling if unused and to prevent SSR import issues.
  const appCheckModule = require('firebase/app-check');
  initializeAppCheckFn = appCheckModule.initializeAppCheck;
  var ReCaptchaV3Provider = appCheckModule.ReCaptchaV3Provider;
} catch (_) {
  // App Check not installed; that's fine unless enforcement is enabled
}
import { config } from '../config/environment.js';

// Firebase configuration - uses environment-specific config
// Some environments may mistakenly provide the download domain (`firebasestorage.app`)
// as the storageBucket. The Web SDK requires the bucket in the form `<project-id>.appspot.com`.
const resolveStorageBucket = () => {
  const raw = (config.firebase.storageBucket || '').trim();
  if (!raw) return undefined;
  if (raw.endsWith('firebasestorage.app')) {
    // Convert to the proper bucket host
    return `${config.firebase.projectId}.appspot.com`;
  }
  return raw;
};

const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: resolveStorageBucket(),
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check if a site key is provided via env
const appCheckSiteKey =
  import.meta?.env?.VITE_FIREBASE_APPCHECK_SITE_KEY ||
  process?.env?.VITE_FIREBASE_APPCHECK_SITE_KEY;
if (initializeAppCheckFn && appCheckSiteKey) {
  try {
    initializeAppCheckFn(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    // eslint-disable-next-line no-console
    console.log('✅ Firebase App Check initialized (reCAPTCHA v3).');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize App Check:', err);
  }
} else {
  // eslint-disable-next-line no-console
  console.log(
    'ℹ️ App Check not initialized (no site key provided). ' +
      'If App Check is enforced on Storage/Firestore, set VITE_FIREBASE_APPCHECK_SITE_KEY.'
  );
}

// Initialize Firestore with environment-specific database name
export const db = getFirestore(app, config.firebase.projectId);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
