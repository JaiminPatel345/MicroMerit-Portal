// @ts-expect-error - uuid package provides its own types but tsc may not detect them properly
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { credentialIssuanceRepository } from './repository';
import { uploadToFilebase } from '../../utils/filebase';
import { writeToBlockchain } from '../../utils/blockchain';
import { buildCanonicalJson, computeDataHash } from '../../utils/canonicalJson';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * Service for credential issuance operations
 */

export interface IssueCredentialParams {
    learner_email: string;
    issuer_id: number;
    certificate_title: string;
    issued_at: Date;
    original_pdf: Buffer;
    original_pdf_filename: string;
    mimetype?: string;
}

export interface IssueCredentialResult {
    credential_id: string;
    learner_id: number | null;
    learner_email: string;
    certificate_title: string;
    ipfs_cid: string;
    tx_hash: string;
    data_hash: string;
    pdf_url: string;
    status: string;
    issued_at: Date;
}

export class CredentialIssuanceService {
    /**
     * Issue a new credential
     */
    async issueCredential(params: IssueCredentialParams): Promise<IssueCredentialResult> {
        const { learner_email, issuer_id, certificate_title, issued_at, original_pdf, original_pdf_filename, mimetype } = params;

        // Step 1: Validate issuer exists and is approved
        const issuer = await credentialIssuanceRepository.findIssuerById(issuer_id);
        if (!issuer) {
            throw new NotFoundError('Issuer not found', 404, 'ISSUER_NOT_FOUND');
        }

        if (issuer.status !== 'approved') {
            throw new ValidationError('Issuer is not approved to issue credentials', 403, 'ISSUER_NOT_APPROVED');
        }

        // Step 2: Resolve learner by email
        let learner = await credentialIssuanceRepository.findLearnerByEmail(learner_email);

        if (!learner) {
            // Try to find by other_emails
            learner = await credentialIssuanceRepository.findLearnerByOtherEmail(learner_email);
        }

        const learner_id = learner ? learner.id : null;
        const status = learner ? 'issued' : 'unclaimed';

        logger.info('Issuing credential', {
            learner_email,
            learner_id,
            issuer_id,
            status,
        });

        // Step 3: Generate credential_id
        const credential_id = uuidv4();

        // Step 4: Build canonical JSON (without data_hash, ipfs_cid, tx_hash initially)
        let canonicalJson = buildCanonicalJson({
            credential_id,
            learner_id,
            learner_email,
            issuer_id,
            certificate_title,
            issued_at,
            ipfs_cid: null,
            pdf_url: null,
            tx_hash: null,
            data_hash: null,
        });

        // Step 5: Compute SHA256 hash (data_hash)
        const data_hash = computeDataHash(canonicalJson);
        logger.info('Computed data hash', { credential_id, data_hash });

        // Step 6: Upload PDF to Filebase (IPFS)
        // Generate unique filename: credential/{user_id || email}/{certificate_title}-{4 random lettors}
        const identifier = learner_id ? learner_id.toString() : learner_email.replace(/[^a-zA-Z0-9]/g, '_');
        const sanitizedTitle = certificate_title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const randomSuffix = crypto.randomBytes(2).toString('hex'); // 4 random hex characters
        const extension = original_pdf_filename.split('.').pop() || 'pdf';

        const uniqueFileName = `credential/${identifier}/${sanitizedTitle}-${randomSuffix}.${extension}`;

        const { cid: ipfs_cid, gateway_url: pdf_url } = await uploadToFilebase(
            original_pdf,
            uniqueFileName,
            mimetype || 'application/pdf'
        );
        logger.info('Uploaded to IPFS', { credential_id, ipfs_cid, pdf_url });

        // Step 7: Update canonical JSON with IPFS data
        canonicalJson = buildCanonicalJson({
            credential_id,
            learner_id,
            learner_email,
            issuer_id,
            certificate_title,
            issued_at,
            ipfs_cid,
            pdf_url,
            tx_hash: null,
            data_hash,
        });

        // Step 8: Mock blockchain write
        const { tx_hash } = await writeToBlockchain(credential_id, data_hash, ipfs_cid);
        logger.info('Blockchain write complete', { credential_id, tx_hash });

        // Step 9: Final canonical JSON with all data
        canonicalJson = buildCanonicalJson({
            credential_id,
            learner_id,
            learner_email,
            issuer_id,
            certificate_title,
            issued_at,
            ipfs_cid,
            pdf_url,
            tx_hash,
            data_hash,
        });

        // Step 10: Store in database
        const credential = await credentialIssuanceRepository.createCredential({
            credential_id,
            learner_id,
            learner_email,
            issuer_id,
            certificate_title,
            issued_at,
            ipfs_cid,
            pdf_url,
            tx_hash,
            data_hash,
            metadata: canonicalJson,
            status,
        });

        logger.info('Credential issued successfully', {
            credential_id,
            learner_id,
            learner_email,
            status,
        });

        return {
            credential_id,
            learner_id,
            learner_email,
            certificate_title,
            ipfs_cid,
            tx_hash,
            data_hash,
            pdf_url,
            status,
            issued_at,
        };
    }
}

export const credentialIssuanceService = new CredentialIssuanceService();
