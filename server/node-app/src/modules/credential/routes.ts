import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticateToken } from '../../middleware/auth';
import { requireIssuer, requireLearner } from '../../middleware/role';
import {
  issueCredentialSchema,
  claimCredentialSchema,
  revokeCredentialSchema,
  getCredentialSchema,
} from './schema';
import {
  issueCredential,
  claimCredential,
  revokeCredential,
  getCredential,
  getLearnerCredentials,
  getIssuerCredentials,
  generateCredentialUid,
} from './controller';

const router = Router();

/**
 * @route   POST /credentials/issue
 * @desc    Issue a new credential (Issuer only)
 * @access  Issuer
 */
router.post(
  '/issue',
  authenticateToken,
  requireIssuer,
  validate(issueCredentialSchema),
  issueCredential
);

/**
 * @route   POST /credentials/claim
 * @desc    Claim a credential (Learner only)
 * @access  Learner
 */
router.post(
  '/claim',
  authenticateToken,
  requireLearner,
  validate(claimCredentialSchema),
  claimCredential
);

/**
 * @route   POST /credentials/revoke
 * @desc    Revoke a credential (Issuer only)
 * @access  Issuer
 */
router.post(
  '/revoke',
  authenticateToken,
  requireIssuer,
  validate(revokeCredentialSchema),
  revokeCredential
);

/**
 * @route   GET /credentials/learner/my-credentials
 * @desc    Get all credentials for authenticated learner
 * @access  Learner
 */
router.get(
  '/learner/my-credentials',
  authenticateToken,
  requireLearner,
  getLearnerCredentials
);

/**
 * @route   GET /credentials/issuer/my-credentials
 * @desc    Get all credentials issued by authenticated issuer
 * @access  Issuer
 */
router.get(
  '/issuer/my-credentials',
  authenticateToken,
  requireIssuer,
  getIssuerCredentials
);

/**
 * @route   GET /credentials/generate-uid
 * @desc    Generate a unique credential UID
 * @access  Issuer
 */
router.get(
  '/generate-uid',
  authenticateToken,
  requireIssuer,
  generateCredentialUid
);

/**
 * @route   GET /credentials/:credentialUid
 * @desc    Get credential details (Public - for verification)
 * @access  Public
 */
router.get(
  '/:credentialUid',
  validate(getCredentialSchema),
  getCredential
);

export default router;
