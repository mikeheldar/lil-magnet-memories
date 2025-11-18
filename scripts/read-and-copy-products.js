#!/usr/bin/env node

/**
 * Script to read products from production and copy to test
 * This will read whatever products exist in production and copy them
 */

const admin = require('firebase-admin');
const fs = require('fs');

const PROD_PROJECT_ID = 'lil-magnet-memories';
const TEST_PROJECT_ID = 'lil-magnet-memories-test';

// Initialize Firebase Admin for production
function initProdAdmin() {
  const serviceAccountPath = process.env.PROD_SERVICE_ACCOUNT_PATH || './prod-service-account.json';
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Production service account file not found: ${serviceAccountPath}`);
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
    // Keep Firestore Timestamps as-is (they'll be converted properly)
    if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Timestamp') {
      // Convert Timestamp to serverTimestamp
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

// Read and copy products
async function readAndCopyProducts(prodDb, testDb) {
  console.log(`\n📖 Reading products from production database...\n`);
  
  try {
    // Try to read products collection
    const snapshot = await prodDb.collection('products').get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  No products found in production database`);
      console.log(`   💡 Checking if collection exists...`);
      
      // Try to see if we can access the collection at all
      try {
        await prodDb.collection('products').limit(1).get();
        console.log(`   ✅ Collection exists but is empty`);
      } catch (error) {
        console.log(`   ❌ Collection does not exist or cannot be accessed`);
        console.log(`   Error: ${error.message}`);
      }
      return { read: 0, copied: 0 };
    }

    console.log(`   ✅ Found ${snapshot.size} product(s) in production\n`);

    // Display what we found
    console.log(`   Products found:`);
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.description || 'No description'}`);
      if (data.pricing) {
        const pricingKeys = Object.keys(data.pricing).sort((a, b) => parseInt(a) - parseInt(b));
        console.log(`     Pricing: ${pricingKeys.map(k => `${k} for $${data.pricing[k]}`).join(', ')}`);
      }
    });

    console.log(`\n📦 Copying products to test database...\n`);

    let copied = 0;
    let batch = testDb.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500;

    // Copy each document
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const destRef = testDb.collection('products').doc(doc.id);
      
      // Process data for copy
      const processedData = processDataForCopy(data);
      
      // Preserve timestamps or use serverTimestamp
      if (!processedData.createdAt) {
        processedData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      }
      if (!processedData.updatedAt) {
        processedData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      }
      
      batch.set(destRef, processedData);
      batchCount++;
      copied++;

      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`   ✅ Committed batch of ${batchCount} products`);
        batchCount = 0;
        batch = testDb.batch();
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Committed final batch of ${batchCount} products`);
    }

    console.log(`\n   ✅ Successfully copied ${copied} product(s) to test database`);
    return { read: snapshot.size, copied };
  } catch (error) {
    if (error.code === 5 || error.message.includes('NOT_FOUND') || error.code === 'NOT_FOUND') {
      console.log(`   ❌ Collection "products" does not exist in production`);
      console.log(`   Error code: ${error.code}`);
      return { read: 0, copied: 0, error: 'NOT_FOUND' };
    }
    console.error(`   ❌ Error reading/copying products:`, error.message);
    console.error(`   Error code: ${error.code}`);
    return { read: 0, copied: 0, error: error.message };
  }
}

// Main function
async function main() {
  console.log('🚀 Reading products from production and copying to test...\n');

  try {
    console.log('📡 Initializing Firebase Admin connections...');
    const prodApp = initProdAdmin();
    const testApp = initTestAdmin();
    
    const prodDb = admin.firestore(prodApp);
    const testDb = admin.firestore(testApp);

    console.log('✅ Connected to both projects\n');

    const result = await readAndCopyProducts(prodDb, testDb);

    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (result.error) {
      console.log(`   Status: ❌ ${result.error}`);
    } else {
      console.log(`   Products read from production: ${result.read}`);
      console.log(`   Products copied to test: ${result.copied}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (result.copied > 0) {
      console.log('\n💡 Next steps:');
      console.log('   1. Check test Firestore: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore/data');
      console.log('   2. Verify products collection has the copied data');
      console.log('   3. Test the site: https://test.lilmagnetmemories.com');
    }

    await prodApp.delete();
    await testApp.delete();
    
    process.exit(result.error ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

