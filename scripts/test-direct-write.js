/**
 * Test direct writes to Firestore using Firebase Admin SDK
 * This bypasses Vercel and tests direct database access
 * 
 * Usage:
 *   node scripts/test-direct-write.js prod
 *   node scripts/test-direct-write.js test
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Get environment from command line argument
const environment = process.argv[2] || 'prod';
const isTest = environment === 'test';

const accountPath = isTest 
  ? path.join(__dirname, '..', 'test-service-account.json')
  : path.join(__dirname, '..', 'prod-service-account.json');

if (!fs.existsSync(accountPath)) {
  console.error(`❌ Service account not found: ${accountPath}`);
  console.error(`   Make sure ${isTest ? 'test' : 'prod'}-service-account.json exists`);
  process.exit(1);
}

const serviceAccount = require(accountPath);

console.log('🔍 Testing Direct Firestore Writes');
console.log('=====================================');
console.log(`Environment: ${environment}`);
console.log(`Project: ${serviceAccount.project_id}`);
console.log(`Service Account: ${serviceAccount.client_email}`);
console.log('');

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});
console.log('✅ Firebase Admin initialized');

// Production now has both databases - test (default) first
// If environment is prod, try (default) database first
const databaseId = environment === 'prod' ? '(default)' : '(default)';

// Use getFirestore with database ID for custom databases
// For (default), omit the database ID parameter
const db = databaseId === '(default)' 
  ? getFirestore(app)
  : getFirestore(app, databaseId);

const timestamp = new Date().toISOString();
const testId = `direct-write-test-${Date.now()}`;

console.log(`Using database ID: "${databaseId}"`);
console.log('');

async function testWrites() {
  try {
    console.log('\n📝 Testing writes to different collections...\n');

    // Test 1: Write to test collection
    console.log('Test 1: Writing to test/ collection...');
    try {
      const testRef = db.collection('test').doc(testId);
      await testRef.set({
        test: true,
        environment: environment,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Direct write test from Admin SDK',
        source: 'test-direct-write.js',
        createdAt: timestamp
      });
      console.log(`✅ Successfully wrote to test/${testId}`);
      console.log(`   👉 Verify in Firebase Console: https://console.firebase.google.com/project/${serviceAccount.project_id}/firestore/data/test/${testId}`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log(`   Code: ${error.code}`);
    }

    // Test 2: Write to admin_config (if it exists)
    console.log('\nTest 2: Writing to admin_config/ collection...');
    try {
      const adminRef = db.collection('admin_config').doc('test-write');
      await adminRef.set({
        test: true,
        environment: environment,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Direct write test to admin_config',
        source: 'test-direct-write.js'
      });
      console.log(`✅ Successfully wrote to admin_config/test-write`);
      console.log(`   👉 Verify in Firebase Console: https://console.firebase.google.com/project/${serviceAccount.project_id}/firestore/data/admin_config/test-write`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log(`   Code: ${error.code}`);
    }

    // Test 3: Write to orders collection (simulating an order)
    console.log('\nTest 3: Writing to orders/ collection...');
    try {
      const orderRef = db.collection('orders').doc(testId);
      await orderRef.set({
        orderNumber: `TEST-${Date.now()}`,
        test: true,
        environment: environment,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        customer: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com'
        },
        status: 'test',
        source: 'test-direct-write.js',
        createdAt: timestamp
      });
      console.log(`✅ Successfully wrote to orders/${testId}`);
      console.log(`   👉 Verify in Firebase Console: https://console.firebase.google.com/project/${serviceAccount.project_id}/firestore/data/orders/${testId}`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log(`   Code: ${error.code}`);
    }

    // Test 4: Write to products collection
    console.log('\nTest 4: Writing to products/ collection...');
    try {
      const productRef = db.collection('products').doc('test-product');
      await productRef.set({
        name: 'Test Product',
        test: true,
        environment: environment,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        price: 0,
        source: 'test-direct-write.js',
        createdAt: timestamp
      });
      console.log(`✅ Successfully wrote to products/test-product`);
      console.log(`   👉 Verify in Firebase Console: https://console.firebase.google.com/project/${serviceAccount.project_id}/firestore/data/products/test-product`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log(`   Code: ${error.code}`);
    }

    // Test 5: Write to user_roles collection
    console.log('\nTest 5: Writing to user_roles/ collection...');
    try {
      const rolesRef = db.collection('user_roles').doc('test-write');
      await rolesRef.set({
        test: true,
        environment: environment,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Direct write test to user_roles',
        source: 'test-direct-write.js'
      });
      console.log(`✅ Successfully wrote to user_roles/test-write`);
      console.log(`   👉 Verify in Firebase Console: https://console.firebase.google.com/project/${serviceAccount.project_id}/firestore/data/user_roles/test-write`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log(`   Code: ${error.code}`);
    }

    console.log('\n✅ Test complete!');
    console.log('\n📋 Summary:');
    console.log('   - Check Firebase Console to verify documents were created');
    console.log('   - Documents are left in place for manual verification');
    console.log('   - You can delete test documents manually from Firebase Console');
    console.log(`   - Project: ${serviceAccount.project_id}`);
    console.log(`   - Environment: ${environment}`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    await admin.app().delete();
  }
}

testWrites();

