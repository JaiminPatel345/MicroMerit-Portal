import { VerificationRepository } from './repository';
import { logger } from '../../utils/logger';
import crypto from 'crypto';
const pdfParse = require('pdf-parse');

export class VerificationService {
  private repository: VerificationRepository;

  constructor(repository: VerificationRepository) {
    this.repository = repository;
  }

  /**
   * Verify credential by UID
   * Public endpoint - anyone can verify a credential
   */
  async verifyCredentialByUid(credentialUid: string) {
    const credential = await this.repository.findCredentialByUid(credentialUid);
    
    if (!credential) {
      return null;
    }

    return {
      success: true,
      credential: {
        uid: credential.credential_uid,
        status: credential.status,
        issuedAt: credential.issued_at,
        claimedAt: credential.claimed_at,
        metadata: credential.metadata,
      },
      issuer: {
        id: credential.issuer.id,
        name: credential.issuer.name,
        type: credential.issuer.type,
        logoUrl: credential.issuer.logo_url,
        officialDomain: credential.issuer.official_domain,
        websiteUrl: credential.issuer.website_url,
        email: credential.issuer.email,
        status: credential.issuer.status,
      },
      learner: credential.learner ? {
        id: credential.learner.id,
        email: credential.learner.email,
        phone: credential.learner.phone,
        profileUrl: credential.learner.profileUrl,
      } : null,
      pdf: credential.pdf_certificate ? {
        pdfUrl: credential.pdf_certificate.pdf_url,
        qrCodeUrl: credential.pdf_certificate.qr_code_url,
        createdAt: credential.pdf_certificate.created_at,
      } : null,
      blockchain: credential.blockchain_record ? {
        transactionId: credential.blockchain_record.blockchain_tx_id,
        hashValue: credential.blockchain_record.hash_value,
        storedAt: credential.blockchain_record.stored_at,
      } : {
        // Placeholder data if no blockchain record exists yet
        transactionId: 'pending',
        hashValue: 'pending',
        storedAt: null,
        note: 'Blockchain verification pending',
      },
    };
  }

  /**
   * Extract credential UID from PDF text
   * Looks for patterns like "CRED-" or "Credential ID:"
   */
  private extractCredentialUidFromText(text: string): string | null {
    // Remove extra whitespace and newlines
    const cleanText = text.replace(/\s+/g, ' ').trim();

    // Pattern 1: Look for "Credential ID: CRED-..."
    const pattern1 = /Credential ID:\s*([A-Z0-9\-]+)/i;
    const match1 = cleanText.match(pattern1);
    if (match1 && match1[1]) {
      return match1[1];
    }

    // Pattern 2: Look for standalone CRED-... pattern
    const pattern2 = /(CRED-[0-9]+-[A-F0-9]+)/i;
    const match2 = cleanText.match(pattern2);
    if (match2 && match2[1]) {
      return match2[1];
    }

    // Pattern 3: Look for any alphanumeric ID after "Credential" or "ID"
    const pattern3 = /(?:Credential|ID):\s*([A-Z0-9\-]{10,})/i;
    const match3 = cleanText.match(pattern3);
    if (match3 && match3[1]) {
      return match3[1];
    }

    return null;
  }

  /**
   * Compute SHA256 hash of buffer
   */
  private computeHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Verify PDF by comparing hash and extracting credential UID
   */
  async verifyPdfUpload(pdfBuffer: Buffer) {
    try {
      // Parse PDF to extract text
      const pdfData = await pdfParse(pdfBuffer);
      const pdfText = pdfData.text;

      // Extract credential UID from text
      const credentialUid = this.extractCredentialUidFromText(pdfText);

      if (!credentialUid) {
        return {
          verified: false,
          reason: 'No credential UID found in PDF',
          credential: null,
          issuer: null,
          learner: null,
        };
      }

      // Fetch credential from database
      const credential = await this.repository.findCredentialByUid(credentialUid);

      if (!credential) {
        return {
          verified: false,
          reason: `Credential ${credentialUid} not found in database`,
          credential: null,
          issuer: null,
          learner: null,
        };
      }

      // Compute hash of uploaded PDF
      const uploadedPdfHash = this.computeHash(pdfBuffer);

      // Get stored hash from metadata
      const storedHash = credential.metadata && typeof credential.metadata === 'object' 
        ? (credential.metadata as any).pdf?.hash 
        : null;

      // If no stored hash, we can't verify integrity but can still verify existence
      if (!storedHash) {
        logger.warn(`No stored hash found for credential ${credentialUid}`);
        return {
          verified: true,
          reason: 'Credential exists but PDF hash verification not available (no stored hash)',
          hashMatch: null,
          credential: {
            uid: credential.credential_uid,
            status: credential.status,
            issuedAt: credential.issued_at,
            claimedAt: credential.claimed_at,
            metadata: credential.metadata,
          },
          issuer: {
            id: credential.issuer.id,
            name: credential.issuer.name,
            type: credential.issuer.type,
            logoUrl: credential.issuer.logo_url,
          },
          learner: credential.learner ? {
            id: credential.learner.id,
            email: credential.learner.email,
            phone: credential.learner.phone,
          } : null,
        };
      }

      // Compare hashes
      const hashMatch = uploadedPdfHash === storedHash;

      if (!hashMatch) {
        logger.warn(`Hash mismatch for credential ${credentialUid}. Expected: ${storedHash}, Got: ${uploadedPdfHash}`);
        return {
          verified: false,
          reason: 'PDF has been tampered with (hash mismatch)',
          hashMatch: false,
          credential: {
            uid: credential.credential_uid,
            status: credential.status,
            issuedAt: credential.issued_at,
          },
          issuer: {
            id: credential.issuer.id,
            name: credential.issuer.name,
          },
          learner: null,
        };
      }

      // Check if credential is revoked
      if (credential.status === 'revoked') {
        return {
          verified: false,
          reason: 'Credential has been revoked by issuer',
          hashMatch: true,
          credential: {
            uid: credential.credential_uid,
            status: credential.status,
            issuedAt: credential.issued_at,
            claimedAt: credential.claimed_at,
          },
          issuer: {
            id: credential.issuer.id,
            name: credential.issuer.name,
            type: credential.issuer.type,
          },
          learner: credential.learner ? {
            id: credential.learner.id,
            email: credential.learner.email,
          } : null,
        };
      }

      // All checks passed
      logger.info(`PDF verified successfully for credential ${credentialUid}`);
      return {
        verified: true,
        reason: 'PDF verification successful - authentic and unmodified',
        hashMatch: true,
        credential: {
          uid: credential.credential_uid,
          status: credential.status,
          issuedAt: credential.issued_at,
          claimedAt: credential.claimed_at,
          metadata: credential.metadata,
        },
        issuer: {
          id: credential.issuer.id,
          name: credential.issuer.name,
          type: credential.issuer.type,
          logoUrl: credential.issuer.logo_url,
          officialDomain: credential.issuer.official_domain,
          websiteUrl: credential.issuer.website_url,
        },
        learner: credential.learner ? {
          id: credential.learner.id,
          email: credential.learner.email,
          phone: credential.learner.phone,
          profileUrl: credential.learner.profileUrl,
        } : null,
        blockchain: credential.blockchain_record ? {
          transactionId: credential.blockchain_record.blockchain_tx_id,
          hashValue: credential.blockchain_record.hash_value,
          storedAt: credential.blockchain_record.stored_at,
        } : null,
      };
    } catch (error) {
      logger.error('Error verifying PDF:', error);
      throw new Error('Failed to parse and verify PDF');
    }
  }
}
