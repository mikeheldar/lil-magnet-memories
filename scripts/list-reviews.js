#!/usr/bin/env node

/**
 * List all reviews from Firebase
 * Usage: node scripts/list-reviews.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('Connecting to Firebase project:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listReviews() {
  try {
    console.log('\n📋 Fetching reviews from Firebase...\n');
    
    const reviewsCollection = collection(db, 'reviews');
    const q = query(reviewsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No reviews found.');
      return;
    }
    
    const reviews = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      });
    });
    
    console.log(`Found ${reviews.length} review(s):\n`);
    
    reviews.forEach((review, index) => {
      console.log(`${index + 1}. ${review.customerName} - ${review.rating || 5} stars`);
      console.log(`   "${review.reviewText}"`);
      console.log(`   Created: ${review.createdAt}`);
      console.log(`   ID: ${review.id}`);
      console.log('');
    });
    
    // Export to JSON file
    const fs = await import('fs');
    const exportPath = join(__dirname, 'reviews-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(reviews, null, 2));
    console.log(`✅ Reviews exported to: ${exportPath}\n`);
    
  } catch (error) {
    console.error('Error fetching reviews:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

listReviews();
