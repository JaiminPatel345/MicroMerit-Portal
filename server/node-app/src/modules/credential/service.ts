import { CredentialRepository } from './repository';
import { IssueCredentialInput, ClaimCredentialInput, RevokeCredentialInput } from './schema';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

export class CredentialService {
  private repository: CredentialRepository;

  constructor(repository: CredentialRepository) {
    this.repository = repository;
  }

  /**
   * Issue a new credential
   * Called by issuer to create a credential for a learner
   */
  async issueCredential(issuerId: number, input: IssueCredentialInput) {
    const { learnerEmail, learnerPhone, credentialUid, metadata } = input;

    // Check if credential UID already exists
    const existing = await this.repository.findCredentialByUid(credentialUid);
    if (existing) {
      throw new Error('Credential UID already exists');
    }

    // Find learner (optional - can be claimed later)
    let learnerId: number | undefined;
    if (learnerEmail || learnerPhone) {
      const learner = await this.repository.findLearner(learnerEmail, learnerPhone);
      if (learner) {
        learnerId = learner.id;
      }
    }

    // Create credential
    const credential = await this.repository.createCredential({
      issuerId,
      learnerId,
      credentialUid,
      metadata,
    });

    logger.info(`Credential issued: ${credentialUid} by issuer ${issuerId}`);

    return {
      credential: {
        id: credential.id,
        credentialUid: credential.credential_uid,
        status: credential.status,
        metadata: credential.metadata,
        issuedAt: credential.issued_at,
        claimedAt: credential.claimed_at,
        issuer: {
          id: credential.issuer.id,
          name: credential.issuer.name,
        },
        learner: credential.learner ? {
          id: credential.learner.id,
          email: credential.learner.email,
          phone: credential.learner.phone,
        } : null,
      },
    };
  }

  /**
   * Claim a credential
   * Called by learner to claim an unclaimed credential
   */
  async claimCredential(learnerId: number, input: ClaimCredentialInput) {
    const { credentialUid } = input;

    // Find credential
    const existing = await this.repository.findCredentialByUid(credentialUid);
    if (!existing) {
      throw new Error('Credential not found');
    }

    // Check if already claimed
    if (existing.learner_id) {
      if (existing.learner_id === learnerId) {
        throw new Error('Credential already claimed by you');
      } else {
        throw new Error('Credential already claimed by another learner');
      }
    }

    // Check if revoked
    if (existing.status === 'revoked') {
      throw new Error('Credential has been revoked');
    }

    // Claim the credential
    const credential = await this.repository.claimCredential(credentialUid, learnerId);

    logger.info(`Credential claimed: ${credentialUid} by learner ${learnerId}`);

    return {
      credential: {
        id: credential.id,
        credentialUid: credential.credential_uid,
        status: credential.status,
        metadata: credential.metadata,
        issuedAt: credential.issued_at,
        claimedAt: credential.claimed_at,
        issuer: {
          id: credential.issuer.id,
          name: credential.issuer.name,
        },
      },
    };
  }

  /**
   * Revoke a credential
   * Called by issuer to revoke a credential
   */
  async revokeCredential(issuerId: number, input: RevokeCredentialInput) {
    const { credentialUid } = input;

    // Find credential
    const existing = await this.repository.findCredentialByUid(credentialUid);
    if (!existing) {
      throw new Error('Credential not found');
    }

    // Check if issuer owns this credential
    if (existing.issuer_id !== issuerId) {
      throw new Error('You are not authorized to revoke this credential');
    }

    // Check if already revoked
    if (existing.status === 'revoked') {
      throw new Error('Credential already revoked');
    }

    // Revoke the credential
    const credential = await this.repository.revokeCredential(credentialUid);

    logger.info(`Credential revoked: ${credentialUid} by issuer ${issuerId}`);

    return {
      credential: {
        id: credential.id,
        credentialUid: credential.credential_uid,
        status: credential.status,
        metadata: credential.metadata,
        issuedAt: credential.issued_at,
        claimedAt: credential.claimed_at,
      },
    };
  }

  /**
   * Get credential details
   * Public endpoint - anyone can verify a credential
   */
  async getCredential(credentialUid: string) {
    const credential = await this.repository.findCredentialByUid(credentialUid);
    if (!credential) {
      throw new Error('Credential not found');
    }

    return {
      credential: {
        id: credential.id,
        credentialUid: credential.credential_uid,
        status: credential.status,
        metadata: credential.metadata,
        issuedAt: credential.issued_at,
        claimedAt: credential.claimed_at,
        issuer: {
          id: credential.issuer.id,
          name: credential.issuer.name,
          logoUrl: credential.issuer.logo_url,
        },
        learner: credential.learner ? {
          id: credential.learner.id,
          email: credential.learner.email,
        } : null,
        blockchain: credential.blockchain_record ? {
          txId: credential.blockchain_record.blockchain_tx_id,
          hash: credential.blockchain_record.hash_value,
          storedAt: credential.blockchain_record.stored_at,
        } : null,
        pdf: credential.pdf_certificate ? {
          pdfUrl: credential.pdf_certificate.pdf_url,
          qrCodeUrl: credential.pdf_certificate.qr_code_url,
        } : null,
      },
    };
  }

  /**
   * Get all credentials for a learner
   */
  async getLearnerCredentials(learnerId: number) {
    const credentials = await this.repository.findCredentialsByLearnerId(learnerId);

    return {
      credentials: credentials.map((cred: any) => ({
        id: cred.id,
        credentialUid: cred.credential_uid,
        status: cred.status,
        metadata: cred.metadata,
        issuedAt: cred.issued_at,
        claimedAt: cred.claimed_at,
        issuer: {
          id: cred.issuer.id,
          name: cred.issuer.name,
          logoUrl: cred.issuer.logo_url,
        },
        hasBlockchainRecord: !!cred.blockchain_record,
        hasPdfCertificate: !!cred.pdf_certificate,
      })),
      total: credentials.length,
    };
  }

  /**
   * Get all credentials issued by an issuer
   */
  async getIssuerCredentials(issuerId: number) {
    const credentials = await this.repository.findCredentialsByIssuerId(issuerId);
    const stats = await this.repository.getIssuerStats(issuerId);

    return {
      credentials: credentials.map((cred: any) => ({
        id: cred.id,
        credentialUid: cred.credential_uid,
        status: cred.status,
        metadata: cred.metadata,
        issuedAt: cred.issued_at,
        claimedAt: cred.claimed_at,
        learner: cred.learner ? {
          id: cred.learner.id,
          email: cred.learner.email,
          phone: cred.learner.phone,
        } : null,
        hasBlockchainRecord: !!cred.blockchain_record,
        hasPdfCertificate: !!cred.pdf_certificate,
      })),
      stats,
    };
  }

  /**
   * Generate a unique credential UID
   * Helper method for issuers
   */
  generateCredentialUid(): string {
    return `CRED-${Date.now()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  }
}
