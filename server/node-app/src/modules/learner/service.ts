import { learnerRepository } from './repository';
import { hashPassword, comparePassword } from '../../utils/bcrypt';
import { generateTokens, TokenResponse, verifyRefreshToken } from '../../utils/jwt';
import { learner } from '@prisma/client';
import { LearnerRegistrationInput, LearnerLoginInput, UpdateLearnerProfileInput } from './schema';
import { logger } from '../../utils/logger';
import { handleProfilePhotoFileUpload } from '../../utils/imageUpload';
import { aiService } from '../ai/ai.service';
import { prisma } from '../../utils/prisma';

export interface LearnerResponse {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  profileFolder?: string | null;
  profileUrl?: string | null;
  external_digilocker_id?: string | null;
  status: string;
  other_emails: string[];
  dob?: Date | null;
  gender?: string | null;
  created_at: Date;
}

export class LearnerService {
  /**
   * Sanitize learner data (remove password hash)
   */
  private sanitizeLearner(learner: learner): LearnerResponse {
    const { hashed_password, ...sanitized } = learner;
    return sanitized;
  }

  /**
   * Register a new learner
   */
  async register(data: LearnerRegistrationInput): Promise<{ learner: LearnerResponse; tokens: TokenResponse }> {
    // Check if learner already exists
    if (data.email) {
      const existingLearner = await learnerRepository.findByEmail(data.email);
      if (existingLearner) {
        throw new Error('Learner with this email already exists');
      }

      const isSecondary = await learnerRepository.isEmailUsedAsSecondary(data.email);
      if (isSecondary) {
        throw new Error('Email is already registered as a secondary email');
      }
    }

    if (data.phone) {
      const existingLearner = await learnerRepository.findByPhone(data.phone);
      if (existingLearner) {
        throw new Error('Learner with this phone already exists');
      }
    }

    // Hash password
    const hashed_password = await hashPassword(data.password);

    // Create learner
    const learner = await learnerRepository.create({
      email: data.email,
      phone: data.phone,
      hashed_password,
      profileFolder: data.profileFolder,
      profileUrl: data.profileUrl,
      external_digilocker_id: data.external_digilocker_id,
      other_emails: data.other_emails || [],
      dob: data.dob,
      gender: data.gender,
    });

    logger.info('Learner registered', { learnerId: learner.id, email: learner.email, phone: learner.phone });

    // Generate tokens
    const tokens = generateTokens({
      id: learner.id,
      email: learner.email || learner.phone || `learner_${learner.id}`,
      role: 'learner',
    });

    return {
      learner: this.sanitizeLearner(learner),
      tokens,
    };
  }

