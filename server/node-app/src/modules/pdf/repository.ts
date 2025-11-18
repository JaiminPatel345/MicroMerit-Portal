import { prisma } from '../../utils/prisma';

export class PdfRepository {
  /**
   * Find credential by UID with all relations
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
   * Create PDF certificate record
   */
  async createPdfCertificate(data: {
    credentialId: number;
    pdfUrl: string;
    qrCodeUrl: string;
  }) {
    return prisma.pdf_certificate.create({
      data: {
        credential_id: data.credentialId,
        pdf_url: data.pdfUrl,
        qr_code_url: data.qrCodeUrl,
      },
    });
  }

  /**
   * Update PDF certificate record
   */
  async updatePdfCertificate(
    credentialId: number,
    data: {
      pdfUrl: string;
      qrCodeUrl: string;
    }
  ) {
    return prisma.pdf_certificate.update({
      where: { credential_id: credentialId },
      data: {
        pdf_url: data.pdfUrl,
        qr_code_url: data.qrCodeUrl,
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

  /**
   * Update credential metadata with PDF hash
   */
  async updateCredentialMetadata(credentialId: number, metadata: any) {
    return prisma.credential.update({
      where: { id: credentialId },
      data: {
        metadata,
      },
    });
  }
}
