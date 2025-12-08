
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid'; // Actually unused if we construct custom ID
import { logger } from '../../utils/logger';
import { uploadToFilebase } from '../../utils/filebase';
import { writeToBlockchain } from '../../services/blockchainClient';
import { buildCanonicalJson, computeDataHash } from '../../utils/canonicalJson';
import { aiService } from '../../modules/ai/ai.service'; // Ensure this path is correct

const prisma = new PrismaClient();

const userConnectionStatus: Record<number, { digilocker: boolean, sip: boolean }> = {};

export class MockIntegrationService {

    async connectDigiLocker(userId: number) {
        if (!userConnectionStatus[userId]) userConnectionStatus[userId] = { digilocker: false, sip: false };
        userConnectionStatus[userId].digilocker = true;
        await prisma.learner.update({ where: { id: userId }, data: { external_digilocker_id: `DL-${userId}` } });
        return { success: true, message: 'Connected to DigiLocker (Mock)' };
    }

    async connectSIP(userId: number) {
        if (!userConnectionStatus[userId]) userConnectionStatus[userId] = { digilocker: false, sip: false };
        userConnectionStatus[userId].sip = true;
        return { success: true, message: 'Connected to SIP (Mock)' };
    }

    async getSyncStatus(userId: number) {
        return userConnectionStatus[userId] || { digilocker: false, sip: false };
    }

