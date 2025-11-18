import { prisma } from '../../utils/prisma';
import { issuer_api_key } from '@prisma/client';

export interface CreateApiKeyDTO {
  issuer_id: number;
  name: string;
  api_key: string;
  rate_limit_per_minute?: number;
  expires_at?: Date;
  allowed_ips?: string;
}

export class ApiKeyRepository {
  async create(data: CreateApiKeyDTO): Promise<issuer_api_key> {
    return prisma.issuer_api_key.create({
      data,
    });
  }

  async findById(id: number): Promise<issuer_api_key | null> {
    return prisma.issuer_api_key.findUnique({
      where: { id },
      include: {
        issuer: true,
      },
    });
  }

  async findByApiKey(apiKey: string): Promise<issuer_api_key | null> {
    return prisma.issuer_api_key.findUnique({
      where: { api_key: apiKey },
      include: {
        issuer: true,
      },
    });
  }

  async findAllByIssuerId(issuerId: number): Promise<issuer_api_key[]> {
    return prisma.issuer_api_key.findMany({
      where: { issuer_id: issuerId },
      orderBy: { created_at: 'desc' },
    });
  }

  async revoke(id: number, reason: string): Promise<issuer_api_key> {
    return prisma.issuer_api_key.update({
      where: { id },
      data: {
        active: false,
        revoked_reason: reason,
      },
    });
  }

  async updateUsage(id: number): Promise<issuer_api_key> {
    return prisma.issuer_api_key.update({
      where: { id },
      data: {
        usage_count: { increment: 1 },
        last_used_at: new Date(),
      },
    });
  }

  async countActiveKeys(issuerId: number): Promise<number> {
    return prisma.issuer_api_key.count({
      where: {
        issuer_id: issuerId,
        active: true,
      },
    });
  }
}

export const apiKeyRepository = new ApiKeyRepository();
