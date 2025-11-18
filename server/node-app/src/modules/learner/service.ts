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
}

export const learnerService = new LearnerService();
