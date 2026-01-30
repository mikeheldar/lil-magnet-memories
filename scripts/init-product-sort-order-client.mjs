#!/usr/bin/env node

/**
 * Initialize sortOrder for all existing products using Firebase client SDK
 * This script adds a sortOrder field to all products that don't have one
 * Products are ordered by their current Firestore order (description)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log(`Initializing sortOrder for products in project: ${firebaseConfig.projectId}`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function initializeProductSortOrder() {
  try {
    // Sign in anonymously to get write permissions
    console.log('\n🔐 Authenticating...');
    await signInAnonymously(auth);
    console.log('✅ Authenticated\n');
    
    console.log('📥 Fetching all products...');
    
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy('description', 'asc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('⚠️  No products found in the database.');
      process.exit(0);
    }
    
    console.log(`✅ Found ${snapshot.size} product(s)\n`);
    
    let updated = 0;
    let skipped = 0;
    
    // Process each product
    const products = [];
    
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      products.push({
        id: docSnapshot.id,
        description: data.description,
        category: data.category || 'custom',
        collection: data.collection || 'Uncategorized',
        sortOrder: data.sortOrder,
      });
    });
    
    // Group by category and collection for proper ordering
    const groupedProducts = {};
    products.forEach((product) => {
      const key = `${product.category}::${product.collection}`;
      if (!groupedProducts[key]) {
        groupedProducts[key] = [];
      }
      groupedProducts[key].push(product);
    });
    
    // Assign sortOrder within each group
    console.log('📊 Assigning sort orders...\n');
    
    for (const key of Object.keys(groupedProducts)) {
      const [category, collection] = key.split('::');
      console.log(`  Category: ${category}, Collection: ${collection}`);
      
      for (let index = 0; index < groupedProducts[key].length; index++) {
        const product = groupedProducts[key][index];
        
        if (product.sortOrder === undefined || product.sortOrder === null) {
          const productRef = doc(db, 'products', product.id);
          await updateDoc(productRef, {
            sortOrder: index,
          });
          console.log(`    ✅ ${product.description} -> sortOrder: ${index}`);
          updated++;
        } else {
          console.log(`    ⏭️  ${product.description} -> already has sortOrder: ${product.sortOrder}`);
          skipped++;
        }
      }
      console.log('');
    }
    
    console.log('📊 Migration Summary:');
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ⏭️  Skipped (already have sortOrder): ${skipped}`);
    console.log(`  📋 Total products: ${snapshot.size}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing product sort order:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

initializeProductSortOrder();
