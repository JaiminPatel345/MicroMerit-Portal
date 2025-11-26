import { prisma } from '../../utils/prisma';

/**
 * Repository for credential verification operations
 */

export class CredentialVerificationRepository {
    /**
     * Find credential by credential_id
     */
    async findByCredentialId(credentialId: string) {
        return await prisma.credential.findUnique({
            where: { credential_id: credentialId },
            include: {
                issuer: {
                    select: {
                        id: true,
                        name: true,
                        official_domain: true,
                        website_url: true,
                        type: true,
                    },
                },
                learner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Find credential by blockchain transaction hash
     */
    async findByTxHash(txHash: string) {
        return await prisma.credential.findFirst({
            where: { tx_hash: txHash },
            include: {
                issuer: {
                    select: {
                        id: true,
                        name: true,
                        official_domain: true,
                        website_url: true,
                        type: true,
                    },
                },
                learner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Find credential by IPFS CID
     */
    async findByIpfsCid(ipfsCid: string) {
        return await prisma.credential.findFirst({
            where: { ipfs_cid: ipfsCid },
            include: {
                issuer: {
                    select: {
                        id: true,
                        name: true,
                        official_domain: true,
                        website_url: true,
                        type: true,
                    },
                },
                learner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
}

export const credentialVerificationRepository = new CredentialVerificationRepository();
