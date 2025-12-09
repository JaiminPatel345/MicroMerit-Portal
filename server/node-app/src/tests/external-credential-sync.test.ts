import { ExternalCredentialSyncService } from '../modules/external-credential-sync/service';
import { externalCredentialSyncRepository } from '../modules/external-credential-sync/repository';
import { credentialIssuanceRepository } from '../modules/credential-issuance/repository';
import { logger } from '../utils/logger';
import { CanonicalCredential } from '../modules/external-credential-sync/types';

// Mock uuid module
jest.mock('uuid', () => {
    const mockFn = () => '123e4567-e89b-12d3-a456-426614174000';
    return {
        v4: mockFn,
        __esModule: true,
        default: { v4: mockFn }
    };
});

// Mock dependencies
jest.mock('../modules/external-credential-sync/repository');
jest.mock('../modules/credential-issuance/repository');
jest.mock('../utils/logger');
jest.mock('../services/blockchainClient', () => ({
    writeToBlockchain: jest.fn().mockResolvedValue({ tx_hash: '0xMockTxHash', status: 'confirmed' }),
    writeToBlockchainQueued: jest.fn().mockResolvedValue('job-id-123'),
}));
jest.mock('../utils/filebase', () => ({
    uploadToFilebase: jest.fn().mockResolvedValue({
        cid: 'QmMockIPFSCid123',
        gateway_url: 'https://ipfs.filebase.io/ipfs/QmMockIPFSCid123'
    })
}));
jest.mock('axios');
jest.mock('../modules/external-credential-sync/connector.factory', () => ({
    getProviderConfig: jest.fn().mockReturnValue({
        id: 'test',
        name: 'Test Provider',
        credentials: {
            api_key: 'test-api-key'
        }
    })
}));

import axios from 'axios';

// Create service instance for testing
const externalCredentialSyncService = new ExternalCredentialSyncService();

