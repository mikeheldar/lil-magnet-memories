// src/boot/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'demo-api-key',
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN || 'spoileralert-firebase.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'spoileralert-firebase',
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET || 'spoileralert-firebase.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '65007432609',
  appId: process.env.FIREBASE_APP_ID || 'demo-app-id',
};

// Check if Firebase config is properly set
if (firebaseConfig.apiKey === 'demo-api-key') {
  console.warn(
    '⚠️ Firebase config not set. Please configure environment variables.'
  );
  console.log('📖 Create a .env file with your Firebase config');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;

