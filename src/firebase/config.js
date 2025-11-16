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

// Initialize Firestore with environment-specific database name
export const db = getFirestore(app, config.firebase.projectId);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
