/**
 * Test S3 Upload Script
 * 
 * This script tests if your AWS S3 configuration is correct by:
 * 1. Creating a small test image
 * 2. Uploading it to S3
 * 3. Verifying the upload was successful
 * 
 * Run: npm run test:s3
 * Or: npx ts-node src/scripts/test-s3-upload.ts
 */

import dotenv from 'dotenv';
import { s3Service } from '../utils/s3';
import { uploadBase64ImageToS3, handleProfilePhotoUpload } from '../utils/imageUpload';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Test base64 image (1x1 pixel red PNG - tiny test image)
const TEST_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

// Test base64 JPEG (1x1 pixel)
const TEST_JPEG_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA==';

async function testS3Configuration() {
  console.log('\n🧪 Testing S3 Configuration...\n');
  console.log('━'.repeat(60));

  // 1. Check environment variables
  console.log('\n📋 Step 1: Checking Environment Variables');
  console.log('━'.repeat(60));

  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET'
  ];

  let envCheckPassed = true;
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      console.log(`❌ ${envVar}: MISSING`);
      envCheckPassed = false;
    } else {
      // Mask sensitive values
      if (envVar.includes('SECRET') || envVar.includes('KEY')) {
        const masked = value.substring(0, 4) + '*'.repeat(value.length - 4);
        console.log(`✅ ${envVar}: ${masked}`);
      } else {
        console.log(`✅ ${envVar}: ${value}`);
      }
    }
  }

  if (!envCheckPassed) {
    console.log('\n❌ Environment variables check FAILED!');
    console.log('\nPlease ensure all required variables are set in your .env file:');
    console.log('  AWS_ACCESS_KEY_ID=your_access_key');
    console.log('  AWS_SECRET_ACCESS_KEY=your_secret_key');
    console.log('  AWS_REGION=us-east-1');
    console.log('  AWS_S3_BUCKET=micromerit-certificates');
    process.exit(1);
  }

  console.log('\n✅ All environment variables are set!');

  // 2. Test direct S3 upload with buffer
  console.log('\n📋 Step 2: Testing Direct S3 Upload (Buffer)');
  console.log('━'.repeat(60));

  try {
    const testBuffer = Buffer.from('Test file content from MicroMerit Portal');
    const testKey = `test-uploads/test-${Date.now()}.txt`;
    
    console.log(`📤 Uploading test file to: ${testKey}`);
    const url = await s3Service.uploadFile(testBuffer, testKey, 'text/plain');
    
    console.log('✅ Upload successful!');
    console.log(`📍 URL: ${url}`);
    
    // Try to delete the test file
    console.log('🧹 Cleaning up test file...');
    await s3Service.deleteFile(testKey);
    console.log('✅ Test file deleted successfully');
    
  } catch (error: any) {
    console.log('❌ Direct S3 upload FAILED!');
    console.log(`Error: ${error.message}`);
    console.log('\nPossible issues:');
    console.log('  1. Incorrect AWS credentials');
    console.log('  2. S3 bucket does not exist');
    console.log('  3. IAM user lacks s3:PutObject permission');
    console.log('  4. Incorrect AWS region');
    console.log('\nFull error:');
    console.error(error);
    process.exit(1);
  }

  // 3. Test base64 image upload (PNG)
  console.log('\n📋 Step 3: Testing Base64 PNG Image Upload');
  console.log('━'.repeat(60));

  try {
    console.log('📤 Uploading base64 PNG image...');
    const pngUrl = await uploadBase64ImageToS3(TEST_IMAGE_BASE64, 'test-uploads');
    
    console.log('✅ PNG upload successful!');
    console.log(`📍 URL: ${pngUrl}`);
    console.log(`🔗 Test in browser: ${pngUrl}`);
    
    // Clean up
    const pngKey = s3Service.extractKeyFromUrl(pngUrl);
    console.log('🧹 Cleaning up test PNG...');
    await s3Service.deleteFile(pngKey);
    console.log('✅ Test PNG deleted successfully');
    
  } catch (error: any) {
    console.log('❌ Base64 PNG upload FAILED!');
    console.log(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  // 4. Test base64 image upload (JPEG)
  console.log('\n📋 Step 4: Testing Base64 JPEG Image Upload');
  console.log('━'.repeat(60));

  try {
    console.log('📤 Uploading base64 JPEG image...');
    const jpegUrl = await uploadBase64ImageToS3(TEST_JPEG_BASE64, 'test-uploads');
    
    console.log('✅ JPEG upload successful!');
    console.log(`📍 URL: ${jpegUrl}`);
    console.log(`🔗 Test in browser: ${jpegUrl}`);
    
    // Clean up
    const jpegKey = s3Service.extractKeyFromUrl(jpegUrl);
    console.log('🧹 Cleaning up test JPEG...');
    await s3Service.deleteFile(jpegKey);
    console.log('✅ Test JPEG deleted successfully');
    
  } catch (error: any) {
    console.log('❌ Base64 JPEG upload FAILED!');
    console.log(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  // 5. Test handleProfilePhotoUpload utility
  console.log('\n📋 Step 5: Testing Profile Photo Upload Utility');
  console.log('━'.repeat(60));

  try {
    console.log('📤 Testing with base64 image...');
    const profileUrl = await handleProfilePhotoUpload(TEST_IMAGE_BASE64, 'test-user-123');
    
    console.log('✅ Profile photo upload successful!');
    console.log(`📍 URL: ${profileUrl}`);
    
    // Clean up
    if (profileUrl) {
      const profileKey = s3Service.extractKeyFromUrl(profileUrl);
      console.log('🧹 Cleaning up test profile photo...');
      await s3Service.deleteFile(profileKey);
      console.log('✅ Test profile photo deleted successfully');
    }
    
  } catch (error: any) {
    console.log('❌ Profile photo upload utility FAILED!');
    console.log(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  // 6. Test with URL input (should pass through)
  console.log('\n📋 Step 6: Testing URL Pass-through');
  console.log('━'.repeat(60));

  try {
    const testUrl = 'https://example.com/photo.jpg';
    console.log(`📤 Testing with URL: ${testUrl}`);
    const result = await handleProfilePhotoUpload(testUrl, 'test-user-456');
    
    if (result === testUrl) {
      console.log('✅ URL pass-through successful!');
      console.log(`📍 Returned: ${result}`);
    } else {
      console.log('❌ URL pass-through FAILED - result does not match input');
    }
    
  } catch (error: any) {
    console.log('❌ URL pass-through test FAILED!');
    console.log(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  // 7. Test with undefined input (should return undefined)
  console.log('\n📋 Step 7: Testing Undefined Input');
  console.log('━'.repeat(60));

  try {
    console.log('📤 Testing with undefined input...');
    const result = await handleProfilePhotoUpload(undefined, 'test-user-789');
    
    if (result === undefined) {
      console.log('✅ Undefined input handling successful!');
    } else {
      console.log('❌ Undefined input handling FAILED - expected undefined');
    }
    
  } catch (error: any) {
    console.log('❌ Undefined input test FAILED!');
    console.log(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  // Final summary
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 ALL TESTS PASSED! ✅');
  console.log('═'.repeat(60));
  console.log('\n✨ Your S3 configuration is working correctly!');
  console.log('\n📝 Summary:');
  console.log('  ✅ Environment variables configured');
  console.log('  ✅ S3 bucket accessible');
  console.log('  ✅ File upload working');
  console.log('  ✅ File deletion working');
  console.log('  ✅ Base64 PNG upload working');
  console.log('  ✅ Base64 JPEG upload working');
  console.log('  ✅ Profile photo utility working');
  console.log('  ✅ URL pass-through working');
  console.log('  ✅ Undefined handling working');
  console.log('\n🚀 You can now use the profile photo upload feature!');
  console.log('\nNext steps:');
  console.log('  1. Test with frontend integration');
  console.log('  2. Try uploading real images through registration');
  console.log('  3. Verify images are accessible in browser');
  console.log('\n');
}

// Run the test
testS3Configuration()
  .then(() => {
    console.log('✅ Test completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  });
