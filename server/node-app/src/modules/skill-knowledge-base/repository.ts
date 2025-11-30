import { prisma } from '../../utils/prisma';

export class SkillKnowledgeBaseRepository {
    /**
     * Search SkillKnowledgeBase by keywords
     */
    async search(query: string, limit: number = 10) {
        // Simple keyword search using contains
        // In a real app, we might use full-text search or vector search
        const keywords = query.toLowerCase().split(' ').filter(k => k.length > 3);

        if (keywords.length === 0) return [];

        // Find entries that match any of the keywords
        // This is a basic implementation
        const results = await prisma.skillKnowledgeBase.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' as const } },
                    { job_role: { contains: query, mode: 'insensitive' as const } },
                    { description: { contains: query, mode: 'insensitive' as const } },
                    // Also try to match individual keywords if the full query doesn't match
                    ...keywords.map(k => ({ title: { contains: k, mode: 'insensitive' as const } })),
                    ...keywords.map(k => ({ job_role: { contains: k, mode: 'insensitive' as const } }))
                ]
            },
            select: {
                qp_code: true,
                job_role: true,
                nsqf_level: true,
                description: true
            },
            take: limit,
            orderBy: {
                created_at: 'desc'
            }
        });

        return results;
    }
}

export const skillKnowledgeBaseRepository = new SkillKnowledgeBaseRepository();
