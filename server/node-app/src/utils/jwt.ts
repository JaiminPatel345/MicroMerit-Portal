import jwt, { SignOptions } from 'jsonwebtoken';

export interface JWTPayload {
  id: number;
  email: string;
  role: 'admin' | 'issuer' | 'learner';
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key';
const JWT_ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m';
const JWT_REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Generate access and refresh tokens
 */
export const generateTokens = (payload: JWTPayload): TokenResponse => {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_TOKEN_EXPIRY,
  } as SignOptions);

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_TOKEN_EXPIRY,
  } as SignOptions);

  return { accessToken, refreshToken };
};

/**
 * Generate access token with custom payload and expiry
 */
export const generateAccessToken = (payload: any, expiresIn?: string): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn || JWT_ACCESS_TOKEN_EXPIRY,
  } as SignOptions);
};

/**
 * Generate refresh token with custom payload and expiry
 */
export const generateRefreshToken = (payload: any, expiresIn?: string): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: expiresIn || JWT_REFRESH_TOKEN_EXPIRY,
  } as SignOptions);
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode token without verification (useful for debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
