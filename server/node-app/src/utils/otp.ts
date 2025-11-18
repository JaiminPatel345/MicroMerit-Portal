import crypto from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Generate a random numeric OTP
 * @param length - Length of OTP (default: 6)
 * @returns OTP string
 */
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
};

/**
 * Hash an OTP using bcrypt
 * @param otp - Plain OTP string
 * @returns Hashed OTP
 */
export const hashOTP = async (otp: string): Promise<string> => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  return bcrypt.hash(otp, rounds);
};

/**
 * Verify an OTP against its hash
 * @param otp - Plain OTP string
 * @param hash - Hashed OTP
 * @returns True if OTP matches, false otherwise
 */
export const verifyOTP = async (otp: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(otp, hash);
};

/**
 * Calculate OTP expiry timestamp
 * @param minutes - Minutes until expiry (default: from env or 10)
 * @returns Date object representing expiry time
 */
export const getOTPExpiry = (minutes?: number): Date => {
  const expiryMinutes = minutes || parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
};
