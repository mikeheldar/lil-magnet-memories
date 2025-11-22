/**
 * Migrate data from "lil-magnet-memories" database to "(default)" database
 * 
 * This script will:
 * 1. Read all collections from source database (lil-magnet-memories)
 * 2. Copy all documents to destination database ((default))
 * 3. Preserve document IDs and all field types
 * 4. Show progress for each collection
 * 
 * Usage: node scripts/migrate-to-default-db.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const prodAccountPath = path.join(__dirname, '..', 'prod-service-account.json');

if (!fs.existsSync(prodAccountPath)) {
  console.error('❌ Service account not found:', prodAccountPath);
  process.exit(1);
}

const serviceAccount = require(prodAccountPath);

console.log('🔄 Firestore Database Migration');
console.log('================================');
console.log(`Project: ${serviceAccount.project_id}`);
console.log(`Source Database: lil-magnet-memories`);
console.log(`Destination Database: (default)`);
console.log('');

// Initialize Firebase
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

// Get both database instances
const sourceDb = getFirestore(app, 'lil-magnet-memories');
const destDb = getFirestore(app);

async function migrateCollection(collectionName) {
  console.log(`\n📦 Migrating collection: ${collectionName}`);
  
  try {
    // Get all documents from source
    const sourceSnapshot = await sourceDb.collection(collectionName).get();
    
    if (sourceSnapshot.empty) {
      console.log(`   ⏭️  Collection is empty, skipping`);
      return { count: 0, errors: 0 };
    }
    
    console.log(`   📄 Found ${sourceSnapshot.size} document(s)`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Migrate each document
    for (const sourceDoc of sourceSnapshot.docs) {
      try {
        const data = sourceDoc.data();
        const docId = sourceDoc.id;
        
        // Write to destination with same document ID
        await destDb.collection(collectionName).doc(docId).set(data);
        successCount++;
        
        if (successCount % 10 === 0) {
          process.stdout.write(`   ✅ Migrated ${successCount}/${sourceSnapshot.size} documents...\r`);
        }
      } catch (error) {
        errorCount++;
        console.error(`\n   ❌ Error migrating document ${sourceDoc.id}: ${error.message}`);
      }
    }
    
    console.log(`\n   ✅ Completed: ${successCount} migrated, ${errorCount} errors`);
    return { count: successCount, errors: errorCount };
    
  } catch (error) {
    console.error(`   ❌ Error reading collection: ${error.message}`);
    return { count: 0, errors: 1 };
  }
}

async function listCollections(db) {
  try {
    const collections = await db.listCollections();
    return collections.map(col => col.id);
  } catch (error) {
    console.error(`❌ Error listing collections: ${error.message}`);
    return [];
  }
}

async function main() {
  try {
    console.log('🔍 Step 1: Listing collections in source database...');
    const sourceCollections = await listCollections(sourceDb);
    
    if (sourceCollections.length === 0) {
      console.log('❌ No collections found in source database');
      process.exit(1);
    }
    
    console.log(`✅ Found ${sourceCollections.length} collection(s):`);
    sourceCollections.forEach(col => console.log(`   - ${col}`));
    
    console.log('\n🔍 Step 2: Checking destination database...');
    const destCollections = await listCollections(destDb);
    console.log(`✅ Destination has ${destCollections.length} collection(s)`);
    
    if (destCollections.length > 0) {
      console.log('\n⚠️  WARNING: Destination database already has collections!');
      console.log('   Collections:', destCollections.join(', '));
      console.log('   This migration will ADD to existing data (may create duplicates)');
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log('\n🚀 Step 3: Starting migration...\n');
    
    let totalMigrated = 0;
    let totalErrors = 0;
    const results = {};
    
    // Migrate each collection
    for (const collectionName of sourceCollections) {
      const result = await migrateCollection(collectionName);
      totalMigrated += result.count;
      totalErrors += result.errors;
      results[collectionName] = result;
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary');
    console.log('='.repeat(50));
    console.log(`Total Collections: ${sourceCollections.length}`);
    console.log(`Total Documents Migrated: ${totalMigrated}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log('\nPer Collection:');
    Object.entries(results).forEach(([collection, result]) => {
      console.log(`   ${collection}: ${result.count} documents, ${result.errors} errors`);
    });
    
    if (totalErrors === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Verify data in Firebase Console:');
      console.log('      https://console.firebase.google.com/project/lil-magnet-memories/firestore/data');
      console.log('   2. Update your app to use (default) database');
      console.log('   3. Test thoroughly before deleting the old database');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review above.');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    await admin.app().delete();
  }
}

main();

