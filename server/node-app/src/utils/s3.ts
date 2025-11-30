import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger';

/**
 * S3 Storage Service
 * Handles all file uploads to Amazon S3
 */
class S3Service {
  private client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.AWS_S3_BUCKET || 'micromerit-certificates';

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      requestHandler: {
        connectionTimeout: 30000, // 30 seconds
        socketTimeout: 30000, // 30 seconds
      },
    });

    logger.info(`S3 Service initialized with bucket: ${this.bucketName}`);
  }

  /**
   * Upload a file to S3
   * @param buffer - File buffer
   * @param key - S3 object key (path)
   * @param contentType - MIME type
   * @returns S3 URL
   */
  async uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.client.send(command);

      // Return public URL
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      logger.info(`File uploaded to S3: ${url}`);
      
      return url;
    } catch (error) {
      logger.error('Error uploading to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Download a file from S3
   * @param key - S3 object key
   * @returns File buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error('Empty response body');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('Error downloading from S3:', error);
      throw new Error('Failed to download file from S3');
    }
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('Error deleting from S3:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Get public URL for an S3 object
   * @param key - S3 object key
   * @returns Public URL
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Extract S3 key from URL
   * @param url - Full S3 URL
   * @returns S3 key
   */
  extractKeyFromUrl(url: string): string {
    const match = url.match(/\.amazonaws\.com\/(.+)$/);
    return match?.[1] || url;
  }

  /**
   * Generate a signed URL for temporary access to a private S3 object
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      logger.info(`Generated signed URL for key: ${key}, expires in ${expiresIn}s`);
      
      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Generate a signed URL from a full S3 URL
   * @param s3Url - Full S3 URL
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL
   */
  async getSignedUrlFromS3Url(s3Url: string, expiresIn: number = 3600): Promise<string> {
    const key = this.extractKeyFromUrl(s3Url);
    return this.getSignedUrl(key, expiresIn);
  }
}

export const s3Service = new S3Service();
