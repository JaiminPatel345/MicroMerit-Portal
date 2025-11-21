import dotenv from 'dotenv';
import { s3Service } from '../utils/s3';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Test script for signed URL generation
 */
async function testSignedUrls() {
  console.log('=== Testing Signed URL Generation ===\n');

  try {
    // Example S3 URL (replace with actual URL from your bucket)
    const exampleS3Url = 'https://micromerit-certificates.s3.us-east-1.amazonaws.com/profile-photos/learner-1/1234567890-abc123.jpg';
    const exampleKey = 'profile-photos/learner-1/1234567890-abc123.jpg';

    console.log('1. Testing getSignedUrl with key:');
    console.log(`   Key: ${exampleKey}`);
    try {
      const signedUrl1 = await s3Service.getSignedUrl(exampleKey, 3600);
      console.log(`   ✅ Signed URL generated (expires in 1 hour)`);
      console.log(`   URL length: ${signedUrl1.length} characters`);
      console.log(`   URL preview: ${signedUrl1.substring(0, 100)}...\n`);
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    console.log('2. Testing getSignedUrlFromS3Url with full URL:');
    console.log(`   S3 URL: ${exampleS3Url}`);
    try {
      const signedUrl2 = await s3Service.getSignedUrlFromS3Url(exampleS3Url, 7200);
      console.log(`   ✅ Signed URL generated (expires in 2 hours)`);
      console.log(`   URL length: ${signedUrl2.length} characters`);
      console.log(`   URL preview: ${signedUrl2.substring(0, 100)}...\n`);
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    console.log('3. Testing extractKeyFromUrl:');
    const extractedKey = s3Service.extractKeyFromUrl(exampleS3Url);
    console.log(`   Original URL: ${exampleS3Url}`);
    console.log(`   Extracted Key: ${extractedKey}`);
    console.log(`   ✅ Key extraction successful\n`);

    console.log('=== Test Complete ===');
    console.log('\nNote: If you see AWS errors, make sure:');
    console.log('  1. AWS credentials are set in .env file');
    console.log('  2. The S3 bucket exists and you have access');
    console.log('  3. The object key exists in the bucket (for actual file access)');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    logger.error('Signed URL test failed', { error: error.message });
  }

  process.exit(0);
}

// Run the test
testSignedUrls();
