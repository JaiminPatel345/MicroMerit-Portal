import { prisma } from '../../utils/prisma';

export class RegistrationRepository {
  /**
   * Create a new registration session
   */
  async createSession(data: {
    email?: string;
    phone?: string;
    otpHash: string;
    verificationMethod: 'email' | 'phone';
    expiresAt: Date;
  }) {
    return prisma.verification_session.create({
      data: {
        session_type: 'learner_registration',
        email: data.email,
        phone: data.phone,
        otp_hash: data.otpHash,
        metadata: { verification_method: data.verificationMethod },
        expires_at: data.expiresAt,
      },
    });
  }

  /**
   * Find a registration session by ID
   */
  async findSessionById(sessionId: string) {
    return prisma.verification_session.findUnique({
      where: {
        id: sessionId,
      },
    });
  }

  /**
   * Mark session as verified
   */
  async markSessionAsVerified(sessionId: string) {
    return prisma.verification_session.update({
      where: { id: sessionId },
      data: {
        is_verified: true,
        verified_at: new Date(),
      },
    });
  }

  /**
   * Mark session as verified
   */
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

  /**
   * Delete old incomplete registration sessions for same contact
   * Allows user to re-register if they didn't complete step 3
   */
  async deleteIncompleteSessionsByContact(email?: string, phone?: string) {
    return prisma.verification_session.deleteMany({
      where: {
        session_type: 'learner_registration',
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
        ].filter(obj => Object.keys(obj).length > 0),
      },
    });
  }

  /**
   * Delete expired sessions (cleanup utility)
   */
  async deleteExpiredSessions(): Promise<number> {
    const result = await prisma.verification_session.deleteMany({
      where: {
        session_type: 'learner_registration',
        expires_at: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * Check if email or phone already registered
   */
  async isEmailRegistered(email: string): Promise<boolean> {
    const learner = await prisma.learner.findUnique({
      where: { email },
    });
    return !!learner;
  }

  async isPhoneRegistered(phone: string): Promise<boolean> {
    const learner = await prisma.learner.findUnique({
      where: { phone },
    });
    return !!learner;
  }

  /**
   * Create a new learner
   */
  async createLearner(data: {
    name?: string;
    email?: string;
    phone?: string;
    hashedPassword?: string;
    profileUrl?: string;
    otherEmails?: string[];
    externalDigilockerId?: string;
    dob?: Date;
    gender?: string;
  }): Promise<any> {
    return prisma.learner.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        hashed_password: data.hashedPassword,
        profileUrl: data.profileUrl,
        other_emails: data.otherEmails || [],
        external_digilocker_id: data.externalDigilockerId,
        dob: data.dob,
        gender: data.gender,
      },
    });
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
}
