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
  }): Promise<issuer[]> {
    return prisma.issuer.findMany({
      where: filters,
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
}

export const issuerRepository = new IssuerRepository();
