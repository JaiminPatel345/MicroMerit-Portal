import { prisma } from '../../utils/prisma';
import { admin } from '@prisma/client';

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
}

export const adminRepository = new AdminRepository();
