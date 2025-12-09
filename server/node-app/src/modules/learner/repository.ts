import { prisma } from '../../utils/prisma';
import { learner } from '@prisma/client';

export interface CreateLearnerDTO {
  name?: string;
  email?: string;
  phone?: string;
  hashed_password?: string;
  profileFolder?: string;
  profileUrl?: string;
  external_digilocker_id?: string;
  other_emails?: string[];
  dob?: Date;
  gender?: string;
}

export interface UpdateLearnerDTO {
  name?: string;
  email?: string;
  phone?: string;
  profileFolder?: string;
  profileUrl?: string;
  external_digilocker_id?: string;
  other_emails?: string[];
  dob?: Date;
  gender?: string;
}

export class LearnerRepository {
  async create(data: CreateLearnerDTO): Promise<learner> {
    return prisma.learner.create({
      data,
    });
  }

  async findById(id: number): Promise<learner | null> {
    return prisma.learner.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<learner | null> {
    return prisma.learner.findUnique({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<learner | null> {
    return prisma.learner.findUnique({
      where: { phone },
    });
  }

  async update(id: number, data: UpdateLearnerDTO): Promise<learner> {
    return prisma.learner.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: number, status: string): Promise<learner> {
    return prisma.learner.update({
      where: { id },
      data: { status },
    });
  }

  async findAll(filters?: {
    status?: string;
  }): Promise<learner[]> {
    return prisma.learner.findMany({
      where: filters,
      orderBy: { created_at: 'desc' },
    });
  }
  /**
   * Email verification session methods
   */
  async createEmailVerificationSession(data: {
    learnerId: number;
    email: string;
    otpHash: string;
    expiresAt: Date;
  }) {
    return prisma.verification_session.create({
      data: {
        session_type: 'email_verification',
        learner_id: data.learnerId,
        email: data.email,
        otp_hash: data.otpHash,
        expires_at: data.expiresAt,
      },
    });
  }

  async findEmailVerificationSessionById(sessionId: string) {
    return prisma.verification_session.findUnique({
      where: { id: sessionId },
    });
  }

  async markEmailVerificationSessionAsVerified(sessionId: string) {
    return prisma.verification_session.update({
      where: { id: sessionId },
      data: {
        is_verified: true,
        verified_at: new Date(),
      },
    });
  }

  async isEmailAlreadyAdded(learnerId: number, email: string): Promise<boolean> {
    const learner = await this.findById(learnerId);
    if (!learner) return false;

    // Check if email is primary email
    if (learner.email === email) return true;

    // Check if email is in other_emails array
    return learner.other_emails.includes(email);
  }

  async addEmailToOtherEmails(learnerId: number, email: string): Promise<learner> {
    const learner = await this.findById(learnerId);
    if (!learner) {
      throw new Error('Learner not found');
    }

    const updatedEmails = [...learner.other_emails, email];

    return prisma.learner.update({
      where: { id: learnerId },
      data: {
        other_emails: updatedEmails,
      },
    });
  }

  /**
   * Primary contact verification session methods
   */
  async createPrimaryContactVerificationSession(data: {
    learnerId: number;
    contactType: 'email' | 'phone';
    contactValue: string;
    otpHash: string;
    expiresAt: Date;
  }) {
    return prisma.verification_session.create({
      data: {
        session_type: 'primary_contact_change',
        learner_id: data.learnerId,
        contact_type: data.contactType,
        email: data.contactType === 'email' ? data.contactValue : null,
        phone: data.contactType === 'phone' ? data.contactValue : null,
        otp_hash: data.otpHash,
        expires_at: data.expiresAt,
      },
    });
  }

  async findPrimaryContactVerificationSessionById(sessionId: string) {
    return prisma.verification_session.findUnique({
      where: { id: sessionId },
    });
  }

  async markPrimaryContactVerificationSessionAsVerified(sessionId: string) {
    return prisma.verification_session.update({
      where: { id: sessionId },
      data: {
        is_verified: true,
        verified_at: new Date(),
      },
    });
  }

  async updateLearnerPrimaryEmail(learnerId: number, email: string): Promise<learner> {
    return prisma.learner.update({
      where: { id: learnerId },
      data: { email },
    });
  }

  async updateLearnerPrimaryPhone(learnerId: number, phone: string): Promise<learner> {
    return prisma.learner.update({
      where: { id: learnerId },
      data: { phone },
    });
  }
  async getDashboardStats(learnerId: number) {
    const [totalCredentials, recentCredentials, allCredentials] = await Promise.all([
      prisma.credential.count({
        where: { learner_id: learnerId, status: 'issued' },
      }),
      prisma.credential.findMany({
        where: { learner_id: learnerId, status: 'issued' },
        orderBy: { issued_at: 'desc' },
        take: 3,
        include: {
          issuer: {
            select: {
              name: true,
              logo_url: true,
            },
          },
        },
      }),
      prisma.credential.findMany({
        where: { learner_id: learnerId, status: 'issued' },
        select: {
          metadata: true
        }
      })
    ]);

    // Calculate top skills and other stats
    const skillCounts: Record<string, number> = {};
    let nsqfAlignedCount = 0;
    let totalSkillsVerified = 0;

    allCredentials.forEach((cred: any) => {
      const metadata = cred.metadata as any;
      const aiData = metadata?.ai_extracted || {};
      const nosData = metadata?.nos_data || aiData?.nos_data;
      const nsqfAlignment = aiData?.nsqf_alignment || {};

      // Check for NSQF alignment
      if (nosData?.qp_code || nsqfAlignment?.nsqf_level || aiData?.nsqf?.level) {
        nsqfAlignedCount++;
      }

      const skills = aiData?.skills || [];
      if (Array.isArray(skills)) {
        totalSkillsVerified += skills.length;
        skills.forEach((skill: any) => {
          // Handle both string and object formats (SkillExtraction schema)
          const skillName = typeof skill === 'string' ? skill : skill?.name;

          if (skillName && typeof skillName === 'string') {
            skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
          }
        });
      }
    });

    const topSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));

    return {
      totalCredentials,
      recentCredentials,
      topSkills,
      nsqfAlignedCount,
      totalSkillsVerified
    };
  }
  async getCredentialById(credentialId: string) {
    return prisma.credential.findUnique({
      where: { id: credentialId },
      include: {
        issuer: {
          select: {
            name: true,
            logo_url: true,
            website_url: true,
            email: true,
          },
        },
      },
    });
  }
  async getLearnerCredentials(
    learnerId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    issuerId?: number,
    certificateTitle?: string,
    tags?: string[],
    startDate?: Date,
    endDate?: Date,
    sortBy?: string
  ) {
    const skip = (page - 1) * limit;
    const where: any = {
      learner_id: learnerId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (issuerId) {
      where.issuer_id = issuerId;
    }

    if (certificateTitle) {
      where.certificate_title = { contains: certificateTitle, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.issued_at = {};
      if (startDate) where.issued_at.gte = startDate;
      if (endDate) where.issued_at.lte = endDate;
    }

    if (tags && tags.length > 0) {
      const tagConditions = tags.flatMap(t => [
          { sector: { contains: t, mode: 'insensitive' } },
          { tags: { array_contains: t } }
      ]);
      where.OR = tagConditions;
    }

    if (search) {
      // If we already have an OR for tag, we need to be careful not to overwrite it
      // We can use AND to combine them
      const searchCondition = {
        OR: [
            { certificate_title: { contains: search, mode: 'insensitive' } },
            { issuer: { name: { contains: search, mode: 'insensitive' } } },
        ]
      };

      if (where.OR) {
        // If we have tags filter, we want (Tags Condition) AND (Search Condition)
        // But Prisma 'where' structure with top-level OR and AND can be tricky.
        // If we assign where.AND = [searchCondition], it preserves the top-level where.OR (Tags)
        // effective query: (Tag1 OR Tag2) AND (Search1 OR Search2)
        // This is usually what we want.
        
        // However, we must be careful if where.AND acts as an override or merge.
        // In Prisma, 'AND' is an array. We should safely append if it exists (though here it doesn't).
        where.AND = [
            searchCondition
        ];
      } else {
        where.OR = searchCondition.OR;
      }
    }

    let orderBy: any = { issued_at: 'desc' };
    if (sortBy === 'max_hr_desc') {
        orderBy = { max_hr: 'desc' };
    } else if (sortBy === 'min_hr_asc') {
        orderBy = { min_hr: 'asc' };
    }

    const [total, credentials] = await Promise.all([
      prisma.credential.count({ where }),
      prisma.credential.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          issuer: {
            select: {
              id: true,
              name: true,
              logo_url: true,
            },
          },
        },
      }),
    ]);

    return {
      data: credentials,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async isEmailUsedAsSecondary(email: string): Promise<boolean> {
    const learner = await prisma.learner.findFirst({
      where: {
        other_emails: {
          has: email
        }
      }
    });
    return !!learner;
  }

  async claimCredentials(learnerId: number, email: string) {
    return prisma.credential.updateMany({
      where: {
        learner_email: {
          equals: email,
          mode: 'insensitive',
        },
        status: 'unclaimed',
      },
      data: {
        learner_id: learnerId,
        status: 'issued',
      },
    });
  }
}

export const learnerRepository = new LearnerRepository();
