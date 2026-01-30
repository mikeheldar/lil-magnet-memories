#!/usr/bin/env node

/**
 * Copy reviews from test project to prod project
 * This script connects to both projects and copies reviews
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Initialize two separate apps - one for test, one for prod
console.log('Initializing Firebase Admin for both projects...\n');

// Test app
const testApp = admin.initializeApp({
  projectId: 'lil-magnet-memories-test',
}, 'test');
const testDb = testApp.firestore();

// Prod app
const prodApp = admin.initializeApp({
  projectId: 'lil-magnet-memories',
}, 'prod');
const prodDb = prodApp.firestore();

async function copyReviews() {
  try {
    console.log('📥 Fetching reviews from TEST project (lil-magnet-memories-test)...');
    
    const testReviewsCollection = testDb.collection('reviews');
    const testSnapshot = await testReviewsCollection.orderBy('createdAt', 'desc').get();
    
    if (testSnapshot.empty) {
      console.log('⚠️  No reviews found in test project.');
      process.exit(0);
    }
    
    const reviews = [];
    testSnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        customerName: data.customerName,
        reviewText: data.reviewText,
        rating: data.rating || 5,
        isVerified: data.isVerified !== undefined ? data.isVerified : true,
        profilePicture: data.profilePicture || null,
        email: data.email || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
    
    console.log(`✅ Found ${reviews.length} review(s) in test project\n`);
    
    // Print reviews
    console.log('📋 Reviews to copy:');
    reviews.forEach((review, index) => {
      console.log(`  ${index + 1}. ${review.customerName} - ${review.rating} stars`);
      console.log(`     "${review.reviewText.substring(0, 80)}..."`);
    });
    console.log('');
    
    // Now copy to prod
    console.log('📤 Copying reviews to PROD project (lil-magnet-memories)...\n');
    
    const prodReviewsCollection = prodDb.collection('reviews');
    
    let imported = 0;
    let skipped = 0;
    
    for (const review of reviews) {
      try {
        // Check if review already exists in prod
        const existingQuery = await prodReviewsCollection
          .where('customerName', '==', review.customerName)
          .where('reviewText', '==', review.reviewText)
          .get();
        
        if (!existingQuery.empty) {
          console.log(`⏭️  Review from ${review.customerName} already exists in prod, skipping...`);
          skipped++;
          continue;
        }
        
        // Prepare review data (without the id field)
        const reviewData = {
          customerName: review.customerName,
          reviewText: review.reviewText,
          rating: review.rating,
          isVerified: review.isVerified,
          profilePicture: review.profilePicture,
          email: review.email,
          createdAt: review.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: review.updatedAt || admin.firestore.FieldValue.serverTimestamp(),
        };
        
        // Add to prod
        const docRef = await prodReviewsCollection.add(reviewData);
        console.log(`✅ Imported review from ${review.customerName} (ID: ${docRef.id})`);
        imported++;
        
      } catch (error) {
        console.error(`❌ Error importing review from ${review.customerName}:`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Imported to prod: ${imported}`);
    console.log(`  ⏭️  Skipped (already in prod): ${skipped}`);
    console.log(`  📋 Total in test: ${reviews.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error copying reviews:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

copyReviews();
