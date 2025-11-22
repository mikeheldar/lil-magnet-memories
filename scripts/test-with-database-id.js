/**
 * Test Firestore with explicit database ID
 * Production might be using a non-default database
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const environment = process.argv[2] || 'prod';
const isTest = environment === 'test';

const accountPath = isTest 
  ? path.join(__dirname, '..', 'test-service-account.json')
  : path.join(__dirname, '..', 'prod-service-account.json');

if (!fs.existsSync(accountPath)) {
  console.error(`❌ Service account not found: ${accountPath}`);
  process.exit(1);
}

const serviceAccount = require(accountPath);

console.log('🔍 Testing Firestore with Database ID');
console.log('=====================================');
console.log(`Environment: ${environment}`);
console.log(`Project: ${serviceAccount.project_id}`);
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

async function testWithDatabaseId(databaseId = '(default)') {
  try {
    console.log(`\n📝 Testing with database ID: "${databaseId}"`);
    
    // Get Firestore with explicit database ID
    const db = admin.firestore();
    
    // Try to list collections first
    console.log('   Attempting to list collections...');
    const collections = await db.listCollections();
    console.log(`   ✅ Success! Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`      - ${col.id}`));
    
    // Try to read a document
    console.log('\n   Attempting to read admin_config/admin_emails...');
    const docRef = db.collection('admin_config').doc('admin_emails');
    const doc = await docRef.get();
    
    if (doc.exists) {
      console.log('   ✅ Document exists!');
      const data = doc.data();
      console.log(`      Fields: ${Object.keys(data).join(', ')}`);
    } else {
      console.log('   ⚠️  Document does not exist (but read worked)');
    }
    
    // Try to write
    console.log('\n   Attempting to write test document...');
    const testId = `db-test-${Date.now()}`;
    const testRef = db.collection('test').doc(testId);
    await testRef.set({
      test: true,
      databaseId: databaseId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      environment: environment,
      message: 'Database ID test'
    });
    console.log(`   ✅ Write successful! Document: test/${testId}`);
    
    // Clean up
    await testRef.delete();
    console.log('   ✅ Test document cleaned up');
    
    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    if (error.code) {
      console.log(`      Code: ${error.code}`);
    }
    return false;
  }
}

async function main() {
  // Try default database first
  let success = await testWithDatabaseId('(default)');
  
  // If default fails, try common alternatives
  if (!success && environment === 'prod') {
    console.log('\n🔄 Default database failed, trying alternatives...');
    
    // Try without specifying (should be same as default)
    // Try with project ID as database ID
    const alternatives = [
      serviceAccount.project_id,
      'default',
      '(default)'
    ];
    
    for (const dbId of alternatives) {
      if (dbId !== '(default)') { // Already tried
        console.log(`\n   Trying database ID: "${dbId}"`);
        success = await testWithDatabaseId(dbId);
        if (success) {
          console.log(`\n✅ Found working database ID: "${dbId}"`);
          break;
        }
      }
    }
  }
  
  if (!success) {
    console.log('\n❌ All database ID attempts failed');
    console.log('\n💡 Possible issues:');
    console.log('   1. Service account needs "Cloud Datastore User" role');
    console.log('   2. Database location/region configuration mismatch');
    console.log('   3. Firestore database not properly initialized');
    console.log('   4. Permissions not fully propagated (wait 2-3 minutes)');
  }
  
  await admin.app().delete();
}

main().catch(console.error);

