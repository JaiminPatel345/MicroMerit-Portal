import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

/**
 * Middleware to convert uploaded image files to PDF.
 * If the uploaded file is an image, it converts it to PDF.
 * If it's already a PDF, it does nothing.
 */
export const convertImageToPdf = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
        return next();
    }

    // Check if the file is an image
    if (req.file.mimetype.startsWith('image/')) {
        try {
            // Convert image to PNG buffer using sharp
            // We use PNG because it's lossless and supported by pdf-lib
            const imageBuffer = await sharp(req.file.buffer)
                .toFormat('png')
                .toBuffer();

            // Create a new PDF document
            const pdfDoc = await PDFDocument.create();

            // Embed the PNG image
            const image = await pdfDoc.embedPng(imageBuffer);

            // Get image dimensions to set page size
            const { width, height } = image.scale(1);

            // Add a page with the image dimensions
            const page = pdfDoc.addPage([width, height]);

            // Draw the image onto the page
            page.drawImage(image, {
                x: 0,
                y: 0,
                width,
                height,
            });

            // Save the PDF to a buffer
            const pdfBytes = await pdfDoc.save();
            const pdfBuffer = Buffer.from(pdfBytes);

            // Update req.file with the new PDF data
            req.file.buffer = pdfBuffer;
            req.file.mimetype = 'application/pdf';
            req.file.size = pdfBuffer.length;

            // Update filename extension to .pdf
            const nameParts = req.file.originalname.split('.');
            if (nameParts.length > 1) {
                nameParts.pop(); // Remove extension
            }
            req.file.originalname = nameParts.join('.') + '.pdf';

            next();
        } catch (error) {
            console.error('Error converting image to PDF:', error);
            // Pass error to error handler
            next(new Error('Failed to convert image to PDF'));
        }
    } else {
        // file is not an image (likely PDF or other allowed type), proceed as is
        next();
    }
};
