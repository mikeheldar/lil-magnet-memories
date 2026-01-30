#!/usr/bin/env node

/**
 * Initialize sortOrder for all existing products
 * This script adds a sortOrder field to all products that don't have one
 * Products are ordered by their current Firestore order (description)
 */

const admin = require('firebase-admin');

// Project ID
const PROJECT_ID = process.env.PROJECT_ID || 'lil-magnet-memories';

console.log(`Initializing sortOrder for products in project: ${PROJECT_ID}`);

// Initialize Firebase Admin
const app = admin.initializeApp({
  projectId: PROJECT_ID,
});

const db = app.firestore();

async function initializeProductSortOrder() {
  try {
    console.log('\n📥 Fetching all products...');
    
    const productsCollection = db.collection('products');
    const snapshot = await productsCollection.orderBy('description', 'asc').get();
    
    if (snapshot.empty) {
      console.log('⚠️  No products found in the database.');
      process.exit(0);
    }
    
    console.log(`✅ Found ${snapshot.size} product(s)\n`);
    
    let updated = 0;
    let skipped = 0;
    
    // Process each product
    const batch = db.batch();
    const products = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        description: data.description,
        category: data.category || 'custom',
        collection: data.collection || 'Uncategorized',
        sortOrder: data.sortOrder,
      });
    });
    
    // Group by category and collection for proper ordering
    const groupedProducts = {};
    products.forEach((product) => {
      const key = `${product.category}::${product.collection}`;
      if (!groupedProducts[key]) {
        groupedProducts[key] = [];
      }
      groupedProducts[key].push(product);
    });
    
    // Assign sortOrder within each group
    console.log('📊 Assigning sort orders...\n');
    
    Object.keys(groupedProducts).forEach((key) => {
      const [category, collection] = key.split('::');
      console.log(`  Category: ${category}, Collection: ${collection}`);
      
      groupedProducts[key].forEach((product, index) => {
        if (product.sortOrder === undefined || product.sortOrder === null) {
          const productRef = productsCollection.doc(product.id);
          batch.update(productRef, {
            sortOrder: index,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`    ✅ ${product.description} -> sortOrder: ${index}`);
          updated++;
        } else {
          console.log(`    ⏭️  ${product.description} -> already has sortOrder: ${product.sortOrder}`);
          skipped++;
        }
      });
      console.log('');
    });
    
    // Commit all updates
    if (updated > 0) {
      console.log(`💾 Committing ${updated} update(s)...`);
      await batch.commit();
      console.log('✅ Batch update completed\n');
    }
    
    console.log('📊 Migration Summary:');
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ⏭️  Skipped (already have sortOrder): ${skipped}`);
    console.log(`  📋 Total products: ${snapshot.size}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing product sort order:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

initializeProductSortOrder();
