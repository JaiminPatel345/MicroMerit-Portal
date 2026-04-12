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
      const googleName = profile.name || '';

      // Check if learner already exists with complete profile
      let learner = await this.repository.findLearnerByEmail(email);

      if (!learner) {
        // New user - create a verification session (like email signup)
        // This allows them to complete profile, and if they don't finish,
        // they can continue later
        const session = await this.repository.createOAuthSession({
          email,
          googleProfileUrl: profilePicture,
          googleName,
          loginMethod: 'google',
        });

        // Generate temporary token (valid for 7 days for completing registration)
        const tempToken = generateAccessToken(
          { sessionId: session.id, type: 'registration' },
          '7d'
        );

        logger.info(`New Google OAuth session created: ${email}`);

        return {
          isNewUser: true,
          tempToken,
          email,
          name: googleName,
          profileUrl: profilePicture,
          loginMethod: 'google',
        };
      }

      // Existing user with complete profile
      logger.info(`Existing learner logged in via Google OAuth: ${email}`);

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
        isNewUser: false,
        learner: {
          id: learner.id,
          email: learner.email,
          name: learner.name || googleName,
          phone: learner.phone,
          profileUrl: learner.profileUrl || profilePicture,
          otherEmails: learner.other_emails,
        },
        accessToken: accessTokenJWT,
        refreshToken: refreshTokenJWT,
      };
    } catch (error) {
      logger.error('Google OAuth error:', error);
      throw new Error('Failed to authenticate with Google');
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

}
