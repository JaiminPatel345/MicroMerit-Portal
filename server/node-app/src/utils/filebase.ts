import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { logger } from './logger';

/**
 * Filebase IPFS pinning service
 * Uses S3-compatible API for uploading files to IPFS via Filebase
 */

export interface FilebaseUploadResult {
    cid: string;
    gateway_url: string;
}

/**
 * Upload a file to Filebase (IPFS) using S3-compatible API
 * Returns the IPFS CID and gateway URL
 */
export async function uploadToFilebase(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string = 'application/pdf'
): Promise<FilebaseUploadResult> {

    try {
        const accessKeyId = process.env.FILEBASE_ACCESS_KEY_ID;
        const secretAccessKey = process.env.FILEBASE_SECRET_ACCESS_KEY;
        const bucketName = process.env.FILEBASE_BUCKET_NAME;

        if (!accessKeyId || !secretAccessKey || !bucketName) {
            throw new Error('Filebase credentials not configured. Please set FILEBASE_ACCESS_KEY_ID, FILEBASE_SECRET_ACCESS_KEY, and FILEBASE_BUCKET_NAME environment variables.');
        }

        // Initialize S3 client for Filebase
        const s3Client = new S3Client({
            endpoint: 'https://s3.filebase.com',
            region: 'us-east-1',
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });

        logger.info('Uploading to Filebase via S3 API', {
            fileName,
            size: fileBuffer.length,
            bucket: bucketName,
        });

        // Upload the file to Filebase
        const uploadCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType,
        });

        const uploadResponse = await s3Client.send(uploadCommand);

        logger.info('File uploaded to Filebase, retrieving CID', {
            fileName,
            etag: uploadResponse.ETag,
        });

        // Filebase needs time to process IPFS pinning and generate CID
        // Wait 2-3 seconds before retrieving metadata
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get the CID from object metadata
        const headCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: fileName,
        });

        const headResponse = await s3Client.send(headCommand);
        const cid = headResponse.Metadata?.cid || '';

        if (!cid) {
            logger.error('No CID found in metadata', {
                fileName,
                metadata: headResponse.Metadata,
                etag: headResponse.ETag,
            });
            throw new Error('Failed to retrieve CID from Filebase response - metadata does not contain CID');
        }

        const gatewayUrl = `${process.env.FILEBASE_GATEWAY_URL || 'https://ipfs.filebase.io/ipfs/'}${cid}`;

        logger.info('Filebase upload successful via S3 API', {
            fileName,
            cid,
            gateway_url: gatewayUrl,
        });

        return {
            cid,
            gateway_url: gatewayUrl,
        };
    } catch (error: any) {
        logger.error('Filebase upload failed', {
            error: error.message,
            error_code: error.code,
            error_name: error.name,
            fileName,
        });
        throw new Error(`Failed to upload file to Filebase: ${error.message}`);
    }
}

/**
 * Get IPFS gateway URL for a CID
 */
export function getGatewayUrl(cid: string): string {
    const baseUrl = process.env.FILEBASE_GATEWAY_URL || 'https://ipfs.filebase.io/ipfs/';
    return `${baseUrl}${cid}`;
}
