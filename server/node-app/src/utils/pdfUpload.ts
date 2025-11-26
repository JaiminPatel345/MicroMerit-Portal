import multer from 'multer';

/**
 * Configure multer for PDF uploads (memory storage)
 */
export const pdfUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size for PDFs
    },
    fileFilter: (req: any, file: any, cb: any) => {
        // Accept only PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});

/**
 * Multer middleware for single PDF upload
 */
export const uploadPdf: any = pdfUpload.single('original_pdf');
