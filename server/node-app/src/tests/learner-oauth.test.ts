import { OAuthService } from '../modules/learner-oauth/service';
import { OAuthRepository } from '../modules/learner-oauth/repository';
import axios from 'axios';
import * as jwtUtils from '../utils/jwt';

// Mock dependencies
jest.mock('../modules/learner-oauth/repository');
jest.mock('axios');
jest.mock('../utils/jwt');

describe('OAuthService', () => {
  let service: OAuthService;
  let mockRepository: jest.Mocked<OAuthRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = new OAuthRepository() as jest.Mocked<OAuthRepository>;
    service = new OAuthService(mockRepository);

    // Set up environment variables for tests
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/learner/oauth/google/callback';
    process.env.DIGILOCKER_CLIENT_ID = 'test-digilocker-client-id';
    process.env.DIGILOCKER_CLIENT_SECRET = 'test-digilocker-client-secret';
    process.env.DIGILOCKER_CALLBACK_URL = 'http://localhost:3000/auth/learner/oauth/digilocker/callback';
    process.env.DIGILOCKER_FETCH_URL = 'https://api.digitallocker.gov.in/public/oauth2/1/files';
  });

  describe('handleGoogleCallback', () => {
    it('should create new learner and return tokens for new Google user', async () => {
      const code = 'test-google-code';
      const mockTokenResponse = {
        data: {
          access_token: 'google-access-token',
        },
      };
      const mockProfileResponse = {
        data: {
          email: 'newuser@gmail.com',
          picture: 'https://example.com/photo.jpg',
        },
      };
      const mockLearner = {
        id: 1,
        email: 'newuser@gmail.com',
        phone: null,
        hashed_password: null,
        profileUrl: 'https://example.com/photo.jpg',
        other_emails: [],
        status: 'active',
        external_digilocker_id: null,
        created_at: new Date(),
      };

      (axios.post as jest.Mock).mockResolvedValue(mockTokenResponse);
      (axios.get as jest.Mock).mockResolvedValue(mockProfileResponse);
      mockRepository.findLearnerByEmail = jest.fn().mockResolvedValue(null);
      mockRepository.createLearner = jest.fn().mockResolvedValue(mockLearner);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await service.handleGoogleCallback(code);

      expect(axios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({ code })
      );
      expect(axios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        expect.any(Object)
      );
      expect(mockRepository.findLearnerByEmail).toHaveBeenCalledWith('newuser@gmail.com');
      expect(mockRepository.createLearner).toHaveBeenCalledWith({
        email: 'newuser@gmail.com',
        profileUrl: 'https://example.com/photo.jpg',
        otherEmails: [],
        dob: undefined,
        gender: undefined,
      });
      expect(result.learner.id).toBe(1);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should login existing learner with Google account', async () => {
      const code = 'test-google-code';
      const mockTokenResponse = {
        data: {
          access_token: 'google-access-token',
        },
      };
      const mockProfileResponse = {
        data: {
          email: 'existing@gmail.com',
          picture: 'https://example.com/photo.jpg',
        },
      };
      const mockLearner = {
        id: 2,
        email: 'existing@gmail.com',
        phone: null,
        hashed_password: 'some-hash',
        profileUrl: 'https://example.com/old-photo.jpg',
        other_emails: [],
        status: 'active',
        external_digilocker_id: null,
        created_at: new Date(Date.now() - 86400000), // 1 day ago
      };

      (axios.post as jest.Mock).mockResolvedValue(mockTokenResponse);
      (axios.get as jest.Mock).mockResolvedValue(mockProfileResponse);
      mockRepository.findLearnerByEmail = jest.fn().mockResolvedValue(mockLearner);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await service.handleGoogleCallback(code);

      expect(mockRepository.findLearnerByEmail).toHaveBeenCalledWith('existing@gmail.com');
      expect(mockRepository.createLearner).not.toHaveBeenCalled();
      expect(result.learner.id).toBe(2);
      expect(result.isNewUser).toBe(false);
    });

    it('should throw error on Google API failure', async () => {
      const code = 'invalid-code';
      (axios.post as jest.Mock).mockRejectedValue(new Error('Invalid code'));

      await expect(service.handleGoogleCallback(code)).rejects.toThrow(
        'Failed to authenticate with Google'
      );
    });
  });

  describe('handleDigilockerCallback', () => {
    it('should create new learner and fetch certificates for new DigiLocker user', async () => {
      const code = 'test-digilocker-code';
      const mockTokenResponse = {
        data: {
          access_token: 'digilocker-access-token',
        },
      };
      const mockProfileResponse = {
        data: {
          digilockerid: 'DL123456',
          email: 'user@example.com',
          mobile: '+919876543210',
        },
      };
      const mockCertificatesResponse = {
        data: {
          items: [
            { name: 'Certificate 1', uri: 'cert1' },
            { name: 'Certificate 2', uri: 'cert2' },
          ],
        },
      };
      const mockLearner = {
        id: 3,
        email: 'user@example.com',
        phone: '+919876543210',
        hashed_password: null,
        profileUrl: null,
        other_emails: [],
        status: 'active',
        external_digilocker_id: 'DL123456',
        created_at: new Date(),
      };

      (axios.post as jest.Mock).mockResolvedValue(mockTokenResponse);
      (axios.get as jest.Mock)
        .mockResolvedValueOnce(mockProfileResponse) // Profile call
        .mockResolvedValueOnce(mockCertificatesResponse); // Certificates call
      
      mockRepository.findLearnerByDigilockerId = jest.fn().mockResolvedValue(null);
      mockRepository.findLearnerByEmail = jest.fn().mockResolvedValue(null);
      mockRepository.findLearnerByPhone = jest.fn().mockResolvedValue(null);
      mockRepository.createLearner = jest.fn().mockResolvedValue(mockLearner);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await service.handleDigilockerCallback(code);

      expect(mockRepository.findLearnerByDigilockerId).toHaveBeenCalledWith('DL123456');
      expect(mockRepository.createLearner).toHaveBeenCalledWith({
        email: 'user@example.com',
        phone: '+919876543210',
        externalDigilockerId: 'DL123456',
        otherEmails: [],
        dob: undefined,
        gender: undefined,
      });
      expect(result.learner.id).toBe(3);
      expect(result.certificatesCount).toBe(2);
      expect(result.accessToken).toBe('access-token');
    });

    it('should link existing learner with DigiLocker ID', async () => {
      const code = 'test-digilocker-code';
      const mockTokenResponse = {
        data: {
          access_token: 'digilocker-access-token',
        },
      };
      const mockProfileResponse = {
        data: {
          digilockerid: 'DL789012',
          email: 'existing@example.com',
        },
      };
      const mockCertificatesResponse = {
        data: {
          items: [],
        },
      };
      const mockLearner = {
        id: 4,
        email: 'existing@example.com',
        phone: null,
        hashed_password: 'hash',
        profileUrl: null,
        other_emails: [],
        status: 'active',
        external_digilocker_id: null, // No DigiLocker ID yet
        created_at: new Date(Date.now() - 86400000),
      };

      (axios.post as jest.Mock).mockResolvedValue(mockTokenResponse);
      (axios.get as jest.Mock)
        .mockResolvedValueOnce(mockProfileResponse)
        .mockResolvedValueOnce(mockCertificatesResponse);
      
      mockRepository.findLearnerByDigilockerId = jest.fn().mockResolvedValue(null);
      mockRepository.findLearnerByEmail = jest.fn().mockResolvedValue(mockLearner);
      mockRepository.updateLearner = jest.fn().mockResolvedValue({
        ...mockLearner,
        external_digilocker_id: 'DL789012',
      });
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await service.handleDigilockerCallback(code);

      expect(mockRepository.updateLearner).toHaveBeenCalledWith(4, {
        externalDigilockerId: 'DL789012',
      });
      expect(result.learner.id).toBe(4);
    });

    it('should handle DigiLocker login even if certificate fetch fails', async () => {
      const code = 'test-digilocker-code';
      const mockTokenResponse = {
        data: {
          access_token: 'digilocker-access-token',
        },
      };
      const mockProfileResponse = {
        data: {
          digilockerid: 'DL555555',
          email: 'user@test.com',
        },
      };
      const mockLearner = {
        id: 5,
        email: 'user@test.com',
        phone: null,
        hashed_password: null,
        profileUrl: null,
        other_emails: [],
        status: 'active',
        external_digilocker_id: 'DL555555',
        created_at: new Date(),
      };

      (axios.post as jest.Mock).mockResolvedValue(mockTokenResponse);
      (axios.get as jest.Mock)
        .mockResolvedValueOnce(mockProfileResponse) // Profile succeeds
        .mockRejectedValueOnce(new Error('Certificate fetch failed')); // Certificates fail
      
      mockRepository.findLearnerByDigilockerId = jest.fn().mockResolvedValue(null);
      mockRepository.findLearnerByEmail = jest.fn().mockResolvedValue(null);
      mockRepository.createLearner = jest.fn().mockResolvedValue(mockLearner);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await service.handleDigilockerCallback(code);

      expect(result.learner.id).toBe(5);
      expect(result.certificatesCount).toBe(0);
    });

    it('should throw error on DigiLocker API failure', async () => {
      const code = 'invalid-code';
      (axios.post as jest.Mock).mockRejectedValue(new Error('Invalid code'));

      await expect(service.handleDigilockerCallback(code)).rejects.toThrow(
        'Failed to authenticate with DigiLocker'
      );
    });
  });

  describe('getGoogleAuthUrl', () => {
    it('should generate correct Google OAuth URL', () => {
      const url = service.getGoogleAuthUrl();

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=test-google-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid+email+profile');
    });
  });

  describe('getDigilockerAuthUrl', () => {
    it('should generate correct DigiLocker OAuth URL', () => {
      const url = service.getDigilockerAuthUrl();

      expect(url).toContain('https://api.digitallocker.gov.in/public/oauth2/1/authorize');
      expect(url).toContain('client_id=test-digilocker-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=');
    });
  });
});
