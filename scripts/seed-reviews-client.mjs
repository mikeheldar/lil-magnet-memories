import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Firebase configuration (uses prod by default)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('Seeding reviews to Firebase project:', firebaseConfig.projectId);
console.log('');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign in anonymously to get write permissions
console.log('Signing in anonymously...');
await signInAnonymously(auth);
console.log('✅ Authenticated\n');

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
    console.log('Starting to seed reviews...\n');

    const reviewsCollection = collection(db, 'reviews');
    const existingSnapshot = await getDocs(reviewsCollection);
    
    if (existingSnapshot.size > 0) {
      console.log(`Found ${existingSnapshot.size} existing reviews. Checking for duplicates...\n`);
      
      // Check each review to see if it already exists
      for (const review of reviews) {
        const existingQuery = query(
          reviewsCollection,
          where('customerName', '==', review.customerName),
          where('reviewText', '==', review.reviewText)
        );
        const existingReviewSnapshot = await getDocs(existingQuery);
        
        if (!existingReviewSnapshot.empty) {
          console.log(`⏭️  Review from ${review.customerName} already exists, skipping...`);
        } else {
          const docRef = await addDoc(reviewsCollection, {
            ...review,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log(`✅ Added review from ${review.customerName} (ID: ${docRef.id})`);
        }
      }
    } else {
      // No reviews exist, add all of them
      console.log('No existing reviews found. Adding all reviews...\n');
      for (const review of reviews) {
        const docRef = await addDoc(reviewsCollection, {
          ...review,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log(`✅ Added review from ${review.customerName} (ID: ${docRef.id})`);
      }
    }

    console.log('\n✅ Reviews seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    process.exit(1);
  }
}

seedReviews();
