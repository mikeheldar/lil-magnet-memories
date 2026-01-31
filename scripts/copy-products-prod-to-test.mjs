import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Production Firebase configuration
const prodConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: 'lil-magnet-memories', // Explicitly set to production
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Test Firebase configuration
const testConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY_TEST,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN_TEST,
  projectId: 'lil-magnet-memories-test', // Explicitly set to test
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET_TEST,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID_TEST,
  appId: process.env.VITE_FIREBASE_APP_ID_TEST,
};

console.log('📋 Copying products from production to test Firebase project');
console.log('From:', prodConfig.projectId);
console.log('To:', testConfig.projectId);
console.log('');

// Initialize both Firebase apps
const prodApp = initializeApp(prodConfig, 'prod');
const testApp = initializeApp(testConfig, 'test');

const prodDb = getFirestore(prodApp);
const testDb = getFirestore(testApp);
const prodAuth = getAuth(prodApp);
const testAuth = getAuth(testApp);

async function copyProducts() {
  try {
    // Sign in anonymously to both projects
    console.log('Signing in anonymously to production...');
    await signInAnonymously(prodAuth);
    console.log('✅ Authenticated to production\n');
    
    console.log('Signing in anonymously to test project...');
    await signInAnonymously(testAuth);
    console.log('✅ Authenticated to test project\n');

    // Fetch all products from production
    console.log('📥 Fetching products from production...');
    const prodProductsCollection = collection(prodDb, 'products');
    const prodSnapshot = await getDocs(prodProductsCollection);
    
    if (prodSnapshot.empty) {
      console.log('⚠️  No products found in production project!');
      process.exit(0);
    }

    console.log(`✅ Found ${prodSnapshot.size} products in production\n`);

    // Check what exists in test
    console.log('📥 Checking existing products in test...');
    const testProductsCollection = collection(testDb, 'products');
    const testSnapshot = await getDocs(testProductsCollection);
    console.log(`Found ${testSnapshot.size} existing products in test\n`);

    // Copy each product
    let copied = 0;
    let skipped = 0;

    for (const prodDoc of prodSnapshot.docs) {
      const productData = prodDoc.data();
      
      // Check if product already exists in test (by description and category)
      const existingQuery = query(
        testProductsCollection,
        where('description', '==', productData.description),
        where('category', '==', productData.category)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        console.log(`⏭️  Product "${productData.description}" (${productData.category}) already exists in test, skipping...`);
        skipped++;
      } else {
        // Copy the product to test
        const newProduct = {
          ...productData,
          // Preserve all fields including sortOrder if it exists
        };

        const docRef = await addDoc(testProductsCollection, newProduct);
        console.log(`✅ Copied "${productData.description}" (${productData.category}) to test (ID: ${docRef.id})`);
        console.log(`   sortOrder: ${productData.sortOrder}, price: $${productData.price}`);
        copied++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Product copy completed!');
    console.log(`   Copied: ${copied}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total in production: ${prodSnapshot.size}`);
    console.log(`   Total in test now: ${testSnapshot.size + copied}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error copying products:', error);
    console.error('Error details:', error.message);
    if (error.code === 'permission-denied') {
      console.error('\nThis could mean:');
      console.error('1. Firestore rules haven\'t propagated yet (wait a minute and try again)');
      console.error('2. The rules in test project don\'t match production');
      console.error('3. Anonymous auth is disabled in Firebase console for test project');
    }
    process.exit(1);
  }
}

copyProducts();
