/**
 * Script to create the user_roles collection in production Firestore
 * 
 * This creates the user_roles/roles_config document that's missing in production
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load service account - try new admin account first, fallback to prod account
const adminAccountPath = path.join(__dirname, '..', 'firestore-admin-service-account.json');
const prodAccountPath = path.join(__dirname, '..', 'prod-service-account.json');

let serviceAccountPath;
if (fs.existsSync(adminAccountPath)) {
  serviceAccountPath = adminAccountPath;
  console.log('📋 Using firestore-admin-service-account.json');
} else if (fs.existsSync(prodAccountPath)) {
  serviceAccountPath = prodAccountPath;
  console.log('📋 Using prod-service-account.json (may need additional permissions)');
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

async function createUserRolesCollection() {
  try {
    console.log('🔍 Checking if user_roles/roles_config exists...');
    
    const rolesConfigRef = db.collection('user_roles').doc('roles_config');
    
    // Try to get the document
    let doc;
    try {
      doc = await rolesConfigRef.get();
    } catch (getError) {
      // If collection doesn't exist, get() might fail, but we can still create it
      console.log('⚠️  Collection may not exist yet, will create it...');
      doc = null;
    }
    
    if (doc && doc.exists) {
      console.log('✅ user_roles/roles_config already exists');
      console.log('📄 Current data:', JSON.stringify(doc.data(), null, 2));
      return;
    }
    
    console.log('📝 Creating user_roles/roles_config...');
    
    // Create the document with initial structure
    // Using set() with merge: false to create a new document
    const data = {
      roles: {},
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await rolesConfigRef.set(data, { merge: false });
    
    // Verify it was created
    const verifyDoc = await rolesConfigRef.get();
    if (verifyDoc.exists) {
      console.log('✅ Successfully created user_roles/roles_config in production!');
      console.log('📋 Document structure:');
      console.log('   - Collection: user_roles');
      console.log('   - Document ID: roles_config');
      console.log('   - Fields: roles (map), updatedAt (timestamp)');
      console.log('📄 Created data:', JSON.stringify(verifyDoc.data(), null, 2));
    } else {
      console.error('❌ Document was not created successfully');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error creating user_roles collection:', error.message);
    console.error('Error code:', error.code);
    if (error.code === 5) {
      console.error('💡 NOT_FOUND error - This might mean:');
      console.error('   1. Firestore database is not initialized in this project');
      console.error('   2. Service account does not have proper permissions');
      console.error('   3. Database location mismatch');
      console.error('\n💡 Try creating it manually in Firebase Console:');
      console.error('   https://console.firebase.google.com/project/lil-magnet-memories/firestore/data');
    }
    process.exit(1);
  } finally {
    // Clean up
    try {
      await admin.app().delete();
    } catch (deleteError) {
      // Ignore cleanup errors
    }
  }
}

createUserRolesCollection();

