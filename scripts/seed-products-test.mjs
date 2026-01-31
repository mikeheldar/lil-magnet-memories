import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Test Firebase configuration
const testConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY_TEST,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN_TEST,
  projectId: 'lil-magnet-memories-test', // Explicitly target test
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET_TEST,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID_TEST,
  appId: process.env.VITE_FIREBASE_APP_ID_TEST,
};

console.log('📋 Seeding test products to:', testConfig.projectId);
console.log('');

// Initialize Firebase
const app = initializeApp(testConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sample products to seed
const products = [
  {
    category: 'custom',
    collection: 'photo-magnets',
    description: '9 Piece Magnet Puzzle',
    image: '/assets/products/9-piece-puzzle.jpg',
    maxImageHeight: 1000,
    maxImageWidth: 1000,
    minImageHeight: 400,
    minImageWidth: 400,
    price: 9,
    requiresImage: true,
    sortOrder: 0,
    visible: true
  },
  {
    category: 'custom',
    collection: 'photo-magnets',
    description: 'Little Circle Photo Magnet',
    image: '/assets/products/circle-magnet.jpg',
    maxImageHeight: 1000,
    maxImageWidth: 1000,
    minImageHeight: 200,
    minImageWidth: 200,
    price: 4,
    requiresImage: true,
    sortOrder: 1,
    visible: true
  },
  {
    category: 'custom',
    collection: 'photo-magnets',
    description: 'Square Photo Magnets',
    image: '/assets/products/square-magnet.jpg',
    maxImageHeight: 1000,
    maxImageWidth: 1000,
    minImageHeight: 200,
    minImageWidth: 200,
    price: 3,
    requiresImage: true,
    sortOrder: 2,
    visible: true
  },
  {
    category: 'custom',
    collection: 'photo-magnets',
    description: 'Oval Photo Magnets',
    image: '/assets/products/oval-magnet.jpg',
    maxImageHeight: 1000,
    maxImageWidth: 1000,
    minImageHeight: 200,
    minImageWidth: 200,
    price: 4,
    requiresImage: true,
    sortOrder: 3,
    visible: true
  }
];

async function seedProducts() {
  try {
    console.log('Signing in anonymously to test project...');
    await signInAnonymously(auth);
    console.log('✅ Authenticated\n');

    console.log('Starting to seed products...\n');

    const productsCollection = collection(db, 'products');

    for (const product of products) {
      try {
        const docRef = await addDoc(productsCollection, {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log(`✅ Added "${product.description}" (ID: ${docRef.id})`);
        console.log(`   Category: ${product.category}, Collection: ${product.collection}, Price: $${product.price}, sortOrder: ${product.sortOrder}\n`);
      } catch (addError) {
        console.error(`❌ Failed to add "${product.description}":`, addError.message);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Products seeding completed!');
    console.log(`   Total products added: ${products.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    console.error('Error details:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Anonymous authentication not enabled in Firebase console');
    console.error('2. Firestore rules don\'t allow authenticated writes to products collection');
    console.error('3. Network or Firebase connection issues');
    process.exit(1);
  }
}

seedProducts();
