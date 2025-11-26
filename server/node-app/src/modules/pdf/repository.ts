/**
 * PDF Repository
 * Updated to work with new Credential schema
 */

import { prisma } from '../../utils/prisma';

export class PdfRepository {
  /**
   * Find credential by credential_id (new field name)
   */
  async findCredentialByUid(credentialUid: string) {
    return prisma.credential.findUnique({
      where: { credential_id: credentialUid },
      include: {
        issuer: true,
        learner: true,
      },
    });
  }

  /**
   * PDF URLs are now stored directly in Credential.pdf_url
   * This method throws an error as the pdf_certificate table no longer exists
   */
  async createPdfCertificate(data: {
    credentialId: string;
    pdfUrl: string;
    qrCodeUrl: string;
  }) {
    throw new Error('pdf_certificate table no longer exists. Use updateCredentialPdfUrl instead.');
  }

  /**
   * PDF URLs are now stored directly in Credential.pdf_url
   */
  async updatePdfCertificate(
    credentialId: string,
    data: {
      pdfUrl: string;
      qrCodeUrl: string;
    }
  ) {
    throw new Error('pdf_certificate table no longer exists. Use updateCredentialPdfUrl instead.');
  }

  /**
   * Update credential with PDF URL directly
   */
  async updateCredentialPdfUrl(credentialId: string, pdfUrl: string) {
    return prisma.credential.update({
      where: { credential_id: credentialId },
      data: { pdf_url: pdfUrl },
    });
  }

  /**
   * Find PDF URL by credential_id
   */
  async findPdfByCredentialUid(credentialUid: string): Promise<string | null> {
    const credential = await prisma.credential.findUnique({
      where: { credential_id: credentialUid },
      select: { pdf_url: true },
    });

    return credential?.pdf_url || null;
  }

  /**
   * Update credential metadata
   */
  async updateCredentialMetadata(credentialId: string, metadata: any) {
    return prisma.credential.update({
      where: { credential_id: credentialId },
      data: { metadata },
    });
  }
}

export const pdfRepository = new PdfRepository();
