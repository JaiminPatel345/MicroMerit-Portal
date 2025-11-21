import { Request, Response, NextFunction } from 'express';
import { s3Service } from '../utils/s3';
import { logger } from '../utils/logger';

/**
 * Convert a URL to signed URL if it's an S3 URL
 */
async function convertIfS3Url(url: string): Promise<string> {
  // Check if it's an S3 URL
  const s3UrlPattern = /^https?:\/\/[a-z0-9.-]+\.s3\.[a-z0-9-]+\.amazonaws\.com\//i;
  
  if (s3UrlPattern.test(url)) {
    try {
      // Get expiration time from env or default to 1 hour
      const expiresIn = parseInt(process.env.S3_SIGNED_URL_EXPIRY || '3600', 10);
      return await s3Service.getSignedUrlFromS3Url(url, expiresIn);
    } catch (error) {
      logger.error('Failed to generate signed URL, returning original:', error);
      return url;
    }
  }

  return url;
}

/**
 * Recursively traverse an object and convert S3 URLs to signed URLs
 */
async function convertUrlsInObject(obj: any): Promise<any> {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // If it's a string, check if it's an S3 URL
  if (typeof obj === 'string') {
    return await convertIfS3Url(obj);
  }

  // If it's a Date object, return as-is (don't convert to empty object)
  if (obj instanceof Date) {
    return obj;
  }

  // If it's an array, process each element
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => convertUrlsInObject(item)));
  }

  // If it's an object, process each property
  if (typeof obj === 'object') {
    const processed: any = {};
    for (const key of Object.keys(obj)) {
      processed[key] = await convertUrlsInObject(obj[key]);
    }
    return processed;
  }

  // Return as-is for other types
  return obj;
}

/**
 * Middleware to automatically convert S3 URLs to signed URLs in API responses
 * This intercepts the response and replaces all S3 URLs with temporary signed URLs
 */
export const convertS3UrlsToSigned = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Store the original json method
  const originalJson = res.json.bind(res);

  // Override the json method
  res.json = function (data: any): Response {
    // Process the data asynchronously
    processAndSendResponse(data, originalJson);
    return res;
  };

  async function processAndSendResponse(data: any, jsonMethod: any) {
    try {
      // Convert S3 URLs to signed URLs
      const processedData = await convertUrlsInObject(data);
      jsonMethod(processedData);
    } catch (error) {
      logger.error('Error converting S3 URLs to signed URLs:', error);
      // Send original data if conversion fails
      jsonMethod(data);
    }
  }

  next();
};

/**
 * Simple middleware for specific routes that need signed URLs
 * Use this on routes that return S3 URLs
 */
export const addSignedUrlsMiddleware = convertS3UrlsToSigned;

