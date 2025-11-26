import { prisma } from '../../utils/prisma';
import { admin, learner } from '@prisma/client';

export interface CreateAdminDTO {
  email: string;
  password_hash: string;
}

export class AdminRepository {
  async create(data: CreateAdminDTO): Promise<admin> {
    return prisma.admin.create({
      data,
    });
  }

  async findById(id: number): Promise<admin | null> {
    return prisma.admin.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<admin | null> {
    return prisma.admin.findUnique({
      where: { email },
    });
  }

  async findAll(): Promise<admin[]> {
    return prisma.admin.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Learner management methods
   */
  async findAllLearners(filters?: {
    status?: string;
    search?: string;
  }): Promise<learner[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.learner.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findLearnerById(id: number) {
    return prisma.learner.findUnique({
      where: { id },
      include: {
        credentials: {
          include: {
            issuer: {
              select: {
                id: true,
                name: true,
                email: true,
                logo_url: true,
                type: true,
              },
            },
          },
          orderBy: { issued_at: 'desc' },
        },
      },
    });
  }

  /**
   * Analytics methods
   */
  async getPlatformStats() {
    const [totalLearners, activeLearners, totalIssuers, approvedIssuers, totalCredentials] =
      await Promise.all([
        prisma.learner.count(),
        prisma.learner.count({ where: { status: 'active' } }),
        prisma.issuer.count(),
        prisma.issuer.count({ where: { status: 'approved', is_blocked: false } }),
        prisma.credential.count(),
      ]);

    return {
      totalLearners,
      activeLearners,
      totalIssuers,
      approvedIssuers,
      totalCredentials,
    };
  }

  async getCredentialStats() {
    const [issued, claimed, revoked] = await Promise.all([
      prisma.credential.count({ where: { status: 'issued' } }),
      prisma.credential.count({ where: { status: 'claimed' } }),
      prisma.credential.count({ where: { status: 'revoked' } }),
    ]);

    return { issued, claimed, revoked };
  }

  async getIssuerStats() {
    const [pending, approved, rejected, blocked] = await Promise.all([
      prisma.issuer.count({ where: { status: 'pending' } }),
      prisma.issuer.count({ where: { status: 'approved' } }),
      prisma.issuer.count({ where: { status: 'rejected' } }),
      prisma.issuer.count({ where: { is_blocked: true } }),
    ]);

    return { pending, approved, rejected, blocked };
  }

  async getLearnerStats() {
    const [active, inactive] = await Promise.all([
      prisma.learner.count({ where: { status: 'active' } }),
      prisma.learner.count({ where: { status: { not: 'active' } } }),
    ]);

    return { active, inactive, total: active + inactive };
  }

  async getRecentCredentials(limit: number = 10) {
    return prisma.credential.findMany({
      take: limit,
      orderBy: { issued_at: 'desc' },
      include: {
        issuer: {
          select: {
            id: true,
            name: true,
            logo_url: true,
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

export const adminRepository = new AdminRepository();
