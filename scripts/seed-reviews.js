/**
 * Script to seed initial customer reviews into Firebase Firestore
 * Run with: node scripts/seed-reviews.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { config } from '../src/config/environment.js';

const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const reviews = [
  {
    customerName: 'Jodi',
    reviewText: 'Lil magnets was the best find of the holiday season!!! I had a bunch made for each family member and they were the biggest hit!!! Looking forward to having them made as save the date for my daughter\'s wedding!! Thanks for all you do!',
    rating: 5,
    isVerified: true,
  },
  {
    customerName: 'Miriam',
    reviewText: 'Love my magnets! They are the best quality photo magnets I have ever had! The picture quality is fantastic! I gave some as gifts to my family capturing special moments. I highly recommend these magnets, and there is a very quick turn around too.',
    rating: 5,
    isVerified: true,
  },
  {
    customerName: 'Shawn',
    reviewText: 'Li\'l Magnet Memories are GREAT! I ordered them to give as gifts and they were already so quickly- so professionally made! It\'s fun to have a memory to look back at and share with loved ones! Highly recommend!!',
    rating: 5,
    isVerified: true,
  },
];

async function seedReviews() {
  try {
    console.log('Starting to seed reviews...');

    // Check if reviews already exist
    const reviewsCollection = collection(db, 'reviews');
    const existingReviews = await getDocs(reviewsCollection);
    
    if (existingReviews.size > 0) {
      console.log(`Found ${existingReviews.size} existing reviews. Checking for duplicates...`);
      
      // Check each review to see if it already exists
      for (const review of reviews) {
        const existingQuery = query(
          reviewsCollection,
          where('customerName', '==', review.customerName),
          where('reviewText', '==', review.reviewText)
        );
        const existing = await getDocs(existingQuery);
        
        if (existing.size > 0) {
          console.log(`Review from ${review.customerName} already exists, skipping...`);
        } else {
          const docRef = await addDoc(reviewsCollection, {
            ...review,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log(`Added review from ${review.customerName} with ID: ${docRef.id}`);
        }
      }
    } else {
      // No reviews exist, add all of them
      for (const review of reviews) {
        const docRef = await addDoc(reviewsCollection, {
          ...review,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log(`Added review from ${review.customerName} with ID: ${docRef.id}`);
      }
    }

    console.log('Reviews seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding reviews:', error);
    process.exit(1);
  }
}

seedReviews();