  /**
   * Login a learner
   */
  async login(data: LearnerLoginInput): Promise<{ learner: LearnerResponse; tokens: TokenResponse }> {
    // Find learner
    let learner: learner | null = null;

    if (data.email) {
      learner = await learnerRepository.findByEmail(data.email);
    } else if (data.phone) {
      learner = await learnerRepository.findByPhone(data.phone);
    }

    if (!learner || !learner.hashed_password) {
      throw new Error('Invalid credentials');
    }

    // Check if learner is active
    if (learner.status !== 'active') {
      throw new Error(`Account is ${learner.status}`);
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, learner.hashed_password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    logger.info('Learner logged in', { learnerId: learner.id, email: learner.email, phone: learner.phone });


    // Generate tokens
    const tokens = generateTokens({
      id: learner.id,
      email: learner.email || learner.phone || `learner_${learner.id}`,
      role: 'learner',
    });

    return {
      learner: this.sanitizeLearner(learner),
      tokens,
    };
  }

  /**
   * Refresh tokens
   */
  async refresh(refreshToken: string): Promise<TokenResponse> {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      // Verify learner still exists and is valid
      const learner = await learnerRepository.findById(decoded.id);
      if (!learner) {
        throw new Error('Learner not found');
      }

      if (learner.status !== 'active') {
        throw new Error('Account is not active');
      }

      // Generate new tokens
      const tokens = generateTokens({
        id: learner.id,
        email: learner.email || learner.phone || `learner_${learner.id}`,
        role: 'learner',
      });

      return tokens;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Get learner profile
   */
  async getProfile(learnerId: number): Promise<LearnerResponse> {
    const learner = await learnerRepository.findById(learnerId);
    if (!learner) {
      throw new Error('Learner not found');
    }

    return this.sanitizeLearner(learner);
  }

  /**
   * Update learner profile
   */
  async updateProfile(
    learnerId: number,
    data: UpdateLearnerProfileInput,
    profilePhotoFile?: Express.Multer.File
  ): Promise<LearnerResponse> {
    // Check if email is being updated and already exists
    if (data.email) {
      const existingLearner = await learnerRepository.findByEmail(data.email);
      if (existingLearner && existingLearner.id !== learnerId) {
        throw new Error('Email is already in use');
      }

      const isSecondary = await learnerRepository.isEmailUsedAsSecondary(data.email);
      if (isSecondary) {
        throw new Error('Email is already registered as a secondary email');
      }
    }

    // Check if phone is being updated and already exists
    if (data.phone) {
      const existingLearner = await learnerRepository.findByPhone(data.phone);
      if (existingLearner && existingLearner.id !== learnerId) {
        throw new Error('Phone number is already in use');
      }
    }

    // Handle profile photo upload (multipart file upload)
    let profileUrl: string | undefined;
    if (profilePhotoFile) {
      try {
        profileUrl = await handleProfilePhotoFileUpload(profilePhotoFile, learnerId);
        logger.info('Profile photo updated', { learnerId, hasPhoto: !!profileUrl });
      } catch (error: any) {
        logger.error('Profile photo upload failed during update', { learnerId, error: error.message });
        throw new Error(`Profile photo upload failed: ${error.message}`);
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.dob !== undefined) updateData.dob = new Date(data.dob);
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (profileUrl !== undefined) updateData.profileUrl = profileUrl;

    const learner = await learnerRepository.update(learnerId, updateData);
    logger.info('Learner profile updated', { learnerId });
    return this.sanitizeLearner(learner);
  }

  /**
   * Request to add email (Step 1)
   */
  async requestAddEmail(learnerId: number, email: string): Promise<{ sessionId: string; message: string; expiresAt: Date }> {
    // Check if learner exists
    const learner = await learnerRepository.findById(learnerId);
    if (!learner) {
      throw new Error('Learner not found');
    }

    // Check if email is already registered as primary email for any user
    const existingLearner = await learnerRepository.findByEmail(email);
    if (existingLearner) {
      throw new Error('Email is already registered');
    }

    // Check if email is already in learner's other_emails
    const isAlreadyAdded = await learnerRepository.isEmailAlreadyAdded(learnerId, email);
    if (isAlreadyAdded) {
      throw new Error('Email is already added to your account');
    }

    // Check if email is used as secondary email by any user
    const isUsedAsSecondary = await learnerRepository.isEmailUsedAsSecondary(email);
    if (isUsedAsSecondary) {
      throw new Error('Email is already registered as a secondary email');
    }

    // Generate OTP
    const { generateOTP, hashOTP, getOTPExpiry } = require('../../utils/otp');
    const { sendOTP } = require('../../utils/notification');

    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);
    const expiresAt = getOTPExpiry();

    // Create email verification session
    const session = await learnerRepository.createEmailVerificationSession({
      learnerId,
      email,
      otpHash,
      expiresAt,
    });

    // Send OTP to email
    await sendOTP('email', email, otp);

    logger.info('Email addition OTP sent', { learnerId, email, sessionId: session.id });

    return {
      sessionId: session.id,
      message: 'OTP sent to email',
      expiresAt: session.expires_at,
    };
  }

  /**
   * Verify email OTP and add to other_emails (Step 2)
   */
  async verifyEmailOTP(learnerId: number, sessionId: string, otp: string): Promise<{ email: string; message: string }> {
    // Find session
    const session = await learnerRepository.findEmailVerificationSessionById(sessionId);
    if (!session) {
      throw new Error('Invalid session ID');
    }

    // Verify session belongs to learner
    if (session.learner_id !== learnerId) {
      throw new Error('Unauthorized access to session');
    }

    // Check if already verified
    if (session.is_verified) {
      throw new Error('Session already verified');
    }

    // Check if expired
    if (new Date() > session.expires_at) {
      throw new Error('OTP expired');
    }

    // Verify OTP
    const { verifyOTP: verifyOTPUtil } = require('../../utils/otp');
    const isValid = await verifyOTPUtil(otp, session.otp_hash);
    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    // Mark session as verified
    await learnerRepository.markEmailVerificationSessionAsVerified(sessionId);

    // Validate email is present
    if (!session.email) {
      throw new Error('Email not found in session');
    }

    // Add email to other_emails
    await learnerRepository.addEmailToOtherEmails(learnerId, session.email);

    // Claim any pre-issued (unclaimed) credentials for this email
    await learnerRepository.claimCredentials(learnerId, session.email);

    logger.info('Email added to learner account', { learnerId, email: session.email });

    return {
      email: session.email,
      message: 'Email added successfully',
    };
  }

  /**
   * Request to add primary email (for learners who registered with phone)
   */
  async requestAddPrimaryEmail(learnerId: number, email: string): Promise<{ sessionId: string; message: string; expiresAt: Date }> {
    // Check if learner exists
    const learner = await learnerRepository.findById(learnerId);
    if (!learner) {
      throw new Error('Learner not found');
    }

    // Check if learner already has primary email
    if (learner.email) {
      throw new Error('Primary email already exists. Use add-email endpoint to add additional emails.');
    }

    // Check if email is already registered
    const existingLearner = await learnerRepository.findByEmail(email);
    if (existingLearner) {
      throw new Error('Email is already registered');
    }

    const isSecondary = await learnerRepository.isEmailUsedAsSecondary(email);
    if (isSecondary) {
      throw new Error('Email is already registered as a secondary email');
    }

    // Generate OTP
    const { generateOTP, hashOTP, getOTPExpiry } = require('../../utils/otp');
    const { sendOTP } = require('../../utils/notification');

    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);
    const expiresAt = getOTPExpiry();

    // Create verification session
    const session = await learnerRepository.createPrimaryContactVerificationSession({
      learnerId,
      contactType: 'email',
      contactValue: email,
      otpHash,
      expiresAt,
    });

    // Send OTP to email
    await sendOTP('email', email, otp);

    logger.info('Primary email addition OTP sent', { learnerId, email, sessionId: session.id });

    return {
      sessionId: session.id,
      message: 'OTP sent to email',
      expiresAt: session.expires_at,
    };
  }

  /**
   * Verify primary email OTP
   */
  async verifyPrimaryEmailOTP(learnerId: number, sessionId: string, otp: string): Promise<{ email: string; message: string }> {
    // Find session
    const session = await learnerRepository.findPrimaryContactVerificationSessionById(sessionId);
    if (!session) {
      throw new Error('Invalid session ID');
    }

    // Verify session belongs to learner
    if (session.learner_id !== learnerId) {
      throw new Error('Unauthorized access to session');
    }

    // Verify contact type
    if (session.contact_type !== 'email') {
      throw new Error('Invalid session type');
    }

    // Check if already verified
    if (session.is_verified) {
      throw new Error('Session already verified');
    }

    // Check if expired
    if (new Date() > session.expires_at) {
      throw new Error('OTP expired');
    }

    // Verify OTP
    const { verifyOTP: verifyOTPUtil } = require('../../utils/otp');
    const isValid = await verifyOTPUtil(otp, session.otp_hash);
    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    // Mark session as verified
    await learnerRepository.markPrimaryContactVerificationSessionAsVerified(sessionId);

    // Update learner's primary email
    await learnerRepository.updateLearnerPrimaryEmail(learnerId, session.email!);

    logger.info('Primary email added to learner account', { learnerId, email: session.email });

    return {
      email: session.email!,
      message: 'Primary email added successfully',
    };
  }

  /**
   * Request to add primary phone (for learners who registered with email)
   */
  async requestAddPrimaryPhone(learnerId: number, phone: string): Promise<{ sessionId: string; message: string; expiresAt: Date }> {
    // Check if learner exists
    const learner = await learnerRepository.findById(learnerId);
    if (!learner) {
      throw new Error('Learner not found');
    }

    // Check if learner already has primary phone
    if (learner.phone) {
      throw new Error('Primary phone already exists.');
    }

    // Check if phone is already registered
    const existingLearner = await learnerRepository.findByPhone(phone);
    if (existingLearner) {
      throw new Error('Phone is already registered');
    }

    // Generate OTP
    const { generateOTP, hashOTP, getOTPExpiry } = require('../../utils/otp');
    const { sendOTP } = require('../../utils/notification');

    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);
    const expiresAt = getOTPExpiry();

    // Create verification session
    const session = await learnerRepository.createPrimaryContactVerificationSession({
      learnerId,
      contactType: 'phone',
      contactValue: phone,
      otpHash,
      expiresAt,
    });

    // Send OTP to phone
    await sendOTP('phone', phone, otp);

    logger.info('Primary phone addition OTP sent', { learnerId, phone, sessionId: session.id });

    return {
      sessionId: session.id,
      message: 'OTP sent to phone',
      expiresAt: session.expires_at,
    };
  }

