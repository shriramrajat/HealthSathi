#!/usr/bin/env node

/**
 * Script to deploy Firestore security rules and indexes
 * Run with: node scripts/deploy-security-rules.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFirebaseProject() {
  try {
    const result = execSync('firebase projects:list', { encoding: 'utf8' });
    log('✓ Firebase CLI is installed and authenticated', 'green');
    return true;
  } catch (error) {
    log('✗ Firebase CLI not found or not authenticated', 'red');
    log('Please install Firebase CLI and run "firebase login"', 'yellow');
    return false;
  }
}

function checkRequiredFiles() {
  const requiredFiles = [
    'firebase.json',
    'firestore.rules',
    'storage.rules',
    'firestore.indexes.json'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    log(`✗ Missing required files: ${missingFiles.join(', ')}`, 'red');
    return false;
  }
  
  log('✓ All required files found', 'green');
  return true;
}

function deployRules() {
  try {
    log('Deploying Firestore security rules...', 'blue');
    execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
    log('✓ Firestore security rules deployed successfully', 'green');
    
    log('Deploying Storage security rules...', 'blue');
    execSync('firebase deploy --only storage', { stdio: 'inherit' });
    log('✓ Storage security rules deployed successfully', 'green');
    
    log('Deploying Firestore indexes...', 'blue');
    execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
    log('✓ Firestore indexes deployed successfully', 'green');
    
    return true;
  } catch (error) {
    log('✗ Failed to deploy security rules', 'red');
    log(error.message, 'red');
    return false;
  }
}

function validateRules() {
  try {
    log('Validating Firestore rules...', 'blue');
    
    // Read and validate firestore.rules
    const firestoreRules = fs.readFileSync('firestore.rules', 'utf8');
    if (!firestoreRules.includes('rules_version = \'2\'')) {
      throw new Error('Firestore rules must specify rules_version = \'2\'');
    }
    
    // Read and validate storage.rules
    const storageRules = fs.readFileSync('storage.rules', 'utf8');
    if (!storageRules.includes('rules_version = \'2\'')) {
      throw new Error('Storage rules must specify rules_version = \'2\'');
    }
    
    // Validate firebase.json
    const firebaseConfig = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    if (!firebaseConfig.firestore || !firebaseConfig.storage) {
      throw new Error('firebase.json must include firestore and storage configuration');
    }
    
    log('✓ Security rules validation passed', 'green');
    return true;
  } catch (error) {
    log('✗ Security rules validation failed', 'red');
    log(error.message, 'red');
    return false;
  }
}

function main() {
  log('🔒 Firebase Security Rules Deployment Script', 'cyan');
  log('==========================================', 'cyan');
  
  // Check prerequisites
  if (!checkFirebaseProject()) {
    process.exit(1);
  }
  
  if (!checkRequiredFiles()) {
    process.exit(1);
  }
  
  // Validate rules syntax
  if (!validateRules()) {
    process.exit(1);
  }
  
  // Deploy rules
  if (!deployRules()) {
    process.exit(1);
  }
  
  log('🎉 Security rules deployment completed successfully!', 'green');
  log('', 'reset');
  log('Next steps:', 'yellow');
  log('1. Test your security rules using Firebase emulator', 'reset');
  log('2. Verify rules in Firebase Console', 'reset');
  log('3. Monitor security rule violations in Firebase Console', 'reset');
}

if (require.main === module) {
  main();
}

module.exports = {
  checkFirebaseProject,
  checkRequiredFiles,
  validateRules,
  deployRules
};