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
        throw new Error('Email already registered');
      }
    }

    if (phone) {
      const exists = await this.repository.isPhoneRegistered(phone);
      if (exists) {
        throw new Error('Phone number already registered');
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
      throw new Error('Invalid session ID');
    }

    // Check if already verified
    if (session.is_verified) {
      throw new Error('Session already verified');
    }

    // Check if expired
    if (new Date() > session.expires_at) {
      throw new Error('OTP expired');
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, session.otp_hash);
    if (!isValid) {
      throw new Error('Invalid OTP');
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
    input: CompleteRegistrationInput
  ) {
    // Find and validate session
    const session = await this.repository.findSessionById(sessionId);
    if (!session) {
      throw new Error('Invalid session ID');
    }

    if (!session.is_verified) {
      throw new Error('Session not verified');
    }

    if (new Date() > session.expires_at) {
      throw new Error('Session expired');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (input.password) {
      hashedPassword = await hashPassword(input.password);
    }

    // Create learner
    const learner = await this.repository.createLearner({
      email: session.email || undefined,
      phone: session.phone || undefined,
      hashedPassword,
      profileUrl: input.profilePhotoUrl,
      otherEmails: (input as any).otherEmails || undefined,
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
      },
      accessToken,
      refreshToken,
    };
  }
}
