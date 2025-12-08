/**
 * External Credential Sync Repository
 * Data access for ExternalCredential, ProcessedJob, DLQ tables
 */

import { prisma } from '../../utils/prisma';
import { ExternalCredential, ProcessedJob, DLQ, Prisma } from '@prisma/client';
import { CanonicalCredential } from './connectors/types';

export interface CreateExternalCredentialDTO {
    issuerId: number;
    providerCredentialId: string;
    canonicalPayload: CanonicalCredential;
    rawPayloadEncrypted?: Buffer;
    signatureVerified: boolean;
    verificationMethod?: string;
    status?: string;
    learnerId?: number;
    matchConfidence?: number;
}

export class ExternalCredentialSyncRepository {

    // =====================================
    // External Credential Operations
    // =====================================

    async createExternalCredential(data: CreateExternalCredentialDTO): Promise<any> {
        return prisma.credential.create({
            data: {
                // Regular credential fields
                credential_id: data.providerCredentialId,
                issuer_id: data.issuerId,
                learner_id: data.learnerId,
                learner_email: data.canonicalPayload.recipientEmail || '',
                certificate_title: data.canonicalPayload.certificateTitle || 'External Credential',
                issued_at: new Date(data.canonicalPayload.issueDate),
                data_hash: '', // Not applicable
                metadata: data.canonicalPayload.metadata || {},
                status: data.status || 'pending',

                // External fields
                is_external: true,
                provider_credential_id: data.providerCredentialId,
                signature_verified: data.signatureVerified,
                verification_method: data.verificationMethod,
                encrypted_raw_payload: data.rawPayloadEncrypted ? data.rawPayloadEncrypted.toString('base64') : null, // Store as base64 string
                match_confidence: data.matchConfidence,
                processed_at: data.status === 'verified' ? new Date() : null,
            },
        });
    }

    async findExternalCredentialByProviderId(providerCredentialId: string): Promise<any | null> {
        return prisma.credential.findFirst({
            where: {
                provider_credential_id: providerCredentialId,
                is_external: true
            },
        });
    }

    // Helper used by processor
    async createCredential(data: any): Promise<any> {
        // This is a duplicate of createExternalCredential but requested by the processor
        // We'll map it to the same prisma call
        return prisma.credential.create({
            data: {
                credential_id: data.providerCredentialId,
                provider_credential_id: data.providerCredentialId,
                issuer_id: data.issuerId,
                learner_id: data.learnerId,
                learner_email: data.learnerEmail,
                certificate_title: data.certificateTitle,
                issued_at: data.issuedAt,
                data_hash: data.dataHash,
                metadata: data.metadata,
                status: data.status,

                is_external: true,
                signature_verified: data.signatureVerified,
                verification_method: data.verificationMethod,
                encrypted_raw_payload: data.encryptedRawPayload,
                match_confidence: data.matchConfidence,
                match_type: data.matchType,
                processed_at: data.processedAt,
            },
        });
    }

    async updateExternalCredential(
        id: string,
        data: Partial<{
            status: string;
            learnerId: number;
            matchConfidence: number;
            signatureVerified: boolean;
            verificationMethod: string;
            processedAt: Date;
        }>
    ): Promise<any> {
        return prisma.credential.update({
            where: { id },
            data: {
                status: data.status,
                learner_id: data.learnerId,
                match_confidence: data.matchConfidence,
                signature_verified: data.signatureVerified,
                verification_method: data.verificationMethod,
                processed_at: data.processedAt,
            },
        });
    }

    async findExternalCredentialsByIssuer(
        issuerId: number,
        options?: { status?: string; limit?: number; offset?: number }
    ): Promise<any[]> {
        return prisma.credential.findMany({
            where: {
                issuer_id: issuerId,
                is_external: true,
                ...(options?.status && { status: options.status }),
            },
            take: options?.limit,
            skip: options?.offset,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findPendingCredentials(limit: number = 100): Promise<any[]> {
        return prisma.credential.findMany({
            where: {
                status: 'pending',
                learner_id: null,
                is_external: true
            },
            take: limit,
            orderBy: { createdAt: 'asc' },
        });
    }

    // =====================================
    // Processed Job (Idempotency) Operations
    // =====================================

    async isJobProcessed(idempotencyKey: string): Promise<boolean> {
        const job = await prisma.processedJob.findUnique({
            where: { idempotency_key: idempotencyKey },
        });
        return !!job;
    }

    async markJobProcessed(idempotencyKey: string): Promise<ProcessedJob> {
        return prisma.processedJob.create({
            data: { idempotency_key: idempotencyKey },
        });
    }

    // =====================================
    // DLQ Operations
    // =====================================

    async addToDLQ(data: {
        jobType: string;
        jobId: string;
        reason: string;
        payload: unknown;
        attempts?: number;
    }): Promise<DLQ> {
        return prisma.dLQ.create({
            data: {
                job_type: data.jobType,
                job_id: data.jobId,
                reason: data.reason,
                payload: data.payload as Prisma.JsonObject,
                attempts: data.attempts || 0,
            },
        });
    }

    async getDLQItems(options?: {
        jobType?: string;
        limit?: number;
        offset?: number;
    }): Promise<DLQ[]> {
        return prisma.dLQ.findMany({
            where: options?.jobType ? { job_type: options.jobType } : undefined,
            take: options?.limit || 50,
            skip: options?.offset,
            orderBy: { created_at: 'desc' },
        });
    }

    async getDLQCount(jobType?: string): Promise<number> {
        return prisma.dLQ.count({
            where: jobType ? { job_type: jobType } : undefined,
        });
    }

    async removeDLQItem(id: string): Promise<void> {
        await prisma.dLQ.delete({ where: { id } });
    }

    async incrementDLQAttempts(id: string): Promise<DLQ> {
        return prisma.dLQ.update({
            where: { id },
            data: { attempts: { increment: 1 } },
        });
    }

    // =====================================
    // Issuer Sync Operations
    // =====================================

    async updateIssuerLastSync(issuerId: number): Promise<void> {
        await prisma.issuer.update({
            where: { id: issuerId },
            data: { last_sync_at: new Date() },
        });
    }

    async getIssuersForSync(options?: {
        onlyExternal?: boolean;
        staleThresholdHours?: number;
    }): Promise<{ id: number; registry_id: string | null; last_sync_at: Date | null }[]> {
        const where: Prisma.issuerWhereInput = {
            accept_external: true,
            status: 'approved',
            is_blocked: false,
        };

        if (options?.staleThresholdHours) {
            const threshold = new Date();
            threshold.setHours(threshold.getHours() - options.staleThresholdHours);
            where.OR = [
                { last_sync_at: null },
                { last_sync_at: { lt: threshold } },
            ];
        }

        return prisma.issuer.findMany({
            where,
            select: { id: true, registry_id: true, last_sync_at: true },
        });
    }

    // =====================================
    // Stats
    // =====================================

    async getSyncStats(): Promise<{
        totalExternal: number;
        verified: number;
        pending: number;
        rejected: number;
        dlqCount: number;
    }> {
        const [totalExternal, verified, pending, rejected, dlqCount] = await Promise.all([
            prisma.credential.count({ where: { is_external: true } }),
            prisma.credential.count({ where: { is_external: true, status: 'verified' } }),
            prisma.credential.count({ where: { is_external: true, status: 'pending' } }),
            prisma.credential.count({ where: { is_external: true, status: 'rejected' } }),
            prisma.dLQ.count(),
        ]);

        return { totalExternal, verified, pending, rejected, dlqCount };
    }
}

export const externalCredentialSyncRepository = new ExternalCredentialSyncRepository();
