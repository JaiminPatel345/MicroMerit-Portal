import axios from 'axios';
import { OAuthRepository } from './repository';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';

export class OAuthService {
  private repository: OAuthRepository;

  constructor(repository: OAuthRepository) {
    this.repository = repository;
  }

  /**
   * Handle Google OAuth callback
   * Exchange code for tokens, get user profile, and create/login learner
   */
  async handleGoogleCallback(code: string) {
    try {
      // Exchange authorization code for access token
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      });

      const { access_token } = tokenResponse.data;

      // Fetch user profile from Google
      const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const profile = profileResponse.data;
      const email = profile.email;
      const profilePicture = profile.picture;

      // Check if learner already exists
      let learner = await this.repository.findLearnerByEmail(email);

      if (!learner) {
        // Create new learner (auto-complete registration)
        learner = await this.repository.createLearner({
          email,
          profileUrl: profilePicture,
          otherEmails: [],
          // No password for OAuth users
        });

        logger.info(`New learner created via Google OAuth: ${email}`);
      } else {
        logger.info(`Existing learner logged in via Google OAuth: ${email}`);
      }

      // Claim any pre-issued (unclaimed) credentials for this email
      try {
        const result = await this.repository.claimCredentials(learner.id, email);
        if (result.count > 0) {
          logger.info('Claimed existing credentials for learner (Google OAuth)', {
            learnerId: learner.id,
            email,
            count: result.count
          });
        }
      } catch (error: any) {
        logger.error('Failed to claim credentials during Google OAuth', {
          learnerId: learner.id,
          error: error.message
        });
      }

      // Generate tokens
      const accessTokenJWT = generateAccessToken(
        { id: learner.id, role: 'learner' },
        process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m'
      );
      const refreshTokenJWT = generateRefreshToken(
        { id: learner.id, role: 'learner' },
        process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d'
      );

      return {
        learner: {
          id: learner.id,
          email: learner.email,
          phone: learner.phone,
          profileUrl: learner.profileUrl,
          otherEmails: learner.other_emails,
        },
        accessToken: accessTokenJWT,
        refreshToken: refreshTokenJWT,
        isNewUser: !learner.created_at ||
          (new Date().getTime() - new Date(learner.created_at).getTime() < 5000),
      };
    } catch (error) {
      logger.error('Google OAuth error:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  /**
   * Handle DigiLocker OAuth callback
   * Exchange code for tokens, get user profile, fetch certificates, and create/login learner
   */
  async handleDigilockerCallback(code: string) {
    try {
      // Exchange authorization code for access token
      const tokenResponse = await axios.post(
        'https://api.digitallocker.gov.in/public/oauth2/1/token',
        new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: process.env.DIGILOCKER_CLIENT_ID || '',
          client_secret: process.env.DIGILOCKER_CLIENT_SECRET || '',
          redirect_uri: process.env.DIGILOCKER_CALLBACK_URL || '',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token } = tokenResponse.data;

      // Fetch user profile from DigiLocker
      const profileResponse = await axios.get(
        'https://api.digitallocker.gov.in/public/oauth2/1/user',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const profile = profileResponse.data;
      const digilockerId = profile.digilockerid || profile.id;
      const email = profile.email;
      const phone = profile.mobile;

      // Check if learner already exists (by DigiLocker ID, email, or phone)
      let learner = await this.repository.findLearnerByDigilockerId(digilockerId);

      if (!learner && email) {
        learner = await this.repository.findLearnerByEmail(email);
      }

      if (!learner && phone) {
        learner = await this.repository.findLearnerByPhone(phone);
      }

      let credentials: any[] = [];

      // Fetch certificates from DigiLocker
      try {
        const certificatesResponse = await axios.get(
          process.env.DIGILOCKER_FETCH_URL || 'https://api.digitallocker.gov.in/public/oauth2/1/files',
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );

        credentials = certificatesResponse.data.items || [];
        logger.info(`Fetched ${credentials.length} certificates from DigiLocker`);
      } catch (certError) {
        logger.warn('Failed to fetch certificates from DigiLocker:', certError);
        // Continue even if certificate fetch fails
      }

      if (!learner) {
        // Create new learner
        learner = await this.repository.createLearner({
          email: email || undefined,
          phone: phone || undefined,
          externalDigilockerId: digilockerId,
          otherEmails: [],
        });

        logger.info(`New learner created via DigiLocker OAuth: ${digilockerId}`);
      } else if (!learner.external_digilocker_id) {
        // Update existing learner with DigiLocker ID
        await this.repository.updateLearner(learner.id, {
          externalDigilockerId: digilockerId,
        });
        logger.info(`Existing learner linked with DigiLocker: ${digilockerId}`);
      }

      // Claim any pre-issued (unclaimed) credentials for this email
      if (email) {
        try {
          const result = await this.repository.claimCredentials(learner.id, email);
          if (result.count > 0) {
            logger.info('Claimed existing credentials for learner (DigiLocker OAuth)', {
              learnerId: learner.id,
              email,
              count: result.count
            });
          }
        } catch (error: any) {
          logger.error('Failed to claim credentials during DigiLocker OAuth', {
            learnerId: learner.id,
            error: error.message
          });
        }
      }

      // TODO: Save credentials to database
      // Note: As per requirements, we DO NOT call AI service here
      // Credentials are saved in the credential table but not processed by AI
      // This will be implemented in the credential module

      // Generate tokens
      const accessTokenJWT = generateAccessToken(
        { id: learner.id, role: 'learner' },
        process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m'
      );
      const refreshTokenJWT = generateRefreshToken(
        { id: learner.id, role: 'learner' },
        process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d'
      );

      return {
        learner: {
          id: learner.id,
          email: learner.email,
          phone: learner.phone,
          profileUrl: learner.profileUrl,
          otherEmails: learner.other_emails,
          digilockerId: learner.external_digilocker_id,
        },
        accessToken: accessTokenJWT,
        refreshToken: refreshTokenJWT,
        certificatesCount: credentials.length,
        isNewUser: !learner.created_at ||
          (new Date().getTime() - new Date(learner.created_at).getTime() < 5000),
      };
    } catch (error) {
      logger.error('DigiLocker OAuth error:', error);
      throw new Error('Failed to authenticate with DigiLocker');
    }
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getGoogleAuthUrl() {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Generate DigiLocker OAuth authorization URL
   */
  getDigilockerAuthUrl() {
    const params = new URLSearchParams({
      client_id: process.env.DIGILOCKER_CLIENT_ID || '',
      redirect_uri: process.env.DIGILOCKER_CALLBACK_URL || '',
      response_type: 'code',
      state: Math.random().toString(36).substring(7), // Random state for CSRF protection
    });

    return `https://api.digitallocker.gov.in/public/oauth2/1/authorize?${params.toString()}`;
  }
}