  /**
   * Verify primary phone OTP
   */
  async verifyPrimaryPhoneOTP(learnerId: number, sessionId: string, otp: string): Promise<{ phone: string; message: string }> {
    // Find session
    const session = await learnerRepository.findPrimaryContactVerificationSessionById(sessionId);
    if (!session) {
      throw new Error('Invalid session ID');
    }

    // Verify session belongs to learner
    if (session.learner_id !== learnerId) {
      throw new Error('Unauthorized access to session');
    }

    // Verify contact type
    if (session.contact_type !== 'phone') {
      throw new Error('Invalid session type');
    }

    // Check if already verified
    if (session.is_verified) {
      throw new Error('Session already verified');
    }

    // Check if expired
    if (new Date() > session.expires_at) {
      throw new Error('OTP expired');
    }

    // Verify OTP
    const { verifyOTP: verifyOTPUtil } = require('../../utils/otp');
    const isValid = await verifyOTPUtil(otp, session.otp_hash);
    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    // Mark session as verified
    await learnerRepository.markPrimaryContactVerificationSessionAsVerified(sessionId);

    // Update learner's primary phone
    await learnerRepository.updateLearnerPrimaryPhone(learnerId, session.phone!);

    logger.info('Primary phone added to learner account', { learnerId, phone: session.phone });

    return {
      phone: session.phone!,
      message: 'Primary phone added successfully',
    };
  }