describe('External Credential Sync Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.MIN_HOUR_LEN = '7.5';
        process.env.MAX_HOUR_LEN = '30';
        process.env.POSSIBLE_MAX_HOUR = '1000';

        // Default valid issuer mock
        (externalCredentialSyncRepository.findIssuerById as jest.Mock).mockResolvedValue({ id: 1, name: 'Test Issuer', status: 'approved' });

        // Default duplicate checks
        (externalCredentialSyncRepository.credentialExistsByExternalId as jest.Mock).mockResolvedValue(false);
        (externalCredentialSyncRepository.credentialExists as jest.Mock).mockResolvedValue(false);

        // Mock axios for PDF download
        (axios.get as jest.Mock).mockResolvedValue({
            status: 200,
            headers: { 'content-type': 'application/pdf', 'content-length': '1234' },
            data: Buffer.from('mock pdf content')
        });
    });

    describe('processCredential', () => {
        const mockCanonical: CanonicalCredential = {
            learner_email: 'test@example.com',
            learner_name: 'Test Learner',
            certificate_title: 'Test Certificate',
            certificate_code: 'TEST-123',
            issued_at: new Date('2024-01-01'),
            sector: 'IT',
            nsqf_level: 5,
            max_hr: 100,
            min_hr: 80,
            awarding_bodies: ['Test Body'],
            occupation: 'Developer',
            tags: ['test', 'mock'],
            description: 'Test Description',
            certificate_url: 'https://example.com/certificates/test.pdf',
            external_id: 'ext-123',
            raw_data: {}
        };

        const providerId = 'nsdc';
        const issuerId = 1;

        it('should process and create a new credential successfully', async () => {
            // Mock learner lookup (found)
            (externalCredentialSyncRepository.findLearnerByEmail as jest.Mock).mockResolvedValue({ id: 101, email: 'test@example.com' });

            // Mock credential creation
            (credentialIssuanceRepository.createCredential as jest.Mock).mockResolvedValue({ id: 'new-cred-id' });

            const mockConnector = {
                issuerId: issuerId,
                normalize: jest.fn().mockReturnValue(mockCanonical),
                authenticate: jest.fn(),
                fetchSince: jest.fn(),
                verify: jest.fn().mockResolvedValue({ ok: true, meta: {} }),
                providerId: providerId
            };

            await externalCredentialSyncService['processCredential'](mockConnector as any, {});

            // Verify exists check by external ID
            // Wait, implementation checks credentialExists (by email/title/issuer), NOT external ID directly in processCredential
            // Line 167: const exists = await externalCredentialSyncRepository.credentialExists(...)
            expect(externalCredentialSyncRepository.credentialExists).toHaveBeenCalledWith(
                mockCanonical.learner_email,
                mockCanonical.certificate_title,
                issuerId
            );

            // Verify create call with new fields
            expect(credentialIssuanceRepository.createCredential).toHaveBeenCalledWith(expect.objectContaining({
                credential_id: expect.any(String),
                learner_id: 101,
                learner_email: 'test@example.com',
                issuer_id: issuerId,
                certificate_title: 'Test Certificate',
                // New fields verification
                certificate_code: 'TEST-123',
                sector: 'IT',
                nsqf_level: 5,
                max_hr: 100,
                min_hr: 80,
                awarding_bodies: ['Test Body'],
                occupation: 'Developer',
                tags: ['test', 'mock'],
                status: 'issued'
            }));
        });

        it('should resolve learner by alternate email', async () => {
            // Mock learner lookup (primary not found, alternate found)
            // The repository handles the OR logic, so we just mock it returning a learner
            (externalCredentialSyncRepository.findLearnerByEmail as jest.Mock).mockResolvedValue({ id: 102, email: 'primary@example.com' });

            // Mock credential creation
            (credentialIssuanceRepository.createCredential as jest.Mock).mockResolvedValue({ id: 'new-cred-id' });

            const mockConnector = {
                issuerId,
                normalize: jest.fn().mockReturnValue(mockCanonical),
                verify: jest.fn().mockResolvedValue({ ok: true }),
                providerId
            };

            await externalCredentialSyncService['processCredential'](mockConnector as any, {});

            expect(credentialIssuanceRepository.createCredential).toHaveBeenCalledWith(expect.objectContaining({
                learner_id: 102
            }));
        });

        it('should create unclaimed credential if learner not found', async () => {
            // Mock learner lookup (not found)
            (credentialIssuanceRepository.findLearnerByEmail as jest.Mock).mockResolvedValue(null);
            (credentialIssuanceRepository.findLearnerByOtherEmail as jest.Mock).mockResolvedValue(null);
            (externalCredentialSyncRepository.credentialExists as jest.Mock).mockResolvedValue(false);
            (credentialIssuanceRepository.createCredential as jest.Mock).mockResolvedValue({ id: 'new-cred-id' });

            const mockConnector = {
                issuerId,
                normalize: jest.fn().mockReturnValue(mockCanonical),
                verify: jest.fn().mockResolvedValue({ ok: true }),
                providerId
            };

            await externalCredentialSyncService['processCredential'](mockConnector as any, {});

            expect(credentialIssuanceRepository.createCredential).toHaveBeenCalledWith(expect.objectContaining({
                learner_id: null,
                learner_email: 'test@example.com',
                status: 'unclaimed'
            }));
        });

        it('should skip processing if credential already exists', async () => {
            // Implementation uses credentialExists
            (externalCredentialSyncRepository.credentialExists as jest.Mock).mockResolvedValue(true);

            const mockConnector = {
                issuerId,
                normalize: jest.fn().mockReturnValue(mockCanonical),
                verify: jest.fn().mockResolvedValue({ ok: true }),
                providerId
            };

            await expect(externalCredentialSyncService['processCredential'](mockConnector as any, {}))
                .rejects.toThrow('Credential already exists (duplicate)');

            expect(credentialIssuanceRepository.createCredential).not.toHaveBeenCalled();
        });

        it('should skip processing if max_hr exceeds MAX_HOUR_LEN', async () => {
            process.env.MAX_HOUR_LEN = '30';
            // Recreate service instance to pick up new env var
            const testService = new ExternalCredentialSyncService();
            const tooLongCredential = { ...mockCanonical, max_hr: 50 };

            const mockConnector = {
                issuerId,
                normalize: jest.fn().mockReturnValue(tooLongCredential),
                verify: jest.fn().mockResolvedValue({ ok: true }),
                providerId
            };

            await expect(testService['processCredential'](mockConnector as any, {}))
                .rejects.toThrow('exceed maximum allowed');

            expect(credentialIssuanceRepository.createCredential).not.toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith(
                expect.stringContaining('Skipping credential with hours=50'),
                expect.objectContaining({ credential_title: 'Test Certificate' })
            );
        });

        it('should skip processing if hours are below MIN_HOUR_LEN', async () => {
            process.env.MIN_HOUR_LEN = '7.5';
            // Recreate service instance to pick up new env var
            const testService = new ExternalCredentialSyncService();
            const tooShortCredential = { ...mockCanonical, max_hr: 5, min_hr: 5 };

            const mockConnector = {
                issuerId,
                normalize: jest.fn().mockReturnValue(tooShortCredential),
                verify: jest.fn().mockResolvedValue({ ok: true }),
                providerId
            };

            await expect(testService['processCredential'](mockConnector as any, {}))
                .rejects.toThrow('below minimum required');

            expect(credentialIssuanceRepository.createCredential).not.toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith(
                expect.stringContaining('Skipping credential with hours=5'),
                expect.objectContaining({ credential_title: 'Test Certificate' })
            );
        });
    });
});
