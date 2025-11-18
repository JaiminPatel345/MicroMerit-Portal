import { learnerRepository } from './repository';
import { hashPassword, comparePassword } from '../../utils/bcrypt';
import { generateTokens, TokenResponse, verifyRefreshToken } from '../../utils/jwt';
import { learner } from '@prisma/client';
import { LearnerRegistrationInput, LearnerLoginInput, UpdateLearnerProfileInput } from './schema';
import { logger } from '../../utils/logger';

export interface LearnerResponse {
  id: number;
  email?: string | null;
  phone?: string | null;
  profileFolder?: string | null;
  profileUrl?: string | null;
  external_digilocker_id?: string | null;
  status: string;
  other_emails: string[];
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
  async updateProfile(learnerId: number, data: UpdateLearnerProfileInput): Promise<LearnerResponse> {
    // Check if email is being updated and already exists
    if (data.email) {
      const existingLearner = await learnerRepository.findByEmail(data.email);
      if (existingLearner && existingLearner.id !== learnerId) {
        throw new Error('Email is already in use');
      }
    }

    // Check if phone is being updated and already exists
    if (data.phone) {
      const existingLearner = await learnerRepository.findByPhone(data.phone);
      if (existingLearner && existingLearner.id !== learnerId) {
        throw new Error('Phone number is already in use');
      }
    }

    const learner = await learnerRepository.update(learnerId, data);
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

    // Add email to other_emails
    await learnerRepository.addEmailToOtherEmails(learnerId, session.email);

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
    await learnerRepository.updateLearnerPrimaryEmail(learnerId, session.contact_value);

    logger.info('Primary email added to learner account', { learnerId, email: session.contact_value });

    return {
      email: session.contact_value,
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
    await sendOTP('sms', phone, otp);

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
    await learnerRepository.updateLearnerPrimaryPhone(learnerId, session.contact_value);

    logger.info('Primary phone added to learner account', { learnerId, phone: session.contact_value });

    return {
      phone: session.contact_value,
      message: 'Primary phone added successfully',
    };
  }
}

export const learnerService = new LearnerService();
