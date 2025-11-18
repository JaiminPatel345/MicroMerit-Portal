import { PdfService } from '../modules/pdf/service';
import { PdfRepository } from '../modules/pdf/repository';
import * as QRCode from 'qrcode';
import { s3Service } from '../utils/s3';

// Mock dependencies
jest.mock('../modules/pdf/repository');
jest.mock('../utils/s3');
jest.mock('qrcode');

describe('PdfService', () => {
  let service: PdfService;
  let mockRepository: jest.Mocked<PdfRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = new PdfRepository() as jest.Mocked<PdfRepository>;
    service = new PdfService(mockRepository);

    // Set up environment variable
    process.env.APP_URL = 'http://localhost:3000';
  });

  describe('generatePdfCertificate', () => {
    it('should generate PDF certificate with QR code for valid credential', async () => {
      const input = {
        credentialUid: 'CRED-TEST-123',
        templateType: 'standard' as const,
      };

      const mockCredential = {
        id: 1,
        credential_uid: 'CRED-TEST-123',
        status: 'claimed',
        metadata: {
          description: 'Successfully completed Web Development course',
        },
        issued_at: new Date('2024-01-01'),
        issuer: {
          id: 1,
          name: 'Tech University',
          logo_url: 'https://example.com/logo.png',
        },
        learner: {
          id: 1,
          email: 'student@example.com',
        },
        pdf_certificate: null,
      };

      mockRepository.findCredentialByUid = jest.fn().mockResolvedValue(mockCredential);
      // Valid minimal PNG base64 (1x1 transparent PNG)
      const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(`data:image/png;base64,${validPngBase64}`);
      // Mock uploadFile to return different URLs for QR and PDF
      (s3Service.uploadFile as jest.Mock)
        .mockResolvedValueOnce('https://s3.amazonaws.com/bucket/certificates/CRED-TEST-123-qr.png')
        .mockResolvedValueOnce('https://s3.amazonaws.com/bucket/certificates/CRED-TEST-123-certificate.pdf');
      mockRepository.createPdfCertificate = jest.fn().mockResolvedValue({
        id: 1,
        credential_id: 1,
        pdf_url: 'https://s3.amazonaws.com/bucket/certificates/CRED-TEST-123-certificate.pdf',
        qr_code_url: 'https://s3.amazonaws.com/bucket/certificates/CRED-TEST-123-qr.png',
        created_at: new Date(),
      });

      const result = await service.generatePdfCertificate(input);

      expect(mockRepository.findCredentialByUid).toHaveBeenCalledWith('CRED-TEST-123');
      expect(QRCode.toDataURL).toHaveBeenCalled();
      expect(s3Service.uploadFile).toHaveBeenCalledTimes(2); // QR code and PDF
      expect(mockRepository.createPdfCertificate).toHaveBeenCalled();
      expect(result.credentialUid).toBe('CRED-TEST-123');
      expect(result.pdfUrl).toContain('certificate.pdf');
      expect(result.qrCodeUrl).toContain('qr.png');
    });

    it('should throw error if credential not found', async () => {
      const input = {
        credentialUid: 'INVALID-CRED',
        templateType: 'standard' as const,
      };

      mockRepository.findCredentialByUid = jest.fn().mockResolvedValue(null);

      await expect(service.generatePdfCertificate(input)).rejects.toThrow('Credential not found');
    });

    it('should throw error if credential is revoked', async () => {
      const input = {
        credentialUid: 'CRED-REVOKED',
        templateType: 'standard' as const,
      };

      const mockCredential = {
        id: 1,
        credential_uid: 'CRED-REVOKED',
        status: 'revoked',
        metadata: {},
        issued_at: new Date(),
        issuer: { id: 1, name: 'Test Issuer' },
        learner: null,
        pdf_certificate: null,
      };

      mockRepository.findCredentialByUid = jest.fn().mockResolvedValue(mockCredential);

      await expect(service.generatePdfCertificate(input)).rejects.toThrow(
        'Cannot generate PDF for revoked credential'
      );
    });

    it('should regenerate PDF if it already exists', async () => {
      const input = {
        credentialUid: 'CRED-EXISTING',
        templateType: 'standard' as const,
      };

      const mockCredential = {
        id: 1,
        credential_uid: 'CRED-EXISTING',
        status: 'claimed',
        metadata: {},
        issued_at: new Date(),
        issuer: { id: 1, name: 'Test Issuer' },
        learner: { id: 1, email: 'test@example.com' },
        pdf_certificate: {
          id: 1,
          credential_id: 1,
          pdf_url: '/old-path.pdf',
          qr_code_url: '/old-qr.png',
          created_at: new Date(),
        },
      };

      mockRepository.findCredentialByUid = jest.fn().mockResolvedValue(mockCredential);
      // Valid minimal PNG base64 (1x1 transparent PNG)
      const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(`data:image/png;base64,${validPngBase64}`);
      (s3Service.uploadFile as jest.Mock)
        .mockResolvedValueOnce('https://s3.amazonaws.com/bucket/certificates/CRED-EXISTING-qr.png')
        .mockResolvedValueOnce('https://s3.amazonaws.com/bucket/certificates/CRED-EXISTING-certificate.pdf');
      mockRepository.updatePdfCertificate = jest.fn().mockResolvedValue({
        ...mockCredential.pdf_certificate,
        pdf_url: 'https://s3.amazonaws.com/bucket/certificates/CRED-EXISTING-certificate.pdf',
        qr_code_url: 'https://s3.amazonaws.com/bucket/certificates/CRED-EXISTING-qr.png',
      });

      const result = await service.generatePdfCertificate(input);

      expect(mockRepository.updatePdfCertificate).toHaveBeenCalled();
      expect(result.message).toBe('PDF certificate regenerated');
    });
  });

  describe('getPdfCertificate', () => {
    it('should return PDF certificate details', async () => {
      const credentialUid = 'CRED-TEST-123';
      const mockPdf = {
        id: 1,
        credential_id: 1,
        pdf_url: '/uploads/certificates/CRED-TEST-123-certificate.pdf',
        qr_code_url: '/uploads/certificates/CRED-TEST-123-qr.png',
        created_at: new Date(),
      };

      mockRepository.findPdfByCredentialUid = jest.fn().mockResolvedValue(mockPdf);

      const result = await service.getPdfCertificate(credentialUid);

      expect(mockRepository.findPdfByCredentialUid).toHaveBeenCalledWith(credentialUid);
      expect(result.pdfUrl).toBe(mockPdf.pdf_url);
      expect(result.qrCodeUrl).toBe(mockPdf.qr_code_url);
    });

    it('should throw error if PDF not found', async () => {
      const credentialUid = 'CRED-NO-PDF';

      mockRepository.findPdfByCredentialUid = jest.fn().mockResolvedValue(null);

      await expect(service.getPdfCertificate(credentialUid)).rejects.toThrow(
        'PDF certificate not found for this credential'
      );
    });
  });

  describe('downloadPdf', () => {
    it('should return PDF buffer and filename', async () => {
      const credentialUid = 'CRED-TEST-123';
      const mockPdf = {
        id: 1,
        credential_id: 1,
        pdf_url: 'https://s3.amazonaws.com/bucket/certificates/CRED-TEST-123-certificate.pdf',
        qr_code_url: 'https://s3.amazonaws.com/bucket/certificates/CRED-TEST-123-qr.png',
        created_at: new Date(),
      };
      const mockBuffer = Buffer.from('PDF content');

      mockRepository.findPdfByCredentialUid = jest.fn().mockResolvedValue(mockPdf);
      (s3Service.extractKeyFromUrl as jest.Mock).mockReturnValue('certificates/CRED-TEST-123-certificate.pdf');
      (s3Service.downloadFile as jest.Mock).mockResolvedValue(mockBuffer);

      const result = await service.downloadPdf(credentialUid);

      expect(result.buffer).toEqual(mockBuffer);
      expect(result.filename).toBe('CRED-TEST-123-certificate.pdf');
    });

    it('should throw error if PDF file not found on S3', async () => {
      const credentialUid = 'CRED-TEST-123';
      const mockPdf = {
        id: 1,
        credential_id: 1,
        pdf_url: 'https://s3.amazonaws.com/bucket/certificates/CRED-TEST-123-certificate.pdf',
        qr_code_url: 'https://s3.amazonaws.com/bucket/certificates/CRED-TEST-123-qr.png',
        created_at: new Date(),
      };

      mockRepository.findPdfByCredentialUid = jest.fn().mockResolvedValue(mockPdf);
      (s3Service.extractKeyFromUrl as jest.Mock).mockReturnValue('certificates/CRED-TEST-123-certificate.pdf');
      (s3Service.downloadFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(service.downloadPdf(credentialUid)).rejects.toThrow(
        'PDF file not found on S3'
      );
    });

    it('should throw error if PDF certificate record not found', async () => {
      const credentialUid = 'CRED-NO-PDF';

      mockRepository.findPdfByCredentialUid = jest.fn().mockResolvedValue(null);

      await expect(service.downloadPdf(credentialUid)).rejects.toThrow(
        'PDF certificate not found'
      );
    });
  });
});
