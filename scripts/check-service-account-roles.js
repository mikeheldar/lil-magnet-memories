/**
 * Check and compare service account roles for test vs production
 * This will show actual roles including inherited ones
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const prodAccountPath = path.join(__dirname, '..', 'prod-service-account.json');
const testAccountPath = path.join(__dirname, '..', 'test-service-account.json');

function getServiceAccountEmail(accountPath) {
  if (!fs.existsSync(accountPath)) {
    return null;
  }
  const serviceAccount = require(accountPath);
  return serviceAccount.client_email;
}

function getProjectId(accountPath) {
  if (!fs.existsSync(accountPath)) {
    return null;
  }
  const serviceAccount = require(accountPath);
  return serviceAccount.project_id;
}

function checkRoles(projectId, serviceAccountEmail) {
  try {
    console.log(`\n🔍 Checking roles for: ${serviceAccountEmail}`);
    console.log(`   Project: ${projectId}`);
    
    // Use gcloud to get IAM policy
    const command = `gcloud projects get-iam-policy ${projectId} --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:${serviceAccountEmail}"`;
    
    try {
      const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
      const roles = output
        .split('\n')
        .filter(line => line.trim() && !line.includes('ROLE'))
        .map(line => line.trim())
        .filter(Boolean);
      
      return roles;
    } catch (error) {
      console.log(`   ⚠️  Could not check via gcloud: ${error.message}`);
      console.log(`   💡 Make sure you're authenticated: gcloud auth login`);
      return null;
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

function checkFirestoreAccess(accountPath, environment) {
  const admin = require('firebase-admin');
  const serviceAccount = require(accountPath);
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    const db = admin.firestore();
    
    return new Promise(async (resolve) => {
      try {
        // Try to list collections (requires read permission)
        const collections = await db.listCollections();
        const canRead = collections.length >= 0; // If no error, can read
        
        // Try to write (requires write permission)
        const testRef = db.collection('test').doc('role-check-test');
        await testRef.set({
          test: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          environment: environment
        });
        const canWrite = true;
        
        // Clean up
        await testRef.delete();
        
        await admin.app().delete();
        
        resolve({ canRead, canWrite, error: null });
      } catch (error) {
        await admin.app().delete();
        resolve({ 
          canRead: false, 
          canWrite: false, 
          error: {
            message: error.message,
            code: error.code
          }
        });
      }
    });
  } catch (error) {
    return Promise.resolve({
      canRead: false,
      canWrite: false,
      error: { message: error.message, code: error.code }
    });
  }
}

async function main() {
  console.log('🔍 Service Account Role Comparison');
  console.log('=====================================\n');
  
  const prodEmail = getServiceAccountEmail(prodAccountPath);
  const testEmail = getServiceAccountEmail(testAccountPath);
  const prodProjectId = getProjectId(prodAccountPath);
  const testProjectId = getProjectId(testAccountPath);
  
  if (!prodEmail || !testEmail) {
    console.error('❌ Service account files not found');
    process.exit(1);
  }
  
  console.log('📋 Service Accounts:');
  console.log(`   Production: ${prodEmail}`);
  console.log(`   Test: ${testEmail}`);
  
  // Check roles via gcloud
  console.log('\n📊 Checking IAM Roles (via gcloud)...');
  console.log('   (This requires gcloud CLI and authentication)');
  
  const prodRoles = checkRoles(prodProjectId, prodEmail);
  const testRoles = checkRoles(testProjectId, testEmail);
  
  if (prodRoles && testRoles) {
    console.log('\n📋 Role Comparison:');
    console.log('\n   Production Roles:');
    prodRoles.forEach(role => console.log(`      - ${role}`));
    
    console.log('\n   Test Roles:');
    testRoles.forEach(role => console.log(`      - ${role}`));
    
    // Find differences
    const prodSet = new Set(prodRoles);
    const testSet = new Set(testRoles);
    
    const onlyInProd = prodRoles.filter(r => !testSet.has(r));
    const onlyInTest = testRoles.filter(r => !prodSet.has(r));
    
    if (onlyInProd.length > 0) {
      console.log('\n   ⚠️  Roles only in Production:');
      onlyInProd.forEach(role => console.log(`      - ${role}`));
    }
    
    if (onlyInTest.length > 0) {
      console.log('\n   ⚠️  Roles only in Test:');
      onlyInTest.forEach(role => console.log(`      - ${role}`));
      console.log('\n   💡 These missing roles in production might be the issue!');
    }
    
    if (onlyInProd.length === 0 && onlyInTest.length === 0) {
      console.log('\n   ✅ Both have the same roles');
    }
  }
  
  // Test actual Firestore access
  console.log('\n🧪 Testing Actual Firestore Access...');
  
  console.log('\n   Testing Production...');
  const prodAccess = await checkFirestoreAccess(prodAccountPath, 'prod');
  if (prodAccess.canRead && prodAccess.canWrite) {
    console.log('   ✅ Production: Can read and write');
  } else {
    console.log(`   ❌ Production: Read=${prodAccess.canRead}, Write=${prodAccess.canWrite}`);
    if (prodAccess.error) {
      console.log(`      Error: ${prodAccess.error.message} (code: ${prodAccess.error.code})`);
    }
  }
  
  console.log('\n   Testing Test...');
  const testAccess = await checkFirestoreAccess(testAccountPath, 'test');
  if (testAccess.canRead && testAccess.canWrite) {
    console.log('   ✅ Test: Can read and write');
  } else {
    console.log(`   ❌ Test: Read=${testAccess.canRead}, Write=${testAccess.canWrite}`);
    if (testAccess.error) {
      console.log(`      Error: ${testAccess.error.message} (code: ${testAccess.error.code})`);
    }
  }
  
  // Summary
  console.log('\n📋 Summary:');
  if (prodAccess.canWrite && testAccess.canWrite) {
    console.log('   ✅ Both environments can write to Firestore');
  } else if (testAccess.canWrite && !prodAccess.canWrite) {
    console.log('   ⚠️  Test works, Production does not');
    console.log('   💡 Check for missing roles in production (see above)');
    console.log('   💡 Or check database location/region configuration');
  }
}

main().catch(console.error);

