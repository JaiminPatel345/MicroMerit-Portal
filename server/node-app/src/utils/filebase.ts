import { ObjectManager } from '@filebase/sdk';
import { logger } from './logger';
import crypto from 'crypto';

/**
 * Filebase IPFS pinning service
 * Uses @filebase/sdk for uploading files to IPFS via Filebase
 */

export interface FilebaseUploadResult {
    cid: string;
    gateway_url: string;
}

/**
 * Upload a file to Filebase (IPFS)
 * Returns the IPFS CID and gateway URL
 */
export async function uploadToFilebase(
    fileBuffer: Buffer,
    fileName: string
): Promise<FilebaseUploadResult> {

    try {
        const accessKeyId = process.env.FILEBASE_ACCESS_KEY_ID;
        const secretAccessKey = process.env.FILEBASE_SECRET_ACCESS_KEY;
        const bucketName = process.env.FILEBASE_BUCKET_NAME;

        if (!accessKeyId || !secretAccessKey || !bucketName) {
            throw new Error('Filebase credentials not configured. Please set FILEBASE_ACCESS_KEY_ID, FILEBASE_SECRET_ACCESS_KEY, and FILEBASE_BUCKET_NAME environment variables.');
        }

        // Initialize ObjectManager
        const objectManager = new ObjectManager(accessKeyId, secretAccessKey, {
            bucket: bucketName,
        });

        logger.info('Uploading to Filebase', {
            fileName,
            size: fileBuffer.length,
            bucket: bucketName,
        });

        // Upload the file
        // @ts-expect-error - Filebase SDK documentation shows upload(key, buffer) but types incorrectly show 4 params
        const uploadedObject = await objectManager.upload(fileName, fileBuffer);

        // The SDK returns an object with cid property
        const cid = uploadedObject.cid || '';
        const gatewayUrl = `${process.env.FILEBASE_GATEWAY_URL || 'https://ipfs.filebase.io/ipfs/'}${cid}`;

        logger.info('Filebase upload successful', {
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
