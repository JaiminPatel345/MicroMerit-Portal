import { prisma } from '../../utils/prisma';
import { issuer } from '@prisma/client';

export interface CreateIssuerDTO {
  name: string;
  official_domain?: string;
  website_url?: string;
  type: string;
  email: string;
  phone?: string;
  password_hash: string;
  contact_person_name?: string;
  contact_person_designation?: string;
  address?: string;
  kyc_document_url?: string;
  logo_url?: string;
}

export interface UpdateIssuerDTO {
  name?: string;
  official_domain?: string;
  website_url?: string;
  type?: string;
  phone?: string;
  contact_person_name?: string;
  contact_person_designation?: string;
  address?: string;
  kyc_document_url?: string;
  logo_url?: string;
}

export class IssuerRepository {
  async create(data: CreateIssuerDTO): Promise<issuer> {
    return prisma.issuer.create({
      data,
    });
  }

  async findById(id: number): Promise<issuer | null> {
    return prisma.issuer.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<issuer | null> {
    return prisma.issuer.findUnique({
      where: { email },
    });
  }

  async update(id: number, data: UpdateIssuerDTO): Promise<issuer> {
    return prisma.issuer.update({
      where: { id },
      data,
    });
  }

  async approve(id: number): Promise<issuer> {
    return prisma.issuer.update({
      where: { id },
      data: {
        status: 'approved',
        approved_at: new Date(),
        rejected_reason: null,
      },
    });
  }

  async reject(id: number, reason: string): Promise<issuer> {
    return prisma.issuer.update({
      where: { id },
      data: {
        status: 'rejected',
        rejected_reason: reason,
        approved_at: null,
      },
    });
  }

  async block(id: number, reason: string): Promise<issuer> {
    return prisma.issuer.update({
      where: { id },
      data: {
        is_blocked: true,
        blocked_reason: reason,
      },
    });
  }

  async unblock(id: number): Promise<issuer> {
    return prisma.issuer.update({
      where: { id },
      data: {
        is_blocked: false,
        blocked_reason: null,
      },
    });
  }

  async findAll(filters?: {
    status?: string;
    is_blocked?: boolean;
    source?: 'connector' | 'platform';
  }): Promise<issuer[]> {
    // Get connector issuer IDs from environment
    const connectorIssuerIds: number[] = [];
    if (process.env.NSDC_ISSUER_ID) connectorIssuerIds.push(parseInt(process.env.NSDC_ISSUER_ID, 10));
    if (process.env.UDEMY_ISSUER_ID) connectorIssuerIds.push(parseInt(process.env.UDEMY_ISSUER_ID, 10));
    if (process.env.JAIMIN_ISSUER_ID) connectorIssuerIds.push(parseInt(process.env.JAIMIN_ISSUER_ID, 10));

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.is_blocked !== undefined) where.is_blocked = filters.is_blocked;

    // Handle source filtering
    if (filters?.source === 'connector' && connectorIssuerIds.length > 0) {
      where.id = { in: connectorIssuerIds };
    } else if (filters?.source === 'platform' && connectorIssuerIds.length > 0) {
      where.id = { notIn: connectorIssuerIds };
    }

    return prisma.issuer.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Issuer registration session methods
   */
  async createRegistrationSession(data: {
    email: string;
    otpHash: string;
    expiresAt: Date;
    registrationData: any;
  }) {
    return prisma.verification_session.create({
      data: {
        session_type: 'issuer_registration',
        email: data.email,
        otp_hash: data.otpHash,
        expires_at: data.expiresAt,
        metadata: data.registrationData,
      },
    });
  }

  async findRegistrationSessionById(sessionId: string) {
    return prisma.verification_session.findUnique({
      where: { id: sessionId },
    });
  }

  async markRegistrationSessionAsVerified(sessionId: string) {
    return prisma.verification_session.update({
      where: { id: sessionId },
      data: {
        is_verified: true,
        verified_at: new Date(),
      },
    });
  }

  async getStats(issuerId: number) {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of month

    const [
      totalIssued,
      activeRecipients,
      topCertificates,
      statusDistribution,
      issuanceTrends,
      verificationTrends,
      totalVerificationsRes,
      learnerGrowth
    ] = await Promise.all([
      // 1. Total Issued
      prisma.credential.count({
        where: { issuer_id: issuerId },
      }),

      // 2. Active Recipients (Distinct emails)
      prisma.credential.groupBy({
        by: ['learner_email'],
        where: { issuer_id: issuerId },
      }).then(groups => groups.length),

      // 3. Top 5 Certificates
      prisma.credential.groupBy({
        by: ['certificate_title'],
        where: { issuer_id: issuerId },
        _count: { certificate_title: true },
        orderBy: {
          _count: {
            certificate_title: 'desc'
          }
        },
        take: 5,
      }),

      // 4. Status Distribution
      prisma.credential.groupBy({
        by: ['status'],
        where: { issuer_id: issuerId },
        _count: { status: true },
      }),

      // 5. Issuance Trends (Last 6 Months)
      prisma.$queryRaw`
        SELECT TO_CHAR(issued_at, 'Mon YYYY') as month,
               DATE_TRUNC('month', issued_at) as date,
               COUNT(*)::int as count
        FROM "Credential"
        WHERE issuer_id = ${issuerId}
          AND issued_at >= ${sixMonthsAgo}
        GROUP BY month, date
        ORDER BY date ASC
      `,

      // 6. Verification Trends (Last 6 Months)
      prisma.$queryRaw`
        SELECT TO_CHAR(l.created_at, 'Mon YYYY') as month,
               DATE_TRUNC('month', l.created_at) as date,
               COUNT(*)::int as count
        FROM employer_activity_log l
        JOIN "Credential" c ON l.credential_id = c.credential_id
        WHERE c.issuer_id = ${issuerId}
          AND l.activity_type = 'verify'
          AND l.created_at >= ${sixMonthsAgo}
        GROUP BY month, date
        ORDER BY date ASC
      `,

      // 7. Total Verifications
      prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM employer_activity_log l
        JOIN "Credential" c ON l.credential_id = c.credential_id
        WHERE c.issuer_id = ${issuerId}
          AND l.activity_type = 'verify'
      `,

      // 8. Learner Growth
      prisma.$queryRaw`
         SELECT TO_CHAR(first_seen, 'Mon YYYY') as month,
                DATE_TRUNC('month', first_seen) as date,
                COUNT(*)::int as count
         FROM (
            SELECT learner_email, MIN(issued_at) as first_seen
            FROM "Credential"
            WHERE issuer_id = ${issuerId}
            GROUP BY learner_email
         ) as sub
         WHERE first_seen >= ${sixMonthsAgo}
         GROUP BY month, date
         ORDER BY date ASC
       `
    ]);

    const totalVerificationsRaw = totalVerificationsRes as any[];
    const totalVerifications = totalVerificationsRaw[0]?.count || 0;

    return {
      summary: {
        totalIssued,
        activeRecipients,
        totalVerifications: Number(totalVerifications),
      },
      topCertificates: topCertificates.map(t => ({
        name: t.certificate_title,
        value: t._count.certificate_title
      })),
      statusDistribution: statusDistribution.map(s => ({
        name: s.status,
        value: s._count.status
      })),
      trends: issuanceTrends,
      verificationTrends,
      learnerGrowth
    };
  }

  /**
   * Phone verification session methods
   */
  async createPhoneVerificationSession(data: {
    issuerId: number;
    phone: string;
    otpHash: string;
    expiresAt: Date;
  }) {
    return prisma.verification_session.create({
      data: {
        session_type: 'issuer_phone_change',
        issuer_id: data.issuerId,
        phone: data.phone,
        contact_type: 'phone',
        otp_hash: data.otpHash,
        expires_at: data.expiresAt,
      },
    });
  }

  async findPhoneVerificationSessionById(sessionId: string) {
    return prisma.verification_session.findUnique({
      where: { id: sessionId },
    });
  }

  async markPhoneVerificationSessionAsVerified(sessionId: string) {
    return prisma.verification_session.update({
      where: { id: sessionId },
      data: {
        is_verified: true,
        verified_at: new Date(),
      },
    });
  }

  async updatePhone(issuerId: number, phone: string): Promise<issuer> {
    return prisma.issuer.update({
      where: { id: issuerId },
      data: { phone },
    });
  }
}

export const issuerRepository = new IssuerRepository();
