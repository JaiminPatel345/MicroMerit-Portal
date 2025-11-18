import { issuerRepository } from './repository';
import { hashPassword, comparePassword } from '../../utils/bcrypt';
import { generateTokens, TokenResponse, verifyRefreshToken } from '../../utils/jwt';
import { issuer } from '@prisma/client';
import { IssuerRegistrationInput, IssuerLoginInput, UpdateIssuerProfileInput } from './schema';
import { logger } from '../../utils/logger';

export interface IssuerResponse {
  id: number;
  name: string;
  official_domain?: string | null;
  website_url?: string | null;
  type: string;
  email: string;
  phone?: string | null;
  contact_person_name?: string | null;
  contact_person_designation?: string | null;
  address?: string | null;
  kyc_document_url?: string | null;
  logo_url?: string | null;
  status: string;
  approved_at?: Date | null;
  rejected_reason?: string | null;
  is_blocked: boolean;
  blocked_reason?: string | null;
  created_at: Date;
}

export class IssuerService {
  /**
   * Sanitize issuer data (remove password hash)
   */
  private sanitizeIssuer(issuer: issuer): IssuerResponse {
    const { password_hash, ...sanitized } = issuer;
    return sanitized;
  }

  /**
   * Register a new issuer
   */
  async register(data: IssuerRegistrationInput): Promise<{ issuer: IssuerResponse; tokens: TokenResponse }> {
    // Check if issuer already exists
    const existingIssuer = await issuerRepository.findByEmail(data.email);
    if (existingIssuer) {
      throw new Error('Issuer with this email already exists');
    }

    // Hash password
    const password_hash = await hashPassword(data.password);

    // Create issuer
    const issuer = await issuerRepository.create({
      name: data.name,
      official_domain: data.official_domain,
      website_url: data.website_url,
      type: data.type,
      email: data.email,
      phone: data.phone,
      password_hash,
      contact_person_name: data.contact_person_name,
      contact_person_designation: data.contact_person_designation,
      address: data.address,
      kyc_document_url: data.kyc_document_url,
      logo_url: data.logo_url,
    });

    logger.info('Issuer registered', { issuerId: issuer.id, email: issuer.email });

    // Generate tokens
    const tokens = generateTokens({
      id: issuer.id,
      email: issuer.email,
      role: 'issuer',
    });

    return {
      issuer: this.sanitizeIssuer(issuer),
      tokens,
    };
  }

  /**
   * Login an issuer
   */
  async login(data: IssuerLoginInput): Promise<{ issuer: IssuerResponse; tokens: TokenResponse }> {
    // Find issuer
    const issuer = await issuerRepository.findByEmail(data.email);
    if (!issuer || !issuer.password_hash) {
      throw new Error('Invalid email or password');
    }

    // Check if issuer is blocked
    if (issuer.is_blocked) {
      throw new Error(`Account is blocked. Reason: ${issuer.blocked_reason || 'Contact support'}`);
    }

    // For now, we'll allow pending issuers to login but they won't be able to use API keys
    // You can uncomment this if you want to prevent login for pending issuers
    // if (issuer.status === 'pending') {
    //   throw new Error('Account is pending approval');
    // }

    if (issuer.status === 'rejected') {
      throw new Error(`Account has been rejected. Reason: ${issuer.rejected_reason || 'Contact support'}`);
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, issuer.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    logger.info('Issuer logged in', { issuerId: issuer.id, email: issuer.email });

    // Generate tokens
    const tokens = generateTokens({
      id: issuer.id,
      email: issuer.email,
      role: 'issuer',
    });

    return {
      issuer: this.sanitizeIssuer(issuer),
      tokens,
    };
  }

  /**
   * Refresh tokens
   */
  async refresh(refreshToken: string): Promise<TokenResponse> {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      // Verify issuer still exists and is valid
      const issuer = await issuerRepository.findById(decoded.id);
      if (!issuer) {
        throw new Error('Issuer not found');
      }

      if (issuer.is_blocked) {
        throw new Error('Account is blocked');
      }

      // Generate new tokens
      const tokens = generateTokens({
        id: issuer.id,
        email: issuer.email,
        role: 'issuer',
      });

      return tokens;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Get issuer profile
   */
  async getProfile(issuerId: number): Promise<IssuerResponse> {
    const issuer = await issuerRepository.findById(issuerId);
    if (!issuer) {
      throw new Error('Issuer not found');
    }

    return this.sanitizeIssuer(issuer);
  }

  /**
   * Update issuer profile
   */
  async updateProfile(issuerId: number, data: UpdateIssuerProfileInput): Promise<IssuerResponse> {
    const issuer = await issuerRepository.update(issuerId, data);
    logger.info('Issuer profile updated', { issuerId });
    return this.sanitizeIssuer(issuer);
  }
}

export const issuerService = new IssuerService();
