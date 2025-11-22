#!/usr/bin/env node

/**
 * Check Vercel Environment Variables
 * 
 * This script helps verify which environment variables should be set in Vercel
 * for both production and test environments.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Read environment.js to understand what variables are expected
function analyzeEnvironmentConfig() {
  logSection('Environment Variable Requirements');
  
  const envFile = join(__dirname, '..', 'src', 'config', 'environment.js');
  let content;
  try {
    content = readFileSync(envFile, 'utf8');
  } catch (error) {
    log(`❌ Could not read ${envFile}`, 'red');
    return;
  }
  
  log('\n📋 Production Environment Variables:', 'blue');
  log('   (Used when hostname is NOT test.lilmagnetmemories.com)', 'yellow');
  const prodVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];
  prodVars.forEach(varName => {
    log(`   - ${varName}`, 'green');
  });
  
  log('\n📋 Test Environment Variables:', 'blue');
  log('   (Used when hostname IS test.lilmagnetmemories.com)', 'yellow');
  const testVars = [
    'VITE_FIREBASE_API_KEY_TEST',
    'VITE_FIREBASE_AUTH_DOMAIN_TEST',
    'VITE_FIREBASE_PROJECT_ID_TEST',
    'VITE_FIREBASE_STORAGE_BUCKET_TEST',
    'VITE_FIREBASE_MESSAGING_SENDER_ID_TEST',
    'VITE_FIREBASE_APP_ID_TEST',
  ];
  testVars.forEach(varName => {
    log(`   - ${varName}`, 'green');
  });
  
  logSection('How to Check in Vercel');
  log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables', 'blue');
  log('2. Check that ALL production variables are set for:', 'blue');
  log('   - Production', 'yellow');
  log('   - Preview (optional, but recommended)', 'yellow');
  log('3. Check that ALL test variables are set for:', 'blue');
  log('   - Preview (for test.lilmagnetmemories.com)', 'yellow');
  log('4. Verify the values match your Firebase Console project settings', 'blue');
  
  logSection('Common Issues');
  log('❌ Missing _TEST variables → Test site uses production Firebase project', 'red');
  log('❌ Wrong PROJECT_ID → Connects to wrong Firebase project', 'red');
  log('❌ Wrong API_KEY → Authentication fails', 'red');
  log('❌ Wrong STORAGE_BUCKET → Storage operations fail', 'red');
  
  logSection('Verification Steps');
  log('1. Open browser console on production site (www.lilmagnetmemories.com)', 'blue');
  log('2. Check console logs for:', 'blue');
  log('   - "Firebase Project ID: <expected-id>"', 'yellow');
  log('   - "Environment: production"', 'yellow');
  log('3. Open browser console on test site (test.lilmagnetmemories.com)', 'blue');
  log('4. Check console logs for:', 'blue');
  log('   - "Firebase Project ID: <test-id>"', 'yellow');
  log('   - "Environment: test"', 'yellow');
  log('5. If Project IDs don\'t match expected values, environment variables are wrong', 'red');
}

analyzeEnvironmentConfig();

