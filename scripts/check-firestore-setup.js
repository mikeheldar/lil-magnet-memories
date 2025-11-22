/**
 * Check Firestore setup and configuration
 */

console.log('🔍 Checking Firestore Setup\n');
console.log('Since you can access Firestore in the console, the database exists.');
console.log('The NOT_FOUND error from Admin SDK suggests:\n');
console.log('1. Firestore Admin API might not be enabled');
console.log('2. Database location/region configuration issue');
console.log('3. Service account permissions need time to propagate\n');
console.log('To check:\n');
console.log('1. Enable Firestore Admin API:');
console.log('   https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=lil-magnet-memories\n');
console.log('2. Check database location:');
console.log('   https://console.firebase.google.com/project/lil-magnet-memories/firestore/data\n');
console.log('3. Verify service account has these roles:');
console.log('   - Cloud Datastore User');
console.log('   - Firestore Service Agent (if available)\n');
console.log('4. Wait 2-3 minutes for permissions to fully propagate\n');
console.log('The fact that you can access it in the console means:');
console.log('✅ Database exists');
console.log('✅ Your user account has permissions');
console.log('❓ Service account permissions may need more time or different role\n');

