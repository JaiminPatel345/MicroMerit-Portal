import { adminRepository } from './repository';
import { issuerRepository } from '../issuer/repository';
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
}

export const adminService = new AdminService();