    /**
     * Syncs credentials from mock registry with proper Blockchain Verification & AI Enrichment
     */
    async syncCredentials(userId: number) {
        const learner = await prisma.learner.findUnique({ where: { id: userId } });
        if (!learner || !learner.email) throw new Error('Learner not found or email missing');

        const registryPath = path.join(__dirname, 'mock_registry.json');
        // 2. Fetch from Mock Registry
        // In a real scenario, we'd call DigiLocker/SIP APIs here using the user's linked tokens.
        // For this mock, we just look up the static JSON.
        // const allMockUsers = JSON.parse(JSON.stringify(mockRegistry)); // Deep copy to ensure fresh read if module cached? No, require cache.
        // Better:
        // const allMockUsers = require('./mock_registry.json'); // This might be cached.
        
        // Let's force re-reading JSON if possible, or assume nodemon restarts on change.
        // Since we are using tsx/nodemon, it should restart.
        if (!fs.existsSync(registryPath)) return { synced: 0, message: 'No registry found' };
        const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
        
        const mockUser = registry.find((u: any) => u.email === learner.email);
        
        console.log(`[Sync] User ${learner.email} found in registry? ${!!mockUser}`);

        if (!mockUser) {
            return { success: true, synced: 0, message: 'No records found in mock registry' };
        }

        let syncedCount = 0;

        for (const cert of mockUser.credentials) {
            console.log(`[Sync] Checking cert: ${cert.certificate_title}`);
            const credential_id = `MOCK-${cert.qp_code}-${userId}`;

            // 3. Check if already exists in DB (Deduplication)
            const existing = await prisma.credential.findUnique({
                where: { credential_id }
            });

            if (existing) {
                console.log(`[Sync] Skipping ${cert.certificate_title}, already exists.`);
                continue;
            }
            
            console.log(`[Sync] Processing new cert: ${cert.certificate_title}`);
            
            // 1. Setup Mock Issuer
            let issuer = await prisma.issuer.findFirst({ where: { email: 'system@micromerit.com' } });
            if (!issuer) {
                issuer = await prisma.issuer.create({
                    data: {
                        name: 'System Registry',
                        email: 'system@micromerit.com',
                        type: 'system',
                        status: 'approved'
                    }
                });
            }

            // 2. Generate Dummy PDF & Upload to IPFS
            // In real app, we'd fetch the PDF from source. Here we create a placeholder.
            const dummyPdfBuffer = Buffer.from(`Certificate: ${cert.certificate_title}\nIssued to: ${learner.name}\nDate: ${cert.issued_at}`);
            const uniqueFileName = `credential/${userId}/MOCK-${cert.qp_code}.pdf`;
            
            let ipfs_cid = 'mock-cid';
            let pdf_url = '';

            try {
                const uploadRes = await uploadToFilebase(dummyPdfBuffer, uniqueFileName, 'application/pdf');
                ipfs_cid = uploadRes.cid;
                pdf_url = uploadRes.gateway_url;
                logger.info('Uploaded mock cert to IPFS', { ipfs_cid });
            } catch (e) {
                logger.warn('Failed to upload mock PDF to IPFS, using fallback', e);
            }

            // 3. Compute Hashes & Write to Blockchain
            const network = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
            const contract_address = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '0x0';
            const issued_at = new Date(cert.issued_at);

            // Canonical JSON for Data Hash (tx_hash null initially)
            const canonicalJson = buildCanonicalJson({
                credential_id,
                learner_id: userId,
                learner_email: learner.email,
                issuer_id: issuer.id,
                certificate_title: cert.certificate_title,
                issued_at,
                network,
                contract_address,
                ipfs_cid,
                pdf_url,
                tx_hash: null,
                data_hash: null // computeDataHash ignores this anyway
            });

            const data_hash = computeDataHash(canonicalJson);
            let tx_hash = null;
            let blockchain_status = 'pending';

            try {
               const bcRes = await writeToBlockchain(credential_id, data_hash, ipfs_cid);
               tx_hash = bcRes.tx_hash;
               blockchain_status = 'confirmed';
               logger.info('Written mock cert to Blockchain', { tx_hash });
            } catch (e) {
                logger.error('Blockchain write failed for mock cert', e);
                blockchain_status = 'failed';
            }

            // 4. AI Enrichment (Job Roles, NOS)
            let enrichedMetadata = {};
            let contextData: any = {}; // Hoist to outer scope

            try {
                // Try to find context from our KB first
                const nsqfContext = await prisma.skillKnowledgeBase.findMany({
                    where: { qp_code: cert.qp_code },
                    take: 1
                });
                
                // If we have strict QP code match, use it. Otherwise search by title.
                contextData = nsqfContext.length > 0 ? nsqfContext[0] : {};
                
                // Call AI Service
                enrichedMetadata = await aiService.enrichCredentialMetadata(cert.certificate_title, contextData);
                logger.info('Enriched mock metadata', { credential_id });
            } catch (e) {
                logger.warn('AI enrichment failed for mock cert', e);
            }

            // 5. Final Metadata Assembly
            // Re-build canonical JSON with tx_hash if available
            const finalCanonical = buildCanonicalJson({
                credential_id,
                learner_id: userId,
                learner_email: learner.email,
                issuer_id: issuer.id,
                certificate_title: cert.certificate_title,
                issued_at,
                network,
                contract_address,
                ipfs_cid,
                pdf_url,
                tx_hash,
                data_hash
            });

            const enrichedAny = enrichedMetadata as any;

            // Determine Source Tag
            let sourceTag = cert.issuer_name;
            if (cert.qp_code && cert.qp_code.startsWith('NIE')) sourceTag = 'DigiLocker';
            else if (cert.qp_code && cert.qp_code.startsWith('SSC')) sourceTag = 'SIP';

            const fullMetadata = {
                ...cert.metadata,
                ...finalCanonical,
                ...enrichedMetadata,
                source: sourceTag, 
                blockchain_status,
                ai_extracted: {
                    skills: (enrichedAny.skills || []).length > 0 
                        ? enrichedAny.skills 
                        : (contextData?.keywords || []).map((k: string) => ({ name: k, proficiency_level: 'Intermediate' })),
                    keywords: enrichedAny.keywords || contextData?.keywords || [], 
                    description: contextData?.description || `Mock certificate for ${cert.certificate_title}`,
                    // Automated Verified NSQF Mapping
                    nsqf_alignment: {
                        nsqf_level: contextData?.nsqf_level || cert?.nsqf_level,
                        sector: contextData?.sector,
                        sub_sector: contextData?.sub_sector,
                        job_role: contextData?.job_role || cert.certificate_title,
                        qp_code: cert.qp_code,
                        certifying_body: contextData?.certifying_body,
                        
                        // Stackable Roadmap Data
                        progression_pathways: contextData?.progression_pathways,
                        credits_breakdown: contextData?.credits_breakdown,
                        notional_hours: contextData?.notional_hours,

                        verified_at: new Date().toISOString(),
                        verified_by_issuer: true, // System verification
                        verification_status: 'approved',
                        aligned: true, // Explicitly aligned
                        reasoning: 'Automated mapping from National Qualifications Register'
                    }
                }
            };

            // 6. DB Creation
            await prisma.credential.create({
                data: {
                    credential_id,
                    learner_id: userId,
                    learner_email: learner.email,
                    issuer_id: issuer.id,
                    certificate_title: cert.certificate_title,
                    issued_at,
                    data_hash,
                    tx_hash,
                    ipfs_cid,
                    pdf_url,
                    status: 'issued',
                    metadata: fullMetadata
                }
            });

            syncedCount++;
        }

        return { success: true, synced: syncedCount, message: `Synced ${syncedCount} credentials with Blockchain verification` };
    }

    async syncAllUsers() {
        const learners = await prisma.learner.findMany();
        logger.info(`Starting sync for ${learners.length} learners`);
        let total = 0;
        for (const l of learners) {
            try {
                const res = await this.syncCredentials(l.id);
                total += res.synced || 0;
            } catch (e) {
                logger.error(`Failed to sync user ${l.id}`, e);
            }
        }
        return total;
    }
}

export const mockIntegrationService = new MockIntegrationService();
