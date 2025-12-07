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
        const learnerIds = new Set<number>();

        // 1. Search in Credentials (Title, Issuer, Metadata)
        const credWhere: Prisma.CredentialWhereInput = {
            status: 'issued',
            learner: { isNot: null }
        };

        const credConditions: Prisma.CredentialWhereInput[] = [];

        if (filters.keyword) {
            credConditions.push({
                OR: [
                    { certificate_title: { contains: filters.keyword, mode: 'insensitive' } },
                    { learner: { name: { contains: filters.keyword, mode: 'insensitive' } } },
                    { issuer: { name: { contains: filters.keyword, mode: 'insensitive' } } }
                ]
            });
        }
        if (filters.job_role) {
            credConditions.push({ certificate_title: { contains: filters.job_role, mode: 'insensitive' } });
        }
        if (filters.issuer) {
            credConditions.push({ issuer: { name: { contains: filters.issuer, mode: 'insensitive' } } });
        }
        if (credConditions.length > 0) {
            credWhere.AND = credConditions;
        }

        // If specific non-credential filters (like 'skills' which might only be in profile) are NOT present, or if we want to combine results
        const credentials = await prisma.credential.findMany({
            where: credWhere,
            select: { learner_id: true }
        });
        credentials.forEach(c => { if (c.learner_id) learnerIds.add(c.learner_id) });


        // 2. Search in SkillProfile (via Raw Query for JSON text search)
        // This covers "Skills" filter and generic Keyword search in profile
        let searchTerm = filters.keyword || filters.skills;
        if (filters.skills && Array.isArray(filters.skills)) searchTerm = filters.skills.join(' ');

        if (searchTerm && searchTerm.length > 0) {
            try {
                // Determine table name - usually LearnerSkillProfile or "LearnerSkillProfile"
                // Using generic raw query hoping standard naming. If fail, will catch.
                const profiles = await prisma.$queryRawUnsafe<{ learner_id: number }[]>(
                    `SELECT learner_id FROM "LearnerSkillProfile" WHERE data::text ILIKE $1`,
                    `%${searchTerm}%`
                );
                profiles.forEach(p => learnerIds.add(p.learner_id));
            } catch (e) {
                console.error("SkillProfile raw search failed", e);
            }
        }

        // 3. Search Learners direct (Name)
        if (filters.keyword) {
            const learners = await prisma.learner.findMany({
                where: {
                    name: { contains: filters.keyword, mode: 'insensitive' }
                },
                select: { id: true }
            });
            learners.forEach(l => learnerIds.add(l.id));
        }

        if (learnerIds.size === 0) return [];

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
