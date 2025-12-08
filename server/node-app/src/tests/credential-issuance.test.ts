import { credentialIssuanceService } from '../modules/credential-issuance/service';
import { credentialIssuanceRepository } from '../modules/credential-issuance/repository';
import { uploadToFilebase } from '../utils/filebase';
import { writeToBlockchain } from '../services/blockchainClient';

// Mock uuid module
jest.mock('uuid', () => {
    const mockFn = () => '123e4567-e89b-12d3-a456-426614174000';
    return {
        v4: mockFn,
        __esModule: true,
        default: { v4: mockFn }
    };
});

jest.mock('../modules/credential-issuance/repository');
jest.mock('../utils/filebase');
jest.mock('../services/blockchainClient');
jest.mock('../utils/logger');

describe('Credential Issuance Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('issueCredential - existing learner', () => {
        it('should issue credential to existing learner successfully', async () => {
            const mockIssuer = {
                id: 1,
                name: 'Example University',
                status: 'approved',
            };

            const mockLearner = {
                id: 42,
                email: 'learner@example.com',
            };

            const mockPdfBuffer = Buffer.from('PDF content');

            const input = {
                learner_email: 'learner@example.com',
                issuer_id: 1,
                certificate_title: 'Web Development Certificate',
                issued_at: new Date('2024-01-15'),
                original_pdf: mockPdfBuffer,
                original_pdf_filename: 'certificate.pdf',
            };

            (credentialIssuanceRepository.findIssuerById as jest.Mock).mockResolvedValue(mockIssuer);
            (credentialIssuanceRepository.findLearnerByEmail as jest.Mock).mockResolvedValue(mockLearner);
            (uploadToFilebase as jest.Mock).mockResolvedValue({
                cid: 'QmTest123',
                gateway_url: 'https://ipfs.filebase.io/ipfs/QmTest123',
            });
            (writeToBlockchain as jest.Mock).mockResolvedValue({ tx_hash: '0xTxHash123' });
            (credentialIssuanceRepository.createCredential as jest.Mock).mockResolvedValue({
                credential_id: '123e4567-e89b-12d3-a456-426614174000',
                learner_id: 42,
                learner_email: 'learner@example.com',
                certificate_title: 'Web Development Certificate',
                ipfs_cid: 'QmTest123',
                tx_hash: null,
                data_hash: 'hash123',
                pdf_url: 'https://ipfs.filebase.io/ipfs/QmTest123',
                status: 'issued',
                issued_at: new Date('2024-01-15'),
            });

            const result = await credentialIssuanceService.issueCredential(input);

            expect(result.credential_id).toBeDefined();
            expect(result.learner_id).toBe(42);
            expect(result.status).toBe('issued');
            expect(result.ipfs_cid).toBe('QmTest123');
            expect(result.tx_hash).toBeNull();
            expect(credentialIssuanceRepository.createCredential).toHaveBeenCalled();
        });
    });

    describe('issueCredential - unclaimed credential', () => {
        it('should create unclaimed credential for non-existent learner', async () => {
            const mockIssuer = {
                id: 1,
                name: 'Example University',
                status: 'approved',
            };

            const mockPdfBuffer = Buffer.from('PDF content');

            const input = {
                learner_email: 'new.learner@example.com',
                issuer_id: 1,
                certificate_title: 'Certificate of Completion',
                issued_at: new Date('2024-01-15'),
                original_pdf: mockPdfBuffer,
                original_pdf_filename: 'certificate.pdf',
            };

            (credentialIssuanceRepository.findIssuerById as jest.Mock).mockResolvedValue(mockIssuer);
            (credentialIssuanceRepository.findLearnerByEmail as jest.Mock).mockResolvedValue(null);
            (credentialIssuanceRepository.findLearnerByOtherEmail as jest.Mock).mockResolvedValue(null);
            (uploadToFilebase as jest.Mock).mockResolvedValue({
                cid: 'QmTest456',
                gateway_url: 'https://ipfs.filebase.io/ipfs/QmTest456',
            });
            (writeToBlockchain as jest.Mock).mockResolvedValue({ tx_hash: '0xTxHash456' });
            (credentialIssuanceRepository.createCredential as jest.Mock).mockResolvedValue({
                credential_id: '456e4567-e89b-12d3-a456-426614174000',
                learner_id: null,
                learner_email: 'new.learner@example.com',
                certificate_title: 'Certificate of Completion',
                ipfs_cid: 'QmTest456',
                tx_hash: null,
                data_hash: 'hash456',
                pdf_url: 'https://ipfs.filebase.io/ipfs/QmTest456',
                status: 'unclaimed',
                issued_at: new Date('2024-01-15'),
            });

            const result = await credentialIssuanceService.issueCredential(input);

            expect(result.learner_id).toBeNull();
            expect(result.status).toBe('unclaimed');
            expect(result.learner_email).toBe('new.learner@example.com');
        });
    });

    describe('issueCredential - validation errors', () => {
        it('should throw error if issuer not found', async () => {
            const input = {
                learner_email: 'learner@example.com',
                issuer_id: 999,
                certificate_title: 'Certificate',
                issued_at: new Date(),
                original_pdf: Buffer.from('PDF'),
                original_pdf_filename: 'test.pdf',
            };

            (credentialIssuanceRepository.findIssuerById as jest.Mock).mockResolvedValue(null);

            await expect(
                credentialIssuanceService.issueCredential(input)
            ).rejects.toThrow('Issuer not found');
        });

        it('should throw error if issuer is not approved', async () => {
            const mockIssuer = {
                id: 1,
                name: 'Pending University',
                status: 'pending',
            };

            const input = {
                learner_email: 'learner@example.com',
                issuer_id: 1,
                certificate_title: 'Certificate',
                issued_at: new Date(),
                original_pdf: Buffer.from('PDF'),
                original_pdf_filename: 'test.pdf',
            };

            (credentialIssuanceRepository.findIssuerById as jest.Mock).mockResolvedValue(mockIssuer);

            await expect(
                credentialIssuanceService.issueCredential(input)
            ).rejects.toThrow('Issuer is not approved');
        });
    });

    describe('issueCredential - learner resolution', () => {
        it('should find learner by other_emails if not found by primary email', async () => {
            const mockIssuer = {
                id: 1,
                name: 'Example University',
                status: 'approved',
            };

            const mockLearner = {
                id: 42,
                email: 'primary@example.com',
                other_emails: ['secondary@example.com'],
            };

            const input = {
                learner_email: 'secondary@example.com',
                issuer_id: 1,
                certificate_title: 'Certificate',
                issued_at: new Date('2024-01-15'),
                original_pdf: Buffer.from('PDF'),
                original_pdf_filename: 'test.pdf',
            };

            (credentialIssuanceRepository.findIssuerById as jest.Mock).mockResolvedValue(mockIssuer);
            (credentialIssuanceRepository.findLearnerByEmail as jest.Mock).mockResolvedValue(null);
            (credentialIssuanceRepository.findLearnerByOtherEmail as jest.Mock).mockResolvedValue(mockLearner);
            (uploadToFilebase as jest.Mock).mockResolvedValue({
                cid: 'QmTest789',
                gateway_url: 'https://ipfs.filebase.io/ipfs/QmTest789',
            });
            (writeToBlockchain as jest.Mock).mockResolvedValue({ tx_hash: '0xTxHash789' });
            (credentialIssuanceRepository.createCredential as jest.Mock).mockResolvedValue({
                credential_id: '789e4567-e89b-12d3-a456-426614174000',
                learner_id: 42,
                learner_email: 'secondary@example.com',
                certificate_title: 'Certificate',
                ipfs_cid: 'QmTest789',
                tx_hash: '0xTxHash789',
                data_hash: 'hash789',
                pdf_url: 'https://ipfs.filebase.io/ipfs/QmTest789',
                status: 'issued',
                issued_at: new Date('2024-01-15'),
            });

            const result = await credentialIssuanceService.issueCredential(input);

            expect(result.learner_id).toBe(42);
            expect(credentialIssuanceRepository.findLearnerByOtherEmail).toHaveBeenCalledWith('secondary@example.com');
        });
    });
});
