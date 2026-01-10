#!/usr/bin/env node

/**
 * Script to seed initial customer reviews into Firebase Firestore
 * Run with: node scripts/seed-reviews.js
 * 
 * Set TEST_SERVICE_ACCOUNT_PATH environment variable to use service account,
 * or use default credentials (gcloud auth application-default login)
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Project ID - defaults to test, can be overridden with PROJECT_ID env var
const PROJECT_ID = process.env.PROJECT_ID || 'lil-magnet-memories-test';

// Initialize Firebase Admin
function initAdmin() {
  // Try to use service account if available
  const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || process.env.TEST_SERVICE_ACCOUNT_PATH;
  
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID,
    });
  } else {
    // Use default credentials (for local development with gcloud auth)
    console.log('Using default credentials (gcloud auth application-default login)');
    return admin.initializeApp({
      projectId: PROJECT_ID,
    });
  }
}

const app = initAdmin();
const db = app.firestore();

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
    const reviewsCollection = db.collection('reviews');
    const existingReviewsSnapshot = await reviewsCollection.get();
    
    if (existingReviewsSnapshot.size > 0) {
      console.log(`Found ${existingReviewsSnapshot.size} existing reviews. Checking for duplicates...`);
      
      // Check each review to see if it already exists
      for (const review of reviews) {
        const existingQuery = await reviewsCollection
          .where('customerName', '==', review.customerName)
          .where('reviewText', '==', review.reviewText)
          .get();
        
        if (existingQuery.size > 0) {
          console.log(`Review from ${review.customerName} already exists, skipping...`);
        } else {
          const docRef = await reviewsCollection.add({
            ...review,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`✅ Added review from ${review.customerName} with ID: ${docRef.id}`);
        }
      }
    } else {
      // No reviews exist, add all of them
      for (const review of reviews) {
        const docRef = await reviewsCollection.add({
          ...review,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Added review from ${review.customerName} with ID: ${docRef.id}`);
      }
    }

    console.log('✅ Reviews seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    process.exit(1);
  }
}

seedReviews();
