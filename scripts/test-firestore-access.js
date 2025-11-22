/**
 * Script to test direct Firestore access using Firebase Admin SDK
 * 
 * This tests if the production Firestore database is accessible
 * and what operations can be performed.
 * 
 * Usage:
 *   node scripts/test-firestore-access.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load service account - try admin account first, fallback to prod account
const adminAccountPath = path.join(__dirname, '..', 'firestore-admin-service-account.json');
const prodAccountPath = path.join(__dirname, '..', 'prod-service-account.json');

let serviceAccountPath;
if (fs.existsSync(adminAccountPath)) {
  serviceAccountPath = adminAccountPath;
  console.log('📋 Using firestore-admin-service-account.json\n');
} else if (fs.existsSync(prodAccountPath)) {
  serviceAccountPath = prodAccountPath;
  console.log('📋 Using prod-service-account.json\n');
} else {
  console.error('❌ No service account file found!');
  console.error('   Expected:', adminAccountPath);
  console.error('   Or:', prodAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'lil-magnet-memories'
});

const db = admin.firestore();

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logResult(test, success, message, details = null) {
  const result = { test, success, message, details, timestamp: new Date().toISOString() };
  if (success) {
    results.passed.push(result);
    console.log(`✅ ${test}: ${message}`);
  } else {
    results.failed.push(result);
    console.log(`❌ ${test}: ${message}`);
    if (details) {
      console.log(`   Details:`, details);
    }
  }
}

function logWarning(test, message) {
  results.warnings.push({ test, message, timestamp: new Date().toISOString() });
  console.log(`⚠️  ${test}: ${message}`);
}

async function testBasicConnection() {
  try {
    // Try to get database info
    const collections = await db.listCollections();
    logResult(
      'Basic Connection',
      true,
      `Connected successfully. Found ${collections.length} collections.`
    );
    
    // List collections
    if (collections.length > 0) {
      console.log('   Collections found:');
      collections.forEach(col => {
        console.log(`     - ${col.id}`);
      });
    }
    return true;
  } catch (error) {
    logResult('Basic Connection', false, error.message, {
      code: error.code,
      details: error.details
    });
    return false;
  }
}

async function testReadOperations() {
  const collections = ['user_roles', 'admin_config', 'orders', 'products', 'marketEvents', 'settings'];
  
  for (const collectionName of collections) {
    try {
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.limit(1).get();
      
      if (snapshot.empty) {
        logWarning(
          `Read ${collectionName}`,
          `Collection exists but is empty`
        );
      } else {
        logResult(
          `Read ${collectionName}`,
          true,
          `Successfully read ${snapshot.size} document(s)`
        );
      }
    } catch (error) {
      if (error.code === 5) {
        logWarning(
          `Read ${collectionName}`,
          `Collection does not exist (NOT_FOUND)`
        );
      } else {
        logResult(
          `Read ${collectionName}`,
          false,
          error.message,
          { code: error.code }
        );
      }
    }
  }
}

async function testReadSpecificDocuments() {
  const testDocuments = [
    { collection: 'user_roles', doc: 'roles_config' },
    { collection: 'admin_config', doc: 'admin_emails' },
  ];
  
  for (const { collection: colName, doc: docId } of testDocuments) {
    try {
      const docRef = db.collection(colName).doc(docId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        logResult(
          `Read ${colName}/${docId}`,
          true,
          `Document exists with ${Object.keys(data).length} fields`
        );
        console.log(`   Fields: ${Object.keys(data).join(', ')}`);
      } else {
        logWarning(
          `Read ${colName}/${docId}`,
          `Document does not exist`
        );
      }
    } catch (error) {
      logResult(
        `Read ${colName}/${docId}`,
        false,
        error.message,
        { code: error.code }
      );
    }
  }
}

async function testWriteOperation() {
  try {
    const testDoc = {
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: 'Firestore access test',
      testId: `test-${Date.now()}`,
    };
    
    const docRef = db.collection('test').doc(`access-test-${Date.now()}`);
    await docRef.set(testDoc);
    
    // Verify write
    const verifyDoc = await docRef.get();
    if (verifyDoc.exists) {
      logResult(
        'Write Operation',
        true,
        `Successfully wrote and verified document: ${docRef.id}`
      );
      
      // Clean up - delete test document
      try {
        await docRef.delete();
        console.log(`   ✅ Cleaned up test document`);
      } catch (deleteError) {
        logWarning('Cleanup', `Could not delete test document: ${deleteError.message}`);
      }
    } else {
      logResult('Write Operation', false, 'Write succeeded but document not found on read');
    }
  } catch (error) {
    logResult(
      'Write Operation',
      false,
      error.message,
      { code: error.code, details: error.details }
    );
  }
}

async function testQueryOperation() {
  try {
    // Try querying orders collection
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.limit(5).get();
    
    logResult(
      'Query Operation',
      true,
      `Successfully queried orders collection: ${snapshot.size} document(s) found`
    );
  } catch (error) {
    logResult(
      'Query Operation',
      false,
      error.message,
      { code: error.code }
    );
  }
}

async function testPermissions() {
  try {
    // Try to read a document that should exist
    const adminRef = db.collection('admin_config').doc('admin_emails');
    const adminDoc = await adminRef.get();
    
    if (adminDoc.exists) {
      // Try to update it (should work with admin SDK)
      try {
        await adminRef.update({
          _testAccess: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Remove test field
        await adminRef.update({
          _testAccess: admin.firestore.FieldValue.delete()
        });
        
        logResult(
          'Permissions (Update)',
          true,
          'Successfully updated and cleaned up test field'
        );
      } catch (updateError) {
        logResult(
          'Permissions (Update)',
          false,
          updateError.message,
          { code: updateError.code }
        );
      }
    } else {
      logWarning('Permissions (Update)', 'Cannot test - admin_emails document does not exist');
    }
  } catch (error) {
    logResult(
      'Permissions',
      false,
      error.message,
      { code: error.code }
    );
  }
}

async function runAllTests() {
  console.log('🧪 Testing Firestore Access for Production Database\n');
  console.log('='.repeat(60));
  console.log(`Project: lil-magnet-memories`);
  console.log(`Service Account: ${serviceAccount.client_email}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log('');
  
  // Run tests in sequence
  const basicConnection = await testBasicConnection();
  
  if (!basicConnection) {
    console.log('\n❌ Basic connection failed. Cannot proceed with other tests.');
    await admin.app().delete();
    process.exit(1);
  }
  
  console.log('');
  await testReadOperations();
  
  console.log('');
  await testReadSpecificDocuments();
  
  console.log('');
  await testWriteOperation();
  
  console.log('');
  await testQueryOperation();
  
  console.log('');
  await testPermissions();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log('');
  
  if (results.failed.length > 0) {
    console.log('Failed Tests:');
    results.failed.forEach(result => {
      console.log(`  - ${result.test}: ${result.message}`);
    });
    console.log('');
  }
  
  if (results.warnings.length > 0) {
    console.log('Warnings:');
    results.warnings.forEach(warning => {
      console.log(`  - ${warning.test}: ${warning.message}`);
    });
    console.log('');
  }
  
  // Clean up
  await admin.app().delete();
  
  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

