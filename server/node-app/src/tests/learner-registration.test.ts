import { RegistrationService } from '../modules/learner-registration/service';
import { RegistrationRepository } from '../modules/learner-registration/repository';
import * as otpUtils from '../utils/otp';
import * as notificationUtils from '../utils/notification';
import * as bcryptUtils from '../utils/bcrypt';
import * as jwtUtils from '../utils/jwt';

// Mock dependencies
jest.mock('../modules/learner-registration/repository');
jest.mock('../utils/otp');
jest.mock('../utils/notification');
jest.mock('../utils/bcrypt');
jest.mock('../utils/jwt');

describe('RegistrationService', () => {
  let service: RegistrationService;
  let mockRepository: jest.Mocked<RegistrationRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = new RegistrationRepository() as jest.Mocked<RegistrationRepository>;
    service = new RegistrationService(mockRepository);
  });

  describe('startRegistration', () => {
    it('should successfully start registration with email', async () => {
      const input = { email: 'test@example.com' };
      const mockSession = {
        id: 'session-123',
        email: 'test@example.com',
        phone: null,
        otp_hash: 'hashed-otp',
        is_verified: false,
        verification_method: 'email',
        expires_at: new Date(Date.now() + 600000),
        verified_at: null,
        created_at: new Date(),
      };

      mockRepository.isEmailRegistered = jest.fn().mockResolvedValue(false);
      (otpUtils.generateOTP as jest.Mock).mockReturnValue('123456');
      (otpUtils.hashOTP as jest.Mock).mockResolvedValue('hashed-otp');
      (otpUtils.getOTPExpiry as jest.Mock).mockReturnValue(mockSession.expires_at);
      mockRepository.createSession = jest.fn().mockResolvedValue(mockSession);
      (notificationUtils.sendOTP as jest.Mock).mockResolvedValue(undefined);

      const result = await service.startRegistration(input);

      expect(mockRepository.isEmailRegistered).toHaveBeenCalledWith('test@example.com');
      expect(otpUtils.generateOTP).toHaveBeenCalledWith(6);
      expect(otpUtils.hashOTP).toHaveBeenCalledWith('123456');
      expect(mockRepository.createSession).toHaveBeenCalled();
      expect(notificationUtils.sendOTP).toHaveBeenCalledWith('email', 'test@example.com', '123456');
      expect(result.sessionId).toBe('session-123');
    });

    it('should throw error if email already registered', async () => {
      const input = { email: 'existing@example.com' };
      mockRepository.isEmailRegistered = jest.fn().mockResolvedValue(true);

      await expect(service.startRegistration(input)).rejects.toThrow('Email already registered');
    });

    it('should successfully start registration with phone', async () => {
      const input = { phone: '+1234567890' };
      const mockSession = {
        id: 'session-456',
        email: null,
        phone: '+1234567890',
        otp_hash: 'hashed-otp',
        is_verified: false,
        verification_method: 'phone',
        expires_at: new Date(Date.now() + 600000),
        verified_at: null,
        created_at: new Date(),
      };

      mockRepository.isPhoneRegistered = jest.fn().mockResolvedValue(false);
      (otpUtils.generateOTP as jest.Mock).mockReturnValue('654321');
      (otpUtils.hashOTP as jest.Mock).mockResolvedValue('hashed-otp');
      (otpUtils.getOTPExpiry as jest.Mock).mockReturnValue(mockSession.expires_at);
      mockRepository.createSession = jest.fn().mockResolvedValue(mockSession);
      (notificationUtils.sendOTP as jest.Mock).mockResolvedValue(undefined);

      const result = await service.startRegistration(input);

      expect(mockRepository.isPhoneRegistered).toHaveBeenCalledWith('+1234567890');
      expect(result.sessionId).toBe('session-456');
    });

    it('should throw error if phone already registered', async () => {
      const input = { phone: '+9876543210' };
      mockRepository.isPhoneRegistered = jest.fn().mockResolvedValue(true);

      await expect(service.startRegistration(input)).rejects.toThrow('Phone number already registered');
    });
  });

  describe('verifyOTP', () => {
    it('should successfully verify OTP', async () => {
      const input = { sessionId: 'session-123', otp: '123456' };
      const mockSession = {
        id: 'session-123',
        email: 'test@example.com',
        phone: null,
        otp_hash: 'hashed-otp',
        is_verified: false,
        verification_method: 'email',
        expires_at: new Date(Date.now() + 600000),
        verified_at: null,
        created_at: new Date(),
      };

      mockRepository.findSessionById = jest.fn().mockResolvedValue(mockSession);
      (otpUtils.verifyOTP as jest.Mock).mockResolvedValue(true);
      mockRepository.markSessionAsVerified = jest.fn().mockResolvedValue({
        ...mockSession,
        is_verified: true,
      });
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('temp-token');

      const result = await service.verifyOTP(input);

      expect(mockRepository.findSessionById).toHaveBeenCalledWith('session-123');
      expect(otpUtils.verifyOTP).toHaveBeenCalledWith('123456', 'hashed-otp');
      expect(mockRepository.markSessionAsVerified).toHaveBeenCalledWith('session-123');
      expect(result.tempToken).toBe('temp-token');
    });

    it('should throw error for invalid session', async () => {
      const input = { sessionId: 'invalid-session', otp: '123456' };
      mockRepository.findSessionById = jest.fn().mockResolvedValue(null);

      await expect(service.verifyOTP(input)).rejects.toThrow('Invalid session ID');
    });

    it('should throw error if session already verified', async () => {
      const input = { sessionId: 'session-123', otp: '123456' };
      const mockSession = {
        id: 'session-123',
        email: 'test@example.com',
        phone: null,
        otp_hash: 'hashed-otp',
        is_verified: true,
        verification_method: 'email',
        expires_at: new Date(Date.now() + 600000),
        verified_at: new Date(),
        created_at: new Date(),
      };

      mockRepository.findSessionById = jest.fn().mockResolvedValue(mockSession);

      await expect(service.verifyOTP(input)).rejects.toThrow('Session already verified');
    });

    it('should throw error for expired session', async () => {
      const input = { sessionId: 'session-123', otp: '123456' };
      const mockSession = {
        id: 'session-123',
        email: 'test@example.com',
        phone: null,
        otp_hash: 'hashed-otp',
        is_verified: false,
        verification_method: 'email',
        expires_at: new Date(Date.now() - 10000), // Expired
        verified_at: null,
        created_at: new Date(),
      };

      mockRepository.findSessionById = jest.fn().mockResolvedValue(mockSession);

      await expect(service.verifyOTP(input)).rejects.toThrow('OTP expired');
    });

    it('should throw error for invalid OTP', async () => {
      const input = { sessionId: 'session-123', otp: '999999' };
      const mockSession = {
        id: 'session-123',
        email: 'test@example.com',
        phone: null,
        otp_hash: 'hashed-otp',
        is_verified: false,
        verification_method: 'email',
        expires_at: new Date(Date.now() + 600000),
        verified_at: null,
        created_at: new Date(),
      };

      mockRepository.findSessionById = jest.fn().mockResolvedValue(mockSession);
      (otpUtils.verifyOTP as jest.Mock).mockResolvedValue(false);

      await expect(service.verifyOTP(input)).rejects.toThrow('Invalid OTP');
    });
  });

  describe('completeRegistration', () => {
    it('should successfully complete registration with password', async () => {
      const sessionId = 'session-123';
      const input = {
        name: 'John Doe',
        profilePhotoUrl: 'https://example.com/photo.jpg',
        password: 'SecurePass123',
      };
      const mockSession = {
        id: 'session-123',
        email: 'john@example.com',
        phone: null,
        otp_hash: 'hashed-otp',
        is_verified: true,
        verification_method: 'email',
        expires_at: new Date(Date.now() + 600000),
        verified_at: new Date(),
        created_at: new Date(),
      };
      const mockLearner = {
        id: 1,
        email: 'john@example.com',
        phone: null,
        hashed_password: 'hashed-password',
        profileUrl: 'https://example.com/photo.jpg',
        other_emails: [],
        status: 'active',
        created_at: new Date(),
      };

      mockRepository.findSessionById = jest.fn().mockResolvedValue(mockSession);
      (bcryptUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      mockRepository.createLearner = jest.fn().mockResolvedValue(mockLearner);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await service.completeRegistration(sessionId, input);

      expect(mockRepository.findSessionById).toHaveBeenCalledWith('session-123');
      expect(bcryptUtils.hashPassword).toHaveBeenCalledWith('SecurePass123');
      expect(mockRepository.createLearner).toHaveBeenCalledWith({
        email: 'john@example.com',
        phone: undefined,
        hashedPassword: 'hashed-password',
        profileUrl: 'https://example.com/photo.jpg',
        otherEmails: [],
      });
      expect(result.learner.id).toBe(1);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should complete registration without password (OAuth case)', async () => {
      const sessionId = 'session-456';
      const input = {
        name: 'Jane Doe',
        profilePhotoUrl: 'https://example.com/jane.jpg',
      };
      const mockSession = {
        id: 'session-456',
        email: 'jane@example.com',
        phone: null,
        otp_hash: 'hashed-otp',
        is_verified: true,
        verification_method: 'email',
        expires_at: new Date(Date.now() + 600000),
        verified_at: new Date(),
        created_at: new Date(),
      };
      const mockLearner = {
        id: 2,
        email: 'jane@example.com',
        phone: null,
        hashed_password: null,
        profileUrl: 'https://example.com/jane.jpg',
        other_emails: [],
        status: 'active',
        created_at: new Date(),
      };

      mockRepository.findSessionById = jest.fn().mockResolvedValue(mockSession);
      mockRepository.createLearner = jest.fn().mockResolvedValue(mockLearner);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await service.completeRegistration(sessionId, input);

      expect(bcryptUtils.hashPassword).not.toHaveBeenCalled();
      expect(result.learner.id).toBe(2);
    });

    it('should throw error for invalid session', async () => {
      const sessionId = 'invalid-session';
      const input = {
        name: 'Test User',
        password: 'password123',
      };

      mockRepository.findSessionById = jest.fn().mockResolvedValue(null);

      await expect(service.completeRegistration(sessionId, input)).rejects.toThrow('Invalid session ID');
    });

    it('should throw error for unverified session', async () => {
      const sessionId = 'session-123';
      const input = {
        name: 'Test User',
        password: 'password123',
      };
      const mockSession = {
        id: 'session-123',
        email: 'test@example.com',
        phone: null,
        otp_hash: 'hashed-otp',
        is_verified: false,
        verification_method: 'email',
        expires_at: new Date(Date.now() + 600000),
        verified_at: null,
        created_at: new Date(),
      };

      mockRepository.findSessionById = jest.fn().mockResolvedValue(mockSession);

      await expect(service.completeRegistration(sessionId, input)).rejects.toThrow('Session not verified');
    });

    it('should throw error for expired session', async () => {
      const sessionId = 'session-123';
      const input = {
        name: 'Test User',
        password: 'password123',
      };
      const mockSession = {
        id: 'session-123',
        email: 'test@example.com',
        phone: null,
        otp_hash: 'hashed-otp',
        is_verified: true,
        verification_method: 'email',
        expires_at: new Date(Date.now() - 10000), // Expired
        verified_at: new Date(),
        created_at: new Date(),
      };

      mockRepository.findSessionById = jest.fn().mockResolvedValue(mockSession);

      await expect(service.completeRegistration(sessionId, input)).rejects.toThrow('Session expired');
    });
  });
});
