import { adminService } from '../modules/admin/service';
import { adminRepository } from '../modules/admin/repository';
import { issuerRepository } from '../modules/issuer/repository';
import { comparePassword } from '../utils/bcrypt';
import { generateTokens } from '../utils/jwt';

// Mock dependencies
jest.mock('../modules/admin/repository');
jest.mock('../modules/issuer/repository');
jest.mock('../utils/bcrypt');
jest.mock('../utils/jwt');

describe('Admin Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockInput = {
        email: 'admin@example.com',
        password: 'adminpass',
      };

      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        password_hash: 'hashed_password',
        created_at: new Date(),
      };

      (adminRepository.findByEmail as jest.Mock).mockResolvedValue(mockAdmin);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      const result = await adminService.login(mockInput);

      expect(result.admin.email).toBe('admin@example.com');
      expect(result.tokens).toBeDefined();
    });

    it('should throw error with invalid credentials', async () => {
      const mockInput = {
        email: 'admin@example.com',
        password: 'wrongpassword',
      };

      (adminRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(adminService.login(mockInput)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('approveIssuer', () => {
    it('should approve an issuer successfully', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        password_hash: 'hash',
        created_at: new Date(),
      };

      const mockIssuer = {
        id: 10,
        name: 'Test University',
        email: 'test@university.com',
        status: 'pending',
        is_blocked: false,
        type: 'university',
        phone: null,
        password_hash: 'hash',
        official_domain: null,
        website_url: null,
        contact_person_name: null,
        contact_person_designation: null,
        address: null,
        kyc_document_url: null,
        logo_url: null,
        approved_at: null,
        rejected_reason: null,
        blocked_reason: null,
        created_at: new Date(),
      };

      const approvedIssuer = {
        ...mockIssuer,
        status: 'approved',
        approved_at: new Date(),
      };

      (adminRepository.findById as jest.Mock).mockResolvedValue(mockAdmin);
      (issuerRepository.findById as jest.Mock).mockResolvedValue(mockIssuer);
      (issuerRepository.approve as jest.Mock).mockResolvedValue(approvedIssuer);

      const result = await adminService.approveIssuer(1, 10);

      expect(result.status).toBe('approved');
      expect(issuerRepository.approve).toHaveBeenCalledWith(10);
    });

    it('should throw error if issuer is already approved', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        password_hash: 'hash',
        created_at: new Date(),
      };

      const mockIssuer = {
        id: 10,
        status: 'approved',
      };

      (adminRepository.findById as jest.Mock).mockResolvedValue(mockAdmin);
      (issuerRepository.findById as jest.Mock).mockResolvedValue(mockIssuer);

      await expect(adminService.approveIssuer(1, 10)).rejects.toThrow(
        'Issuer is already approved'
      );
    });
  });

  describe('blockIssuer', () => {
    it('should block an issuer successfully', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        password_hash: 'hash',
        created_at: new Date(),
      };

      const mockIssuer = {
        id: 10,
        name: 'Test University',
        email: 'test@university.com',
        is_blocked: false,
      };

      const blockedIssuer = {
        ...mockIssuer,
        is_blocked: true,
        blocked_reason: 'Violation of terms',
      };

      (adminRepository.findById as jest.Mock).mockResolvedValue(mockAdmin);
      (issuerRepository.findById as jest.Mock).mockResolvedValue(mockIssuer);
      (issuerRepository.block as jest.Mock).mockResolvedValue(blockedIssuer);

      const result = await adminService.blockIssuer(1, 10, 'Violation of terms');

      expect(result.is_blocked).toBe(true);
      expect(issuerRepository.block).toHaveBeenCalledWith(10, 'Violation of terms');
    });

    it('should throw error if issuer is already blocked', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        password_hash: 'hash',
        created_at: new Date(),
      };

      const mockIssuer = {
        id: 10,
        is_blocked: true,
      };

      (adminRepository.findById as jest.Mock).mockResolvedValue(mockAdmin);
      (issuerRepository.findById as jest.Mock).mockResolvedValue(mockIssuer);

      await expect(adminService.blockIssuer(1, 10, 'Reason')).rejects.toThrow(
        'Issuer is already blocked'
      );
    });
  });

  describe('rejectIssuer', () => {
    it('should reject an issuer successfully', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        password_hash: 'hash',
        created_at: new Date(),
      };

      const mockIssuer = {
        id: 10,
        status: 'pending',
      };

      const rejectedIssuer = {
        ...mockIssuer,
        status: 'rejected',
        rejected_reason: 'Invalid documents',
      };

      (adminRepository.findById as jest.Mock).mockResolvedValue(mockAdmin);
      (issuerRepository.findById as jest.Mock).mockResolvedValue(mockIssuer);
      (issuerRepository.reject as jest.Mock).mockResolvedValue(rejectedIssuer);

      const result = await adminService.rejectIssuer(1, 10, 'Invalid documents');

      expect(result.status).toBe('rejected');
      expect(issuerRepository.reject).toHaveBeenCalledWith(10, 'Invalid documents');
    });
  });

  describe('unblockIssuer', () => {
    it('should unblock an issuer successfully', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        password_hash: 'hash',
        created_at: new Date(),
      };

      const mockIssuer = {
        id: 10,
        is_blocked: true,
        blocked_reason: 'Terms violation',
      };

      const unblockedIssuer = {
        ...mockIssuer,
        is_blocked: false,
        blocked_reason: null,
      };

      (adminRepository.findById as jest.Mock).mockResolvedValue(mockAdmin);
      (issuerRepository.findById as jest.Mock).mockResolvedValue(mockIssuer);
      (issuerRepository.unblock as jest.Mock).mockResolvedValue(unblockedIssuer);

      const result = await adminService.unblockIssuer(1, 10);

      expect(result.is_blocked).toBe(false);
      expect(issuerRepository.unblock).toHaveBeenCalledWith(10);
    });
  });
});
