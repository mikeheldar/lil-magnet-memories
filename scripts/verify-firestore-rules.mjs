#!/usr/bin/env node

/**
 * Verify Firestore Rules Match Expected Configuration
 * 
 * This script compares the expected rules (from files) with what should be deployed.
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

function analyzeRules(rulesContent, environment) {
  logSection(`Firestore Rules Analysis - ${environment}`);
  
  // Check for admin_config rules
  const adminConfigPattern = /match\s+\/admin_config/;
  if (adminConfigPattern.test(rulesContent)) {
    log('✅ admin_config collection rule found', 'green');
    
    // Check if it allows read for authenticated users
    const adminConfigSection = rulesContent.match(/match\s+\/admin_config\/[^}]+}/s);
    if (adminConfigSection) {
      const section = adminConfigSection[0];
      if (section.includes('allow read: if request.auth != null')) {
        log('✅ admin_config allows read for authenticated users', 'green');
      } else if (section.includes('allow read: if true')) {
        log('⚠️  admin_config allows public read (test rules)', 'yellow');
      } else {
        log('❌ admin_config read rule not found or incorrect', 'red');
      }
    }
  } else {
    log('❌ admin_config collection rule NOT FOUND', 'red');
  }
  
  // Check for user_roles rules
  const userRolesPattern = /match\s+\/user_roles/;
  if (userRolesPattern.test(rulesContent)) {
    log('✅ user_roles collection rule found', 'green');
  } else {
    log('⚠️  user_roles collection rule not found', 'yellow');
  }
  
  // Check for catch-all deny rule
  if (rulesContent.includes('allow read, write: if false')) {
    log('⚠️  Catch-all deny rule found (may block unexpected collections)', 'yellow');
  }
}

function main() {
  log('\n🔍 Firestore Rules Verification Tool', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Read production rules
  const prodRulesPath = join(__dirname, '..', 'production-firestore-rules.txt');
  try {
    const prodRules = readFileSync(prodRulesPath, 'utf8');
    analyzeRules(prodRules, 'PRODUCTION');
  } catch (error) {
    log(`❌ Could not read ${prodRulesPath}: ${error.message}`, 'red');
  }
  
  // Read test rules
  const testRulesPath = join(__dirname, '..', 'test-firestore-rules.txt');
  try {
    const testRules = readFileSync(testRulesPath, 'utf8');
    analyzeRules(testRules, 'TEST');
  } catch (error) {
    log(`❌ Could not read ${testRulesPath}: ${error.message}`, 'red');
  }
  
  logSection('Critical Check for Production');
  log('The production rules require:', 'blue');
  log('  - admin_config: allow read: if request.auth != null', 'yellow');
  log('  - user_roles: allow read: if request.auth != null', 'yellow');
  log('\nIf the user is authenticated but operations still timeout:', 'red');
  log('  1. Check if Firestore API is enabled in Google Cloud Console', 'yellow');
  log('  2. Check if billing is enabled for the Firebase project', 'yellow');
  log('  3. Verify the correct Firebase project ID is in Vercel env vars', 'yellow');
  log('  4. Check browser console for actual Firebase config being used', 'yellow');
  
  logSection('How to Verify Rules in Firebase Console');
  log('1. Go to Firebase Console → Your Project → Firestore Database → Rules', 'blue');
  log('2. Compare the rules there with production-firestore-rules.txt', 'blue');
  log('3. Make sure admin_config rule allows: allow read: if request.auth != null', 'blue');
  log('4. Click "Publish" if you made any changes', 'blue');
}

main();

