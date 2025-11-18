/**
 * Debug script to check environment variables
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('\n🔍 Environment Variables Debug\n');
console.log('━'.repeat(60));

const envVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET'
];

envVars.forEach(key => {
  const value = process.env[key];
  
  console.log(`\n${key}:`);
  console.log(`  Exists: ${value ? '✅ Yes' : '❌ No'}`);
  console.log(`  Type: ${typeof value}`);
  console.log(`  Length: ${value ? value.length : 0}`);
  console.log(`  Is Empty: ${value === '' ? '❌ Yes' : '✅ No'}`);
  console.log(`  Is Undefined: ${value === undefined ? '❌ Yes' : '✅ No'}`);
  console.log(`  Starts with spaces: ${value && value[0] === ' ' ? '❌ Yes' : '✅ No'}`);
  console.log(`  Ends with spaces: ${value && value[value.length - 1] === ' ' ? '❌ Yes' : '✅ No'}`);
  
  if (value) {
    if (key.includes('SECRET') || key.includes('KEY')) {
      const masked = value.substring(0, 4) + '*'.repeat(Math.max(0, value.length - 4));
      console.log(`  Preview: ${masked}`);
    } else {
      console.log(`  Value: ${value}`);
    }
  } else {
    console.log(`  ❌ VALUE IS MISSING OR EMPTY!`);
  }
});

console.log('\n' + '━'.repeat(60));
console.log('\n💡 Troubleshooting:\n');

const allSet = envVars.every(key => process.env[key] && process.env[key].length > 0);

if (allSet) {
  console.log('✅ All environment variables are properly set!\n');
  console.log('The issue might be with the credential values themselves.');
  console.log('\nCheck:');
  console.log('  1. AWS_ACCESS_KEY_ID should start with "AKIA"');
  console.log('  2. AWS_SECRET_ACCESS_KEY should be 40 characters');
  console.log('  3. No extra quotes or spaces in the values');
} else {
  console.log('❌ Some environment variables are missing or empty!\n');
  console.log('Fix your .env file:');
  console.log('\n  1. File location: server/node-app/.env');
  console.log('  2. Format: KEY=value (no spaces, no quotes)');
  console.log('  3. Example:');
  console.log('     AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE');
  console.log('     AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCY');
  console.log('     AWS_REGION=us-east-1');
  console.log('     AWS_S3_BUCKET=fsmstorage\n');
}

// Check if .env file exists
import { existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
console.log('\n📁 .env File Check:');
console.log(`  Path: ${envPath}`);
console.log(`  Exists: ${existsSync(envPath) ? '✅ Yes' : '❌ No'}`);

if (!existsSync(envPath)) {
  console.log('\n❌ .env file not found!');
  console.log('\nCreate it at: ' + envPath);
}

console.log('\n');
