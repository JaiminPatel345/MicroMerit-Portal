import { prisma } from '../../utils/prisma';
import { employer, Prisma } from '@prisma/client';

export const employerRepository = {
    async create(data: Prisma.employerCreateInput) {
        return prisma.employer.create({
            data,
        });
    },

    async findAll(page: number, limit: number, status?: string, search?: string) {
        const skip = (page - 1) * limit;
        const where: Prisma.employerWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { company_name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { contact_person: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [employers, total] = await Promise.all([
            prisma.employer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' }
            }),
            prisma.employer.count({ where })
        ]);

        return {
            employers,
            total,
            pages: Math.ceil(total / limit)
        };
    },

    async createVerificationSession(data: Prisma.verification_sessionCreateInput) {
        return prisma.verification_session.create({ data });
    },

    async findVerificationSessionById(id: string) {
        return prisma.verification_session.findUnique({ where: { id } });
    },

    async updateVerificationSession(id: string, data: Prisma.verification_sessionUpdateInput) {
        return prisma.verification_session.update({ where: { id }, data });
    },

    async updateStatus(id: number, status: string, rejectedReason?: string) {
        return prisma.employer.update({
            where: { id },
            data: {
                status,
                rejected_reason: rejectedReason,
                approved_at: status === 'approved' ? new Date() : null
            }
        });
    },

    async findByEmail(email: string) {
        return prisma.employer.findUnique({
            where: { email },
        });
    },

    async findById(id: number) {
        return prisma.employer.findUnique({
            where: { id },
        });
    },

    async update(id: number, data: Prisma.employerUpdateInput) {
        return prisma.employer.update({
            where: { id },
            data,
        });
    },

    async countAll() {
        return prisma.employer.count();
    },

    async logActivity(employerId: number, activityType: string, credentialId?: string, details?: any) {
        return prisma.employer_activity_log.create({
            data: {
                employer_id: employerId,
                activity_type: activityType,
                credential_id: credentialId,
                details: details ? details : Prisma.JsonNull,
            }
        })
    },

    async getStats(employerId: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalVerifications, verificationsToday] = await Promise.all([
            prisma.employer_activity_log.count({
                where: {
                    employer_id: employerId,
                    activity_type: { in: ['verify', 'bulk_verify'] }
                }
            }),
            prisma.employer_activity_log.count({
                where: {
                    employer_id: employerId,
                    activity_type: { in: ['verify', 'bulk_verify'] },
                    created_at: { gte: today }
                }
            })
        ]);

        return {
            totalVerifications,
            verificationsToday
        };
    },

    async searchCandidates(filters: {
        skills?: string[],
        sector?: string,
        nsqf_level?: number,
        job_role?: string,
        keyword?: string,
        issuer?: string
    }) {
        const strictFilterIds = new Set<number>();
        const searchMatchIds = new Set<number>();
        
        const hasStrictFilters = !!(filters.sector || filters.nsqf_level || filters.job_role || filters.issuer);
        const hasSearchTerm = !!(filters.keyword || (filters.skills && filters.skills.length > 0));

        // --- STAGE 1: Strict Filters (AND logic) ---
        // These MUST be met. They are all based on Credentials.
        if (hasStrictFilters) {
            const credConditions: any[] = []; // Typed as any to support new fields like sector/nsqf_level
            
            if (filters.sector) credConditions.push({ sector: { contains: filters.sector, mode: 'insensitive' } });
            if (filters.job_role) credConditions.push({ certificate_title: { contains: filters.job_role, mode: 'insensitive' } });
            if (filters.issuer) credConditions.push({ issuer: { name: { contains: filters.issuer, mode: 'insensitive' } } });
            
            if (filters.nsqf_level) {
                const level = Number(filters.nsqf_level);
                if (!isNaN(level)) credConditions.push({ nsqf_level: { equals: level } });
            }

            const creds = await prisma.credential.findMany({
                where: {
                    status: 'issued',
                    learner: { isNot: null },
                    AND: credConditions as any
                },
                select: { learner_id: true }
            });
            creds.forEach(c => c.learner_id && strictFilterIds.add(c.learner_id));
            
            // If strict filters are applied but no one matches, we can return early (intersection will be empty)
            if (strictFilterIds.size === 0) return [];
        }

        // --- STAGE 2: Search Query (OR logic across fields) ---
        // Keyword matches Name OR Credential Title OR Profile
        // Skills matches Profile
        if (hasSearchTerm) {
            // A. Search Credentials for Keyword
            if (filters.keyword) {
                const creds = await prisma.credential.findMany({
                    where: {
                        status: 'issued',
                        OR: [
                            { certificate_title: { contains: filters.keyword, mode: 'insensitive' } },
                            { issuer: { name: { contains: filters.keyword, mode: 'insensitive' } } }
                        ]
                    },
                    select: { learner_id: true }
                });
                creds.forEach(c => c.learner_id && searchMatchIds.add(c.learner_id));
                
                // Search Users by Name
                const learners = await prisma.learner.findMany({
                    where: { name: { contains: filters.keyword, mode: 'insensitive' } },
                    select: { id: true }
                });
                learners.forEach(l => searchMatchIds.add(l.id));
            }

            // B. Search Profile for Keyword OR Skills
            let profileTerm = filters.keyword || "";
            if (filters.skills) {
                 if (Array.isArray(filters.skills)) profileTerm += " " + filters.skills.join(' ');
                 else profileTerm += " " + filters.skills;
            }
            
            if (profileTerm.trim().length > 0) {
                 try {
                    const profiles = await prisma.$queryRawUnsafe<{ learner_id: number }[]>(
                        `SELECT learner_id FROM "LearnerSkillProfile" WHERE data::text ILIKE $1`,
                        `%${profileTerm.trim()}%`
                    );
                    profiles.forEach(p => searchMatchIds.add(p.learner_id));
                } catch (e) {
                    console.error("SkillProfile raw search failed", e);
                }
            }
        }

        // --- STAGE 3: Combine (INTERSECTION) ---
        let finalIds: number[] = [];

        if (hasStrictFilters && hasSearchTerm) {
            // Intersection
            finalIds = Array.from(strictFilterIds).filter(id => searchMatchIds.has(id));
        } else if (hasStrictFilters) {
            // Only strict
            finalIds = Array.from(strictFilterIds);
        } else if (hasSearchTerm) {
            // Only search
            finalIds = Array.from(searchMatchIds);
        } else {
            // Neither (Show Recent Default)
             const allLearners = await prisma.learner.findMany({ take: 50, orderBy: { created_at: 'desc' }, select: { id: true } });
             finalIds = allLearners.map(l => l.id);
        }

        // If filtering attempted but nothing matched
        if ((hasStrictFilters || hasSearchTerm) && finalIds.length === 0) {
            return [];
        }

        const learnerIds = new Set(finalIds);

        // 4. Fetch Details for collected IDs
        const candidates = await prisma.learner.findMany({
            where: {
                id: { in: Array.from(learnerIds) }
            },
            include: {
                credentials: {
                    where: { status: 'issued' },
                    include: { issuer: { select: { name: true } } },
                    take: 1 // Just take one for display if matched
                },
                skillProfile: true
            },
            take: 50
        });

        // 5. Post-process to add matched_credential / matched_skill info for UI
        return candidates.map(learner => {
            // Try to find the best matching credential
            let matchedCred = learner.credentials[0];
            if (filters.keyword || filters.job_role) {
                const matchTerm = filters.keyword || filters.job_role || '';
                const betterMatch = learner.credentials.find(c =>
                    c.certificate_title.toLowerCase().includes(matchTerm.toLowerCase())
                );
                if (betterMatch) matchedCred = betterMatch;
            }

            return {
                ...learner,
                matched_credential: matchedCred ? {
                    title: matchedCred.certificate_title,
                    issuer: matchedCred.issuer.name,
                    issued_at: matchedCred.issued_at
                } : null
            };
        });
    }
};
