import { adminRepository } from './repository';
import { issuerRepository } from '../issuer/repository';
import { employerRepository } from '../employer/repository';
import { prisma } from '../../utils/prisma';
import { comparePassword } from '../../utils/bcrypt';
import { generateTokens, TokenResponse, verifyRefreshToken } from '../../utils/jwt';
import { admin, issuer } from '@prisma/client';
import { AdminLoginInput } from './schema';
import { logger } from '../../utils/logger';

export interface AdminResponse {
  id: number;
  email: string;
  created_at: Date;
}

export class AdminService {
  /**
   * Sanitize admin data (remove password hash)
   */
  private sanitizeAdmin(admin: admin): AdminResponse {
    const { password_hash, ...sanitized } = admin;
    return sanitized;
  }

  /**
   * Sanitize issuer data (remove password hash)
   */
  private sanitizeIssuer(issuer: issuer): Omit<issuer, 'password_hash'> {
    const { password_hash, ...sanitized } = issuer;
    return sanitized;
  }

  /**
   * Login an admin
   */
  async login(data: AdminLoginInput): Promise<{ admin: AdminResponse; tokens: TokenResponse }> {
    // Find admin
    const admin = await adminRepository.findByEmail(data.email);
    if (!admin) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, admin.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    logger.info('Admin logged in', { adminId: admin.id, email: admin.email });

    // Generate tokens
    const tokens = generateTokens({
      id: admin.id,
      email: admin.email,
      role: 'admin',
    });

    return {
      admin: this.sanitizeAdmin(admin),
      tokens,
    };
  }

