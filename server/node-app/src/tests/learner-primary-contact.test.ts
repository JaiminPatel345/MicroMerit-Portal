import { learnerService } from '../modules/learner/service';
import { learnerRepository } from '../modules/learner/repository';

// Mock dependencies
jest.mock('../modules/learner/repository');
jest.mock('../utils/otp');
jest.mock('../utils/notification');

const mockOtpUtils = require('../utils/otp');
const mockNotification = require('../utils/notification');

describe('Learner Primary Contact Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestAddPrimaryEmail', () => {
    it('should send OTP to email for phone-registered user', async () => {
      const learnerId = 1;
      const email = 'newemail@example.com';
      const mockLearner = {
        id: learnerId,
        phone: '+1234567890',
        email: null, // No primary email
        other_emails: [],
        status: 'active',
      };
      const mockSession = {
        id: 'session-123',
        learner_id: learnerId,
        contact_type: 'email',
        contact_value: email,
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        created_at: new Date(),
      };

      (learnerRepository.findById as jest.Mock).mockResolvedValue(mockLearner);
      (learnerRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (learnerRepository.createPrimaryContactVerificationSession as jest.Mock).mockResolvedValue(mockSession);
      mockOtpUtils.generateOTP.mockReturnValue('123456');
      mockOtpUtils.hashOTP.mockResolvedValue('hashed-otp');
      mockOtpUtils.getOTPExpiry.mockReturnValue(mockSession.expires_at);
      mockNotification.sendOTP.mockResolvedValue(true);

      const result = await learnerService.requestAddPrimaryEmail(learnerId, email);

      expect(learnerRepository.findById).toHaveBeenCalledWith(learnerId);
      expect(learnerRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(learnerRepository.createPrimaryContactVerificationSession).toHaveBeenCalledWith({
        learnerId,
        contactType: 'email',
        contactValue: email,
        otpHash: 'hashed-otp',
        expiresAt: mockSession.expires_at,
      });
      expect(mockNotification.sendOTP).toHaveBeenCalledWith('email', email, '123456');
      expect(result).toEqual({
        sessionId: 'session-123',
        message: 'OTP sent to email',
        expiresAt: mockSession.expires_at,
      });
    });

    it('should throw error if learner already has primary email', async () => {
      const learnerId = 1;
      const email = 'newemail@example.com';
      const mockLearner = {
        id: learnerId,
        email: 'existing@example.com', // Already has email
        phone: '+1234567890',
        other_emails: [],
        status: 'active',
      };

      (learnerRepository.findById as jest.Mock).mockResolvedValue(mockLearner);

      await expect(learnerService.requestAddPrimaryEmail(learnerId, email)).rejects.toThrow(
        'Primary email already exists. Use add-email endpoint to add additional emails.'
      );
    });

    it('should throw error if email is already registered', async () => {
      const learnerId = 1;
      const email = 'existing@example.com';
      const mockLearner = {
        id: learnerId,
        phone: '+1234567890',
        email: null,
        other_emails: [],
        status: 'active',
      };
      const mockExistingLearner = {
        id: 2,
        email: 'existing@example.com',
        phone: null,
      };

      (learnerRepository.findById as jest.Mock).mockResolvedValue(mockLearner);
      (learnerRepository.findByEmail as jest.Mock).mockResolvedValue(mockExistingLearner);

      await expect(learnerService.requestAddPrimaryEmail(learnerId, email)).rejects.toThrow(
        'Email is already registered'
      );
    });

    it('should throw error if learner not found', async () => {
      const learnerId = 999;
      const email = 'test@example.com';

      (learnerRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(learnerService.requestAddPrimaryEmail(learnerId, email)).rejects.toThrow(
        'Learner not found'
      );
    });
  });

  describe('verifyPrimaryEmailOTP', () => {
    it('should verify OTP and add primary email', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const email = 'newemail@example.com';
      const mockSession = {
        id: sessionId,
        learner_id: learnerId,
        contact_type: 'email',
        contact_value: email,
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        created_at: new Date(),
      };
      const mockUpdatedLearner = {
        id: learnerId,
        email: email,
        phone: '+1234567890',
        other_emails: [],
        status: 'active',
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);
      mockOtpUtils.verifyOTP.mockResolvedValue(true);
      (learnerRepository.markPrimaryContactVerificationSessionAsVerified as jest.Mock).mockResolvedValue({
        ...mockSession,
        is_verified: true,
        verified_at: new Date(),
      });
      (learnerRepository.updateLearnerPrimaryEmail as jest.Mock).mockResolvedValue(mockUpdatedLearner);

      const result = await learnerService.verifyPrimaryEmailOTP(learnerId, sessionId, otp);

      expect(learnerRepository.findPrimaryContactVerificationSessionById).toHaveBeenCalledWith(sessionId);
      expect(mockOtpUtils.verifyOTP).toHaveBeenCalledWith(otp, 'hashed-otp');
      expect(learnerRepository.markPrimaryContactVerificationSessionAsVerified).toHaveBeenCalledWith(sessionId);
      expect(learnerRepository.updateLearnerPrimaryEmail).toHaveBeenCalledWith(learnerId, email);
      expect(result).toEqual({
        email: email,
        message: 'Primary email added successfully',
      });
    });

    it('should throw error if session not found', async () => {
      const learnerId = 1;
      const sessionId = 'invalid-session';
      const otp = '123456';

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(null);

      await expect(learnerService.verifyPrimaryEmailOTP(learnerId, sessionId, otp)).rejects.toThrow(
        'Invalid session ID'
      );
    });

    it('should throw error if session does not belong to learner', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: sessionId,
        learner_id: 2, // Different learner
        contact_type: 'email',
        contact_value: 'test@example.com',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);

      await expect(learnerService.verifyPrimaryEmailOTP(learnerId, sessionId, otp)).rejects.toThrow(
        'Unauthorized access to session'
      );
    });

    it('should throw error if contact type is not email', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: sessionId,
        learner_id: learnerId,
        contact_type: 'phone', // Wrong type
        contact_value: '+1234567890',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);

      await expect(learnerService.verifyPrimaryEmailOTP(learnerId, sessionId, otp)).rejects.toThrow(
        'Invalid session type'
      );
    });

    it('should throw error if session already verified', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: sessionId,
        learner_id: learnerId,
        contact_type: 'email',
        contact_value: 'test@example.com',
        otp_hash: 'hashed-otp',
        is_verified: true, // Already verified
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);

      await expect(learnerService.verifyPrimaryEmailOTP(learnerId, sessionId, otp)).rejects.toThrow(
        'Session already verified'
      );
    });

    it('should throw error if OTP expired', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: sessionId,
        learner_id: learnerId,
        contact_type: 'email',
        contact_value: 'test@example.com',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() - 1000), // Expired
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);

      await expect(learnerService.verifyPrimaryEmailOTP(learnerId, sessionId, otp)).rejects.toThrow('OTP expired');
    });

    it('should throw error if OTP is invalid', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: sessionId,
        learner_id: learnerId,
        contact_type: 'email',
        contact_value: 'test@example.com',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);
      mockOtpUtils.verifyOTP.mockResolvedValue(false);

      await expect(learnerService.verifyPrimaryEmailOTP(learnerId, sessionId, otp)).rejects.toThrow('Invalid OTP');
    });
  });

  describe('requestAddPrimaryPhone', () => {
    it('should send OTP to phone for email-registered user', async () => {
      const learnerId = 1;
      const phone = '+1234567890';
      const mockLearner = {
        id: learnerId,
        email: 'existing@example.com',
        phone: null, // No primary phone
        other_emails: [],
        status: 'active',
      };
      const mockSession = {
        id: 'session-123',
        learner_id: learnerId,
        contact_type: 'phone',
        contact_value: phone,
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        created_at: new Date(),
      };

      (learnerRepository.findById as jest.Mock).mockResolvedValue(mockLearner);
      (learnerRepository.findByPhone as jest.Mock).mockResolvedValue(null);
      (learnerRepository.createPrimaryContactVerificationSession as jest.Mock).mockResolvedValue(mockSession);
      mockOtpUtils.generateOTP.mockReturnValue('123456');
      mockOtpUtils.hashOTP.mockResolvedValue('hashed-otp');
      mockOtpUtils.getOTPExpiry.mockReturnValue(mockSession.expires_at);
      mockNotification.sendOTP.mockResolvedValue(true);

      const result = await learnerService.requestAddPrimaryPhone(learnerId, phone);

      expect(learnerRepository.findById).toHaveBeenCalledWith(learnerId);
      expect(learnerRepository.findByPhone).toHaveBeenCalledWith(phone);
      expect(learnerRepository.createPrimaryContactVerificationSession).toHaveBeenCalledWith({
        learnerId,
        contactType: 'phone',
        contactValue: phone,
        otpHash: 'hashed-otp',
        expiresAt: mockSession.expires_at,
      });
      expect(mockNotification.sendOTP).toHaveBeenCalledWith('sms', phone, '123456');
      expect(result).toEqual({
        sessionId: 'session-123',
        message: 'OTP sent to phone',
        expiresAt: mockSession.expires_at,
      });
    });

    it('should throw error if learner already has primary phone', async () => {
      const learnerId = 1;
      const phone = '+1234567890';
      const mockLearner = {
        id: learnerId,
        email: 'existing@example.com',
        phone: '+0987654321', // Already has phone
        other_emails: [],
        status: 'active',
      };

      (learnerRepository.findById as jest.Mock).mockResolvedValue(mockLearner);

      await expect(learnerService.requestAddPrimaryPhone(learnerId, phone)).rejects.toThrow(
        'Primary phone already exists.'
      );
    });

    it('should throw error if phone is already registered', async () => {
      const learnerId = 1;
      const phone = '+1234567890';
      const mockLearner = {
        id: learnerId,
        email: 'existing@example.com',
        phone: null,
        other_emails: [],
        status: 'active',
      };
      const mockExistingLearner = {
        id: 2,
        phone: '+1234567890',
        email: null,
      };

      (learnerRepository.findById as jest.Mock).mockResolvedValue(mockLearner);
      (learnerRepository.findByPhone as jest.Mock).mockResolvedValue(mockExistingLearner);

      await expect(learnerService.requestAddPrimaryPhone(learnerId, phone)).rejects.toThrow(
        'Phone is already registered'
      );
    });

    it('should throw error if learner not found', async () => {
      const learnerId = 999;
      const phone = '+1234567890';

      (learnerRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(learnerService.requestAddPrimaryPhone(learnerId, phone)).rejects.toThrow('Learner not found');
    });
  });

  describe('verifyPrimaryPhoneOTP', () => {
    it('should verify OTP and add primary phone', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const phone = '+1234567890';
      const mockSession = {
        id: sessionId,
        learner_id: learnerId,
        contact_type: 'phone',
        contact_value: phone,
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        created_at: new Date(),
      };
      const mockUpdatedLearner = {
        id: learnerId,
        email: 'existing@example.com',
        phone: phone,
        other_emails: [],
        status: 'active',
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);
      mockOtpUtils.verifyOTP.mockResolvedValue(true);
      (learnerRepository.markPrimaryContactVerificationSessionAsVerified as jest.Mock).mockResolvedValue({
        ...mockSession,
        is_verified: true,
        verified_at: new Date(),
      });
      (learnerRepository.updateLearnerPrimaryPhone as jest.Mock).mockResolvedValue(mockUpdatedLearner);

      const result = await learnerService.verifyPrimaryPhoneOTP(learnerId, sessionId, otp);

      expect(learnerRepository.findPrimaryContactVerificationSessionById).toHaveBeenCalledWith(sessionId);
      expect(mockOtpUtils.verifyOTP).toHaveBeenCalledWith(otp, 'hashed-otp');
      expect(learnerRepository.markPrimaryContactVerificationSessionAsVerified).toHaveBeenCalledWith(sessionId);
      expect(learnerRepository.updateLearnerPrimaryPhone).toHaveBeenCalledWith(learnerId, phone);
      expect(result).toEqual({
        phone: phone,
        message: 'Primary phone added successfully',
      });
    });

    it('should throw error if session not found', async () => {
      const learnerId = 1;
      const sessionId = 'invalid-session';
      const otp = '123456';

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(null);

      await expect(learnerService.verifyPrimaryPhoneOTP(learnerId, sessionId, otp)).rejects.toThrow(
        'Invalid session ID'
      );
    });

    it('should throw error if session does not belong to learner', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: sessionId,
        learner_id: 2, // Different learner
        contact_type: 'phone',
        contact_value: '+1234567890',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);

      await expect(learnerService.verifyPrimaryPhoneOTP(learnerId, sessionId, otp)).rejects.toThrow(
        'Unauthorized access to session'
      );
    });

    it('should throw error if contact type is not phone', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: sessionId,
        learner_id: learnerId,
        contact_type: 'email', // Wrong type
        contact_value: 'test@example.com',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);

      await expect(learnerService.verifyPrimaryPhoneOTP(learnerId, sessionId, otp)).rejects.toThrow(
        'Invalid session type'
      );
    });

    it('should throw error if session already verified', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: sessionId,
        learner_id: learnerId,
        contact_type: 'phone',
        contact_value: '+1234567890',
        otp_hash: 'hashed-otp',
        is_verified: true, // Already verified
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);

      await expect(learnerService.verifyPrimaryPhoneOTP(learnerId, sessionId, otp)).rejects.toThrow(
        'Session already verified'
      );
    });

    it('should throw error if OTP expired', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: sessionId,
        learner_id: learnerId,
        contact_type: 'phone',
        contact_value: '+1234567890',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() - 1000), // Expired
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);

      await expect(learnerService.verifyPrimaryPhoneOTP(learnerId, sessionId, otp)).rejects.toThrow('OTP expired');
    });

    it('should throw error if OTP is invalid', async () => {
      const learnerId = 1;
      const sessionId = 'session-123';
      const otp = '123456';
      const mockSession = {
        id: sessionId,
        learner_id: learnerId,
        contact_type: 'phone',
        contact_value: '+1234567890',
        otp_hash: 'hashed-otp',
        is_verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      };

      (learnerRepository.findPrimaryContactVerificationSessionById as jest.Mock).mockResolvedValue(mockSession);
      mockOtpUtils.verifyOTP.mockResolvedValue(false);

      await expect(learnerService.verifyPrimaryPhoneOTP(learnerId, sessionId, otp)).rejects.toThrow('Invalid OTP');
    });
  });
});
