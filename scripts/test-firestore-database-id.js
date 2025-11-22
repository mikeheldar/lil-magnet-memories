/**
 * Test Firestore with explicit database ID
 * Sometimes Firestore needs the database ID specified
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const prodAccountPath = path.join(__dirname, '..', 'prod-service-account.json');
const serviceAccount = require(prodAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

async function test() {
  // Try with default database (most common)
  console.log('Test 1: Default database...');
  try {
    const db = admin.firestore();
    const collections = await db.listCollections();
    console.log(`✅ Success! Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`   - ${col.id}`));
    
    // Try reading a document
    console.log('\nTest 2: Reading admin_config/admin_emails...');
    const docRef = db.collection('admin_config').doc('admin_emails');
    const doc = await docRef.get();
    
    if (doc.exists) {
      console.log('✅ Document exists!');
      const data = doc.data();
      console.log(`   Fields: ${Object.keys(data).join(', ')}`);
      // Don't print full data (might contain sensitive info)
    } else {
      console.log('⚠️  Document does not exist (but read worked - permissions OK)');
    }
    
    // Try writing
    console.log('\nTest 3: Writing test document...');
    const testRef = db.collection('test').doc('admin-sdk-test');
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
    if (error.code) {
      console.log(`   Code: ${error.code}`);
    }
    if (error.code === 7) {
      console.log('   💡 PERMISSION_DENIED - Service account needs "Cloud Datastore User" role');
    } else if (error.code === 5) {
      console.log('   💡 NOT_FOUND - This is strange since database exists in console');
      console.log('   Possible causes:');
      console.log('      - Permissions not fully propagated (wait 2-3 minutes)');
      console.log('      - Service account needs additional roles');
      console.log('      - Database location/region configuration issue');
    }
  }

  await admin.app().delete();
}

test();

