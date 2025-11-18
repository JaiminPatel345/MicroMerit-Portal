import { issuerService } from '../modules/issuer/service';
import { issuerRepository } from '../modules/issuer/repository';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateTokens } from '../utils/jwt';

// Mock dependencies
jest.mock('../modules/issuer/repository');
jest.mock('../utils/bcrypt');
jest.mock('../utils/jwt');

describe('Issuer Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new issuer successfully', async () => {
      const mockInput = {
        name: 'Test University',
        type: 'university' as const,
        email: 'test@university.com',
        password: 'password123',
        phone: '+1234567890',
      };

      const mockIssuer = {
        id: 1,
        ...mockInput,
        password_hash: 'hashed_password',
        official_domain: null,
        website_url: null,
        contact_person_name: null,
        contact_person_designation: null,
        address: null,
        kyc_document_url: null,
        logo_url: null,
        status: 'pending',
        approved_at: null,
        rejected_reason: null,
        is_blocked: false,
        blocked_reason: null,
        created_at: new Date(),
      };

      (issuerRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (issuerRepository.create as jest.Mock).mockResolvedValue(mockIssuer);
      (generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      const result = await issuerService.register(mockInput);

      expect(result.issuer.id).toBe(1);
      expect(result.issuer.email).toBe('test@university.com');
      expect(result.tokens.accessToken).toBe('access_token');
      expect(issuerRepository.findByEmail).toHaveBeenCalledWith('test@university.com');
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(issuerRepository.create).toHaveBeenCalled();
    });

    it('should throw error if issuer already exists', async () => {
      const mockInput = {
        name: 'Test University',
        type: 'university' as const,
        email: 'existing@university.com',
        password: 'password123',
      };

      (issuerRepository.findByEmail as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(issuerService.register(mockInput)).rejects.toThrow(
        'Issuer with this email already exists'
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockInput = {
        email: 'test@university.com',
        password: 'password123',
      };

      const mockIssuer = {
        id: 1,
        name: 'Test University',
        email: 'test@university.com',
        password_hash: 'hashed_password',
        type: 'university',
        phone: null,
        official_domain: null,
        website_url: null,
        contact_person_name: null,
        contact_person_designation: null,
        address: null,
        kyc_document_url: null,
        logo_url: null,
        status: 'approved',
        approved_at: new Date(),
        rejected_reason: null,
        is_blocked: false,
        blocked_reason: null,
        created_at: new Date(),
      };

      (issuerRepository.findByEmail as jest.Mock).mockResolvedValue(mockIssuer);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      const result = await issuerService.login(mockInput);

      expect(result.issuer.email).toBe('test@university.com');
      expect(result.tokens).toBeDefined();
      expect(comparePassword).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('should throw error if issuer is blocked', async () => {
      const mockInput = {
        email: 'blocked@university.com',
        password: 'password123',
      };

      const mockIssuer = {
        id: 1,
        email: 'blocked@university.com',
        password_hash: 'hashed_password',
        is_blocked: true,
        blocked_reason: 'Terms violation',
        status: 'approved',
      };

      (issuerRepository.findByEmail as jest.Mock).mockResolvedValue(mockIssuer);

      await expect(issuerService.login(mockInput)).rejects.toThrow('Account is blocked');
    });

    it('should throw error if issuer is rejected', async () => {
      const mockInput = {
        email: 'rejected@university.com',
        password: 'password123',
      };

      const mockIssuer = {
        id: 1,
        email: 'rejected@university.com',
        password_hash: 'hashed_password',
        is_blocked: false,
        status: 'rejected',
        rejected_reason: 'Invalid documents',
      };

      (issuerRepository.findByEmail as jest.Mock).mockResolvedValue(mockIssuer);

      await expect(issuerService.login(mockInput)).rejects.toThrow('Account has been rejected');
    });

    it('should throw error with invalid credentials', async () => {
      const mockInput = {
        email: 'test@university.com',
        password: 'wrongpassword',
      };

      const mockIssuer = {
        id: 1,
        email: 'test@university.com',
        password_hash: 'hashed_password',
        is_blocked: false,
        status: 'approved',
      };

      (issuerRepository.findByEmail as jest.Mock).mockResolvedValue(mockIssuer);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(issuerService.login(mockInput)).rejects.toThrow('Invalid email or password');
    });
  });
});
