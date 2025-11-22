/**
 * Check Firestore database configuration and try different connection methods
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const prodAccountPath = path.join(__dirname, '..', 'prod-service-account.json');
const serviceAccount = require(prodAccountPath);

console.log('🔍 Checking Firestore Database Configuration');
console.log('=============================================\n');
console.log(`Project: ${serviceAccount.project_id}`);
console.log(`Service Account: ${serviceAccount.client_email}`);
console.log('');

// Try to get database info via gcloud
console.log('📊 Checking database configuration via gcloud...');
try {
  const command = `gcloud firestore databases list --project=${serviceAccount.project_id} --format=json`;
  const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
  const databases = JSON.parse(output);
  
  console.log(`✅ Found ${databases.length} database(s):\n`);
  databases.forEach((db, index) => {
    console.log(`Database ${index + 1}:`);
    console.log(`   Name: ${db.name}`);
    console.log(`   Location: ${db.locationId || 'N/A'}`);
    console.log(`   Type: ${db.type || 'N/A'}`);
    console.log(`   Database ID: ${db.name.split('/').pop() || 'N/A'}`);
    console.log('');
  });
  
  // Try connecting with each database ID
  if (databases.length > 0) {
    console.log('🧪 Testing Admin SDK connection with each database...\n');
    
    for (const dbInfo of databases) {
      await (async () => {
      const databaseId = dbInfo.name.split('/').pop();
      console.log(`Testing with database ID: "${databaseId}"`);
      
      try {
        // Reinitialize for each database
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        }, `test-${databaseId}`);
        
        const db = admin.firestore();
        
        // Try to list collections
        const collections = await db.listCollections();
        console.log(`   ✅ Success! Found ${collections.length} collections`);
        collections.forEach(col => console.log(`      - ${col.id}`));
        
        // Try to write
        const testRef = db.collection('test').doc(`db-test-${Date.now()}`);
        await testRef.set({
          test: true,
          databaseId: databaseId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`   ✅ Write successful!`);
        
        // Clean up
        await testRef.delete();
        console.log(`   ✅ Test document cleaned up`);
        
        await admin.app(`test-${databaseId}`).delete();
        console.log(`\n✅ Database "${databaseId}" is accessible!\n`);
        return true;
        
      } catch (error) {
        try {
          await admin.app(`test-${databaseId}`).delete();
        } catch {}
        console.log(`   ❌ Failed: ${error.message} (code: ${error.code})`);
        return false;
      }
      })();
    }
  }
  
} catch (error) {
  console.log(`❌ Could not list databases: ${error.message}`);
  console.log('   💡 Make sure gcloud CLI is installed and authenticated');
  console.log('   💡 Run: gcloud auth login');
}

// Also try the standard method
async function testStandardConnection() {
  console.log('\n🧪 Testing standard Admin SDK connection...\n');
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    const db = admin.firestore();
    const collections = await db.listCollections();
    console.log(`✅ Standard connection works! Found ${collections.length} collections`);
    
    await admin.app().delete();
  } catch (error) {
    console.log(`❌ Standard connection failed: ${error.message} (code: ${error.code})`);
  }
}

// Main execution
(async () => {
  try {
    // Try to get database info via gcloud
    console.log('📊 Checking database configuration via gcloud...');
    const command = `gcloud firestore databases list --project=${serviceAccount.project_id} --format=json`;
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    const databases = JSON.parse(output);
    
    console.log(`✅ Found ${databases.length} database(s):\n`);
    databases.forEach((db, index) => {
      console.log(`Database ${index + 1}:`);
      console.log(`   Name: ${db.name}`);
      console.log(`   Location: ${db.locationId || 'N/A'}`);
      console.log(`   Type: ${db.type || 'N/A'}`);
      console.log(`   Database ID: ${db.name.split('/').pop() || 'N/A'}`);
      console.log('');
    });
    
    // Try connecting with each database ID
    if (databases.length > 0) {
      console.log('🧪 Testing Admin SDK connection with each database...\n');
      
      for (const dbInfo of databases) {
        const databaseId = dbInfo.name.split('/').pop();
        console.log(`Testing with database ID: "${databaseId}"`);
        
        try {
          // Reinitialize for each database
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
          }, `test-${databaseId}`);
          
          const db = admin.firestore();
          
          // Try to list collections
          const collections = await db.listCollections();
          console.log(`   ✅ Success! Found ${collections.length} collections`);
          collections.forEach(col => console.log(`      - ${col.id}`));
          
          // Try to write
          const testRef = db.collection('test').doc(`db-test-${Date.now()}`);
          await testRef.set({
            test: true,
            databaseId: databaseId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`   ✅ Write successful!`);
          
          // Clean up
          await testRef.delete();
          console.log(`   ✅ Test document cleaned up`);
          
          await admin.app(`test-${databaseId}`).delete();
          console.log(`\n✅ Database "${databaseId}" is accessible!\n`);
          break;
          
        } catch (error) {
          try {
            await admin.app(`test-${databaseId}`).delete();
          } catch {}
          console.log(`   ❌ Failed: ${error.message} (code: ${error.code})`);
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Could not list databases: ${error.message}`);
    console.log('   💡 Make sure gcloud CLI is installed and authenticated');
    console.log('   💡 Run: gcloud auth login');
  }
  
  await testStandardConnection();
})();

