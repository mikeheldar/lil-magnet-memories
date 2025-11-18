#!/usr/bin/env node

/**
 * Script to copy products collection from production to test Firebase
 * 
 * Usage:
 * export PROD_SERVICE_ACCOUNT_PATH=./prod-service-account.json
 * export TEST_SERVICE_ACCOUNT_PATH=./test-service-account.json
 * node scripts/copy-products.js
 */

const admin = require('firebase-admin');
const fs = require('fs');

const PROD_PROJECT_ID = 'lil-magnet-memories';
const TEST_PROJECT_ID = 'lil-magnet-memories-test';
const COLLECTION_NAME = 'products';

// Initialize Firebase Admin for production
function initProdAdmin() {
  const serviceAccountPath = process.env.PROD_SERVICE_ACCOUNT_PATH || './prod-service-account.json';
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Production service account file not found: ${serviceAccountPath}`);
    console.error('   Set PROD_SERVICE_ACCOUNT_PATH environment variable');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  return admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      projectId: PROD_PROJECT_ID,
    },
    'prod'
  );
}

// Initialize Firebase Admin for test
function initTestAdmin() {
  const serviceAccountPath = process.env.TEST_SERVICE_ACCOUNT_PATH || './test-service-account.json';
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Test service account file not found: ${serviceAccountPath}`);
    console.error('   Set TEST_SERVICE_ACCOUNT_PATH environment variable');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  return admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      projectId: TEST_PROJECT_ID,
    },
    'test'
  );
}

// Process data to handle Firestore-specific types
function processDataForCopy(data) {
  const processed = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Convert Firestore Timestamps to serverTimestamp placeholders
    if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Timestamp') {
      processed[key] = admin.firestore.FieldValue.serverTimestamp();
    } else if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
      // Recursively process nested objects
      processed[key] = processDataForCopy(value);
    } else {
      processed[key] = value;
    }
  }
  
  return processed;
}

// Copy products collection
async function copyProducts(prodDb, testDb) {
  console.log(`\n📦 Copying ${COLLECTION_NAME} collection from production to test...\n`);
  
  try {
    // Read all documents from production
    const snapshot = await prodDb.collection(COLLECTION_NAME).get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Collection "${COLLECTION_NAME}" is empty in production`);
      console.log(`   💡 You may need to create products in production first`);
      return { copied: 0, error: 'EMPTY' };
    }

    console.log(`   ✅ Found ${snapshot.size} product(s) in production`);

    // Check if test collection already has documents
    const testSnapshot = await testDb.collection(COLLECTION_NAME).get();
    if (!testSnapshot.empty) {
      console.log(`   ⚠️  Test database already has ${testSnapshot.size} product(s)`);
      console.log(`   💡 This will overwrite existing products with same IDs`);
    }

    let copied = 0;
    let batch = testDb.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    // Copy each document
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const destRef = testDb.collection(COLLECTION_NAME).doc(doc.id);
      
      // Convert Firestore Timestamps to serverTimestamp for dates
      const processedData = processDataForCopy(data);
      
      batch.set(destRef, processedData);
      batchCount++;
      copied++;

      // Firestore batches are limited to 500 operations
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`   ✅ Committed batch of ${batchCount} products`);
        batchCount = 0;
        batch = testDb.batch(); // Create new batch
      }
    }

    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Committed final batch of ${batchCount} products`);
    }

    console.log(`\n   ✅ Successfully copied ${copied} product(s) to test database`);
    return { copied, error: null };
  } catch (error) {
    // Check if it's a NOT_FOUND error (collection doesn't exist)
    if (error.code === 5 || error.message.includes('NOT_FOUND')) {
      console.log(`   ❌ Collection "${COLLECTION_NAME}" does not exist in production`);
      console.log(`   💡 You may need to create products in production first`);
      return { copied: 0, error: 'NOT_FOUND' };
    }
    console.error(`   ❌ Error copying products:`, error.message);
    console.error(`   Error code: ${error.code}`);
    return { copied: 0, error: error.message };
  }
}

// Main function
async function main() {
  console.log('🚀 Copying products from production to test database...\n');

  try {
    // Initialize both Firebase Admin instances
    console.log('📡 Initializing Firebase Admin connections...');
    const prodApp = initProdAdmin();
    const testApp = initTestAdmin();
    
    const prodDb = admin.firestore(prodApp);
    const testDb = admin.firestore(testApp);

    console.log('✅ Connected to both projects\n');

    // Copy products
    const result = await copyProducts(prodDb, testDb);

    // Summary
    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (result.error) {
      console.log(`   Status: ❌ ${result.error}`);
      if (result.error === 'NOT_FOUND') {
        console.log('\n💡 Next steps:');
        console.log('   1. Create products in production Firebase Console:');
        console.log('      https://console.firebase.google.com/project/lil-magnet-memories/firestore/data');
        console.log('   2. Or manually create products in test database');
        console.log('   3. Then run this script again');
      }
    } else {
      console.log(`   Products copied: ✅ ${result.copied}`);
      console.log('\n💡 Next steps:');
      console.log('   1. Check test Firestore: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore/data');
      console.log('   2. Verify products collection exists and has data');
      console.log('   3. Test the site: https://test.lilmagnetmemories.com');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Cleanup
    await prodApp.delete();
    await testApp.delete();
    
    process.exit(result.error ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal error during copy:', error);
    process.exit(1);
  }
}

// Run the script
main();

