import { PDFDocument } from 'pdf-lib';
import crypto from 'crypto';
import { logger } from './logger';

/**
 * PDF Metadata Utilities
 * Embed/extract credential verification data in PDF metadata (Keywords field)
 */

export interface CredentialPdfMetadata {
    canonical_json: Record<string, any>;
    tx_hash: string;
    checksum: string;
}

/**
 * Recursively remove null values from an object.
 */
function stripNulls(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) continue;
        if (typeof value === 'object' && !Array.isArray(value)) {
            const nested = stripNulls(value);
            if (Object.keys(nested).length > 0) result[key] = nested;
        } else {
            result[key] = value;
        }
    }
    return result;
}

/**
 * Compute SHA-256 checksum of a PDF buffer
 */
export function computePdfChecksum(pdfBuffer: Buffer): string {
    return crypto.createHash('sha256').update(pdfBuffer).digest('hex');
}

/**
 * Embed credential metadata into PDF's Keywords field
 * Returns the modified PDF buffer with metadata embedded
 */
export async function embedPdfMetadata(
    pdfBuffer: Buffer,
    metadata: CredentialPdfMetadata
): Promise<Buffer> {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        
        // Strip null values from canonical_json before embedding
        const cleanCanonical = stripNulls(metadata.canonical_json);
        const cleanMetadata = { ...metadata, canonical_json: cleanCanonical };

        // Store metadata as JSON string in the Keywords field
        const metadataString = JSON.stringify(cleanMetadata);
        pdfDoc.setKeywords([metadataString]);
        
        const modifiedPdfBytes = await pdfDoc.save();
        
        logger.info('Embedded metadata in PDF', {
            checksum: metadata.checksum,
            tx_hash: metadata.tx_hash,
            metadata_size: metadataString.length,
        });
        
        return Buffer.from(modifiedPdfBytes);
    } catch (error: any) {
        logger.error('Failed to embed PDF metadata', { error: error.message });
        throw new Error(`Failed to embed PDF metadata: ${error.message}`);
    }
}

/**
 * Extract credential metadata from PDF's Keywords field
 * Returns null if no metadata found
 */
export async function extractPdfMetadata(
    pdfBuffer: Buffer
): Promise<CredentialPdfMetadata | null> {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const keywords = pdfDoc.getKeywords();

        if (!keywords) {
            return null;
        }

        // Keywords is stored as a single JSON string
        const metadata = JSON.parse(keywords) as CredentialPdfMetadata;
        
        if (!metadata.canonical_json || !metadata.tx_hash || !metadata.checksum) {
            logger.warn('PDF metadata missing required fields', { 
                has_canonical: !!metadata.canonical_json,
                has_tx_hash: !!metadata.tx_hash,
                has_checksum: !!metadata.checksum,
            });
            return null;
        }

        return metadata;
    } catch (error: any) {
        logger.error('Failed to extract PDF metadata', { error: error.message });
        return null;
    }
}

/**
 * Strip metadata from PDF and return clean PDF bytes
 * This removes the Keywords field so we get the original PDF bytes for checksum computation
 * 
 * IMPORTANT: We don't actually remove existing keywords and re-save, because pdf-lib
 * re-serialization changes bytes. Instead, for verification we extract metadata,
 * then compute checksum by stripping keywords and re-saving. This matches the 
 * issuance flow where checksum was computed on the ORIGINAL pdf buffer before 
 * any metadata was added.
 * 
 * For frontend verification: the original PDF bytes (without metadata) should produce
 * the same checksum when the metadata is stripped.
 */
export async function stripPdfMetadata(pdfBuffer: Buffer): Promise<Buffer> {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        
        // Remove the keywords metadata
        pdfDoc.setKeywords([]);
        
        const cleanPdfBytes = await pdfDoc.save();
        return Buffer.from(cleanPdfBytes);
    } catch (error: any) {
        logger.error('Failed to strip PDF metadata', { error: error.message });
        throw new Error(`Failed to strip PDF metadata: ${error.message}`);
    }
}
