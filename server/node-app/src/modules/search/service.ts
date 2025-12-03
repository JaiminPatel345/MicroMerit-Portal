import { prisma } from '../../utils/prisma';

export class SearchService {
    async search(query: string) {
        if (!query || query.length < 2) {
            return { credentials: [], issuers: [], learners: [] };
        }

        const [credentials, issuers, learners] = await Promise.all([
            // Search Credentials
            prisma.credential.findMany({
                where: {
                    status: 'issued',
                    OR: [
                        { certificate_title: { contains: query, mode: 'insensitive' } },
                        { credential_id: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: {
                    credential_id: true,
                    certificate_title: true,
                    issuer: { select: { name: true } }
                }
            }),

            // Search Issuers
            prisma.issuer.findMany({
                where: {
                    name: { contains: query, mode: 'insensitive' },
                    status: 'approved' // Only show approved issuers
                },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    logo_url: true,
                    type: true
                }
            }),

            // Search Learners
            prisma.learner.findMany({
                where: {
                    name: { contains: query, mode: 'insensitive' }
                },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    profileUrl: true
                }
            })
        ]);

        return { credentials, issuers, learners };
    }
}

export const searchService = new SearchService();
