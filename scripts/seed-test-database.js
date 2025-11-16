#!/usr/bin/env node

/**
 * Script to seed test Firebase database with data from production
 * 
 * Usage:
 * 1. Download service account keys from both Firebase projects
 * 2. Set environment variables:
 *    - PROD_SERVICE_ACCOUNT_PATH=/path/to/prod-service-account.json
 *    - TEST_SERVICE_ACCOUNT_PATH=/path/to/test-service-account.json
 * 3. Run: node scripts/seed-test-database.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Project IDs
const PROD_PROJECT_ID = 'lil-magnet-memories';
const TEST_PROJECT_ID = 'lil-magnet-memories-test';

// Collections to copy
const COLLECTIONS_TO_COPY = ['products', 'adminConfig'];

// Initialize Firebase Admin for production
function initProdAdmin() {
  const serviceAccountPath = process.env.PROD_SERVICE_ACCOUNT_PATH;
  
  if (!serviceAccountPath) {
    console.error('❌ PROD_SERVICE_ACCOUNT_PATH environment variable not set');
    console.error('   Download service account key from:');
    console.error(`   https://console.firebase.google.com/project/${PROD_PROJECT_ID}/settings/serviceaccounts/adminsdk`);
    process.exit(1);
  }

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Service account file not found: ${serviceAccountPath}`);
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
  const serviceAccountPath = process.env.TEST_SERVICE_ACCOUNT_PATH;
  
  if (!serviceAccountPath) {
    console.error('❌ TEST_SERVICE_ACCOUNT_PATH environment variable not set');
    console.error('   Download service account key from:');
    console.error(`   https://console.firebase.google.com/project/${TEST_PROJECT_ID}/settings/serviceaccounts/adminsdk`);
    process.exit(1);
  }

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Service account file not found: ${serviceAccountPath}`);
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

// Copy a collection from source to destination
async function copyCollection(sourceDb, destDb, collectionName) {
  console.log(`\n📦 Copying collection: ${collectionName}`);
  
  try {
    // Read all documents from source
    const snapshot = await sourceDb.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Collection "${collectionName}" is empty in production, skipping...`);
      return { copied: 0, skipped: 0 };
    }

    console.log(`   Found ${snapshot.size} document(s) in production`);

    let copied = 0;
    let skipped = 0;
    const batch = destDb.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    // Copy each document
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const destRef = destDb.collection(collectionName).doc(doc.id);
      
      // Convert Firestore Timestamps to serverTimestamp for dates
      const processedData = processDataForCopy(data);
      
      batch.set(destRef, processedData);
      batchCount++;
      copied++;

      // Firestore batches are limited to 500 operations
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`   ✅ Committed batch of ${batchCount} documents`);
        batchCount = 0;
      }
    }

    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Committed final batch of ${batchCount} documents`);
    }

    console.log(`   ✅ Successfully copied ${copied} document(s) to test database`);
    return { copied, skipped };
  } catch (error) {
    console.error(`   ❌ Error copying collection "${collectionName}":`, error.message);
    throw error;
  }
}

// Process data to handle Firestore-specific types
function processDataForCopy(data) {
  const processed = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Convert Firestore Timestamps to serverTimestamp placeholders
    // (We'll use serverTimestamp() when writing)
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

// Main function
async function main() {
  console.log('🚀 Starting database seeding from production to test...\n');

  try {
    // Initialize both Firebase Admin instances
    console.log('📡 Initializing Firebase Admin connections...');
    const prodApp = initProdAdmin();
    const testApp = initTestAdmin();
    
    const prodDb = admin.firestore(prodApp);
    const testDb = admin.firestore(testApp);

    console.log('✅ Connected to both projects\n');

    // Copy each collection
    const results = {};
    for (const collectionName of COLLECTIONS_TO_COPY) {
      const result = await copyCollection(prodDb, testDb, collectionName);
      results[collectionName] = result;
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const [collection, result] of Object.entries(results)) {
      console.log(`   ${collection}: ${result.copied} copied, ${result.skipped} skipped`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Check test Firestore: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore/data');
    console.log('   2. Verify products and adminConfig collections exist');
    console.log('   3. Test the site: https://test.lilmagnetmemories.com');

    // Cleanup
    await prodApp.delete();
    await testApp.delete();
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the script
main();

