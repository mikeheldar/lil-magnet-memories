import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDFIwa_pv5vne3-WJDzB0D4JVQBPzkv0IQ',
  authDomain: 'lil-magnet-memories.firebaseapp.com',
  projectId: 'lil-magnet-memories',
  storageBucket: 'lil-magnet-memories.firebasestorage.app',
  messagingSenderId: '849050019895',
  appId: '1:849050019895:web:4600965ea2f49a396877b2',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with explicit database name
export const db = getFirestore(app, 'lil-magnet-memories');

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
