/**
 * On-Demand External Certificate Service
 *
 * Handles learner-initiated "Add Certificate" requests.
 * Flow:
 *   1. Find connector for the selected issuer
 *   2. Fetch credential from external endpoint
 *   3. Normalize response fields (field mapping per issuer)
 *   4. Verify learner ownership (email compare or custom verify fn)
 *   5. Convert base64 PDF → Buffer
 *   6. Run the full credential issuance pipeline (blockchain + IPFS, async)
 *   7. Return credential immediately with pending statuses
 */

import { credentialIssuanceService } from '../credential-issuance/service';
import {
  getAllOnDemandConnectors,
  getOnDemandConnectorByIssuerId,
  fetchFromExternalIssuer,
  OnDemandConnector,
  OnDemandCredential,
} from './ondemand.connectors';
import { logger } from '../../utils/logger';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import axios from 'axios';

/**
 * Download an image from a URL and return its buffer and detected type.
 */
async function downloadImage(url: string): Promise<{ buffer: Buffer; type: 'png' | 'jpg' }> {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  const buffer = Buffer.from(response.data);
  const contentType = (response.headers['content-type'] || '').toLowerCase();
  const type: 'png' | 'jpg' = contentType.includes('png') ? 'png' : 'jpg';
  return { buffer, type };
}

/**
 * Create a PDF from a badge image (used for Credly and other image-based providers).
 * Embeds the badge image prominently with credential metadata below it.
 */
