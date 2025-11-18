import { s3Service } from './s3';
import { logger } from './logger';
import crypto from 'crypto';

/**
 * Check if a string is a base64 image
 */
export function isBase64Image(str: string): boolean {
  // Check if it's a data URL with base64 image
  const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp|bmp);base64,/;
  return base64Regex.test(str);
}

/**
 * Extract MIME type from base64 data URL
 */
export function extractMimeType(base64String: string): string {
  const matches = base64String.match(/^data:(image\/[a-z]+);base64,/);
  if (!matches || !matches[1]) {
    throw new Error('Invalid base64 image format');
  }
  return matches[1];
}

/**
 * Extract file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const extensionMap: { [key: string]: string } = {
    'image/png': 'png',
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
  };
  return extensionMap[mimeType] || 'jpg';
}

/**
 * Convert base64 string to buffer
 */
export function base64ToBuffer(base64String: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Generate unique filename for image
 */
export function generateImageFilename(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${prefix}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Upload base64 image to S3 and return URL
 * @param base64String - Base64 encoded image string
 * @param folder - S3 folder path (e.g., 'profile-photos', 'learner-123')
 * @returns S3 URL of uploaded image
 */
export async function uploadBase64ImageToS3(
  base64String: string,
  folder: string = 'profile-photos'
): Promise<string> {
  try {
    // Validate it's a base64 image
    if (!isBase64Image(base64String)) {
      throw new Error('Invalid base64 image format. Expected data:image/[type];base64,...');
    }

    // Extract MIME type
    const mimeType = extractMimeType(base64String);
    const extension = getExtensionFromMimeType(mimeType);

    // Convert base64 to buffer
    const buffer = base64ToBuffer(base64String);

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      throw new Error('Image size exceeds 5MB limit');
    }

    // Generate unique filename
    const filename = generateImageFilename(folder, extension);

    // Upload to S3
    const s3Url = await s3Service.uploadFile(buffer, filename, mimeType);

    logger.info('Base64 image uploaded to S3', { filename, size: buffer.length });

    return s3Url;
  } catch (error: any) {
    logger.error('Failed to upload base64 image to S3', { error: error.message });
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

/**
 * Handle profile photo upload
 * If input is base64, upload to S3 and return URL
 * If input is already a URL, validate and return it
 * If input is undefined/null, return undefined
 */
export async function handleProfilePhotoUpload(
  profilePhotoInput: string | undefined,
  userId: string | number
): Promise<string | undefined> {
  if (!profilePhotoInput) {
    return undefined;
  }

  // Check if it's a base64 image
  if (isBase64Image(profilePhotoInput)) {
    // Upload to S3
    const folder = `profile-photos/learner-${userId}`;
    return await uploadBase64ImageToS3(profilePhotoInput, folder);
  }

  // Check if it's a valid URL
  try {
    new URL(profilePhotoInput);
    return profilePhotoInput; // Return as-is if it's already a valid URL
  } catch {
    throw new Error('Profile photo must be either a valid URL or base64 encoded image');
  }
}
