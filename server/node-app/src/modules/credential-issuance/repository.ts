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

    /**
     * Find credentials by issuer ID
     */
    async findCredentialsByIssuerId(issuerId: number, limit?: number) {
        return await prisma.credential.findMany({
            where: {
                issuer_id: issuerId,
            },
            orderBy: {
                issued_at: 'desc',
            },
            include: {
                learner: true,
            },
            take: limit,
        });
    }
    /**
     * Find aggregated recipients by issuer ID
     */
    async findRecipientsByIssuerId(issuerId: number) {
        // Group credentials by learner email to get stats
        const grouped = await prisma.credential.groupBy({
            by: ['learner_email'],
            where: {
                issuer_id: issuerId,
            },
            _count: {
                id: true,
            },
            _max: {
                issued_at: true,
            },
        });

        // Fetch learner details for these emails
        const emails = grouped.map(g => g.learner_email);
        const learners = await prisma.learner.findMany({
            where: {
                email: {
                    in: emails,
                },
            },
            select: {
                email: true,
                name: true,
            },
        });

        // Merge data
        return grouped.map(g => {
            const learner = learners.find(l => l.email === g.learner_email);
            return {
                ...g,
                learner: learner ? { name: learner.name } : null
            };
        });
    }

    /**
     * Update credential metadata
     * Merges the provided updates into the existing metadata at the root level
     */
    async updateCredentialMetadata(credential_id: string, metadataUpdates: any) {
        const credential = await prisma.credential.findUnique({
            where: { credential_id },
        });

        if (!credential) {
            throw new Error(`Credential not found: ${credential_id}`);
        }

        // Merge updates into existing metadata
        const existingMetadata = (credential.metadata as any) || {};
        const updatedMetadata = {
            ...existingMetadata,
            ...metadataUpdates,
        };

        return await prisma.credential.update({
            where: { credential_id },
            data: {
                metadata: updatedMetadata,
            },
        });
    }

    /**
     * Get the latest N credentials for public display
     */
    async getLatestCredentials(limit: number = 3) {
        const [credentials, totalCount] = await Promise.all([
            prisma.credential.findMany({
                orderBy: {
                    issued_at: 'desc',
                },
                take: limit,
                select: {
                    certificate_title: true,
                    issued_at: true,
                    issuer: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
            prisma.credential.count(),
        ]);

        return {
            credentials,
            totalCount,
        };
    }

    /**
     * Find credential by ID
     */
    async findCredentialById(credentialId: string) {
        return await prisma.credential.findUnique({
            where: { credential_id: credentialId },
        });
    }

    /**
     * Find public credential by ID with relations
     */
    async findPublicCredentialById(credentialId: string) {
        return await prisma.credential.findUnique({
            where: { credential_id: credentialId },
            include: {
                issuer: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        website_url: true,
                        logo_url: true
                    }
                },
                learner: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
    }
    /**
     * Get distinct certificate titles issued by an issuer
     */
    async getDistinctCertificateTitles(issuerId: number) {
        const result = await prisma.credential.findMany({
            where: {
                issuer_id: issuerId,
                status: 'issued'
            },
            select: {
                certificate_title: true
            },
            distinct: ['certificate_title']
        });
        return result.map(r => r.certificate_title);
    }
}

export const credentialIssuanceRepository = new CredentialIssuanceRepository();
