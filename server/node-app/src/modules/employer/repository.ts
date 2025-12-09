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
        try {
            // Base query to find learners
            // We'll use raw query to handle the complex JSON filtering for skills effectively
            
            const conditions: string[] = [`l.status = 'active'`];
            const params: any[] = [];
            let paramCount = 1;

            // --- 1. SECTOR FILTER (Strict) ---
            if (filters.sector) {
                // Find learners who have at least one issued credential in this sector
                conditions.push(`EXISTS (
                    SELECT 1 FROM "Credential" c 
                    WHERE c.learner_id = l.id 
                    AND c.status = 'issued'
                    AND c.sector ILIKE $${paramCount++}
                )`);
                params.push(`%${filters.sector}%`);
            }

            // --- 2. NSQF LEVEL FILTER (Strict) ---
            if (filters.nsqf_level) {
                conditions.push(`EXISTS (
                    SELECT 1 FROM "Credential" c 
                    WHERE c.learner_id = l.id 
                    AND c.status = 'issued'
                    AND c.nsqf_level = $${paramCount++}
                )`);
                params.push(filters.nsqf_level);
            }

            // --- 3. ISSUER FILTER (Strict) ---
            if (filters.issuer) {
                 conditions.push(`EXISTS (
                    SELECT 1 FROM "Credential" c 
                    JOIN "issuer" i ON c.issuer_id = i.id
                    WHERE c.learner_id = l.id 
                    AND c.status = 'issued'
                    AND i.name ILIKE $${paramCount++}
                )`);
                params.push(`%${filters.issuer}%`);
            }

             // --- 4. JOB ROLE FILTER (Strict - on Title) ---
            if (filters.job_role) {
                conditions.push(`EXISTS (
                    SELECT 1 FROM "Credential" c 
                    WHERE c.learner_id = l.id 
                    AND c.status = 'issued'
                    AND c.certificate_title ILIKE $${paramCount++}
                )`);
                params.push(`%${filters.job_role}%`);
            }


            // --- 5. SKILLS FILTER (Strict JSON check) ---
            // Check in LearnerSkillProfile.data -> allSkills (array of strings or objects)
            if (filters.skills && filters.skills.length > 0) {
                // We want learners where ANY of the requested skills exist in their profile
                // JSON structure: data: { allSkills: ["Java", {name: "Python"}] }
                
                // Construct a robust JSON path OR check
                // This checks if any of the filter skills exist in the allSkills array (handling both string/object)
                const skillConditions = filters.skills.map(skill => {
                    const p = `$${paramCount++}`;
                    params.push(`%${skill.trim()}%`);
                    // Check if skill string exists OR if object with name exists
                     return `(
                        EXISTS (
                            SELECT 1 FROM jsonb_array_elements(lsp.data -> 'allSkills') as skill
                            WHERE (jsonb_typeof(skill) = 'string' AND skill #>> '{}' ILIKE ${p})
                            OR (jsonb_typeof(skill) = 'object' AND skill ->> 'name' ILIKE ${p})
                        )
                        OR
                        EXISTS (
                            SELECT 1 FROM jsonb_array_elements(lsp.data -> 'topSkills') as start_skill
                            WHERE (jsonb_typeof(start_skill) = 'string' AND start_skill #>> '{}' ILIKE ${p})
                            OR (jsonb_typeof(start_skill) = 'object' AND start_skill ->> 'skill' ILIKE ${p}) 
                        )
                    )`;
                }).join(' OR ');

                conditions.push(`(${skillConditions})`);
            }

             // --- 6. KEYWORD SEARCH (Broad) ---
             if (filters.keyword) {
                const p = `$${paramCount++}`;
                params.push(`%${filters.keyword}%`);
                
                conditions.push(`(
                    l.name ILIKE ${p}
                    OR l.email ILIKE ${p}
                    OR EXISTS (
                        SELECT 1 FROM "Credential" c 
                        JOIN "issuer" i ON c.issuer_id = i.id
                        WHERE c.learner_id = l.id 
                        AND c.status = 'issued'
                        AND (c.certificate_title ILIKE ${p} OR i.name ILIKE ${p})
                    )
                     OR EXISTS (
                        SELECT 1 FROM "LearnerSkillProfile" lsp2
                        WHERE lsp2.learner_id = l.id
                        AND lsp2.data::text ILIKE ${p}
                    )
                )`);
             }

            // JOIN with SkillProfile to enable skill filtering
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            const query = `
                SELECT DISTINCT l.id 
                FROM "learner" l
                LEFT JOIN "LearnerSkillProfile" lsp ON l.id = lsp.learner_id
                ${whereClause}
                ORDER BY l.id DESC
                LIMIT 50
            `;
            
            // console.log("Search Query:", query, params);

            const result = await prisma.$queryRawUnsafe<{ id: number }[]>(query, ...params);
            
            const learnerIds = result.map(r => r.id);

            if (learnerIds.length === 0) return [];

             // Fetch full details
             const candidates = await prisma.learner.findMany({
                where: {
                    id: { in: learnerIds }
                },
                include: {
                    credentials: {
                        where: { status: 'issued' },
                        include: { issuer: { select: { name: true } } },
                        take: 1 // Just take one for display
                    },
                    skillProfile: true
                },
                take: 50
            });

             // Post-process to optimize display
            return candidates.map(learner => {
                let matchedCred = learner.credentials[0];
                return {
                    ...learner,
                    matched_credential: matchedCred ? {
                        title: matchedCred.certificate_title,
                        issuer: matchedCred.issuer.name,
                        issued_at: matchedCred.issued_at
                    } : null
                };
            });

        } catch (error) {
            console.error("Search failed:", error);
            return []; // Fail safe to empty array
        }
    },

    async getByIds(ids: number[]) {
        return prisma.learner.findMany({
            where: {
                id: { in: ids }
            },
            include: {
                credentials: {
                    where: { status: 'issued' },
                    include: { issuer: { select: { name: true, logo_url: true } } }
                },
                skillProfile: true
            }
        });
    }
};
