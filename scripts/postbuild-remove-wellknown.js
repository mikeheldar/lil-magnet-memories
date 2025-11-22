/**
 * Post-build script to remove .well-known directory from build output
 * This ensures the API route handles the Apple Pay domain association file
 * instead of serving a potentially cached static file
 */

const fs = require('fs');
const path = require('path');

const wellKnownPath = path.join(__dirname, '..', 'dist', 'spa', '.well-known');

try {
  if (fs.existsSync(wellKnownPath)) {
    fs.rmSync(wellKnownPath, { recursive: true, force: true });
    console.log('✅ Removed .well-known directory from build output');
    console.log('   Apple Pay file will be served via API route');
  } else {
    console.log('ℹ️  .well-known directory not found in build (already removed or never existed)');
  }
} catch (error) {
  console.error('❌ Error removing .well-known directory:', error.message);
  process.exit(1);
}

