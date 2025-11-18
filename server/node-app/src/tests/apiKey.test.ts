import { apiKeyService } from '../modules/issuer/apiKey.service';
import { apiKeyRepository } from '../modules/issuer/apiKey.repository';
import { issuerRepository } from '../modules/issuer/repository';
import { generateRandomString } from '../utils/bcrypt';

// Mock dependencies
jest.mock('../modules/issuer/apiKey.repository');
jest.mock('../modules/issuer/repository');
jest.mock('../utils/bcrypt');

describe('API Key Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createApiKey', () => {
    it('should create an API key successfully', async () => {
      const mockInput = {
        name: 'Production API Key',
        rate_limit_per_minute: 100,
      };

      const mockIssuer = {
        id: 1,
        email: 'issuer@example.com',
        status: 'approved',
        is_blocked: false,
        name: 'Test Issuer',
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
        approved_at: new Date(),
        rejected_reason: null,
        blocked_reason: null,
        created_at: new Date(),
      };

      const mockApiKey = {
        id: 1,
        issuer_id: 1,
        name: 'Production API Key',
        api_key: 'mk_test1234567890',
        active: true,
        revoked_reason: null,
        expires_at: null,
        last_used_at: null,
        usage_count: 0,
        rate_limit_per_minute: 100,
        allowed_ips: null,
        created_at: new Date(),
      };

      (issuerRepository.findById as jest.Mock).mockResolvedValue(mockIssuer);
      (apiKeyRepository.countActiveKeys as jest.Mock).mockResolvedValue(2);
      (generateRandomString as jest.Mock).mockReturnValue('test1234567890');
      (apiKeyRepository.create as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await apiKeyService.createApiKey(1, mockInput);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Production API Key');
      expect(issuerRepository.findById).toHaveBeenCalledWith(1);
      expect(apiKeyRepository.countActiveKeys).toHaveBeenCalledWith(1);
    });

    it('should throw error if issuer is not approved', async () => {
      const mockInput = {
        name: 'Test API Key',
      };

      const mockIssuer = {
        id: 1,
        status: 'pending',
        is_blocked: false,
      };

      (issuerRepository.findById as jest.Mock).mockResolvedValue(mockIssuer);

      await expect(apiKeyService.createApiKey(1, mockInput)).rejects.toThrow(
        'Issuer must be approved before creating API keys'
      );
    });

    it('should throw error if issuer is blocked', async () => {
      const mockInput = {
        name: 'Test API Key',
      };

      const mockIssuer = {
        id: 1,
        status: 'approved',
        is_blocked: true,
      };

      (issuerRepository.findById as jest.Mock).mockResolvedValue(mockIssuer);

      await expect(apiKeyService.createApiKey(1, mockInput)).rejects.toThrow(
        'Issuer account is blocked'
      );
    });

    it('should throw error if max API keys limit reached', async () => {
      const mockInput = {
        name: 'Test API Key',
      };

      const mockIssuer = {
        id: 1,
        status: 'approved',
        is_blocked: false,
      };

      (issuerRepository.findById as jest.Mock).mockResolvedValue(mockIssuer);
      (apiKeyRepository.countActiveKeys as jest.Mock).mockResolvedValue(5);

      await expect(apiKeyService.createApiKey(1, mockInput)).rejects.toThrow(
        'Maximum 5 active API keys allowed'
      );
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key successfully', async () => {
      const mockApiKey = {
        id: 1,
        issuer_id: 1,
        name: 'Test Key',
        api_key: 'mk_test123',
        active: true,
        revoked_reason: null,
        expires_at: null,
        last_used_at: null,
        usage_count: 10,
        rate_limit_per_minute: 60,
        allowed_ips: null,
        created_at: new Date(),
      };

      const revokedKey = {
        ...mockApiKey,
        active: false,
        revoked_reason: 'Security breach',
      };

      (apiKeyRepository.findById as jest.Mock).mockResolvedValue(mockApiKey);
      (apiKeyRepository.revoke as jest.Mock).mockResolvedValue(revokedKey);

      const result = await apiKeyService.revokeApiKey(1, 1, 'Security breach');

      expect(result.active).toBe(false);
      expect(result.revoked_reason).toBe('Security breach');
      expect(apiKeyRepository.revoke).toHaveBeenCalledWith(1, 'Security breach');
    });

    it('should throw error if API key not found', async () => {
      (apiKeyRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(apiKeyService.revokeApiKey(1, 1)).rejects.toThrow('API key not found');
    });

    it('should throw error if user does not own the API key', async () => {
      const mockApiKey = {
        id: 1,
        issuer_id: 2, // Different issuer
        active: true,
      };

      (apiKeyRepository.findById as jest.Mock).mockResolvedValue(mockApiKey);

      await expect(apiKeyService.revokeApiKey(1, 1)).rejects.toThrow(
        'You do not have permission to revoke this API key'
      );
    });

    it('should throw error if API key is already revoked', async () => {
      const mockApiKey = {
        id: 1,
        issuer_id: 1,
        active: false,
      };

      (apiKeyRepository.findById as jest.Mock).mockResolvedValue(mockApiKey);

      await expect(apiKeyService.revokeApiKey(1, 1)).rejects.toThrow(
        'API key is already revoked'
      );
    });
  });

  describe('listApiKeys', () => {
    it('should list all API keys for an issuer', async () => {
      const mockApiKeys = [
        {
          id: 1,
          issuer_id: 1,
          name: 'Key 1',
          api_key: 'mk_test123',
          active: true,
          revoked_reason: null,
          expires_at: null,
          last_used_at: null,
          usage_count: 10,
          rate_limit_per_minute: 60,
          allowed_ips: null,
          created_at: new Date(),
        },
        {
          id: 2,
          issuer_id: 1,
          name: 'Key 2',
          api_key: 'mk_test456',
          active: false,
          revoked_reason: 'Replaced',
          expires_at: null,
          last_used_at: null,
          usage_count: 5,
          rate_limit_per_minute: 60,
          allowed_ips: null,
          created_at: new Date(),
        },
      ];

      (apiKeyRepository.findAllByIssuerId as jest.Mock).mockResolvedValue(mockApiKeys);

      const result = await apiKeyService.listApiKeys(1);

      expect(result).toHaveLength(2);
      expect(apiKeyRepository.findAllByIssuerId).toHaveBeenCalledWith(1);
    });
  });
});
