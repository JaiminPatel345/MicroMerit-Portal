import { VerificationService } from '../modules/verification/service';
import { VerificationRepository } from '../modules/verification/repository';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import crypto from 'crypto';

// Mock pdf-parse module before imports
jest.mock('pdf-parse', () => jest.fn());

// Mock dependencies
jest.mock('../modules/verification/repository');
jest.mock('../utils/logger');

// Get the mocked pdf-parse
const pdfParse = require('pdf-parse') as jest.Mock;

describe('Verification Service', () => {
  let service: VerificationService;
  let mockRepository: DeepMockProxy<VerificationRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup pdf-parse mock to return the buffer content as text
    pdfParse.mockImplementation((buffer: Buffer) => {
      const text = buffer.toString('utf-8');
      return Promise.resolve({ text });
    });
    
    mockRepository = mockDeep<VerificationRepository>();
    service = new VerificationService(mockRepository);
  });

  describe('verifyCredentialByUid', () => {
    it('should return null if credential not found', async () => {
      mockRepository.findCredentialByUid.mockResolvedValue(null);

      const result = await service.verifyCredentialByUid('INVALID-UID');

      expect(result).toBeNull();
      expect(mockRepository.findCredentialByUid).toHaveBeenCalledWith('INVALID-UID');
    });

    it('should return credential details if exists', async () => {
      const mockCredential = {
        id: 1,
        credential_uid: 'CRED-123',
        status: 'issued',
        issued_at: new Date('2024-01-01'),
        claimed_at: null,
        metadata: { title: 'Test Certificate' },
        issuer_id: 1,
        learner_id: null,
        issuer: {
          id: 1,
          name: 'Test University',
          type: 'university',
          logo_url: 'https://example.com/logo.png',
          official_domain: 'test.edu',
          website_url: 'https://test.edu',
          email: 'issuer@test.edu',
          status: 'approved',
        },
        learner: null,
        pdf_certificate: {
          pdf_url: 'https://s3.example.com/cert.pdf',
          qr_code_url: 'https://s3.example.com/qr.png',
          created_at: new Date('2024-01-01'),
        },
        blockchain_record: {
          blockchain_tx_id: 'TX123',
          hash_value: 'abc123',
          stored_at: new Date('2024-01-01'),
        },
      } as any;

      mockRepository.findCredentialByUid.mockResolvedValue(mockCredential);

      const result = await service.verifyCredentialByUid('CRED-123');

      expect(result).toBeDefined();
      expect(result?.credential.uid).toBe('CRED-123');
      expect(result?.credential.status).toBe('issued');
      expect(result?.issuer.name).toBe('Test University');
      expect(result?.pdf?.pdfUrl).toBe('https://s3.example.com/cert.pdf');
      expect(result?.blockchain?.transactionId).toBe('TX123');
    });

    it('should return placeholder blockchain data if no blockchain record', async () => {
      const mockCredential = {
        id: 1,
        credential_uid: 'CRED-123',
        status: 'issued',
        issued_at: new Date('2024-01-01'),
        claimed_at: null,
        metadata: { title: 'Test Certificate' },
        issuer_id: 1,
        learner_id: null,
        issuer: {
          id: 1,
          name: 'Test University',
          type: 'university',
          logo_url: null,
          official_domain: null,
          website_url: null,
          email: 'issuer@test.edu',
          status: 'approved',
        },
        learner: null,
        pdf_certificate: null,
        blockchain_record: null,
      } as any;

      mockRepository.findCredentialByUid.mockResolvedValue(mockCredential);

      const result = await service.verifyCredentialByUid('CRED-123');

      expect(result?.blockchain?.transactionId).toBe('pending');
      expect(result?.blockchain?.note).toBe('Blockchain verification pending');
    });

    it('should include learner info if credential is claimed', async () => {
      const mockCredential = {
        id: 1,
        credential_uid: 'CRED-123',
        status: 'claimed',
        issued_at: new Date('2024-01-01'),
        claimed_at: new Date('2024-01-02'),
        metadata: { title: 'Test Certificate' },
        issuer_id: 1,
        learner_id: 1,
        issuer: {
          id: 1,
          name: 'Test University',
          type: 'university',
          logo_url: null,
          official_domain: null,
          website_url: null,
          email: 'issuer@test.edu',
          status: 'approved',
        },
        learner: {
          id: 1,
          email: 'learner@example.com',
          phone: '+1234567890',
          profileUrl: 'https://example.com/profile.jpg',
        },
        pdf_certificate: null,
        blockchain_record: null,
      } as any;

      mockRepository.findCredentialByUid.mockResolvedValue(mockCredential);

      const result = await service.verifyCredentialByUid('CRED-123');

      expect(result?.learner).toBeDefined();
      expect(result?.learner?.email).toBe('learner@example.com');
      expect(result?.credential.status).toBe('claimed');
    });
  });

  describe('verifyPdfUpload', () => {
    it('should return false if no credential UID found in PDF', async () => {
      const pdfBuffer = Buffer.from('This is a PDF without credential UID');

      const result = await service.verifyPdfUpload(pdfBuffer);

      expect(result.verified).toBe(false);
      expect(result.reason).toContain('No credential UID found');
    });

    it('should return false if credential not found in database', async () => {
      const pdfText = 'Credential ID: CRED-123-NOTFOUND';
      const pdfBuffer = Buffer.from(pdfText);

      mockRepository.findCredentialByUid.mockResolvedValue(null);

      const result = await service.verifyPdfUpload(pdfBuffer);

      expect(result.verified).toBe(false);
      expect(result.reason).toContain('not found in database');
    });

    it('should verify successfully when hash matches', async () => {
      const pdfText = 'Certificate\nCredential ID: CRED-123\nIssued by: Test University';
      const pdfBuffer = Buffer.from(pdfText);
      const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

      const mockCredential = {
        id: 1,
        credential_uid: 'CRED-123',
        status: 'issued',
        issued_at: new Date('2024-01-01'),
        claimed_at: null,
        metadata: {
          title: 'Test Certificate',
          pdf: {
            hash: pdfHash,
          },
        },
        issuer_id: 1,
        learner_id: null,
        issuer: {
          id: 1,
          name: 'Test University',
          type: 'university',
          logo_url: null,
          official_domain: 'test.edu',
          website_url: 'https://test.edu',
        },
        learner: null,
        blockchain_record: null,
      } as any;

      mockRepository.findCredentialByUid.mockResolvedValue(mockCredential);

      const result = await service.verifyPdfUpload(pdfBuffer);

      expect(result.verified).toBe(true);
      expect(result.hashMatch).toBe(true);
      expect(result.reason).toContain('authentic and unmodified');
    });

    it('should return false when hash does not match (tampered PDF)', async () => {
      const pdfText = 'Certificate\nCredential ID: CRED-123\nIssued by: Test University';
      const pdfBuffer = Buffer.from(pdfText);
      const wrongHash = 'wrong_hash_value';

      const mockCredential = {
        id: 1,
        credential_uid: 'CRED-123',
        status: 'issued',
        issued_at: new Date('2024-01-01'),
        claimed_at: null,
        metadata: {
          title: 'Test Certificate',
          pdf: {
            hash: wrongHash,
          },
        },
        issuer_id: 1,
        learner_id: null,
        issuer: {
          id: 1,
          name: 'Test University',
          type: 'university',
        },
        learner: null,
        blockchain_record: null,
      } as any;

      mockRepository.findCredentialByUid.mockResolvedValue(mockCredential);

      const result = await service.verifyPdfUpload(pdfBuffer);

      expect(result.verified).toBe(false);
      expect(result.hashMatch).toBe(false);
      expect(result.reason).toContain('tampered');
    });

    it('should verify existence but warn if no stored hash', async () => {
      const pdfText = 'Certificate\nCredential ID: CRED-123\nIssued by: Test University';
      const pdfBuffer = Buffer.from(pdfText);

      const mockCredential = {
        id: 1,
        credential_uid: 'CRED-123',
        status: 'issued',
        issued_at: new Date('2024-01-01'),
        claimed_at: null,
        metadata: {
          title: 'Test Certificate',
          // No pdf.hash field
        },
        issuer_id: 1,
        learner_id: null,
        issuer: {
          id: 1,
          name: 'Test University',
          type: 'university',
          logo_url: null,
        },
        learner: null,
        blockchain_record: null,
      } as any;

      mockRepository.findCredentialByUid.mockResolvedValue(mockCredential);

      const result = await service.verifyPdfUpload(pdfBuffer);

      expect(result.verified).toBe(true);
      expect(result.hashMatch).toBeNull();
      expect(result.reason).toContain('no stored hash');
    });

    it('should return false if credential is revoked', async () => {
      const pdfText = 'Certificate\nCredential ID: CRED-123';
      const pdfBuffer = Buffer.from(pdfText);
      const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

      const mockCredential = {
        id: 1,
        credential_uid: 'CRED-123',
        status: 'revoked',
        issued_at: new Date('2024-01-01'),
        claimed_at: null,
        metadata: {
          pdf: {
            hash: pdfHash,
          },
        },
        issuer_id: 1,
        learner_id: null,
        issuer: {
          id: 1,
          name: 'Test University',
          type: 'university',
        },
        learner: null,
        blockchain_record: null,
      } as any;

      mockRepository.findCredentialByUid.mockResolvedValue(mockCredential);

      const result = await service.verifyPdfUpload(pdfBuffer);

      expect(result.verified).toBe(false);
      expect(result.reason).toContain('revoked');
    });

    it('should extract credential UID with different patterns', async () => {
      const patterns = [
        'Credential ID: CRED-1234567890-ABCDEF',
        'This is CRED-1234567890-ABCDEF certificate',
        'ID: CRED-1234567890-ABCDEF',
      ];

      for (const pattern of patterns) {
        const pdfBuffer = Buffer.from(pattern);
        const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

        const mockCredential = {
          id: 1,
          credential_uid: 'CRED-1234567890-ABCDEF',
          status: 'issued',
          issued_at: new Date(),
          claimed_at: null,
          metadata: { pdf: { hash: pdfHash } },
          issuer_id: 1,
          learner_id: null,
          issuer: {
            id: 1,
            name: 'Test',
            type: 'university',
            logo_url: null,
            official_domain: null,
            website_url: null,
          },
          learner: null,
          blockchain_record: null,
        } as any;

        mockRepository.findCredentialByUid.mockResolvedValue(mockCredential);

        const result = await service.verifyPdfUpload(pdfBuffer);

        expect(result.verified).toBe(true);
        expect(result.credential?.uid).toBe('CRED-1234567890-ABCDEF');
      }
    });
  });
});
