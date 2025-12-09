/**
 * PDF Generator Utility
 * Generates credential certificates as PDFs using pdf-lib
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { MockCredential } from '../types/index.js';

export interface PDFGenerationOptions {
    credentialId: string;
    learnerName: string;
    certificateTitle: string;
    certificateCode?: string;
    issuedAt: Date;
    sector?: string;
    nsqfLevel?: number;
    awardingBodies?: string[];
    occupation?: string;
}

/**
 * Generate a credential certificate PDF using pdf-lib
 * Returns a Buffer containing the PDF
 */
export async function generateCredentialPDF(options: PDFGenerationOptions): Promise<Buffer> {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a page
    const page = pdfDoc.addPage([595, 842]); // A4 size in points
    const { width, height } = page.getSize();

    // Load fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Colors
    const primaryColor = rgb(0.12, 0.25, 0.69); // Blue
    const textColor = rgb(0.2, 0.2, 0.2);
    const lightGray = rgb(0.4, 0.4, 0.4);

    let yPosition = height - 100;

    // Header - Certificate of Completion
    page.drawText('Certificate of Completion', {
        x: 50,
        y: yPosition,
        size: 32,
        font: boldFont,
        color: primaryColor,
    });

    yPosition -= 15;

    // Decorative line
    page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 2,
        color: primaryColor,
    });

    yPosition -= 60;

    // Credential ID (prominently displayed)
    page.drawText('Credential ID:', {
        x: 50,
        y: yPosition,
        size: 12,
        font: regularFont,
        color: lightGray,
    });

    yPosition -= 20;

    page.drawText(options.credentialId, {
        x: 50,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: primaryColor,
    });

    yPosition -= 50;

    // Main content
    page.drawText('This is to certify that', {
        x: width / 2 - 80,
        y: yPosition,
        size: 14,
        font: regularFont,
        color: textColor,
    });

    yPosition -= 35;

    // Learner Name (large and prominent)
    const nameWidth = boldFont.widthOfTextAtSize(options.learnerName, 24);
    page.drawText(options.learnerName, {
        x: width / 2 - nameWidth / 2,
        y: yPosition,
        size: 24,
        font: boldFont,
        color: primaryColor,
    });

    yPosition -= 40;

    page.drawText('has successfully completed', {
        x: width / 2 - 95,
        y: yPosition,
        size: 14,
        font: regularFont,
        color: textColor,
    });

    yPosition -= 35;

    // Certificate Title
    const titleLines = wrapText(options.certificateTitle, 70);
    for (const line of titleLines) {
        const lineWidth = boldFont.widthOfTextAtSize(line, 18);
        page.drawText(line, {
            x: width / 2 - lineWidth / 2,
            y: yPosition,
            size: 18,
            font: boldFont,
            color: textColor,
        });
        yPosition -= 25;
    }

    yPosition -= 30;

    // Details section
    const leftColumn = 80;
    const detailsSize = 11;

    if (options.certificateCode) {
        page.drawText('Certificate Code:', {
            x: leftColumn,
            y: yPosition,
            size: detailsSize,
            font: regularFont,
            color: lightGray,
        });
        page.drawText(options.certificateCode, {
            x: leftColumn + 120,
            y: yPosition,
            size: detailsSize,
            font: boldFont,
            color: textColor,
        });
        yPosition -= 20;
    }

    if (options.sector) {
        page.drawText('Sector:', {
            x: leftColumn,
            y: yPosition,
            size: detailsSize,
            font: regularFont,
            color: lightGray,
        });
        page.drawText(options.sector, {
            x: leftColumn + 120,
            y: yPosition,
            size: detailsSize,
            font: boldFont,
            color: textColor,
        });
        yPosition -= 20;
    }

    if (options.nsqfLevel) {
        page.drawText('NSQF Level:', {
            x: leftColumn,
            y: yPosition,
            size: detailsSize,
            font: regularFont,
            color: lightGray,
        });
        page.drawText(`Level ${options.nsqfLevel}`, {
            x: leftColumn + 120,
            y: yPosition,
            size: detailsSize,
            font: boldFont,
            color: textColor,
        });
        yPosition -= 20;
    }

    if (options.occupation) {
        page.drawText('Occupation:', {
            x: leftColumn,
            y: yPosition,
            size: detailsSize,
            font: regularFont,
            color: lightGray,
        });
        const occupationLines = wrapText(options.occupation, 50);
        for (const line of occupationLines) {
            page.drawText(line, {
                x: leftColumn + 120,
                y: yPosition,
                size: detailsSize,
                font: boldFont,
                color: textColor,
            });
            yPosition -= 20;
        }
    }

    page.drawText('Date of Issuance:', {
        x: leftColumn,
        y: yPosition,
        size: detailsSize,
        font: regularFont,
        color: lightGray,
    });
    const dateStr = options.issuedAt.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    page.drawText(dateStr, {
        x: leftColumn + 120,
        y: yPosition,
        size: detailsSize,
        font: boldFont,
        color: textColor,
    });

    yPosition -= 40;

    // Awarding body
    if (options.awardingBodies && options.awardingBodies.length > 0) {
        page.drawText('Awarded by:', {
            x: width / 2 - 50,
            y: yPosition,
            size: 11,
            font: regularFont,
            color: lightGray,
        });
        yPosition -= 20;

        options.awardingBodies.forEach(body => {
            const bodyWidth = boldFont.widthOfTextAtSize(body, 12);
            page.drawText(body, {
                x: width / 2 - bodyWidth / 2,
                y: yPosition,
                size: 12,
                font: boldFont,
                color: primaryColor,
            });
            yPosition -= 18;
        });
    }

    // Footer
    const footerY = 60;
    const footerText = `Credential ID: ${options.credentialId}`;
    const footerWidth = regularFont.widthOfTextAtSize(footerText, 9);
    page.drawText(footerText, {
        x: width / 2 - footerWidth / 2,
        y: footerY,
        size: 9,
        font: regularFont,
        color: lightGray,
    });

    const disclaimerText = 'This is a digitally generated certificate. Verify authenticity at the issuing platform.';
    const disclaimerWidth = regularFont.widthOfTextAtSize(disclaimerText, 8);
    page.drawText(disclaimerText, {
        x: width / 2 - disclaimerWidth / 2,
        y: footerY - 15,
        size: 8,
        font: regularFont,
        color: lightGray,
    });

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();

    return Buffer.from(pdfBytes);
}

/**
 * Helper function to wrap text
 */
function wrapText(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
        return [text];
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + word).length <= maxLength) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

/**
 * Generate PDF from MockCredential
 */
export async function generatePDFFromCredential(credential: MockCredential): Promise<Buffer> {
    return generateCredentialPDF({
        credentialId: credential.id,
        learnerName: credential.learner_name,
        certificateTitle: credential.certificate_title,
        certificateCode: credential.certificate_code,
        issuedAt: credential.issued_at,
        sector: credential.sector,
        nsqfLevel: credential.nsqf_level,
        awardingBodies: credential.awarding_bodies,
        occupation: credential.occupation,
    });
}
