#!/usr/bin/env node

/**
 * Script to initialize sample products in a Firebase project
 * 
 * Usage:
 * export SERVICE_ACCOUNT_PATH=./prod-service-account.json
 * export PROJECT_ID=lil-magnet-memories
 * node scripts/init-products.js
 */

const admin = require('firebase-admin');
const fs = require('fs');

const PROJECT_ID = process.env.PROJECT_ID || 'lil-magnet-memories';
const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH || './prod-service-account.json';

// Sample products to create
const SAMPLE_PRODUCTS = [
  {
    description: 'Custom Photo Magnets',
    detailedDescription: 'High-quality custom magnets made from your photos. Perfect for refrigerators, lockers, and more!',
    pricing: {
      1: 12.99,
      5: 59.95,
      10: 99.90,
      25: 224.75,
      50: 399.50,
    },
    imageUrl: '',
  },
];

// Initialize Firebase Admin
function initAdmin() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`❌ Service account file not found: ${SERVICE_ACCOUNT_PATH}`);
    console.error('   Set SERVICE_ACCOUNT_PATH environment variable');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  
  return admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID,
    }
  );
}

// Initialize products
async function initProducts(db) {
  console.log(`\n📦 Initializing products in project: ${PROJECT_ID}\n`);
  
  try {
    // Check if products already exist
    const existingSnapshot = await db.collection('products').get();
    if (!existingSnapshot.empty) {
      console.log(`   ⚠️  Products collection already has ${existingSnapshot.size} product(s)`);
      console.log(`   💡 Skipping initialization to avoid duplicates`);
      console.log(`   💡 Use copy-products.js to copy existing products instead`);
      return { created: 0, skipped: existingSnapshot.size };
    }

    console.log(`   Creating ${SAMPLE_PRODUCTS.length} sample product(s)...`);

    let created = 0;
    const batch = db.batch();

    for (const product of SAMPLE_PRODUCTS) {
      const productRef = db.collection('products').doc();
      batch.set(productRef, {
        ...product,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      created++;
      console.log(`   ✅ Created product: ${product.description}`);
    }

    await batch.commit();
    console.log(`\n   ✅ Successfully created ${created} product(s)`);
    return { created, skipped: 0 };
  } catch (error) {
    console.error('❌ Error initializing products:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    const app = initAdmin();
    const db = admin.firestore(app);
    
    const result = await initProducts(db);
    
    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Products created: ${result.created}`);
    console.log(`   Products skipped: ${result.skipped}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (result.created > 0) {
      console.log('\n💡 Next steps:');
      console.log('   1. Check Firestore: https://console.firebase.google.com/project/' + PROJECT_ID + '/firestore/data');
      console.log('   2. Verify products collection exists');
      console.log('   3. Run copy-products.js to copy to test database');
    }
    
    await app.delete();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

