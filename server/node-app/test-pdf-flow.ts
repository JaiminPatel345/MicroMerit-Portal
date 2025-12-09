import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { uploadToFilebase } from './src/utils/filebase';
import dotenv from 'dotenv';
import { PDFDocument } from 'pdf-lib';

// Load environment variables
dotenv.config();

async function testPdfFlow() {
    console.log('🚀 Starting PDF Flow Verification...');

    // 1. Get a valid credential ID first
    console.log(`\n🔍 1. Fetching valid credential ID...`);
    const listUrl = `http://localhost:4000/jaimin/api/certs?since=1970-01-01&limit=1`;
    const apiKey = 'mock-api-key'; // From .env setup

    let credentialId;
    try {
        const listRes = await axios.get(listUrl, { headers: { 'X-API-Key': apiKey } });
        if (listRes.data && listRes.data.data && listRes.data.data.length > 0) {
            credentialId = listRes.data.data[0].cert_id;
            console.log(`   ✅ Found Credential ID: ${credentialId}`);
        } else {
            console.error('   ❌ No credentials found to test with!');
            return;
        }
    } catch (e) {
        console.error('   ❌ Failed to fetch credentials list:', e.message);
        return;
    }

    // 2. Test Dummy Server Endpoint
    const certUrl = `http://localhost:4000/jaimin/api/certs/${credentialId}/pdf`;

    console.log(`\n📥 2. Testing Download from: ${certUrl}`);

    try {
        const response = await axios.get(certUrl, {
            responseType: 'arraybuffer',
            headers: { 'X-API-Key': apiKey },
            timeout: 10000
        });

        const pdfBuffer = Buffer.from(response.data);
        console.log(`   ✅ Download successful! Size: ${pdfBuffer.length} bytes`);

        // 2. Validate PDF Content
        console.log('\n🔍 2. Validating PDF Structure...');
        try {
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            const pageCount = pdfDoc.getPageCount();
            console.log(`   ✅ Valid PDF confirmed! Pages: ${pageCount}`);

            // Save locally for inspection
            const debugPath = path.join(__dirname, 'debug-cert.pdf');
            fs.writeFileSync(debugPath, pdfBuffer);
            console.log(`   💾 Saved local copy to: ${debugPath}`);
        } catch (e) {
            console.error('   ❌ Invalid PDF content:', e.message);
            return;
        }

        // 3. Test Filebase Upload
        console.log('\n☁️  3. Testing Filebase Upload...');
        console.log(`   Using Bucket: ${process.env.FILEBASE_BUCKET_NAME}`);
        console.log(`   Access Key: ${process.env.FILEBASE_ACCESS_KEY_ID ? 'Set' : 'Missing'}`);

        try {
            const uploadResult = await uploadToFilebase(
                pdfBuffer,
                `debug-${credentialId}.pdf`,
                'application/pdf'
            );

            console.log('   ✅ Upload Successful!');
            console.log('   ----------------------------------------');
            console.log(`   📝 CID: ${uploadResult.cid}`);
            console.log(`   🔗 URL: ${uploadResult.gateway_url}`);
            console.log('   ----------------------------------------');

            // 4. Verify IPFS URL works
            console.log('\n🌐 4. Verifying IPFS Accessibility...');
            const ipfsRes = await axios.head(uploadResult.gateway_url, { timeout: 15000 });
            console.log(`   ✅ Gateway accessible! Status: ${ipfsRes.status}`);

        } catch (e) {
            console.error('   ❌ Upload/IPFS Failed:', e.message);
            if (e.response) {
                console.error('   Status:', e.response.status);
                console.error('   Data:', JSON.stringify(e.response.data));
            }
        }

    } catch (e) {
        console.error('   ❌ Download Failed:', e.message);
        if (e.code === 'ECONNREFUSED') {
            console.error('   👉 Logic: Backend cannot reach Dummy Server on localhost:4000');
            console.error('   👉 Fix: Ensure Dummy Server is running with `npm run dev`');
        }
    }
}

testPdfFlow().catch(console.error);
