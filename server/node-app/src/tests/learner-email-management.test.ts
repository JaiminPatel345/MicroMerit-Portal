import { learnerService } from '../modules/learner/service';
import { learnerRepository } from '../modules/learner/repository';
import * as otpUtils from '../utils/otp';
import * as notificationUtils from '../utils/notification';

// Mock dependencies
jest.mock('../modules/learner/repository');
jest.mock('../utils/otp');
jest.mock('../utils/notification');

describe('Learner Email Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestAddEmail', () => {
    it('should successfully request to add email', async () => {
      const learnerId = 1;
      const email = 'newemail@example.com';
      const mockLearner = {
        id: 1,
        email: 'learner@example.com',
        phone: null,
        hashed_password: 'hashed',
        profileFolder: null,
        profileUrl: null,
        external_digilocker_id: null,
        status: 'active',
        other_emails: [],
        created_at: new Date(),
      };
      const mockSession = {
        id: 'session-123',
        learner_id: 1,
        email: 'newemail@example.com',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 600000),
        verified_at: null,
        created_at: new Date(),
      };

      (learnerRepository.findById as jest.Mock).mockResolvedValue(mockLearner);
      (learnerRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (learnerRepository.isEmailAlreadyAdded as jest.Mock).mockResolvedValue(false);
      (otpUtils.generateOTP as jest.Mock).mockReturnValue('123456');
      (otpUtils.hashOTP as jest.Mock).mockResolvedValue('hashed-otp');
      (otpUtils.getOTPExpiry as jest.Mock).mockReturnValue(mockSession.expires_at);
      (learnerRepository.createEmailVerificationSession as jest.Mock).mockResolvedValue(mockSession);
      (notificationUtils.sendOTP as jest.Mock).mockResolvedValue(undefined);

      const result = await learnerService.requestAddEmail(learnerId, email);

      expect(learnerRepository.findById).toHaveBeenCalledWith(1);
      expect(learnerRepository.findByEmail).toHaveBeenCalledWith('newemail@example.com');
      expect(learnerRepository.isEmailAlreadyAdded).toHaveBeenCalledWith(1, 'newemail@example.com');
      expect(otpUtils.generateOTP).toHaveBeenCalledWith(6);
      expect(notificationUtils.sendOTP).toHaveBeenCalledWith('email', 'newemail@example.com', '123456');
      expect(result.sessionId).toBe('session-123');
      expect(result.message).toBe('OTP sent to email');
    });

    it('should throw error if learner not found', async () => {
      const learnerId = 999;
      const email = 'test@example.com';

      (learnerRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(learnerService.requestAddEmail(learnerId, email)).rejects.toThrow('Learner not found');
    });

    it('should throw error if email already registered as primary', async () => {
      const learnerId = 1;
      const email = 'existing@example.com';
      const mockLearner = {
        id: 1,
        email: 'learner@example.com',
        phone: null,
        other_emails: [],
      };
      const existingLearner = {
        id: 2,
        email: 'existing@example.com',
      };

      (learnerRepository.findById as jest.Mock).mockResolvedValue(mockLearner);
      (learnerRepository.findByEmail as jest.Mock).mockResolvedValue(existingLearner);

      await expect(learnerService.requestAddEmail(learnerId, email)).rejects.toThrow('Email is already registered');
    });

    it('should throw error if email already in other_emails', async () => {
      const learnerId = 1;
      const email = 'already@example.com';
      const mockLearner = {
        id: 1,
        email: 'learner@example.com',
        phone: null,
        other_emails: ['already@example.com'],
      };

      (learnerRepository.findById as jest.Mock).mockResolvedValue(mockLearner);
      (learnerRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (learnerRepository.isEmailAlreadyAdded as jest.Mock).mockResolvedValue(true);

      await expect(learnerService.requestAddEmail(learnerId, email)).rejects.toThrow('Email is already added to your account');
    });
  });

  describe('verifyEmailOTP', () => {
    it('should successfully verify OTP and add email', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: 'session-123',
        learner_id: 1,
        email: 'newemail@example.com',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 600000),
        verified_at: null,
        created_at: new Date(),
      };

      (learnerRepository.findEmailVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);
      (otpUtils.verifyOTP as jest.Mock).mockResolvedValue(true);
      (learnerRepository.markEmailVerificationSessionAsVerified as jest.Mock).mockResolvedValue(undefined);
      (learnerRepository.addEmailToOtherEmails as jest.Mock).mockResolvedValue(undefined);

      const result = await learnerService.verifyEmailOTP(learnerId, sessionId, otp);

      expect(learnerRepository.findEmailVerificationSessionById).toHaveBeenCalledWith('session-123');
      expect(otpUtils.verifyOTP).toHaveBeenCalledWith('123456', 'hashed-otp');
      expect(learnerRepository.markEmailVerificationSessionAsVerified).toHaveBeenCalledWith('session-123');
      expect(learnerRepository.addEmailToOtherEmails).toHaveBeenCalledWith(1, 'newemail@example.com');
      expect(result.email).toBe('newemail@example.com');
      expect(result.message).toBe('Email added successfully');
    });

    it('should throw error for invalid session', async () => {
      const learnerId = 1;
      const sessionId = 'invalid-session';
      const otp = '123456';

      (learnerRepository.findEmailVerificationSessionById as jest.Mock).mockResolvedValue(null);

      await expect(learnerService.verifyEmailOTP(learnerId, sessionId, otp)).rejects.toThrow('Invalid session ID');
    });

    it('should throw error for unauthorized session access', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: 'session-123',
        learner_id: 2, // Different learner
        email: 'test@example.com',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 600000),
      };

      (learnerRepository.findEmailVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);

      await expect(learnerService.verifyEmailOTP(learnerId, sessionId, otp)).rejects.toThrow('Unauthorized access to session');
    });

    it('should throw error if session already verified', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: 'session-123',
        learner_id: 1,
        email: 'test@example.com',
        otp_hash: 'hashed-otp',
        is_verified: true,
        expires_at: new Date(Date.now() + 600000),
      };

      (learnerRepository.findEmailVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);

      await expect(learnerService.verifyEmailOTP(learnerId, sessionId, otp)).rejects.toThrow('Session already verified');
    });

    it('should throw error for expired OTP', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: 'session-123',
        learner_id: 1,
        email: 'test@example.com',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() - 10000), // Expired
      };

      (learnerRepository.findEmailVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);

      await expect(learnerService.verifyEmailOTP(learnerId, sessionId, otp)).rejects.toThrow('OTP expired');
    });

    it('should throw error for invalid OTP', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '999999';
      const mockSession = {
        id: 'session-123',
        learner_id: 1,
        email: 'test@example.com',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 600000),
      };

      (learnerRepository.findEmailVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);
      (otpUtils.verifyOTP as jest.Mock).mockResolvedValue(false);

      await expect(learnerService.verifyEmailOTP(learnerId, sessionId, otp)).rejects.toThrow('Invalid OTP');
    });
  });
});
