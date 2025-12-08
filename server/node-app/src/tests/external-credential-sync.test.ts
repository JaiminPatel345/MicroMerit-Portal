/**
 * External Credential Sync Unit Tests
 * Tests for matching engine, normalization, and idempotency
 */

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { prismaMock } from './setup';

// Mock modules
jest.mock('../utils/prisma', () => ({
    __esModule: true,
    prisma: mockDeep<PrismaClient>(),
}));

jest.mock('../infrastructure/config/feature-flags', () => ({
    featureFlags: {
        externalSyncEnabled: true,
        matchThreshold: 0.85,
        kmsMock: true,
        dlqMaxRetries: 3,
    },
    kmsConfig: {
        devKey: 'test-encryption-key-32bytes!',
    },
}));

describe('External Credential Sync', () => {
    beforeEach(() => {
        mockReset(prismaMock);
    });

    describe('Matching Engine', () => {
        it('should match by primary email with confidence 1.0', async () => {
            // Import after mocking
            const { matchCredentialToLearner } = await import(
                '../modules/external-credential-sync/matching/matching-engine'
            );

            const mockLearner = { id: 1 };
            prismaMock.learner.findUnique.mockResolvedValue(mockLearner as any);

            const result = await matchCredentialToLearner({
                providerCredentialId: 'test-001',
                recipientEmail: 'test@example.com',
                certificateTitle: 'Test Certificate',
                issueDate: '2024-01-01T00:00:00Z',
            });

            expect(result.learnerId).toBe(1);
            expect(result.confidence).toBe(1.0);
            expect(result.matchType).toBe('email');
        });

        it('should match by other_emails with confidence 0.95', async () => {
            const { matchCredentialToLearner } = await import(
                '../modules/external-credential-sync/matching/matching-engine'
            );

            prismaMock.learner.findUnique.mockResolvedValue(null);
            prismaMock.learner.findFirst.mockResolvedValue({ id: 2 } as any);

            const result = await matchCredentialToLearner({
                providerCredentialId: 'test-002',
                recipientEmail: 'secondary@example.com',
                certificateTitle: 'Test Certificate',
                issueDate: '2024-01-01T00:00:00Z',
            });

            expect(result.learnerId).toBe(2);
            expect(result.confidence).toBe(0.95);
            expect(result.matchType).toBe('other_email');
        });

        it('should return no match when email not found', async () => {
            const { matchCredentialToLearner } = await import(
                '../modules/external-credential-sync/matching/matching-engine'
            );

            prismaMock.learner.findUnique.mockResolvedValue(null);
            prismaMock.learner.findFirst.mockResolvedValue(null);

            const result = await matchCredentialToLearner({
                providerCredentialId: 'test-003',
                recipientEmail: 'unknown@example.com',
                certificateTitle: 'Test Certificate',
                issueDate: '2024-01-01T00:00:00Z',
            });

            expect(result.learnerId).toBeNull();
            expect(result.confidence).toBe(0);
            expect(result.matchType).toBe('none');
        });
    });

    describe('Connector Normalization', () => {
        it('should normalize NSDC credential to canonical format', async () => {
            const { getNsdcConnector } = await import(
                '../modules/external-credential-sync/connectors/nsdc-apisetu.connector'
            );

            const connector = getNsdcConnector();
            const canonical = connector.normalize({
                id: 'nsdc-001',
                signedPayload: 'test.jws.payload',
                signatureType: 'JWS',
                rawData: {
                    email: 'learner@example.com',
                    name: 'Test Learner',
                    title: 'Web Development',
                    issued_at: '2024-01-15T10:00:00Z',
                    qp_code: 'SSC/Q0101',
                },
            });

            expect(canonical.providerCredentialId).toBe('nsdc-001');
            expect(canonical.recipientEmail).toBe('learner@example.com');
            expect(canonical.certificateTitle).toBe('Web Development');
            expect(canonical.metadata?.provider).toBe('nsdc');
        });
    });

    describe('Idempotency', () => {
        it('should detect already processed jobs', async () => {
            const { externalCredentialSyncRepository } = await import(
                '../modules/external-credential-sync/repository'
            );

            prismaMock.processedJob.findUnique.mockResolvedValue({
                idempotency_key: 'nsdc:1:cred-001',
                processed_at: new Date(),
            });

            const isProcessed = await externalCredentialSyncRepository.isJobProcessed(
                'nsdc:1:cred-001'
            );

            expect(isProcessed).toBe(true);
        });

        it('should mark job as processed', async () => {
            const { externalCredentialSyncRepository } = await import(
                '../modules/external-credential-sync/repository'
            );

            prismaMock.processedJob.create.mockResolvedValue({
                idempotency_key: 'nsdc:1:cred-002',
                processed_at: new Date(),
            });

            await externalCredentialSyncRepository.markJobProcessed('nsdc:1:cred-002');

            expect(prismaMock.processedJob.create).toHaveBeenCalledWith({
                data: { idempotency_key: 'nsdc:1:cred-002' },
            });
        });
    });

    describe('DLQ Operations', () => {
        it('should add failed job to DLQ', async () => {
            const { externalCredentialSyncRepository } = await import(
                '../modules/external-credential-sync/repository'
            );

            const dlqEntry = {
                id: 'dlq-001',
                job_type: 'credential_processing',
                job_id: 'nsdc:1:cred-003',
                reason: 'Verification failed',
                attempts: 1,
                payload: { provider: 'nsdc' },
                created_at: new Date(),
            };

            prismaMock.dLQ.create.mockResolvedValue(dlqEntry);

            const result = await externalCredentialSyncRepository.addToDLQ({
                jobType: 'credential_processing',
                jobId: 'nsdc:1:cred-003',
                reason: 'Verification failed',
                payload: { provider: 'nsdc' },
            });

            expect(result.job_id).toBe('nsdc:1:cred-003');
            expect(result.reason).toBe('Verification failed');
        });
    });
});
