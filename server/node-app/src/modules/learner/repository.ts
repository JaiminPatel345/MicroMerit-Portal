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
  dob?: Date;
  gender?: string;
}

export interface UpdateLearnerDTO {
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
}

export const learnerRepository = new LearnerRepository();
