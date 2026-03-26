import { logger } from './logger';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Local uploads directory (server/node-app/uploads/)
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * Ensure a directory exists, creating it recursively if needed
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Save a buffer to the local filesystem and return the public URL path
 */
async function saveBufferToLocal(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const filePath = path.join(UPLOADS_DIR, filename);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, buffer);
  // Return URL path that will be served as static file
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${appUrl}/uploads/${filename}`;
}

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
 * Upload base64 image to local filesystem and return URL
 * @param base64String - Base64 encoded image string
 * @param folder - Folder path (e.g., 'profile-photos', 'logos/issuer-1')
 * @returns Local URL of uploaded image
 */
export async function uploadBase64ImageToS3(
  base64String: string,
  folder: string = 'profile-photos'
): Promise<string> {
  try {
    if (!isBase64Image(base64String)) {
      throw new Error('Invalid base64 image format. Expected data:image/[type];base64,...');
    }

    const mimeType = extractMimeType(base64String);
    const extension = getExtensionFromMimeType(mimeType);
    const buffer = base64ToBuffer(base64String);

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      throw new Error('Image size exceeds 5MB limit');
    }

    const filename = generateImageFilename(folder, extension);
    const url = await saveBufferToLocal(buffer, filename, mimeType);
    logger.info('Base64 image saved to local filesystem', { filename, size: buffer.length });
    return url;
  } catch (error: any) {
    logger.error('Failed to save base64 image to local filesystem', { error: error.message });
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

/**
 * Upload image buffer to local filesystem
 * @param buffer - Image buffer from multer
 * @param mimeType - MIME type of the image
 * @param folder - Folder path
 * @returns Local URL of uploaded image
 */
export async function uploadImageBufferToS3(
  buffer: Buffer,
  mimeType: string,
  folder: string = 'profile-photos'
): Promise<string> {
  try {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      throw new Error('Image size exceeds 5MB limit');
    }

    const extension = getExtensionFromMimeType(mimeType);
    const filename = generateImageFilename(folder, extension);
    const url = await saveBufferToLocal(buffer, filename, mimeType);
    logger.info('Image buffer saved to local filesystem', { filename, size: buffer.length, mimeType });
    return url;
  } catch (error: any) {
    logger.error('Failed to save image buffer to local filesystem', { error: error.message });
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

/**
 * Handle profile photo upload from multer file — saves to local filesystem
 * @param file - Multer file object
 * @param userId - User ID for folder organization
 * @returns Local URL of uploaded image or undefined if no file
 */
export async function handleProfilePhotoFileUpload(
  file: Express.Multer.File | undefined,
  userId: string | number
): Promise<string | undefined> {
  if (!file) {
    return undefined;
  }

  try {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.buffer.length > maxSize) {
      throw new Error('Image size exceeds 5MB limit');
    }

    const extension = getExtensionFromMimeType(file.mimetype);
    const filename = generateImageFilename(`profile-photos/learner-${userId}`, extension);
    const url = await saveBufferToLocal(file.buffer, filename, file.mimetype);
    logger.info('Profile photo saved to local filesystem', { filename, size: file.buffer.length });
    return url;
  } catch (error: any) {
    logger.error('Failed to save profile photo to local filesystem', { error: error.message });
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

/**
 * Handle profile photo upload
 * If input is base64, save to local filesystem and return URL
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
    try {
      const mimeType = extractMimeType(profilePhotoInput);
      const extension = getExtensionFromMimeType(mimeType);
      const buffer = base64ToBuffer(profilePhotoInput);

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (buffer.length > maxSize) {
        throw new Error('Image size exceeds 5MB limit');
      }

      const filename = generateImageFilename(`profile-photos/learner-${userId}`, extension);
      const url = await saveBufferToLocal(buffer, filename, mimeType);
      logger.info('Base64 profile photo saved to local filesystem', { filename, size: buffer.length });
      return url;
    } catch (error: any) {
      logger.error('Failed to save base64 profile photo to local filesystem', { error: error.message });
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  // Check if it's a valid URL
  try {
    new URL(profilePhotoInput);
    return profilePhotoInput; // Return as-is if it's already a valid URL
  } catch {
    throw new Error('Profile photo must be either a valid URL or base64 encoded image');
  }
}
