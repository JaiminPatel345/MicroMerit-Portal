import multer from 'multer';

/**
 * Configure multer for image uploads (memory storage)
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
    fieldSize: 10 * 1024 * 1024, // 10MB max field size (for text fields)
    fields: 20, // Max number of non-file fields
    fieldNameSize: 200, // Max field name size
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Accept only image files
    const allowedMimeTypes = [
      'image/png',
      'image/jpg', 
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/bmp'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (png, jpg, jpeg, gif, webp, bmp)'));
    }
  },
});

/**
 * Multer middleware for single profile photo upload
 */
export const uploadProfilePhoto: any = imageUpload.single('profilePhoto');

/**
 * Configure multer for document uploads (PDFs and Images)
 */
export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpg', 
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/bmp'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  },
});
