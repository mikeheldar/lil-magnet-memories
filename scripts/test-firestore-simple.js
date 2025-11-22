/**
 * Simplified Firestore access test
 * Tests if we can access Firestore at all, with better error reporting
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const prodAccountPath = path.join(__dirname, '..', 'prod-service-account.json');

if (!fs.existsSync(prodAccountPath)) {
  console.error('❌ Service account not found:', prodAccountPath);
  process.exit(1);
}

const serviceAccount = require(prodAccountPath);

console.log('🔍 Initializing Firebase Admin...');
console.log(`   Project: ${serviceAccount.project_id}`);
console.log(`   Service Account: ${serviceAccount.client_email}`);
console.log('');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function test() {
  try {
    console.log('🔍 Testing Firestore access...');
    console.log('');
    
    // Try to get a specific document first (simpler than listing collections)
    console.log('Test 1: Reading admin_config/admin_emails...');
    try {
      const docRef = db.collection('admin_config').doc('admin_emails');
      const doc = await docRef.get();
      
      if (doc.exists) {
        console.log('✅ Document exists!');
        console.log('   Data:', JSON.stringify(doc.data(), null, 2));
      } else {
        console.log('⚠️  Document does not exist');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${JSON.stringify(error.details || {})}`);
    }
    
    console.log('');
    console.log('Test 2: Reading user_roles/roles_config...');
    try {
      const docRef = db.collection('user_roles').doc('roles_config');
      const doc = await docRef.get();
      
      if (doc.exists) {
        console.log('✅ Document exists!');
        console.log('   Data:', JSON.stringify(doc.data(), null, 2));
      } else {
        console.log('⚠️  Document does not exist');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${JSON.stringify(error.details || {})}`);
    }
    
    console.log('');
    console.log('Test 3: Listing collections...');
    try {
      const collections = await db.listCollections();
      console.log(`✅ Found ${collections.length} collections:`);
      collections.forEach(col => {
        console.log(`   - ${col.id}`);
      });
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${JSON.stringify(error.details || {})}`);
      console.log('');
      console.log('💡 This might indicate:');
      console.log('   1. Service account lacks "Cloud Datastore User" role');
      console.log('   2. Firestore database is not initialized');
      console.log('   3. Database location/region mismatch');
    }
    
    console.log('');
    console.log('Test 4: Writing test document...');
    try {
      const testRef = db.collection('test').doc('access-test');
      await testRef.set({
        test: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Admin SDK access test'
      });
      console.log('✅ Write successful!');
      
      // Clean up
      await testRef.delete();
      console.log('✅ Test document cleaned up');
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${JSON.stringify(error.details || {})}`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await admin.app().delete();
  }
}

test();

