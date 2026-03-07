import { PDFDocument } from 'pdf-lib';
import crypto from 'crypto';
import { logger } from './logger';

/**
 * PDF Metadata Utilities — Simplified.
 *
 * New approach: only the credential_id is embedded in the PDF Keywords field.
 * All other data (tx_hash, checksum, data_hash, canonical JSON, ipfs_cid,
 * pdf_url) lives exclusively in the database.
 *
 * Checksum is computed on the PDF WITH the credential_id already embedded,
 * so verification never needs to strip/normalize — just SHA-256 the file
 * as-is and compare with the stored checksum.
 */

/**
 * Compute SHA-256 checksum of a PDF buffer
 */
export function computePdfChecksum(pdfBuffer: Buffer | Uint8Array): string {
    return crypto.createHash('sha256').update(pdfBuffer).digest('hex');
}

/**
 * Embed only the credential_id into the PDF Keywords field.
 * Returns the modified PDF buffer.
 *
 * Uses { updateMetadata: false } so pdf-lib does not touch
 * ModificationDate, making the output fully deterministic for
 * the same input.
 */
export async function embedCredentialId(
    pdfBuffer: Buffer,
    credentialId: string,
): Promise<Buffer> {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer, { updateMetadata: false });
        pdfDoc.setKeywords([credentialId]);
        const modifiedPdfBytes = await pdfDoc.save();

        logger.info('Embedded credential_id in PDF Keywords', {
            credential_id: credentialId,
            original_size: pdfBuffer.length,
            modified_size: modifiedPdfBytes.length,
        });

        return Buffer.from(modifiedPdfBytes);
    } catch (error: any) {
        logger.error('Failed to embed credential_id in PDF', { error: error.message });
        throw new Error(`Failed to embed credential_id in PDF: ${error.message}`);
    }
}

/**
 * Extract the credential_id from a PDF's Keywords field.
 * Returns null if no credential_id is found.
 */
export async function extractCredentialId(pdfBuffer: Buffer | Uint8Array): Promise<string | null> {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer, { updateMetadata: false });
        const keywords = pdfDoc.getKeywords();

        if (!keywords || keywords.trim().length === 0) {
            logger.warn('No credential_id found in PDF Keywords');
            return null;
        }

        // Keywords field stores the credential_id as a plain string.
        // Old-format PDFs may store a JSON blob — try to detect and handle.
        let credentialId = keywords.trim();

        // If it looks like JSON (old format), try to extract credential_id from it
        if (credentialId.startsWith('{') || credentialId.startsWith('[')) {
            try {
                const parsed = JSON.parse(credentialId);
                credentialId = parsed?.canonical_json?.credential_id || parsed?.credential_id || '';
                if (!credentialId) {
                    logger.warn('Old-format PDF metadata: could not find credential_id in JSON');
                    return null;
                }
                logger.info('Extracted credential_id from old-format JSON metadata', {
                    credential_id: credentialId,
                });
            } catch {
                // Not valid JSON; treat as raw credential_id
            }
        }

        logger.info('Extracted credential_id from PDF', { credential_id: credentialId });
        return credentialId;
    } catch (error: any) {
        logger.error('Failed to extract credential_id from PDF', { error: error.message });
        return null;
    }
}
