#!/usr/bin/env node

/**
 * Import reviews to Firebase project
 * Run with: PROJECT_ID=lil-magnet-memories node scripts/import-reviews.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Project ID - must be specified
const PROJECT_ID = process.env.PROJECT_ID || 'lil-magnet-memories';
const INPUT_FILE = process.env.INPUT_FILE || path.join(__dirname, 'reviews-backup.json');

console.log(`Importing reviews to project: ${PROJECT_ID}`);

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

async function importReviews() {
  try {
    // Read reviews from JSON file
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`❌ Input file not found: ${INPUT_FILE}`);
      console.log('Run export-reviews.js first to create the backup file.');
      process.exit(1);
    }
    
    const reviewsData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    
    if (!Array.isArray(reviewsData) || reviewsData.length === 0) {
      console.log('⚠️  No reviews to import.');
      process.exit(0);
    }
    
    console.log(`📥 Found ${reviewsData.length} review(s) to import`);
    
    const reviewsCollection = db.collection('reviews');
    
    let imported = 0;
    let skipped = 0;
    
    // Import each review
    for (const review of reviewsData) {
      try {
        // Check if review already exists (by customerName and reviewText)
        const existingQuery = await reviewsCollection
          .where('customerName', '==', review.customerName)
          .where('reviewText', '==', review.reviewText)
          .get();
        
        if (!existingQuery.empty) {
          console.log(`⏭️  Review from ${review.customerName} already exists, skipping...`);
          skipped++;
          continue;
        }
        
        // Prepare review data
        const reviewData = {
          customerName: review.customerName,
          reviewText: review.reviewText,
          rating: review.rating || 5,
          isVerified: review.isVerified !== undefined ? review.isVerified : true,
          profilePicture: review.profilePicture || null,
          email: review.email || null,
          createdAt: admin.firestore.Timestamp.fromDate(new Date(review.createdAt)),
          updatedAt: admin.firestore.Timestamp.fromDate(new Date(review.updatedAt)),
        };
        
        // Add to Firestore
        await reviewsCollection.add(reviewData);
        console.log(`✅ Imported review from ${review.customerName}`);
        imported++;
        
      } catch (error) {
        console.error(`❌ Error importing review from ${review.customerName}:`, error.message);
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`  ✅ Imported: ${imported}`);
    console.log(`  ⏭️  Skipped (duplicates): ${skipped}`);
    console.log(`  📋 Total in file: ${reviewsData.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing reviews:', error);
    process.exit(1);
  }
}

importReviews();
