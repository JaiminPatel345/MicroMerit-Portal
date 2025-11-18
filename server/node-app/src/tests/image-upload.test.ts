import {
  isBase64Image,
  extractMimeType,
  getExtensionFromMimeType,
  base64ToBuffer,
  generateImageFilename,
  handleProfilePhotoUpload,
} from '../utils/imageUpload';

describe('Image Upload Utils', () => {
  const validBase64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const validBase64Jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA==';
  const validUrl = 'https://example.com/image.jpg';
  const invalidString = 'not-a-valid-image';

  describe('isBase64Image', () => {
    it('should return true for valid base64 PNG', () => {
      expect(isBase64Image(validBase64Png)).toBe(true);
    });

    it('should return true for valid base64 JPEG', () => {
      expect(isBase64Image(validBase64Jpeg)).toBe(true);
    });

    it('should return false for URL', () => {
      expect(isBase64Image(validUrl)).toBe(false);
    });

    it('should return false for invalid string', () => {
      expect(isBase64Image(invalidString)).toBe(false);
    });
  });

  describe('extractMimeType', () => {
    it('should extract MIME type from PNG base64', () => {
      expect(extractMimeType(validBase64Png)).toBe('image/png');
    });

    it('should extract MIME type from JPEG base64', () => {
      expect(extractMimeType(validBase64Jpeg)).toBe('image/jpeg');
    });

    it('should throw error for invalid format', () => {
      expect(() => extractMimeType(invalidString)).toThrow('Invalid base64 image format');
    });
  });

  describe('getExtensionFromMimeType', () => {
    it('should return png for image/png', () => {
      expect(getExtensionFromMimeType('image/png')).toBe('png');
    });

    it('should return jpg for image/jpeg', () => {
      expect(getExtensionFromMimeType('image/jpeg')).toBe('jpg');
    });

    it('should return default jpg for unknown type', () => {
      expect(getExtensionFromMimeType('image/unknown')).toBe('jpg');
    });
  });

  describe('base64ToBuffer', () => {
    it('should convert base64 to buffer', () => {
      const buffer = base64ToBuffer(validBase64Png);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle base64 without data URL prefix', () => {
      const base64Only = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const buffer = base64ToBuffer(base64Only);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateImageFilename', () => {
    it('should generate filename with correct format', () => {
      const filename = generateImageFilename('profile-photos', 'jpg');
      expect(filename).toMatch(/^profile-photos\/\d+-[a-f0-9]{16}\.jpg$/);
    });

    it('should generate unique filenames', () => {
      const filename1 = generateImageFilename('test', 'png');
      const filename2 = generateImageFilename('test', 'png');
      expect(filename1).not.toBe(filename2);
    });
  });

  describe('handleProfilePhotoUpload', () => {
    it('should return undefined for empty input', async () => {
      const result = await handleProfilePhotoUpload(undefined, 'user-123');
      expect(result).toBeUndefined();
    });

    it('should return URL as-is if valid URL provided', async () => {
      const result = await handleProfilePhotoUpload(validUrl, 'user-123');
      expect(result).toBe(validUrl);
    });

    it('should throw error for invalid input', async () => {
      await expect(handleProfilePhotoUpload(invalidString, 'user-123')).rejects.toThrow();
    });

    // Note: Testing actual S3 upload would require mocking the s3Service
    // or integration tests with actual S3 credentials
  });
});
