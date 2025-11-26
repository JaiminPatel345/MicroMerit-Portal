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

  describe('listLearners', () => {
    it('should list all learners without filters', async () => {
      const mockLearners = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          hashed_password: 'hash',
          status: 'active',
          profileFolder: null,
          profileUrl: null,
          external_digilocker_id: null,
          other_emails: [],
          dob: null,
          gender: null,
          created_at: new Date(),
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+9876543210',
          hashed_password: 'hash',
          status: 'active',
          profileFolder: null,
          profileUrl: null,
          external_digilocker_id: null,
          other_emails: [],
          dob: null,
          gender: null,
          created_at: new Date(),
        },
      ];

      (adminRepository.findAllLearners as jest.Mock).mockResolvedValue(mockLearners);

      const result = await adminService.listLearners();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('hashed_password');
      expect(result[0]?.email).toBe('john@example.com');
    });

    it('should list learners with status filter', async () => {
      const mockLearners = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          hashed_password: 'hash',
          status: 'active',
          profileFolder: null,
          profileUrl: null,
          external_digilocker_id: null,
          other_emails: [],
          dob: null,
          gender: null,
          created_at: new Date(),
        },
      ];

      (adminRepository.findAllLearners as jest.Mock).mockResolvedValue(mockLearners);

      const result = await adminService.listLearners({ status: 'active' });

      expect(result).toHaveLength(1);
      expect(adminRepository.findAllLearners).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should list learners with search filter', async () => {
      const mockLearners = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          hashed_password: 'hash',
          status: 'active',
          profileFolder: null,
          profileUrl: null,
          external_digilocker_id: null,
          other_emails: [],
          dob: null,
          gender: null,
          created_at: new Date(),
        },
      ];

      (adminRepository.findAllLearners as jest.Mock).mockResolvedValue(mockLearners);

      const result = await adminService.listLearners({ search: 'john' });

      expect(result).toHaveLength(1);
      expect(adminRepository.findAllLearners).toHaveBeenCalledWith({ search: 'john' });
    });
  });

  describe('getLearnerDetails', () => {
    it('should get learner details successfully', async () => {
      const mockLearner = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        hashed_password: 'hash',
        status: 'active',
        profileFolder: null,
        profileUrl: null,
        external_digilocker_id: null,
        other_emails: ['john.doe@gmail.com'],
        dob: new Date('1995-05-15'),
        gender: 'Male',
        created_at: new Date(),
        credentials: [
          {
            id: '101',
            credential_id: 'CRED-001',
            status: 'claimed',
            issued_at: new Date(),
            claimed_at: new Date(),
            metadata: { courseName: 'Web Development' },
            issuer: {
              id: 5,
              name: 'MIT University',
              email: 'admin@mit.edu',
              logo_url: 'https://example.com/logo.png',
              type: 'university',
            },
            blockchain_record: {
              id: 50,
              blockchain_tx_id: '0x123abc',
              hash_value: 'hash123',
              stored_at: new Date(),
            },
            pdf_certificate: {
              id: 60,
              pdf_url: 'https://example.com/cert.pdf',
              qr_code_url: 'https://example.com/qr.png',
              created_at: new Date(),
            },
          },
        ],
      };

      (adminRepository.findLearnerById as jest.Mock).mockResolvedValue(mockLearner);

      const result = await adminService.getLearnerDetails(1);

      expect(result).not.toHaveProperty('hashed_password');
      expect(result.name).toBe('John Doe');
      expect(result.credentials).toHaveLength(1);
      expect(result.credentials[0]?.credential_id).toBe('CRED-001');
    });

    it('should throw error if learner not found', async () => {
      (adminRepository.findLearnerById as jest.Mock).mockResolvedValue(null);

      await expect(adminService.getLearnerDetails(999)).rejects.toThrow('Learner not found');
    });
  });

  describe('getPlatformAnalytics', () => {
    it('should get platform analytics successfully', async () => {
      const mockPlatformStats = {
        totalLearners: 1500,
        activeLearners: 1350,
        totalIssuers: 50,
        approvedIssuers: 45,
        totalCredentials: 5000,
      };

      const mockCredentialStats = {
        issued: 2000,
        claimed: 2800,
        revoked: 200,
      };

      const mockIssuerStats = {
        pending: 5,
        approved: 45,
        rejected: 10,
        blocked: 2,
      };

      const mockLearnerStats = {
        active: 1350,
        inactive: 150,
        total: 1500,
      };

      const mockRecentCredentials = [
        {
          id: '5000',
          credential_id: 'CRED-5000',
          status: 'claimed',
          issued_at: new Date(),
          claimed_at: new Date(),
          metadata: {},
          issuer: {
            id: 5,
            name: 'MIT University',
            logo_url: 'https://example.com/logo.png',
            type: 'university',
          },
          learner: {
            id: 100,
            name: 'Alice Johnson',
            email: 'alice@example.com',
          },
        },
      ];

      (adminRepository.getPlatformStats as jest.Mock).mockResolvedValue(mockPlatformStats);
      (adminRepository.getCredentialStats as jest.Mock).mockResolvedValue(mockCredentialStats);
      (adminRepository.getIssuerStats as jest.Mock).mockResolvedValue(mockIssuerStats);
      (adminRepository.getLearnerStats as jest.Mock).mockResolvedValue(mockLearnerStats);
      (adminRepository.getRecentCredentials as jest.Mock).mockResolvedValue(
        mockRecentCredentials
      );

      const result = await adminService.getPlatformAnalytics();

      expect(result.overview).toEqual(mockPlatformStats);
      expect(result.credentials).toEqual(mockCredentialStats);
      expect(result.issuers).toEqual(mockIssuerStats);
      expect(result.learners).toEqual(mockLearnerStats);
      expect(result.recentActivity).toHaveLength(1);
      expect(result.recentActivity[0]?.credential_id).toBe('CRED-5000');
    });
  });
});
