import multer from 'multer';

/**
 * Configure multer for image uploads (memory storage)
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
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
