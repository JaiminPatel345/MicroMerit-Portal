import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { PdfRepository } from './repository';
import { GeneratePdfInput } from './schema';
import { logger } from '../../utils/logger';
import { s3Service } from '../../utils/s3';
import crypto from 'crypto';

export class PdfService {
  private repository: PdfRepository;

  constructor(repository: PdfRepository) {
    this.repository = repository;
  }

  /**
   * Generate QR code as data URL
   */
  private async generateQRCode(data: string): Promise<string> {
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 200,
        margin: 1,
      });

      return qrCodeDataUrl;
    } catch (error) {
      logger.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Create PDF certificate with embedded QR code
   */
  private async createPdfCertificate(
    credential: any,
    qrCodeDataUrl: string,
    templateType: string
  ): Promise<Buffer> {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size

      const { width, height } = page.getSize();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Draw border
      page.drawRectangle({
        x: 30,
        y: 30,
        width: width - 60,
        height: height - 60,
        borderColor: rgb(0.2, 0.4, 0.7),
        borderWidth: 3,
      });

      // Draw inner border
      page.drawRectangle({
        x: 40,
        y: 40,
        width: width - 80,
        height: height - 80,
        borderColor: rgb(0.2, 0.4, 0.7),
        borderWidth: 1,
      });

      // Title
      page.drawText('CERTIFICATE OF ACHIEVEMENT', {
        x: width / 2 - 200,
        y: height - 100,
        size: 28,
        font: helveticaBold,
        color: rgb(0.2, 0.4, 0.7),
      });

      // Subtitle line
      page.drawLine({
        start: { x: 100, y: height - 120 },
        end: { x: width - 100, y: height - 120 },
        thickness: 2,
        color: rgb(0.8, 0.6, 0.2),
      });

      // "This is to certify that"
      page.drawText('This is to certify that', {
        x: width / 2 - 90,
        y: height - 180,
        size: 16,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });

      // Learner name (if available)
      const learnerName = credential.learner?.email || 'Certificate Holder';
      page.drawText(learnerName, {
        x: width / 2 - (learnerName.length * 6),
        y: height - 220,
        size: 24,
        font: timesRomanBold,
        color: rgb(0.2, 0.4, 0.7),
      });

      // Underline for name
      page.drawLine({
        start: { x: 100, y: height - 230 },
        end: { x: width - 100, y: height - 230 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Description
      const description = credential.metadata?.description ||
        `has successfully completed the requirements and is awarded this credential`;

      page.drawText(description, {
        x: width / 2 - (description.length * 3),
        y: height - 280,
        size: 14,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
        maxWidth: width - 120,
      });

      // Credential details
      page.drawText(`Credential ID: ${credential.credential_id}`, {
        x: 80,
        y: height - 340,
        size: 12,
        font: timesRomanFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      page.drawText(`Issued by: ${credential.issuer.name}`, {
        x: 80,
        y: height - 365,
        size: 12,
        font: timesRomanFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      page.drawText(`Issue Date: ${new Date(credential.issued_at).toLocaleDateString()}`, {
        x: 80,
        y: height - 390,
        size: 12,
        font: timesRomanFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Status
      page.drawText(`Status: ${credential.status.toUpperCase()}`, {
        x: 80,
        y: height - 415,
        size: 12,
        font: timesRomanBold,
        color: credential.status === 'claimed' ? rgb(0, 0.6, 0) :
          credential.status === 'revoked' ? rgb(0.8, 0, 0) :
            rgb(0.2, 0.4, 0.7),
      });

      // Embed QR code
      const qrImageBytes = Buffer.from(
        qrCodeDataUrl.replace(/^data:image\/png;base64,/, ''),
        'base64'
      );
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      const qrDims = qrImage.scale(0.5);

      page.drawImage(qrImage, {
        x: width - 150,
        y: 80,
        width: qrDims.width,
        height: qrDims.height,
      });

      // QR code label
      page.drawText('Scan to verify', {
        x: width - 140,
        y: 60,
        size: 10,
        font: timesRomanFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Issuer signature section
      page.drawLine({
        start: { x: 80, y: 150 },
        end: { x: 250, y: 150 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      page.drawText('Authorized Signature', {
        x: 120,
        y: 130,
        size: 10,
        font: timesRomanFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Footer
      page.drawText('This is a digitally generated certificate. Verify authenticity at:', {
        x: 80,
        y: 90,
        size: 8,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/credentials/${credential.credential_id}`;
      page.drawText(verifyUrl, {
        x: 80,
        y: 75,
        size: 8,
        font: timesRomanFont,
        color: rgb(0.2, 0.4, 0.7),
      });

      // Serialize the PDF to bytes
      const pdfBytes = await pdfDoc.save();

      return Buffer.from(pdfBytes);
    } catch (error) {
      logger.error('Error creating PDF certificate:', error);
      throw new Error('Failed to create PDF certificate');
    }
  }

  /**
   * Compute SHA256 hash of buffer
   */
  private computeHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Save file to S3
   */
  private async saveFile(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const key = `certificates/${filename}`;
    return await s3Service.uploadFile(buffer, key, contentType);
  }

  /**
   * Generate PDF certificate for a credential
   */
  async generatePdfCertificate(input: GeneratePdfInput) {
    const { credentialUid, templateType } = input;

    // Find credential
    const credential = await this.repository.findCredentialByUid(credentialUid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    // Check if credential is revoked
    if (credential.status === 'revoked') {
      throw new Error('Cannot generate PDF for revoked credential');
    }

    // Generate verification URL for QR code
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/credentials/${credential.credential_id}`;

    // Generate QR code
    const qrCodeDataUrl = await this.generateQRCode(verifyUrl);

    // Save QR code as separate file
    const qrCodeBuffer = Buffer.from(
      qrCodeDataUrl.replace(/^data:image\/png;base64,/, ''),
      'base64'
    );
    const qrCodeFilename = `${credentialUid}-qr.png`;
    const qrCodeUrl = await this.saveFile(qrCodeBuffer, qrCodeFilename, 'image/png');

    // Create PDF certificate
    const pdfBuffer = await this.createPdfCertificate(
      credential,
      qrCodeDataUrl,
      templateType || 'standard'
    );

    // Compute SHA256 hash of PDF
    const pdfHash = this.computeHash(pdfBuffer);
    logger.info(`PDF hash computed for credential ${credentialUid}: ${pdfHash}`);

    // Save PDF
    const pdfFilename = `${credentialUid}-certificate.pdf`;
    const pdfUrl = await this.saveFile(pdfBuffer, pdfFilename, 'application/pdf');

    // PDF certificate table no longer exists - PDF URL is stored in Credential model
    // Update credential with PDF URL and metadata
    const existingMetadata = credential.metadata && typeof credential.metadata === 'object'
      ? credential.metadata as any
      : {};

    const existingPdfMeta = existingMetadata.pdf && typeof existingMetadata.pdf === 'object'
      ? existingMetadata.pdf
      : {};

    const updatedMetadata = {
      ...existingMetadata,
      pdf: {
        ...existingPdfMeta,
        url: pdfUrl,
        hash: pdfHash,
        generatedAt: new Date().toISOString(),
        filename: pdfFilename,
        qrCodeUrl: qrCodeUrl,
      },
    };

    await this.repository.updateCredentialMetadata(credential.credential_id, updatedMetadata);

    logger.info(`PDF certificate generated for credential: ${credentialUid}`);

    return {
      credentialUid,
      pdfUrl,
      qrCodeUrl,
      createdAt: new Date(),
      message: 'PDF certificate generated',
    };
  }

  /**
   * Get PDF certificate by credential UID
   */
  async getPdfCertificate(credentialUid: string) {
    const pdfUrl = await this.repository.findPdfByCredentialUid(credentialUid);

    if (!pdfUrl) {
      throw new Error('PDF certificate not found for this credential');
    }

    return {
      credentialUid,
      pdfUrl: pdfUrl,
      qrCodeUrl: null, // QR is embedded in PDF
      createdAt: new Date(),
    };
  }

  /**
   * Download PDF file from S3
   */
  async downloadPdf(credentialUid: string): Promise<{ buffer: Buffer; filename: string }> {
    const pdfUrl = await this.repository.findPdfByCredentialUid(credentialUid);

    if (!pdfUrl) {
      throw new Error('PDF certificate not found');
    }

    // Extract S3 key from URL
    const s3Key = s3Service.extractKeyFromUrl(pdfUrl);
    const filename = `${credentialUid}-certificate.pdf`;

    try {
      const buffer = await s3Service.downloadFile(s3Key);
      return { buffer, filename };
    } catch (error) {
      logger.error('Error downloading PDF from S3:', error);
      throw new Error('PDF file not found on S3');
    }
  }
}
