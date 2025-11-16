import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
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

// Initialize Firestore with environment-specific database name
export const db = getFirestore(app, config.firebase.projectId);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
