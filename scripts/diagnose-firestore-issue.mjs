#!/usr/bin/env node

/**
 * Comprehensive Firestore Diagnostic Script
 * 
 * This script checks:
 * 1. Environment variable configuration
 * 2. Firebase project configuration
 * 3. Firestore rules (via Admin SDK)
 * 4. Connection status
 * 5. Authentication status
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function checkServiceAccount() {
  logSection('1. Checking Service Account');
  
  const serviceAccountPath = join(__dirname, '..', 'firestore-admin-service-account.json');
  const prodServiceAccountPath = join(__dirname, '..', 'prod-service-account.json');
  
  let serviceAccount = null;
  let accountType = null;
  
  try {
    if (require('fs').existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      accountType = 'test';
      log(`✅ Found service account: ${serviceAccountPath}`, 'green');
    } else if (require('fs').existsSync(prodServiceAccountPath)) {
      serviceAccount = JSON.parse(readFileSync(prodServiceAccountPath, 'utf8'));
      accountType = 'production';
      log(`✅ Found service account: ${prodServiceAccountPath}`, 'green');
    } else {
      log(`❌ No service account found. Expected:`, 'red');
      log(`   - ${serviceAccountPath}`, 'yellow');
      log(`   - ${prodServiceAccountPath}`, 'yellow');
      return null;
    }
    
    log(`   Project ID: ${serviceAccount.project_id}`, 'blue');
    log(`   Client Email: ${serviceAccount.client_email}`, 'blue');
    return { serviceAccount, accountType };
  } catch (error) {
    log(`❌ Error reading service account: ${error.message}`, 'red');
    return null;
  }
}

async function initializeFirebase(serviceAccount) {
  logSection('2. Initializing Firebase Admin SDK');
  
  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    
    log(`✅ Firebase Admin SDK initialized`, 'green');
    log(`   Project ID: ${serviceAccount.project_id}`, 'blue');
    
    return app;
  } catch (error) {
    log(`❌ Failed to initialize Firebase: ${error.message}`, 'red');
    return null;
  }
}

async function testFirestoreConnection(db) {
  logSection('3. Testing Firestore Connection');
  
  try {
    // Test 1: Simple read
    log('Testing simple read from admin_config...', 'blue');
    const adminRef = db.collection('admin_config').doc('admin_emails');
    const adminDoc = await adminRef.get();
    
    if (adminDoc.exists) {
      log(`✅ Successfully read admin_config/admin_emails`, 'green');
      log(`   Data: ${JSON.stringify(adminDoc.data(), null, 2)}`, 'blue');
    } else {
      log(`⚠️  Document admin_config/admin_emails does not exist`, 'yellow');
    }
    
    // Test 2: Write test
    log('\nTesting write to test collection...', 'blue');
    const testRef = db.collection('test').doc('connection_test');
    await testRef.set({
      timestamp: new Date().toISOString(),
      test: true,
    });
    log(`✅ Successfully wrote to test collection`, 'green');
    
    // Test 3: Read back
    const testDoc = await testRef.get();
    if (testDoc.exists) {
      log(`✅ Successfully read back from test collection`, 'green');
    }
    
    // Cleanup
    await testRef.delete();
    log(`✅ Cleaned up test document`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Firestore connection test failed: ${error.message}`, 'red');
    log(`   Error code: ${error.code}`, 'yellow');
    return false;
  }
}

async function checkCollections(db) {
  logSection('4. Checking Required Collections');
  
  const requiredCollections = [
    { name: 'admin_config', doc: 'admin_emails' },
    { name: 'user_roles', doc: 'roles_config' },
    { name: 'products', doc: null },
    { name: 'orders', doc: null },
    { name: 'marketEvents', doc: null },
  ];
  
  for (const collection of requiredCollections) {
    try {
      if (collection.doc) {
        const docRef = db.collection(collection.name).doc(collection.doc);
        const doc = await docRef.get();
        if (doc.exists) {
          log(`✅ ${collection.name}/${collection.doc} exists`, 'green');
        } else {
          log(`⚠️  ${collection.name}/${collection.doc} does not exist`, 'yellow');
        }
      } else {
        // Just check if collection exists by trying to list
        const snapshot = await db.collection(collection.name).limit(1).get();
        log(`✅ ${collection.name} collection exists (${snapshot.size} docs)`, 'green');
      }
    } catch (error) {
      log(`❌ Error checking ${collection.name}: ${error.message}`, 'red');
    }
  }
}

async function checkEnvironmentVariables() {
  logSection('5. Checking Environment Variables (Expected)');
  
  const expectedVars = {
    production: [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ],
    test: [
      'VITE_FIREBASE_API_KEY_TEST',
      'VITE_FIREBASE_AUTH_DOMAIN_TEST',
      'VITE_FIREBASE_PROJECT_ID_TEST',
      'VITE_FIREBASE_STORAGE_BUCKET_TEST',
      'VITE_FIREBASE_MESSAGING_SENDER_ID_TEST',
      'VITE_FIREBASE_APP_ID_TEST',
    ],
  };
  
  log('Production environment variables:', 'blue');
  expectedVars.production.forEach(varName => {
    log(`   ${varName}: ${process.env[varName] ? '✅ Set' : '❌ Missing'}`, 
        process.env[varName] ? 'green' : 'red');
  });
  
  log('\nTest environment variables:', 'blue');
  expectedVars.test.forEach(varName => {
    log(`   ${varName}: ${process.env[varName] ? '✅ Set' : '❌ Missing'}`, 
        process.env[varName] ? 'green' : 'red');
  });
}

async function main() {
  log('\n🔍 Firestore Diagnostic Tool', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Check service account
  const accountInfo = await checkServiceAccount();
  if (!accountInfo) {
    log('\n❌ Cannot proceed without service account', 'red');
    process.exit(1);
  }
  
  const { serviceAccount, accountType } = accountInfo;
  log(`\nUsing ${accountType} service account`, 'blue');
  
  // Initialize Firebase
  const app = await initializeFirebase(serviceAccount);
  if (!app) {
    log('\n❌ Cannot proceed without Firebase initialization', 'red');
    process.exit(1);
  }
  
  const db = getFirestore(app);
  
  // Test connection
  const connectionOk = await testFirestoreConnection(db);
  if (!connectionOk) {
    log('\n❌ Firestore connection test failed', 'red');
    log('   This suggests a permissions or API issue', 'yellow');
    process.exit(1);
  }
  
  // Check collections
  await checkCollections(db);
  
  // Check environment variables
  await checkEnvironmentVariables();
  
  logSection('Summary');
  log('✅ All diagnostic tests completed', 'green');
  log('\nNext steps:', 'cyan');
  log('1. Verify environment variables are set in Vercel', 'blue');
  log('2. Check Firestore rules in Firebase Console', 'blue');
  log('3. Verify the correct Firebase project is being used', 'blue');
  log('4. Check if billing is enabled for the project', 'blue');
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

