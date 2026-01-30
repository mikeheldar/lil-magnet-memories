import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Test Firebase configuration
const testConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY_TEST,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN_TEST,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID_TEST,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET_TEST,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID_TEST,
  appId: process.env.VITE_FIREBASE_APP_ID_TEST,
};

// Prod Firebase configuration
const prodConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('Test Project:', testConfig.projectId);
console.log('Prod Project:', prodConfig.projectId);
console.log('');

// Check if they're the same project
if (testConfig.projectId === prodConfig.projectId) {
  console.log('⚠️  WARNING: Test and Prod are using the SAME Firebase project!');
  console.log('   This means reviews are already shared between test and prod.');
  console.log('   No migration needed.\n');
  
  // Just list the reviews
  const app = initializeApp(prodConfig);
  const db = getFirestore(app);
  
  const reviewsRef = collection(db, 'reviews');
  const q = query(reviewsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  console.log(`📋 Found ${snapshot.size} review(s) in the shared database:\n`);
  
  snapshot.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. ${data.customerName} - ${data.rating || 5} stars`);
    console.log(`   "${data.reviewText.substring(0, 80)}..."`);
    console.log('');
  });
  
  process.exit(0);
}

// Initialize both apps
const testApp = initializeApp(testConfig, 'test');
const prodApp = initializeApp(prodConfig, 'prod');

const testDb = getFirestore(testApp);
const prodDb = getFirestore(prodApp);

async function copyReviews() {
  try {
    console.log('📥 Fetching reviews from TEST database...\n');
    
    const testReviewsRef = collection(testDb, 'reviews');
    const testQuery = query(testReviewsRef, orderBy('createdAt', 'desc'));
    const testSnapshot = await getDocs(testQuery);
    
    if (testSnapshot.empty) {
      console.log('⚠️  No reviews found in test database.');
      process.exit(0);
    }
    
    const reviews = [];
    testSnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        ...data,
      });
    });
    
    console.log(`✅ Found ${reviews.length} review(s) in test database\n`);
    
    // Print reviews
    console.log('📋 Reviews to copy:');
    reviews.forEach((review, index) => {
      console.log(`  ${index + 1}. ${review.customerName} - ${review.rating || 5} stars`);
      console.log(`     "${review.reviewText.substring(0, 80)}..."`);
    });
    console.log('');
    
    // Now copy to prod
    console.log('📤 Copying reviews to PROD database...\n');
    
    const prodReviewsRef = collection(prodDb, 'reviews');
    
    let imported = 0;
    let skipped = 0;
    
    for (const review of reviews) {
      try {
        // Check if review already exists in prod
        const existingQuery = query(
          prodReviewsRef,
          where('customerName', '==', review.customerName),
          where('reviewText', '==', review.reviewText)
        );
        const existingSnapshot = await getDocs(existingQuery);
        
        if (!existingSnapshot.empty) {
          console.log(`⏭️  Review from ${review.customerName} already exists in prod, skipping...`);
          skipped++;
          continue;
        }
        
        // Prepare review data (without the id field)
        const reviewData = {
          customerName: review.customerName,
          reviewText: review.reviewText,
          rating: review.rating || 5,
          isVerified: review.isVerified !== undefined ? review.isVerified : true,
          profilePicture: review.profilePicture || null,
          email: review.email || null,
          createdAt: review.createdAt || serverTimestamp(),
          updatedAt: review.updatedAt || serverTimestamp(),
        };
        
        // Add to prod
        const docRef = await addDoc(prodReviewsRef, reviewData);
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