  /**
   * Get QR payload for a credential
   */
  async getCredentialQRPayload(learnerId: number, credentialId: string): Promise<{
    credential_id: string;
    ipfs_cid: string;
    tx_hash: string;
    data_hash: string;
  }> {
    // Import prisma to query credential
    const { prisma } = require('../../utils/prisma');
    const { NotFoundError } = require('../../utils/errors');

    // Find the credential
    const credential = await prisma.credential.findUnique({
      where: { credential_id: credentialId },
    });

    if (!credential) {
      throw new NotFoundError('Credential not found', 404, 'CREDENTIAL_NOT_FOUND');
    }

    // Verify the credential belongs to this learner
    if (credential.learner_id !== learnerId) {
      throw new NotFoundError('Credential not found', 404, 'CREDENTIAL_NOT_FOUND');
    }

    // Return QR payload
    return {
      credential_id: credential.credential_id,
      ipfs_cid: credential.ipfs_cid || '',
      tx_hash: credential.tx_hash || '',
      data_hash: credential.data_hash,
    };
  }
  /**
   * Get learner dashboard data
   */
  async getDashboard(learnerId: number) {
    const [stats, learner] = await Promise.all([
      learnerRepository.getDashboardStats(learnerId),
      learnerRepository.findById(learnerId)
    ]);

    if (!learner) {
      throw new Error('Learner not found');
    }

    // Calculate profile completion
    let completion = 0;
    if (learner.name) completion += 20;
    if (learner.email || learner.phone) completion += 20;
    if (learner.profileUrl) completion += 20;
    if (learner.dob) completion += 20;
    if (learner.gender) completion += 20;

    // Fallback: If no top skills from credentials (e.g. dummy users), try seeded profile
    if (!stats.topSkills || stats.topSkills.length === 0) {
        const profile = await prisma.learnerSkillProfile.findUnique({ where: { learner_id: learnerId } });
        if (profile && profile.data) {
             const data: any = profile.data;
             if (data.topSkills && Array.isArray(data.topSkills)) {
                  stats.topSkills = data.topSkills.map((s: any) => ({
                      skill: typeof s === 'string' ? s : s.skill,
                      count: 1 // Dummy count for display
                  }));
                  // Update total verified count approximation if zero
                  if (stats.totalSkillsVerified === 0) {
                      stats.totalSkillsVerified = (data.allSkills?.length) || stats.topSkills.length;
                  }
             }
        }
    }

    return {
      ...stats,
      profileCompletion: completion,
      // Pass through real stats from repository
      nsqfAlignedCount: stats.nsqfAlignedCount,
      totalSkillsVerified: stats.totalSkillsVerified
    };
  }
  /**
   * Get single credential details
   */
  async getCredential(learnerId: number, credentialId: string) {
    const credential = await learnerRepository.getCredentialById(credentialId);

    if (!credential) {
      throw new Error('Credential not found');
    }

    if (credential.learner_id !== learnerId) {
      throw new Error('Unauthorized access to credential');
    }

    return credential;
  }
  /**
   * Get learner credentials with pagination
   */
  async getMyCredentials(
    learnerId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    tags?: string[],
    startDate?: Date,
    endDate?: Date,
    sortBy?: string
  ) {
    return learnerRepository.getLearnerCredentials(learnerId, page, limit, search, status, undefined, undefined, tags, startDate, endDate, sortBy);
  }
  /**
   * Get public profile
   */
  async getPublicProfile(idOrSlug: string, filters?: { issuerId?: number; certificateTitle?: string; page?: number; limit?: number }): Promise<any> {
    const learnerId = parseInt(idOrSlug, 10);
    if (isNaN(learnerId)) {
      throw new Error('Invalid learner ID');
    }

    const learner = await learnerRepository.findById(learnerId);
    if (!learner) {
      throw new Error('Learner not found');
    }

    // Get public credentials (issued only)
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const credentialsResult = await learnerRepository.getLearnerCredentials(
      learnerId,
      page,
      limit,
      undefined,
      'issued',
      filters?.issuerId,
      filters?.certificateTitle
    );

    // Get stats for skills
    const stats = await learnerRepository.getDashboardStats(learnerId);

    // Get distinct issuers for filter dropdown
    const distinctIssuers = await prisma.credential.findMany({
      where: { learner_id: learnerId, status: 'issued' },
      select: { issuer: { select: { id: true, name: true } } },
      distinct: ['issuer_id']
    }).then(res => res.map(r => r.issuer));

    return {
      learner: {
        id: learner.id,
        name: learner.name,
        email: learner.email,
        profileUrl: learner.profileUrl,
        joinedAt: learner.created_at,
      },
      certificates: credentialsResult.data,
      pagination: credentialsResult.pagination,
      filters: {
        issuers: distinctIssuers
      },
      stats: {
        totalCertificates: stats.totalCredentials,
        topSkills: stats.topSkills,
        trustScore: 92 // Mocked for now
      }
    };
  }
  /**
   * Get learner roadmap
   */
  async getRoadmap(learnerId: number) {
    let roadmap = await prisma.learnerRoadmap.findUnique({
      where: { learner_id: learnerId }
    });

    if (!roadmap) {
      // Trigger generation if not exists
      await this.updateLearnerAIProfile(learnerId);
      roadmap = await prisma.learnerRoadmap.findUnique({
        where: { learner_id: learnerId }
      });
    }

    return roadmap?.data || null;
  }

