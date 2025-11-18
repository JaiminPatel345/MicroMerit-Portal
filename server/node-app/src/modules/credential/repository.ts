import { prisma } from '../../utils/prisma';

export class CredentialRepository {
  /**
   * Find learner by email or phone
   */
  async findLearner(email?: string, phone?: string) {
    if (email) {
      return prisma.learner.findUnique({ where: { email } });
    }
    if (phone) {
      return prisma.learner.findUnique({ where: { phone } });
    }
    return null;
  }

  /**
   * Create a new credential
   */
  async createCredential(data: {
    issuerId: number;
    learnerId?: number;
    credentialUid: string;
    metadata: any;
  }) {
    return prisma.credential.create({
      data: {
        issuer_id: data.issuerId,
        learner_id: data.learnerId,
        credential_uid: data.credentialUid,
        metadata: data.metadata,
        status: 'issued',
      },
      include: {
        issuer: true,
        learner: true,
      },
    });
  }

  /**
   * Find credential by UID
   */
  async findCredentialByUid(credentialUid: string) {
    return prisma.credential.findUnique({
      where: { credential_uid: credentialUid },
      include: {
        issuer: true,
        learner: true,
        blockchain_record: true,
        pdf_certificate: true,
      },
    });
  }

  /**
   * Find all credentials for a learner
   */
  async findCredentialsByLearnerId(learnerId: number) {
    return prisma.credential.findMany({
      where: { learner_id: learnerId },
      include: {
        issuer: true,
        blockchain_record: true,
        pdf_certificate: true,
      },
      orderBy: { issued_at: 'desc' },
    });
  }

  /**
   * Find all credentials issued by an issuer
   */
  async findCredentialsByIssuerId(issuerId: number) {
    return prisma.credential.findMany({
      where: { issuer_id: issuerId },
      include: {
        learner: true,
        blockchain_record: true,
        pdf_certificate: true,
      },
      orderBy: { issued_at: 'desc' },
    });
  }

  /**
   * Claim a credential (link to learner)
   */
  async claimCredential(credentialUid: string, learnerId: number) {
    return prisma.credential.update({
      where: { credential_uid: credentialUid },
      data: {
        learner_id: learnerId,
        status: 'claimed',
        claimed_at: new Date(),
      },
      include: {
        issuer: true,
        learner: true,
      },
    });
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(credentialUid: string) {
    return prisma.credential.update({
      where: { credential_uid: credentialUid },
      data: {
        status: 'revoked',
      },
      include: {
        issuer: true,
        learner: true,
      },
    });
  }

  /**
   * Get credential statistics for an issuer
   */
  async getIssuerStats(issuerId: number) {
    const [total, issued, claimed, revoked] = await Promise.all([
      prisma.credential.count({ where: { issuer_id: issuerId } }),
      prisma.credential.count({ where: { issuer_id: issuerId, status: 'issued' } }),
      prisma.credential.count({ where: { issuer_id: issuerId, status: 'claimed' } }),
      prisma.credential.count({ where: { issuer_id: issuerId, status: 'revoked' } }),
    ]);

    return { total, issued, claimed, revoked };
  }
}
