import { prisma } from '../../utils/prisma';

export class VerificationRepository {
  /**
   * Find credential by UID with all relations
   */
  async findCredentialByUid(credentialUid: string) {
    return await prisma.credential.findUnique({
      where: { credential_uid: credentialUid },
      include: {
        issuer: {
          select: {
            id: true,
            name: true,
            type: true,
            logo_url: true,
            official_domain: true,
            website_url: true,
            email: true,
            status: true,
          },
        },
        learner: {
          select: {
            id: true,
            email: true,
            phone: true,
            profileUrl: true,
          },
        },
        pdf_certificate: {
          select: {
            pdf_url: true,
            qr_code_url: true,
            created_at: true,
          },
        },
        blockchain_record: {
          select: {
            blockchain_tx_id: true,
            hash_value: true,
            stored_at: true,
          },
        },
      },
    });
  }

  /**
   * Find PDF certificate by credential UID
   */
  async findPdfByCredentialUid(credentialUid: string) {
    const credential = await prisma.credential.findUnique({
      where: { credential_uid: credentialUid },
      include: {
        pdf_certificate: true,
      },
    });

    return credential?.pdf_certificate || null;
  }
}
