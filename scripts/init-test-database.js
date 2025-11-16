#!/usr/bin/env node

/**
 * Script to initialize test Firebase database with default data
 * 
 * Usage:
 * 1. Download test service account key from Firebase Console
 * 2. Set environment variable:
 *    - TEST_SERVICE_ACCOUNT_PATH=/path/to/test-service-account.json
 * 3. Run: node scripts/init-test-database.js
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Project ID
const TEST_PROJECT_ID = 'lil-magnet-memories-test';

// Initialize Firebase Admin for test
function initTestAdmin() {
  const serviceAccountPath = process.env.TEST_SERVICE_ACCOUNT_PATH;
  
  if (!serviceAccountPath) {
    console.error('❌ TEST_SERVICE_ACCOUNT_PATH environment variable not set');
    console.error('   Download service account key from:');
    console.error(`   https://console.firebase.google.com/project/${TEST_PROJECT_ID}/settings/serviceaccounts/adminsdk`);
    process.exit(1);
  }

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Service account file not found: ${serviceAccountPath}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  return admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      projectId: TEST_PROJECT_ID,
    },
    'test'
  );
}

// Default products
const DEFAULT_PRODUCTS = [
  {
    id: 'magnet-2x3',
    name: '2x3 Magnet',
    price: 5.00,
    description: '2x3 inch custom magnet',
    size: '2x3',
    active: true,
  },
  {
    id: 'magnet-3x4',
    name: '3x4 Magnet',
    price: 7.00,
    description: '3x4 inch custom magnet',
    size: '3x4',
    active: true,
  },
  {
    id: 'magnet-4x6',
    name: '4x6 Magnet',
    price: 10.00,
    description: '4x6 inch custom magnet',
    size: '4x6',
    active: true,
  },
];

// Default admin config
const DEFAULT_ADMIN_CONFIG = {
  emails: [
    'michael.helmandarley@gmail.com',
    'amy.helmandarley@gmail.com',
    'lilmagnetmemories@gmail.com',
  ],
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

// Initialize collections
async function initializeCollections(testDb) {
  console.log('\n📦 Initializing collections...\n');

  // Initialize products
  console.log('📦 Creating products collection...');
  const productsCollection = testDb.collection('products');
  let productsCreated = 0;
  
  for (const product of DEFAULT_PRODUCTS) {
    try {
      await productsCollection.doc(product.id).set(product);
      console.log(`   ✅ Created product: ${product.name} (${product.id})`);
      productsCreated++;
    } catch (error) {
      console.error(`   ❌ Error creating product ${product.id}:`, error.message);
    }
  }
  
  console.log(`   ✅ Created ${productsCreated} product(s)\n`);

  // Initialize admin_config
  console.log('📦 Creating admin_config collection...');
  try {
    const adminConfigRef = testDb.collection('admin_config').doc('admin_emails');
    await adminConfigRef.set(DEFAULT_ADMIN_CONFIG);
    console.log(`   ✅ Created admin_config with ${DEFAULT_ADMIN_CONFIG.emails.length} admin email(s)`);
    console.log(`   Admin emails: ${DEFAULT_ADMIN_CONFIG.emails.join(', ')}\n`);
  } catch (error) {
    console.error(`   ❌ Error creating admin_config:`, error.message);
  }

  // Initialize settings (for shipping options)
  console.log('📦 Creating settings collection...');
  try {
    const settingsRef = testDb.collection('settings').doc('shippingOptions');
    const defaultShipping = {
      options: [
        {
          name: 'Standard Shipping',
          price: 5.00,
          days: '5-7',
          active: true,
        },
        {
          name: 'Express Shipping',
          price: 10.00,
          days: '2-3',
          active: true,
        },
      ],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await settingsRef.set(defaultShipping);
    console.log(`   ✅ Created settings/shippingOptions with ${defaultShipping.options.length} option(s)\n`);
  } catch (error) {
    console.error(`   ❌ Error creating settings:`, error.message);
  }
}

// Main function
async function main() {
  console.log('🚀 Initializing test Firebase database...\n');

  try {
    // Initialize Firebase Admin
    console.log('📡 Initializing Firebase Admin connection...');
    const testApp = initTestAdmin();
    const testDb = admin.firestore(testApp);

    console.log('✅ Connected to test project\n');

    // Initialize collections
    await initializeCollections(testDb);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database initialization completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Next steps:');
    console.log('   1. Check test Firestore: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore/data');
    console.log('   2. Verify products, admin_config, and settings collections exist');
    console.log('   3. Test the site: https://test.lilmagnetmemories.com');

    // Cleanup
    await testApp.delete();
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error during initialization:', error);
    process.exit(1);
  }
}

// Run the script
main();

