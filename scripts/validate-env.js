#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * This script validates that all required environment variables are set
 * before building the application. It should be run as part of the build
 * process to catch configuration issues early.
 * 
 * Usage: node scripts/validate-env.js
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const optionalEnvVars = [
  'NEXT_PUBLIC_JITSI_DOMAIN',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_VERCEL_ANALYTICS_ID',
];

console.log('🔍 Validating environment variables...\n');

// Check required variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:\n');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\n💡 Tip: Copy .env.example to .env.local and fill in the values');
  console.error('   See docs/ENVIRONMENT.md for more information\n');
  process.exit(1);
}

console.log('✅ All required environment variables are set\n');

// Check optional variables
const missingOptionalVars = optionalEnvVars.filter(varName => !process.env[varName]);

if (missingOptionalVars.length > 0) {
  console.log('ℹ️  Optional environment variables not set:');
  missingOptionalVars.forEach(varName => console.log(`  - ${varName}`));
  console.log('');
}

// Display configured variables (without values for security)
console.log('📋 Environment configuration:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const maskedValue = value ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 'NOT SET';
  console.log(`  ✓ ${varName}: ${maskedValue}`);
});

console.log('\n✨ Environment validation complete!\n');
