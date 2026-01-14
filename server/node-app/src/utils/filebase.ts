import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
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
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Upload a file to Filebase (IPFS) using S3-compatible API
 * Returns the IPFS CID and gateway URL
 */
export async function uploadToFilebase(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string = 'application/pdf'
): Promise<FilebaseUploadResult> {

    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const accessKeyId = process.env.FILEBASE_ACCESS_KEY_ID;
            const secretAccessKey = process.env.FILEBASE_SECRET_ACCESS_KEY;
            const bucketName = process.env.FILEBASE_BUCKET_NAME;

            if (!accessKeyId || !secretAccessKey || !bucketName) {
                throw new Error('Filebase credentials not configured. Please set FILEBASE_ACCESS_KEY_ID, FILEBASE_SECRET_ACCESS_KEY, and FILEBASE_BUCKET_NAME environment variables.');
            }

            // Initialize S3 client for Filebase with proper timeout configuration
            const s3Client = new S3Client({
                endpoint: 'https://s3.filebase.com',
                region: 'us-east-1',
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
                requestHandler: new NodeHttpHandler({
                    connectionTimeout: 60000, // 60 seconds for connection
                    requestTimeout: 120000,   // 120 seconds for request (increased for large files)
                }),
                maxAttempts: 3, // SDK-level retries
            });

            logger.info('Uploading to Filebase via S3 API', {
                fileName,
                size: fileBuffer.length,
                bucket: bucketName,
                attempt,
                maxRetries,
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
                attempt,
            });

            // Filebase needs time to process IPFS pinning and generate CID
            // Increased wait time to 5 seconds for better reliability
            await sleep(5000);

            // Get the CID from object metadata with retry logic
            let cid = '';
            const maxCidRetries = 3;
            
            for (let cidAttempt = 1; cidAttempt <= maxCidRetries; cidAttempt++) {
                try {
                    const headCommand = new HeadObjectCommand({
                        Bucket: bucketName,
                        Key: fileName,
                    });

                    const headResponse = await s3Client.send(headCommand);
                    cid = headResponse.Metadata?.cid || '';

                    if (cid) {
                        logger.info('CID retrieved successfully', {
                            fileName,
                            cid,
                            cidAttempt,
                        });
                        break;
                    }

                    if (cidAttempt < maxCidRetries) {
                        logger.warn('CID not yet available, retrying...', {
                            fileName,
                            cidAttempt,
                            maxCidRetries,
                            metadata: headResponse.Metadata,
                        });
                        await sleep(3000); // Wait 3 seconds before retry
                    }
                } catch (headError: any) {
                    logger.error('Error retrieving CID', {
                        fileName,
                        cidAttempt,
                        error: headError.message,
                    });
                    if (cidAttempt === maxCidRetries) {
                        throw headError;
                    }
                    await sleep(3000);
                }
            }

            if (!cid) {
                logger.error('No CID found in metadata after retries', {
                    fileName,
                });
                throw new Error('Failed to retrieve CID from Filebase response - metadata does not contain CID after multiple attempts');
            }

            const gatewayUrl = `${process.env.FILEBASE_GATEWAY_URL || 'https://ipfs.filebase.io/ipfs/'}${cid}`;

            logger.info('Filebase upload successful via S3 API', {
                fileName,
                cid,
                gateway_url: gatewayUrl,
                totalAttempts: attempt,
            });

            return {
                cid,
                gateway_url: gatewayUrl,
            };
        } catch (error: any) {
            lastError = error;
            
            logger.error('Filebase upload attempt failed', {
                error: error.message,
                error_code: error.code,
                error_name: error.name,
                fileName,
                attempt,
                maxRetries,
                stack: error.stack,
            });

            // Check if error is retryable
            const isRetryable = 
                error.name === 'TimeoutError' ||
                error.name === 'RequestTimeout' ||
                error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT' ||
                error.code === 'ENOTFOUND' ||
                error.name === '408' ||
                (error.$metadata && error.$metadata.httpStatusCode === 408);

            if (isRetryable && attempt < maxRetries) {
                const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
                logger.info('Retrying upload after delay', {
                    fileName,
                    attempt,
                    nextAttempt: attempt + 1,
                    backoffDelay,
                });
                await sleep(backoffDelay);
                continue; // Retry
            }

            // If not retryable or max retries reached, throw
            break;
        }
    }

    // If we get here, all retries failed
    logger.error('Filebase upload failed after all retries', {
        error: lastError.message,
        error_code: lastError.code,
        error_name: lastError.name,
        fileName,
        maxRetries,
    });
    
    throw new Error(`Failed to upload file to Filebase after ${maxRetries} attempts: ${lastError.message || lastError.name}`);
}

/**
 * Get IPFS gateway URL for a CID
 */
export function getGatewayUrl(cid: string): string {
    const baseUrl = process.env.FILEBASE_GATEWAY_URL || 'https://ipfs.filebase.io/ipfs/';
    return `${baseUrl}${cid}`;
}
