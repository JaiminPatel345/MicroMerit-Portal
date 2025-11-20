import { RegistrationRepository } from './repository';
import { generateOTP, hashOTP, verifyOTP, getOTPExpiry } from '../../utils/otp';
import { sendOTP } from '../../utils/notification';
import { hashPassword } from '../../utils/bcrypt';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import {
  StartRegistrationInput,
  VerifyOTPInput,
  CompleteRegistrationInput,
} from './schema';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors';
import { handleProfilePhotoFileUpload } from '../../utils/imageUpload';
import { logger } from '../../utils/logger';

export class RegistrationService {
  private repository: RegistrationRepository;

  constructor(repository: RegistrationRepository) {
    this.repository = repository;
  }

  /**
   * Step 1: Start registration and send OTP
   */
  async startRegistration(input: StartRegistrationInput) {
    const { email, phone } = input;

    // Determine verification method
    const verificationMethod = email ? 'email' : 'phone';
    const recipient = email || phone!;

    // Check if already registered
    if (email) {
      const exists = await this.repository.isEmailRegistered(email);
      if (exists) {
        throw new ConflictError('Email already registered', 409, 'EMAIL_ALREADY_REGISTERED');
      }
    }

    if (phone) {
      const exists = await this.repository.isPhoneRegistered(phone);
      if (exists) {
        throw new ConflictError('Phone number already registered', 409, 'PHONE_ALREADY_REGISTERED');
      }
    }

    // Generate OTP
    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);
    const expiresAt = getOTPExpiry();

    // Create session
    const session = await this.repository.createSession({
      email,
      phone,
      otpHash,
      verificationMethod,
      expiresAt,
    });

    // Send OTP
    await sendOTP(verificationMethod, recipient, otp);

    return {
      sessionId: session.id,
      message: `OTP sent to ${verificationMethod === 'email' ? 'email' : 'phone'}`,
      expiresAt: session.expires_at,
    };
  }

  /**
   * Step 2: Verify OTP
   */
  async verifyOTP(input: VerifyOTPInput) {
    const { sessionId, otp } = input;

    // Find session
    const session = await this.repository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('Invalid session ID', 404, 'SESSION_NOT_FOUND');
    }

    // Check if already verified
    if (session.is_verified) {
      throw new ValidationError('Session already verified', 400, 'SESSION_ALREADY_VERIFIED');
    }

    // Check if expired
    if (new Date() > session.expires_at) {
      throw new ValidationError('OTP expired', 400, 'OTP_EXPIRED');
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, session.otp_hash);
    if (!isValid) {
      throw new ValidationError('Invalid OTP', 400, 'INVALID_OTP');
    }

    // Mark as verified
    await this.repository.markSessionAsVerified(sessionId);

    // Generate temporary token (valid for 15 minutes for completing registration)
    const tempToken = generateAccessToken(
      { sessionId, type: 'registration' },
      '15m'
    );

    return {
      message: 'OTP verified successfully',
      tempToken,
    };
  }

  /**
   * Step 3: Complete registration
   */
  async completeRegistration(
    sessionId: string,
    input: CompleteRegistrationInput,
    profilePhotoFile?: Express.Multer.File
  ) {
    // Find and validate session
    const session = await this.repository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('Invalid session ID', 404, 'SESSION_NOT_FOUND');
    }

    if (!session.is_verified) {
      throw new ValidationError('Session not verified', 400, 'SESSION_NOT_VERIFIED');
    }

    if (new Date() > session.expires_at) {
      throw new ValidationError('Session expired', 400, 'SESSION_EXPIRED');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (input.password) {
      hashedPassword = await hashPassword(input.password);
    }

    // Handle profile photo upload (multipart file upload)
    let profilePhotoUrl: string | undefined;
    if (profilePhotoFile) {
      try {
        // Generate temporary learner ID for folder structure
        const tempLearnerId = `temp-${sessionId.substring(0, 8)}`;
        profilePhotoUrl = await handleProfilePhotoFileUpload(
          profilePhotoFile,
          tempLearnerId
        );
        logger.info('Profile photo uploaded', { sessionId, hasPhoto: !!profilePhotoUrl });
      } catch (error: any) {
        logger.error('Profile photo upload failed', { error: error.message });
        throw new ValidationError(
          `Profile photo upload failed: ${error.message}`,
          400,
          'PROFILE_PHOTO_UPLOAD_FAILED'
        );
      }
    }

    // Create learner
    const learner = await this.repository.createLearner({
      email: session.email || undefined,
      phone: session.phone || undefined,
      hashedPassword,
      profileUrl: profilePhotoUrl,
      otherEmails: [], // Initialize with empty array
      dob: input.dob ? new Date(input.dob) : undefined,
      gender: input.gender,
    });

    logger.info('Learner registration completed', { 
      learnerId: learner.id, 
      email: learner.email,
      phone: learner.phone,
      hasProfilePhoto: !!profilePhotoUrl
    });

    // Generate tokens
    const accessToken = generateAccessToken(
      { id: learner.id, role: 'learner' },
      process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m'
    );
    const refreshToken = generateRefreshToken(
      { id: learner.id, role: 'learner' },
      process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d'
    );

    return {
      message: 'Registration completed successfully',
      learner: {
        id: learner.id,
        email: learner.email,
        phone: learner.phone,
        profileUrl: learner.profileUrl,
        otherEmails: learner.other_emails,
        dob: learner.dob,
        gender: learner.gender,
      },
      accessToken,
      refreshToken,
    };
  }
}
