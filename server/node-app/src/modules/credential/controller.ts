import { Request, Response, NextFunction } from 'express';
import { CredentialService } from './service';
import { CredentialRepository } from './repository';
import { IssueCredentialInput, ClaimCredentialInput, RevokeCredentialInput } from './schema';
import { sendSuccess } from '../../utils/response';

const repository = new CredentialRepository();
const service = new CredentialService(repository);

/**
 * Controller: Issue Credential (Issuer only)
 * POST /credentials/issue
 */
export const issueCredential = async (
  req: Request<{}, {}, IssueCredentialInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const issuerId = (req as any).user.id; // From auth middleware
    const result = await service.issueCredential(issuerId, req.body);
    sendSuccess(res, result, 'Credential issued successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Claim Credential (Learner only)
 * POST /credentials/claim
 */
export const claimCredential = async (
  req: Request<{}, {}, ClaimCredentialInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const learnerId = (req as any).user.id; // From auth middleware
    const result = await service.claimCredential(learnerId, req.body);
    sendSuccess(res, result, 'Credential claimed successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Revoke Credential (Issuer only)
 * POST /credentials/revoke
 */
export const revokeCredential = async (
  req: Request<{}, {}, RevokeCredentialInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const issuerId = (req as any).user.id; // From auth middleware
    const result = await service.revokeCredential(issuerId, req.body);
    sendSuccess(res, result, 'Credential revoked successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get Credential Details
 * GET /credentials/:credentialUid
 */
export const getCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { credentialUid } = req.params;
    if (!credentialUid) {
      throw new Error('Credential UID is required');
    }
    const result = await service.getCredential(credentialUid);
    sendSuccess(res, result, 'Credential retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get Learner Credentials
 * GET /credentials/learner/my-credentials
 */
export const getLearnerCredentials = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const learnerId = (req as any).user.id; // From auth middleware
    const result = await service.getLearnerCredentials(learnerId);
    sendSuccess(res, result, 'Credentials retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get Issuer Credentials
 * GET /credentials/issuer/my-credentials
 */
export const getIssuerCredentials = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const issuerId = (req as any).user.id; // From auth middleware
    const result = await service.getIssuerCredentials(issuerId);
    sendSuccess(res, result, 'Credentials retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Generate Credential UID
 * GET /credentials/generate-uid
 */
export const generateCredentialUid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const uid = service.generateCredentialUid();
    sendSuccess(res, { credentialUid: uid }, 'Credential UID generated', 200);
  } catch (error) {
    next(error);
  }
};
