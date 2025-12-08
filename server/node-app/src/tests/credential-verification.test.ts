import { credentialVerificationService } from '../modules/credential-verification/service';
import { credentialVerificationRepository } from '../modules/credential-verification/repository';
import { verifyBlockchainTransaction } from '../services/blockchainClient';
import { computeDataHash } from '../utils/canonicalJson';

jest.mock('../modules/credential-verification/repository');
jest.mock('../services/blockchainClient');
jest.mock('../utils/logger');
jest.mock('../utils/canonicalJson', () => ({
    ...jest.requireActual('../utils/canonicalJson'),
    computeDataHash: jest.fn(),
}));

describe('Credential Verification Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('verifyCredential - by credential_id', () => {
        it('should verify a valid credential by credential_id', async () => {
            const mockHash = 'computed_hash_123';
            const mockCredential = {
                credential_id: '123e4567-e89b-12d3-a456-426614174000',
                learner_id: 42,
                learner_email: 'learner@example.com',
                issuer_id: 1,
                certificate_title: 'Web Development Certificate',
                issued_at: new Date('2024-01-15'),
                ipfs_cid: 'QmTest123',
                pdf_url: 'https://ipfs.filebase.io/ipfs/QmTest123',
                tx_hash: '0xTest123',
                data_hash: mockHash, // Same as computed hash
                status: 'issued',
                metadata: {},
                issuer: {
                    id: 1,
                    name: 'Example University',
                    type: 'university',
                    website_url: 'https://example.edu',
                },
                learner: {
                    id: 42,
                    name: 'John Doe',
                    email: 'learner@example.com',
                },
            };

            (credentialVerificationRepository.findByCredentialId as jest.Mock).mockResolvedValue(mockCredential);
            (computeDataHash as jest.Mock).mockReturnValue(mockHash);
            (verifyBlockchainTransaction as jest.Mock).mockResolvedValue(true);

            const result = await credentialVerificationService.verifyCredential({
                credential_id: '123e4567-e89b-12d3-a456-426614174000',
            });

            expect(result.status).toBe('VALID');
            expect(result.credential).toBeDefined();
            expect(result.credential?.credential_id).toBe('123e4567-e89b-12d3-a456-426614174000');
            expect(result.verified_fields?.hash_match).toBe(true);
            expect(result.verified_fields?.blockchain_verified).toBe(true);
        });

        it('should return INVALID for credential with hash mismatch', async () => {
            const mockCredential = {
                credential_id: '123e4567-e89b-12d3-a456-426614174000',
                learner_id: 42,
                learner_email: 'learner@example.com',
                issuer_id: 1,
                certificate_title: 'Web Development Certificate',
                issued_at: new Date('2024-01-15'),
                ipfs_cid: 'QmTest123',
                pdf_url: 'https://ipfs.filebase.io/ipfs/QmTest123',
                tx_hash: '0xTest123',
                data_hash: 'stored_hash_456',
                status: 'issued',
                metadata: {},
                issuer: {
                    id: 1,
                    name: 'Example University',
                    type: 'university',
                    website_url: 'https://example.edu',
                },
                learner: null,
            };

            (credentialVerificationRepository.findByCredentialId as jest.Mock).mockResolvedValue(mockCredential);
            (computeDataHash as jest.Mock).mockReturnValue('different_hash_789'); // Different hash
            (verifyBlockchainTransaction as jest.Mock).mockResolvedValue(true);

            const result = await credentialVerificationService.verifyCredential({
                credential_id: '123e4567-e89b-12d3-a456-426614174000',
            });

            expect(result.status).toBe('INVALID');
            expect(result.reason).toContain('Hash mismatch');
            expect(result.verified_fields?.hash_match).toBe(false);
        });

        it('should throw error if credential not found', async () => {
            (credentialVerificationRepository.findByCredentialId as jest.Mock).mockResolvedValue(null);

            await expect(
                credentialVerificationService.verifyCredential({
                    credential_id: 'non-existent-id',
                })
            ).rejects.toThrow('Credential not found');
        });
    });

    describe('verifyCredential - by tx_hash', () => {
        it('should verify credential by blockchain transaction hash', async () => {
            const mockHash = 'hash_for_tx';
            const mockCredential = {
                credential_id: '123e4567-e89b-12d3-a456-426614174000',
                learner_id: null,
                learner_email: 'unclaimed@example.com',
                issuer_id: 1,
                certificate_title: 'Certificate',
                issued_at: new Date('2024-01-15'),
                ipfs_cid: 'QmTest123',
                pdf_url: 'https://ipfs.filebase.io/ipfs/QmTest123',
                tx_hash: '0xTxHash123',
                data_hash: mockHash,
                status: 'unclaimed',
                metadata: {},
                issuer: {
                    id: 1,
                    name: 'Example University',
                    type: 'university',
                    website_url: 'https://example.edu',
                },
                learner: null,
            };

            (credentialVerificationRepository.findByTxHash as jest.Mock).mockResolvedValue(mockCredential);
            (computeDataHash as jest.Mock).mockReturnValue(mockHash);
            (verifyBlockchainTransaction as jest.Mock).mockResolvedValue(true);

            const result = await credentialVerificationService.verifyCredential({
                tx_hash: '0xTxHash123',
            });

            expect(result.status).toBe('VALID');
            expect(result.credential?.learner).toBeNull();
            expect(credentialVerificationRepository.findByTxHash).toHaveBeenCalledWith('0xTxHash123');
        });
    });

    describe('verifyCredential - by ipfs_cid', () => {
        it('should verify credential by IPFS CID', async () => {
            const mockHash = 'hash_for_ipfs';
            const mockCredential = {
                credential_id: '123e4567-e89b-12d3-a456-426614174000',
                learner_id: 42,
                learner_email: 'learner@example.com',
                issuer_id: 1,
                certificate_title: 'Certificate',
                issued_at: new Date('2024-01-15'),
                ipfs_cid: 'QmSpecificCID',
                pdf_url: 'https://ipfs.filebase.io/ipfs/QmSpecificCID',
                tx_hash: '0xTest123',
                data_hash: mockHash,
                status: 'issued',
                metadata: {},
                issuer: {
                    id: 1,
                    name: 'Example University',
                    type: 'university',
                    website_url: 'https://example.edu',
                },
                learner: {
                    id: 42,
                    name: 'John Doe',
                    email: 'learner@example.com',
                },
            };

            (credentialVerificationRepository.findByIpfsCid as jest.Mock).mockResolvedValue(mockCredential);
            (computeDataHash as jest.Mock).mockReturnValue(mockHash);
            (verifyBlockchainTransaction as jest.Mock).mockResolvedValue(true);

            const result = await credentialVerificationService.verifyCredential({
                ipfs_cid: 'QmSpecificCID',
            });

            expect(result.status).toBe('VALID');
            expect(result.verified_fields?.ipfs_cid_match).toBe(true);
            expect(credentialVerificationRepository.findByIpfsCid).toHaveBeenCalledWith('QmSpecificCID');
        });
    });

    describe('verifyCredential - blockchain verification failure', () => {
        it('should return INVALID if blockchain verification fails', async () => {
            const mockHash = 'same_hash';
            const mockCredential = {
                credential_id: '123e4567-e89b-12d3-a456-426614174000',
                learner_id: 42,
                learner_email: 'learner@example.com',
                issuer_id: 1,
                certificate_title: 'Certificate',
                issued_at: new Date('2024-01-15'),
                ipfs_cid: 'QmTest123',
                pdf_url: 'https://ipfs.filebase.io/ipfs/QmTest123',
                tx_hash: '0xTest123',
                data_hash: mockHash,
                status: 'issued',
                metadata: {},
                issuer: {
                    id: 1,
                    name: 'Example University',
                    type: 'university',
                    website_url: 'https://example.edu',
                },
                learner: null,
            };

            (credentialVerificationRepository.findByCredentialId as jest.Mock).mockResolvedValue(mockCredential);
            (computeDataHash as jest.Mock).mockReturnValue(mockHash); // Hash matches
            (verifyBlockchainTransaction as jest.Mock).mockResolvedValue(false); // But blockchain fails

            const result = await credentialVerificationService.verifyCredential({
                credential_id: '123e4567-e89b-12d3-a456-426614174000',
            });

            expect(result.status).toBe('INVALID');
            expect(result.reason).toBeDefined();
            expect(result.verified_fields?.hash_match).toBe(true);
            expect(result.verified_fields?.blockchain_verified).toBe(false);
        });
    });
});
