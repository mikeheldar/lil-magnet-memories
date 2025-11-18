#!/usr/bin/env node

/**
 * Script to list all collections in a Firebase project
 */

const admin = require('firebase-admin');
const fs = require('fs');

const PROJECT_ID = process.env.PROJECT_ID || 'lil-magnet-memories';
const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH || './prod-service-account.json';

// Initialize Firebase Admin
function initAdmin() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`❌ Service account file not found: ${SERVICE_ACCOUNT_PATH}`);
    console.error('   Set SERVICE_ACCOUNT_PATH environment variable');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  
  return admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID,
    }
  );
}

// List all collections
async function listCollections(db) {
  console.log(`\n📋 Listing collections in project: ${PROJECT_ID}\n`);
  
  try {
    // Firestore doesn't have a direct way to list collections
    // We'll try to read from common collection names
    const commonCollections = ['products', 'adminConfig', 'admin_config', 'orders', 'marketEvents', 'settings'];
    
    const results = {};
    
    for (const collectionName of commonCollections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        if (!snapshot.empty) {
          const fullSnapshot = await db.collection(collectionName).get();
          results[collectionName] = fullSnapshot.size;
          console.log(`   ✅ ${collectionName}: ${fullSnapshot.size} document(s)`);
        } else {
          console.log(`   ⚠️  ${collectionName}: exists but is empty`);
        }
      } catch (error) {
        if (error.code === 5 || error.message.includes('NOT_FOUND')) {
          console.log(`   ❌ ${collectionName}: does not exist`);
        } else {
          console.log(`   ❌ ${collectionName}: error - ${error.message}`);
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const existingCollections = Object.keys(results);
    if (existingCollections.length > 0) {
      existingCollections.forEach(name => {
        console.log(`   ${name}: ${results[name]} documents`);
      });
    } else {
      console.log('   No collections found with common names');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Error listing collections:', error);
  }
}

// Main function
async function main() {
  try {
    const app = initAdmin();
    const db = admin.firestore(app);
    
    await listCollections(db);
    
    await app.delete();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

