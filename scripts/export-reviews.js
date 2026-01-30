#!/usr/bin/env node

/**
 * Export reviews from test Firebase project
 * Run with: PROJECT_ID=lil-magnet-memories-test node scripts/export-reviews.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Project ID - must be specified
const PROJECT_ID = process.env.PROJECT_ID || 'lil-magnet-memories';
const OUTPUT_FILE = process.env.OUTPUT_FILE || path.join(__dirname, 'reviews-backup.json');

console.log(`Exporting reviews from project: ${PROJECT_ID}`);

// Initialize Firebase Admin
function initAdmin() {
  const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH;
  
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID,
    });
  } else {
    console.log('Using default credentials (ensure you have run: gcloud auth application-default login)');
    return admin.initializeApp({
      projectId: PROJECT_ID,
    });
  }
}

const app = initAdmin();
const db = app.firestore();

async function exportReviews() {
  try {
    console.log('📥 Fetching reviews from Firestore...');
    
    const reviewsCollection = db.collection('reviews');
    const snapshot = await reviewsCollection.orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      console.log('⚠️  No reviews found in the database.');
      process.exit(0);
    }
    
    const reviews = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        customerName: data.customerName,
        reviewText: data.reviewText,
        rating: data.rating || 5,
        isVerified: data.isVerified !== undefined ? data.isVerified : true,
        profilePicture: data.profilePicture || null,
        email: data.email || null,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      });
    });
    
    console.log(`✅ Found ${reviews.length} review(s)`);
    
    // Write to JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(reviews, null, 2));
    console.log(`💾 Reviews exported to: ${OUTPUT_FILE}`);
    
    // Print summary
    console.log('\n📊 Export Summary:');
    reviews.forEach((review, index) => {
      console.log(`  ${index + 1}. ${review.customerName} - ${review.rating} stars`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error exporting reviews:', error);
    process.exit(1);
  }
}

exportReviews();