async function generateImagePdf(cred: OnDemandCredential, imageBuffer: Buffer, imageType: 'png' | 'jpg'): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  // Embed the image
  const image = imageType === 'png'
    ? await pdfDoc.embedPng(imageBuffer)
    : await pdfDoc.embedJpg(imageBuffer);

  // Scale image to fit nicely (max 400px wide, centered)
  const imgDims = image.scale(1);
  const maxWidth = 400;
  const maxHeight = 400;
  const scale = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height, 1);
  const imgW = imgDims.width * scale;
  const imgH = imgDims.height * scale;

  // Draw image centered in the upper portion
  const imgX = (width - imgW) / 2;
  const imgY = height - imgH - 80;
  page.drawImage(image, { x: imgX, y: imgY, width: imgW, height: imgH });

  // Credential title below image
  const titleY = imgY - 40;
  const titleLines = wrapText(cred.title, 55);
  titleLines.forEach((line, i) => {
    const textWidth = font.widthOfTextAtSize(line, 16);
    page.drawText(line, { x: (width - textWidth) / 2, y: titleY - i * 22, size: 16, font, color: rgb(0.1, 0.1, 0.1) });
  });

  // Issuer name
  const issuerY = titleY - titleLines.length * 22 - 15;
  const issuerText = `Issued by ${cred.issuer_name}`;
  const issuerTextWidth = fontRegular.widthOfTextAtSize(issuerText, 12);
  page.drawText(issuerText, { x: (width - issuerTextWidth) / 2, y: issuerY, size: 12, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Learner name
  if (cred.learner_name) {
    const nameY = issuerY - 25;
    const nameText = `Awarded to: ${cred.learner_name}`;
    const nameWidth = fontRegular.widthOfTextAtSize(nameText, 12);
    page.drawText(nameText, { x: (width - nameWidth) / 2, y: nameY, size: 12, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  }

  // Skills (if available)
  const skills = cred.extra?.skills;
  if (skills && skills.length > 0) {
    const skillsY = (cred.learner_name ? issuerY - 50 : issuerY - 25);
    const skillsText = `Skills: ${skills.slice(0, 6).join(', ')}`;
    const skillLines = wrapText(skillsText, 80);
    skillLines.forEach((line, i) => {
      page.drawText(line, { x: 60, y: skillsY - i * 15, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    });
  }

  // Footer metadata
  page.drawText(`Credential ID: ${cred.external_id}`, { x: 60, y: 100, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText(`Issued: ${cred.issued_date}`, { x: 60, y: 85, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  if (cred.extra?.credly_badge_url) {
    page.drawText(`Badge URL: ${cred.extra.credly_badge_url}`, { x: 60, y: 70, size: 8, font: fontRegular, color: rgb(0.45, 0.45, 0.7) });
  }
  page.drawText('Verified via MicroMerit Portal', { x: 60, y: 55, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate a minimal PDF certificate from metadata when external issuer doesn't provide one.
 * Used as last-resort fallback when no image or PDF is available.
 */
async function generateFallbackPdf(cred: OnDemandCredential): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();

  // Title
  page.drawText('CERTIFICATE OF COMPLETION', { x: 150, y: height - 80, size: 18, font, color: rgb(0.18, 0.38, 0.65) });

  // Issuer
  page.drawText(cred.issuer_name, { x: 200, y: height - 120, size: 20, font, color: rgb(0.1, 0.1, 0.1) });

  page.drawText('hereby certifies that', { x: 220, y: height - 155, size: 11, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  // Learner name
  const displayName = cred.learner_name || 'Credential Holder';
  page.drawText(displayName, { x: 150, y: height - 195, size: 22, font, color: rgb(0.18, 0.38, 0.65) });

  page.drawText('has successfully completed', { x: 195, y: height - 235, size: 11, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  // Title (word-wrap manually for long titles)
  const titleLines = wrapText(cred.title, 60);
  titleLines.forEach((line, i) => {
    page.drawText(line, { x: 80, y: height - 275 - i * 25, size: 16, font, color: rgb(0.1, 0.1, 0.1) });
  });

  const descY = height - 275 - titleLines.length * 25 - 20;

  // Description
  if (cred.description) {
    const descLines = wrapText(cred.description, 80);
    descLines.slice(0, 4).forEach((line, i) => {
      page.drawText(line, { x: 60, y: descY - i * 17, size: 10, font: fontRegular, color: rgb(0.35, 0.35, 0.35) });
    });
  }

  // Footer metadata
  page.drawText(`Credential ID: ${cred.external_id}`, { x: 60, y: 120, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText(`Issued: ${cred.issued_date}`, { x: 60, y: 105, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('Verified via MicroMerit Portal', { x: 60, y: 90, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}


export interface AddCertificateParams {
  issuer_id: number;
  credential_id: string;
  logged_in_email: string;
}

export interface AddCertificateResult {
  credential_id: string;
  title: string;
  learner_email: string;
  issuer_name: string;
  issued_at: Date;
  blockchain_status: 'pending' | 'confirmed' | 'failed';
  ipfs_status: 'pending' | 'confirmed' | 'failed';
  tx_hash: string | null;
  ipfs_cid: string | null;
  pdf_url: string | null;
  status: string;
  db_id: string;
}

export interface OnDemandIssuerInfo {
  id: number;
  slug: string;
  name: string;
}

export class OnDemandCertService {
  /**
   * Get list of all issuers with on-demand sync configured.
   * Returns issuers in a format ready for the learner dropdown.
   */
  getAvailableIssuers(): OnDemandIssuerInfo[] {
    return getAllOnDemandConnectors()
      .filter(c => c.issuerId > 0)
      .map(c => ({
        id: c.issuerId,
        slug: c.id,
        name: c.name,
      }));
  }

  /**
   * Main add-certificate flow triggered by a learner.
   */
  async addCertificate(params: AddCertificateParams): Promise<AddCertificateResult> {
    const { issuer_id, credential_id, logged_in_email } = params;

    // ── Step 1: Find connector ────────────────────────────────────────────
    const connector = getOnDemandConnectorByIssuerId(issuer_id);
    if (!connector) {
      throw new NotFoundError(`No on-demand connector found for issuer ID ${issuer_id}`, 404, 'ISSUER_NOT_SUPPORTED');
    }

    logger.info(`[OnDemand] Add certificate requested`, {
      issuer: connector.name,
      credential_id,
      logged_in_email,
    });

    // ── Step 2: Fetch from external issuer ───────────────────────────────
    // Typed errors (NotFoundError, ForbiddenError, ValidationError) are thrown
    // directly by fetchFromExternalIssuer and will bubble up to the controller.
    let rawResponse: any;
    try {
      rawResponse = await fetchFromExternalIssuer(connector, credential_id);
    } catch (err: any) {
      // Re-throw typed errors as-is; only wrap truly unexpected ones
      if (err.statusCode) throw err;
      logger.error(`[OnDemand][${connector.id}] External fetch failed`, { error: err.message });
      throw new ValidationError(
        `Failed to reach ${connector.name}. Please try again later.`,
        502,
        'EXTERNAL_ISSUER_UNREACHABLE'
      );
    }

    // ── Step 3: Normalize fields ─────────────────────────────────────────
    const normalized = connector.normalize(rawResponse);
    logger.info(`[OnDemand][${connector.id}] Normalized credential`, {
      title: normalized.title,
      learner_email: normalized.learner_email,
    });

    // ── Step 4: Verify ownership ─────────────────────────────────────────
    const isVerified = connector.verify(rawResponse, logged_in_email);
    if (!isVerified) {
      logger.warn(`[OnDemand][${connector.id}] Email mismatch`, {
        credential_email: normalized.learner_email,
        logged_in_email,
      });
      throw new ForbiddenError(
        `This credential does not belong to your account. It is linked to a different email address.`,
        403,
        'CREDENTIAL_OWNERSHIP_MISMATCH'
      );
    }

    // ── Step 5: Get PDF Buffer ────────────────────────────────────────────
    // Priority: 1) issuer-provided base64 PDF  2) badge image → embedded PDF  3) text-only fallback
    let pdfBuffer: Buffer;
    if (normalized.pdf_base64) {
      pdfBuffer = Buffer.from(normalized.pdf_base64, 'base64');
      if (pdfBuffer.length === 0) {
        throw new ValidationError('Received an empty PDF from the external issuer. Please try again or contact support.', 400, 'EMPTY_PDF');
      }
      logger.info(`[OnDemand][${connector.id}] PDF decoded from base64`, { bytes: pdfBuffer.length });
    } else if (normalized.extra?.badge_image_url) {
      // Download badge image and create a proper PDF with the image embedded
      const imageUrl = normalized.extra.badge_image_url;
      logger.info(`[OnDemand][${connector.id}] Downloading badge image for PDF`, { imageUrl });
      try {
        const { buffer: imageBuffer, type: imageType } = await downloadImage(imageUrl);
        logger.info(`[OnDemand][${connector.id}] Badge image downloaded`, { bytes: imageBuffer.length, type: imageType });
        pdfBuffer = await generateImagePdf(normalized, imageBuffer, imageType);
        logger.info(`[OnDemand][${connector.id}] Image-based PDF generated`, { bytes: pdfBuffer.length });
      } catch (imgErr: any) {
        logger.warn(`[OnDemand][${connector.id}] Failed to download badge image, falling back to text PDF`, { error: imgErr.message });
        pdfBuffer = await generateFallbackPdf(normalized);
      }
    } else {
      logger.info(`[OnDemand][${connector.id}] No PDF or image provided by issuer — generating fallback PDF`);
      pdfBuffer = await generateFallbackPdf(normalized);
      logger.info(`[OnDemand][${connector.id}] Fallback PDF generated`, { bytes: pdfBuffer.length });
    }

    // ── Step 6: Run full issuance pipeline (async, returns immediately) ───
    const issued_at = normalized.issued_date
      ? new Date(normalized.issued_date)
      : new Date();

    const filename = `${connector.id}-${credential_id}-${Date.now()}.pdf`;

    // For Credly: learner_email is empty (hash-verified), so we use the logged-in email
    const learnerEmail = normalized.learner_email || logged_in_email;

    // Build display issuer name: for real providers, format as "OrgName | Platform"
    // e.g. "Google Cloud | Credly" — only when the org name differs from the connector platform name
    const issuerNameOverride =
      normalized.issuer_name && normalized.issuer_name !== connector.name
        ? `${normalized.issuer_name} | ${connector.name}`
        : connector.name;

    const result = await credentialIssuanceService.issueCredential({
      learner_email:           learnerEmail,
      issuer_id,
      certificate_title:       normalized.title,
      issued_at,
      original_pdf:            pdfBuffer,
      original_pdf_filename:   filename,
      mimetype:                'application/pdf',
      issuer_name_override:    issuerNameOverride,
    });

    logger.info(`[OnDemand][${connector.id}] Credential issued`, {
      credential_id: result.credential_id,
      blockchain_status: result.blockchain_status,
      ipfs_status: result.ipfs_status,
    });

    // ── Step 7: Return immediately with pending statuses ─────────────────
    return {
      credential_id:    result.credential_id,
      title:            normalized.title,
      learner_email:    result.learner_email,
      issuer_name:      issuerNameOverride,
      issued_at,
      blockchain_status: result.blockchain_status,
      ipfs_status:       result.ipfs_status,
      tx_hash:           result.tx_hash,
      ipfs_cid:          result.ipfs_cid,
      pdf_url:           result.pdf_url,
      status:            result.status,
      db_id:             result.id,   // Prisma PK — matches GET /learner/credentials/:id
    };
  }
}

export const onDemandCertService = new OnDemandCertService();