  /**
   * Get learner skill profile
   */
  async getSkillProfile(learnerId: number) {
    let profile = await prisma.learnerSkillProfile.findUnique({
      where: { learner_id: learnerId }
    });

    if (!profile) {
      // Trigger generation if not exists
      await this.updateLearnerAIProfile(learnerId);
      profile = await prisma.learnerSkillProfile.findUnique({
        where: { learner_id: learnerId }
      });
    }

    return profile?.data || null;
  }

  /**
   * Update learner AI profile (Roadmap & Skills)
   * Called after credential issuance
   */
  async updateLearnerAIProfile(learnerId: number) {
    try {
      // 1. Fetch all issued credentials
      const credentials = await prisma.credential.findMany({
        where: { learner_id: learnerId, status: 'issued' },
        select: {
          certificate_title: true,
          metadata: true,
          issued_at: true,
          issuer: { select: { name: true } }
        }
      });

      if (credentials.length === 0) return;

      // 2. Fetch learner profile
      const learner = await prisma.learner.findUnique({
        where: { id: learnerId },
        select: { id: true, name: true, email: true, phone: true } // Basic info
      });

      // 3. Generate Roadmap
      const roadmapData = await aiService.generateRoadmap(credentials, learner);
      if (roadmapData) {
        await prisma.learnerRoadmap.upsert({
          where: { learner_id: learnerId },
          update: { data: roadmapData },
          create: { learner_id: learnerId, data: roadmapData }
        });
      }

      // 4. Generate Skill Profile
      const skillProfileData = await aiService.generateSkillProfile(credentials);
      if (skillProfileData) {
        await prisma.learnerSkillProfile.upsert({
          where: { learner_id: learnerId },
          update: { data: skillProfileData },
          create: { learner_id: learnerId, data: skillProfileData }
        });
      }

      logger.info('Learner AI profile updated', { learnerId });

    } catch (error: any) {
      logger.error('Failed to update learner AI profile', { learnerId, error: error.message });
    }
  }
}

export const learnerService = new LearnerService();
