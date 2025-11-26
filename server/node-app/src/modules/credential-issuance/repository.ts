import { prisma } from '../../utils/prisma';

/**
 * Repository for credential issuance operations
 */

export class CredentialIssuanceRepository {
    /**
     * Find learner by primary email
     */
    async findLearnerByEmail(email: string) {
        return await prisma.learner.findUnique({
            where: { email },
        });
    }

    /**
     * Find learner by email in other_emails array
     */
    async findLearnerByOtherEmail(email: string) {
        return await prisma.learner.findFirst({
            where: {
                other_emails: {
                    has: email,
                },
            },
        });
    }

    /**
     * Find issuer by ID
     */
    async findIssuerById(issuerId: number) {
        return await prisma.issuer.findUnique({
            where: { id: issuerId },
        });
    }

    /**
     * Create a new credential
     */
    async createCredential(data: {
        credential_id: string;
        learner_id: number | null;
        learner_email: string;
        issuer_id: number;
        certificate_title: string;
        issued_at: Date;
        ipfs_cid: string | null;
        pdf_url: string | null;
        tx_hash: string | null;
        data_hash: string;
        metadata: any;
        status: string;
    }) {
        return await prisma.credential.create({
            data,
        });
    }

    /**
     * Find unclaimed credentials by learner email
     * Used when a new learner signs up
     */
    async findUnclaimedCredentialsByEmail(email: string) {
        return await prisma.credential.findMany({
            where: {
                learner_email: email,
                status: 'unclaimed',
            },
        });
    }

    /**
     * Claim credentials for a learner
     * Updates unclaimed credentials to link them to the learner
     */
    async claimCredentials(email: string, learnerId: number) {
        return await prisma.credential.updateMany({
            where: {
                learner_email: email,
                status: 'unclaimed',
            },
            data: {
                learner_id: learnerId,
                status: 'claimed',
            },
        });
    }
}

export const credentialIssuanceRepository = new CredentialIssuanceRepository();
