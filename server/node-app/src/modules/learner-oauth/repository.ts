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
    dob?: Date;
    gender?: string;
  }) {
    return prisma.learner.create({
      data: {
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

  /**
   * Create OAuth session for new users  
   * Stores their OAuth profile data until they complete registration
   */
  async createOAuthSession(data: {
    email: string;
    googleProfileUrl?: string;
    googleName?: string;
    loginMethod: string;
  }) {
    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.verification_session.create({
      data: {
        session_type: 'oauth_registration',
        email: data.email,
        otp_hash: '', // Not needed for OAuth
        is_verified: true, // OAuth is pre-verified
        verified_at: new Date(),
        metadata: {
          loginMethod: data.loginMethod,
          googleName: data.googleName,
          googleProfileUrl: data.googleProfileUrl,
        },
        expires_at: expiresAt,
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

  /**
   * Claim credentials for a learner
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
}
