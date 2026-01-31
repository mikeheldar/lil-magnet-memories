import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy as firestoreOrderBy } from 'firebase/firestore';
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

console.log('📋 Initializing sortOrder for products in:', testConfig.projectId);
console.log('');

// Initialize Firebase
const app = initializeApp(testConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function initializeSortOrder() {
  try {
    console.log('Signing in anonymously...');
    await signInAnonymously(auth);
    console.log('✅ Authenticated\n');

    console.log('📥 Fetching all products from test project...');
    const productsCollection = collection(db, 'products');
    
    // Get all products without any orderBy to avoid filtering
    const snapshot = await getDocs(productsCollection);
    
    console.log(`✅ Found ${snapshot.size} products\n`);

    if (snapshot.empty) {
      console.log('⚠️  No products found in test database!');
      process.exit(0);
    }

    // Group products by category and collection for proper ordering
    const productsByGroup = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const groupKey = `${data.category || 'unknown'}_${data.collection || 'unknown'}`;
      
      if (!productsByGroup[groupKey]) {
        productsByGroup[groupKey] = [];
      }
      
      productsByGroup[groupKey].push({
        id: doc.id,
        ...data
      });
    });

    console.log('📊 Products by category/collection:');
    Object.keys(productsByGroup).forEach(key => {
      console.log(`   ${key}: ${productsByGroup[key].length} products`);
    });
    console.log('');

    let updated = 0;
    let skipped = 0;

    // Process each group
    for (const [groupKey, products] of Object.entries(productsByGroup)) {
      console.log(`\n🔄 Processing group: ${groupKey}`);
      
      // Sort by existing description if sortOrder doesn't exist
      products.sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        return (a.description || '').localeCompare(b.description || '');
      });

      // Assign sortOrder to each product
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        if (product.sortOrder !== undefined) {
          console.log(`   ⏭️  "${product.description}" already has sortOrder: ${product.sortOrder}`);
          skipped++;
        } else {
          const productRef = doc(db, 'products', product.id);
          await updateDoc(productRef, {
            sortOrder: i
          });
          console.log(`   ✅ Set sortOrder=${i} for "${product.description}"`);
          updated++;
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ sortOrder initialization completed!');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (already had sortOrder): ${skipped}`);
    console.log(`   Total products: ${snapshot.size}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing sortOrder:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

initializeSortOrder();
