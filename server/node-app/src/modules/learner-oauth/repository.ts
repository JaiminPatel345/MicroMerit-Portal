import { prisma } from '../../utils/prisma';

export class OAuthRepository {
  /**
   * Find learner by email
   */
  async findLearnerByEmail(email: string) {
    return prisma.learner.findUnique({
      where: { email },
    });
  }

  /**
   * Find learner by phone
   */
  async findLearnerByPhone(phone: string) {
    return prisma.learner.findUnique({
      where: { phone },
    });
  }

  /**
   * Find learner by DigiLocker ID
   */
  async findLearnerByDigilockerId(digilockerId: string) {
    return prisma.learner.findFirst({
      where: { external_digilocker_id: digilockerId },
    });
  }

  /**
   * Create a new learner
   */
  async createLearner(data: {
    email?: string;
    phone?: string;
    hashedPassword?: string;
    profileUrl?: string;
    otherEmails?: string[];
    externalDigilockerId?: string;
  }) {
    return prisma.learner.create({
      data: {
        email: data.email,
        phone: data.phone,
        hashed_password: data.hashedPassword,
        profileUrl: data.profileUrl,
        other_emails: data.otherEmails || [],
        external_digilocker_id: data.externalDigilockerId,
      },
    });
  }

  /**
   * Update learner profile
   */
  async updateLearner(
    id: number,
    data: {
      profileUrl?: string;
      externalDigilockerId?: string;
    }
  ) {
    return prisma.learner.update({
      where: { id },
      data: {
        profileUrl: data.profileUrl,
        external_digilocker_id: data.externalDigilockerId,
      },
    });
  }
}
