import 'dotenv/config';
import { uploadToFilebase } from './src/utils/filebase';
import { logger } from './src/utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Test script to verify Filebase upload functionality
 * Run with: npx tsx test-filebase-upload.ts
 */

async function testFilebaseUpload() {
    console.log('🧪 Testing Filebase Upload Configuration\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`   FILEBASE_ACCESS_KEY_ID: ${process.env.FILEBASE_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing'}`);
    console.log(`   FILEBASE_SECRET_ACCESS_KEY: ${process.env.FILEBASE_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing'}`);
    console.log(`   FILEBASE_BUCKET_NAME: ${process.env.FILEBASE_BUCKET_NAME || '✗ Missing'}`);
    console.log(`   FILEBASE_GATEWAY_URL: ${process.env.FILEBASE_GATEWAY_URL || 'Using default'}\n`);

    if (!process.env.FILEBASE_ACCESS_KEY_ID || !process.env.FILEBASE_SECRET_ACCESS_KEY || !process.env.FILEBASE_BUCKET_NAME) {
        console.error('❌ Missing required Filebase environment variables!');
        console.error('Please set FILEBASE_ACCESS_KEY_ID, FILEBASE_SECRET_ACCESS_KEY, and FILEBASE_BUCKET_NAME in your .env file');
        process.exit(1);
    }

    // Create a test file
    console.log('📄 Creating test file...');
    const testContent = Buffer.from('This is a test file for Filebase upload verification');
    const testFileName = `test/filebase-test-${Date.now()}.txt`;

    try {
        console.log(`\n☁️  Uploading test file to Filebase...`);
        console.log(`   File: ${testFileName}`);
        console.log(`   Size: ${testContent.length} bytes\n`);

        const startTime = Date.now();
        const result = await uploadToFilebase(testContent, testFileName, 'text/plain');
        const duration = Date.now() - startTime;

        console.log('\n✅ Upload successful!');
        console.log(`   Duration: ${duration}ms`);
        console.log(`   CID: ${result.cid}`);
        console.log(`   Gateway URL: ${result.gateway_url}`);
        console.log(`\n🎉 Filebase integration is working correctly!`);

    } catch (error: any) {
        console.error('\n❌ Upload failed!');
        console.error(`   Error: ${error.message}`);
        console.error(`   Error Name: ${error.name}`);
        console.error(`   Error Code: ${error.code}`);
        
        if (error.name === '408' || error.code === 'RequestTimeout') {
            console.error('\n💡 Troubleshooting Tips for 408 Timeout:');
            console.error('   1. Check your internet connection');
            console.error('   2. Verify Filebase credentials are correct');
            console.error('   3. Check if Filebase service is operational');
            console.error('   4. Try with a smaller file');
            console.error('   5. Check firewall/proxy settings');
        }

        if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
            console.error('\n💡 Troubleshooting Tips for Authentication:');
            console.error('   1. Verify FILEBASE_ACCESS_KEY_ID is correct');
            console.error('   2. Verify FILEBASE_SECRET_ACCESS_KEY is correct');
            console.error('   3. Check if credentials have expired');
            console.error('   4. Ensure bucket name is correct');
        }

        console.error('\n📋 Full error details:');
        console.error(error);
        process.exit(1);
    }
}

// Run the test
testFilebaseUpload().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
