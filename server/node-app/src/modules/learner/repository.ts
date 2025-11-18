import { prisma } from '../../utils/prisma';
import { learner } from '@prisma/client';

export interface CreateLearnerDTO {
  email?: string;
  phone?: string;
  hashed_password?: string;
  profileFolder?: string;
  profileUrl?: string;
  external_digilocker_id?: string;
  other_emails?: string[];
}

export interface UpdateLearnerDTO {
  email?: string;
  phone?: string;
  profileFolder?: string;
  profileUrl?: string;
  external_digilocker_id?: string;
  other_emails?: string[];
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
}

export const learnerRepository = new LearnerRepository();