  /**
   * Refresh tokens
   */
  async refresh(refreshToken: string): Promise<TokenResponse> {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      // Verify admin still exists
      const admin = await adminRepository.findById(decoded.id);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Generate new tokens
      const tokens = generateTokens({
        id: admin.id,
        email: admin.email,
        role: 'admin',
      });

      return tokens;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Get admin profile
   */
  async getProfile(adminId: number): Promise<AdminResponse> {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    return this.sanitizeAdmin(admin);
  }

  /**
   * Approve an issuer
   */
  async approveIssuer(adminId: number, issuerId: number): Promise<Omit<issuer, 'password_hash'>> {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    const issuer = await issuerRepository.findById(issuerId);
    if (!issuer) {
      throw new Error('Issuer not found');
    }

    if (issuer.status === 'approved') {
      throw new Error('Issuer is already approved');
    }

    const approvedIssuer = await issuerRepository.approve(issuerId);

    logger.info('Issuer approved', {
      adminId,
      adminEmail: admin.email,
      issuerId,
      issuerEmail: issuer.email,
    });

    return this.sanitizeIssuer(approvedIssuer);
  }

  /**
   * Reject an issuer
   */
  async rejectIssuer(adminId: number, issuerId: number, reason: string): Promise<Omit<issuer, 'password_hash'>> {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    const issuer = await issuerRepository.findById(issuerId);
    if (!issuer) {
      throw new Error('Issuer not found');
    }

    if (issuer.status === 'rejected') {
      throw new Error('Issuer is already rejected');
    }

    const rejectedIssuer = await issuerRepository.reject(issuerId, reason);

    logger.info('Issuer rejected', {
      adminId,
      adminEmail: admin.email,
      issuerId,
      issuerEmail: issuer.email,
      reason,
    });

    return this.sanitizeIssuer(rejectedIssuer);
  }

  /**
   * Block an issuer
   */
  async blockIssuer(adminId: number, issuerId: number, reason: string): Promise<Omit<issuer, 'password_hash'>> {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    const issuer = await issuerRepository.findById(issuerId);
    if (!issuer) {
      throw new Error('Issuer not found');
    }

    if (issuer.is_blocked) {
      throw new Error('Issuer is already blocked');
    }

    const blockedIssuer = await issuerRepository.block(issuerId, reason);

    logger.info('Issuer blocked', {
      adminId,
      adminEmail: admin.email,
      issuerId,
      issuerEmail: issuer.email,
      reason,
    });

    return this.sanitizeIssuer(blockedIssuer);
  }

  /**
   * Unblock an issuer
   */
  async unblockIssuer(adminId: number, issuerId: number): Promise<Omit<issuer, 'password_hash'>> {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    const issuer = await issuerRepository.findById(issuerId);
    if (!issuer) {
      throw new Error('Issuer not found');
    }

    if (!issuer.is_blocked) {
      throw new Error('Issuer is not blocked');
    }

    const unblockedIssuer = await issuerRepository.unblock(issuerId);

    logger.info('Issuer unblocked', {
      adminId,
      adminEmail: admin.email,
      issuerId,
      issuerEmail: issuer.email,
    });

    return this.sanitizeIssuer(unblockedIssuer);
  }

  /**
   * List all issuers with optional filters
   */
  async listIssuers(filters?: { status?: string; is_blocked?: boolean }): Promise<Omit<issuer, 'password_hash'>[]> {
    const issuers = await issuerRepository.findAll(filters);
    return issuers.map(issuer => this.sanitizeIssuer(issuer));
  }

  /**
   * List all learners with optional filters
   */
  async listLearners(filters?: {
    status?: string;
    search?: string;
  }): Promise<Omit<any, 'hashed_password'>[]> {
    const learners = await adminRepository.findAllLearners(filters);
    return learners.map(learner => {
      const { hashed_password, ...sanitized } = learner;
      return sanitized;
    });
  }

  /**
   * Get learner details by ID
   */
  async getLearnerDetails(learnerId: number) {
    const learner = await adminRepository.findLearnerById(learnerId);
    if (!learner) {
      throw new Error('Learner not found');
    }

    const { hashed_password, ...sanitizedLearner } = learner;

    // Sanitize issuer data in credentials
    const sanitizedCredentials = (sanitizedLearner as any).credentials?.map((cred: any) => ({
      ...cred,
      issuer: {
        ...cred.issuer,
      },
    }));

    return {
      ...sanitizedLearner,
      credentials: sanitizedCredentials || [],
    };
  }

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics() {
    const [platformStats, credentialStats, issuerStats, learnerStats, recentCredentials] =
      await Promise.all([
        adminRepository.getPlatformStats(),
        adminRepository.getCredentialStats(),
        adminRepository.getIssuerStats(),
        adminRepository.getLearnerStats(),
        adminRepository.getRecentCredentials(10),
      ]);

    // Sanitize recent credentials
    const sanitizedRecentCredentials = recentCredentials.map(cred => ({
      ...cred,
      issuer: cred.issuer
        ? {
          id: cred.issuer.id,
          name: cred.issuer.name,
          logo_url: cred.issuer.logo_url,
          type: cred.issuer.type,
        }
        : null,
      learner: cred.learner
        ? {
          id: cred.learner.id,
          name: cred.learner.name,
          email: cred.learner.email,
        }
        : null,
    }));

    return {
      overview: platformStats,
      credentials: credentialStats,
      issuers: issuerStats,
      learners: learnerStats,
      recentActivity: sanitizedRecentCredentials,
    };
  }

  /**
   * List all employers
   */
  async listEmployers(page: number, limit: number, status?: string, search?: string) {
    return employerRepository.findAll(page, limit, status, search);
  }

  /**
   * Approve an employer
   */
  async approveEmployer(id: number) {
    const employer = await employerRepository.findById(id);
    if (!employer) {
      throw new Error('Employer not found');
    }

    if (employer.status === 'approved') {
      throw new Error('Employer is already approved');
    }

    const approvedEmployer = await employerRepository.updateStatus(id, 'approved');

    // TODO: Send approval email

    return approvedEmployer;
  }

  /**
   * Reject an employer
   */
  async rejectEmployer(id: number, reason: string) {
    const employer = await employerRepository.findById(id);
    if (!employer) {
      throw new Error('Employer not found');
    }

    if (employer.status === 'rejected') {
      throw new Error('Employer is already rejected');
    }

    const rejectedEmployer = await employerRepository.updateStatus(id, 'rejected', reason);

    // TODO: Send rejection email with reason

    return rejectedEmployer;
  }
}

export const adminService = new AdminService();
