/**
 * On-Demand Issuer Connectors
 *
 * These configs define how to call external issuer endpoints on-demand
 * (triggered by a learner adding a certificate — NOT an automated scheduler).
 *
 * Each connector defines:
 *  - id / name / issuerId: identity
 *  - buildUrl(credentialId): constructs the request URL
 *  - normalize(data): maps issuer-specific field names to our canonical format
 *  - verify(data, loggedInEmail): checks if the credential belongs to the learner.
 *    Default: simple email comparison. Override for issuers with custom verification
 *    (e.g., Credly uses hash-based matching).
 */

import crypto from 'crypto';
import axios from 'axios';
import { logger } from '../../utils/logger';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors';

export interface OnDemandCredential {
  learner_email: string;
  learner_name?: string;
  title: string;
  issued_date: string;
  description?: string;
  /** Base64-encoded PDF. Optional — if absent, the service generates a PDF from metadata. */
  pdf_base64?: string;
  issuer_name: string;
  external_id: string;
  /** Extra metadata (skills, badge image, etc.) from the issuer */
  extra?: Record<string, any>;
  raw_data: any;
}

export interface OnDemandConnector {
  id: string;
  name: string;
  /** DB issuer ID for this platform. Must match an existing issuer in the DB. */
  issuerId: number;
  buildUrl(credentialId: string): string;
  normalize(rawData: any): OnDemandCredential;
  /**
   * Verify that this credential belongs to the logged-in learner.
   * Default: simple case-insensitive email comparison.
   * Override for platforms that use other verification (hash, token, etc.)
   */
  verify(rawData: any, loggedInEmail: string): boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Connector
// Field names: learner_email, learner_name, title, issued_date
// ─────────────────────────────────────────────────────────────────────────────
const googleConnector: OnDemandConnector = {
  id: 'google',
  name: 'Google',
  issuerId: parseInt(process.env.GOOGLE_DUMMY_ISSUER_ID || '0', 10),

  buildUrl(credentialId) {
    const baseUrl = process.env.GOOGLE_DUMMY_BASE_URL || 'http://localhost:4000';
    return `${baseUrl}/google/${credentialId}`;
  },

  normalize(rawData) {
    const d = rawData.data;
    return {
      learner_email:  d.learner_email,
      learner_name:   d.learner_name,
      title:          d.title,
      issued_date:    d.issued_date,
      description:    d.description,
      pdf_base64:     d.pdf_base64,
      issuer_name:    'Google',
      external_id:    String(d.id),
      raw_data:       d,
    };
  },

  verify(rawData, loggedInEmail) {
    // Default: email comparison (case-insensitive)
    const credEmail = rawData?.data?.learner_email || '';
    return credEmail.toLowerCase().trim() === loggedInEmail.toLowerCase().trim();
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Udemy Connector
// Field names: student_email, student_name, course_title, completion_date
// ─────────────────────────────────────────────────────────────────────────────
const udemyConnector: OnDemandConnector = {
  id: 'udemy',
  name: 'Udemy',
  issuerId: parseInt(process.env.UDEMY_DUMMY_ISSUER_ID || '0', 10),

  buildUrl(credentialId) {
    const baseUrl = process.env.UDEMY_DUMMY_BASE_URL || 'http://localhost:4000';
    return `${baseUrl}/udemy/${credentialId}`;
  },

  normalize(rawData) {
    const d = rawData.data;
    return {
      // Field mapping: student_email → learner_email, course_title → title, etc.
      learner_email:  d.student_email,
      learner_name:   d.student_name,
      title:          d.course_title,
      issued_date:    d.completion_date,
      description:    d.course_description,
      pdf_base64:     d.pdf_base64,
      issuer_name:    'Udemy',
      external_id:    String(d.id),
      raw_data:       d,
    };
  },

  verify(rawData, loggedInEmail) {
    // Default: email comparison using udemy's "student_email" field
    const credEmail = rawData?.data?.student_email || '';
    return credEmail.toLowerCase().trim() === loggedInEmail.toLowerCase().trim();
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Jaimin Pvt Ltd Connector
// Field names: trainee_email, trainee_name, program_name, awarded_on
// ─────────────────────────────────────────────────────────────────────────────
const jaiminPrivateConnector: OnDemandConnector = {
  id: 'jaimin',
  name: 'Jaimin Pvt Ltd',
  issuerId: parseInt(process.env.JAIMIN_DUMMY_ISSUER_ID || '0', 10),

  buildUrl(credentialId) {
    const baseUrl = process.env.JAIMIN_DUMMY_BASE_URL || 'http://localhost:4000';
    return `${baseUrl}/jaimin/${credentialId}`;
  },

  normalize(rawData) {
    const d = rawData.data;
    return {
      // Field mapping: trainee_email → learner_email, program_name → title, etc.
      learner_email:  d.trainee_email,
      learner_name:   d.trainee_name,
      title:          d.program_name,
      issued_date:    d.awarded_on,
      description:    d.program_desc,
      pdf_base64:     d.pdf_base64,
      issuer_name:    'Jaimin Pvt Ltd',
      external_id:    String(d.id),
      raw_data:       d,
    };
  },

  verify(rawData, loggedInEmail) {
    // Default: email comparison using jaimin's "trainee_email" field
    const credEmail = rawData?.data?.trainee_email || '';
    return credEmail.toLowerCase().trim() === loggedInEmail.toLowerCase().trim();
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Credly Connector (REAL PUBLIC API — no auth required)
//
// OBI v2 Badge Assertion endpoint:
//   GET https://api.credly.com/v1/obi/v2/badge_assertions/{UUID}
//
//   The assertion response contains `badge` as a URL (not inline).
//   We must follow that URL to fetch the BadgeClass which has:
//     - name (badge title e.g. "The Basics of Google Cloud Compute Skill Badge")
//     - description
//     - image.id (badge image PNG URL)
//     - tags (skills)
//     - issuer.name (org name e.g. "Google Cloud")
//
// UUID = the badge UUID from a Credly badge URL:
//   https://www.credly.com/badges/{UUID}
//
// Verification: recipient.identity = "sha256$<hash>"
//   Compare sha256(loggedInEmail.toLowerCase()) to the hash.
//
// NOTE: Credly returns JSON metadata only (no PDF).
//   The onDemandCertService generates a PDF from the badge image.
//
// DB: Credly issuer ID = 2 (hardcoded fallback, env: CREDLY_ISSUER_ID)
// ─────────────────────────────────────────────────────────────────────────────
const credlyConnector: OnDemandConnector = {
  id: 'credly',
  name: 'Credly',
  // Hardcoded fallback=2 — Credly issuer (ID=2) was inserted manually into DB.
  issuerId: parseInt(process.env.CREDLY_ISSUER_ID || '2', 10),

  buildUrl(credentialId) {
    // credentialId = the badge UUID from a Credly badge URL
    return `https://api.credly.com/v1/obi/v2/badge_assertions/${credentialId}`;
  },

  normalize(rawData) {
    // rawData = { assertion, badgeClass } — both fetched by fetchFromExternalIssuer (2-step)
    const assertion = rawData.assertion;
    const badgeClass = rawData.badgeClass || {};

    const issued = assertion.issuedOn || assertion.issued_on || '';
    const issuerOrg = badgeClass.issuer || {};

    // Badge image: OBI v2 returns image as { id: "url" } or a plain string
    const imageId = typeof badgeClass.image === 'object'
      ? (badgeClass.image?.id || '')
      : (badgeClass.image || '');

    // Skills/tags array from badge class
    const skills: string[] = badgeClass.tags || [];

    // Issuer org name (e.g. "Google Cloud"), falls back to "Credly"
    const issuerOrgName = issuerOrg.name || 'Credly';

    return {
      learner_email:  '', // Not available in plain text — verified via hash
      learner_name:   assertion.recipientProfile?.name || assertion.recipient_profile?.name || '',
      title:          badgeClass.name || 'Credly Badge',
      issued_date:    typeof issued === 'string' ? issued.substring(0, 10) : String(issued),
      description:    badgeClass.description || '',
      // No pdf_base64 — service generates PDF from badge image
      issuer_name:    issuerOrgName,
      external_id:    assertion.uid || (typeof assertion.id === 'string' ? assertion.id : '') || '',
      extra: {
        badge_image_url: imageId,
        skills,
        credly_badge_url: typeof assertion.id === 'string' ? assertion.id : '',
      },
      raw_data: rawData,
    };
  },

  verify(rawData, loggedInEmail) {
    // Credly stores hashed email: "sha256$<hex-hash>"
    const assertion = rawData.assertion || rawData;
    const identity: string = assertion?.recipient?.identity || assertion?.recipientProfile?.identity || '';
    if (!identity.startsWith('sha256$')) {
      logger.warn('[Credly] recipient.identity is not a sha256 hash — cannot verify', { identity });
      return false;
    }

    const storedHash = identity.replace('sha256$', '').trim();
    // Hash the logged-in email (lowercase, no salt — Credly spec)
    const computedHash = crypto
      .createHash('sha256')
      .update(loggedInEmail.toLowerCase().trim())
      .digest('hex');

    const match = computedHash === storedHash;
    logger.debug('[Credly] Email hash verification', { match, storedHash: storedHash.substring(0, 12) + '...' });
    return match;
  },
};

// Registry of all on-demand connectors
const ON_DEMAND_CONNECTORS: OnDemandConnector[] = [
  googleConnector,
  udemyConnector,
  jaiminPrivateConnector,
  credlyConnector,
];

/**
 * Get all registered on-demand connectors.
 */
export function getAllOnDemandConnectors(): OnDemandConnector[] {
  return ON_DEMAND_CONNECTORS;
}

/**
 * Find a connector by issuer ID.
 */
export function getOnDemandConnectorByIssuerId(issuerId: number): OnDemandConnector | undefined {
  return ON_DEMAND_CONNECTORS.find(c => c.issuerId === issuerId);
}

/**
 * Find a connector by its string id.
 */
export function getOnDemandConnectorById(id: string): OnDemandConnector | undefined {
  return ON_DEMAND_CONNECTORS.find(c => c.id === id);
}

/**
 * Fetch a credential from an external issuer endpoint and return the raw JSON response.
 *
 * For Credly:
 *   Step 1 — Fetch the OBI v2 badge assertion (contains `badge` as a URL, not inline)
 *   Step 2 — Fetch the badge class from that URL to get name/image/issuer/tags
 *   Returns: { assertion, badgeClass }
 *
 * For dummy issuers:
 *   Response has { success: true, data: {...} } — returned as-is.
 */
export async function fetchFromExternalIssuer(connector: OnDemandConnector, credentialId: string): Promise<any> {
  const url = connector.buildUrl(credentialId);
  logger.info(`[OnDemand][${connector.id}] Fetching credential`, { url, credentialId });

  const fetchWithErrors = async (fetchUrl: string, label: string): Promise<any> => {
    try {
      const response = await axios.get(fetchUrl, { timeout: 15000 });
      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status;
        if (status === 404) {
          throw new NotFoundError(
            `Credential "${credentialId}" was not found on ${connector.name}. Please check the credential ID and try again.`,
            404,
            'CREDENTIAL_NOT_FOUND'
          );
        }
        if (status === 403 || status === 401) {
          throw new ForbiddenError(
            `Access denied by ${connector.name}. The credential may be private or the ID may be incorrect.`,
            403,
            'CREDENTIAL_ACCESS_DENIED'
          );
        }
        if (status === 400) {
          throw new ValidationError(
            `Invalid credential ID format for ${connector.name}. Please verify the ID and try again.`,
            400,
            'INVALID_CREDENTIAL_ID'
          );
        }
        if (status === 429) {
          throw new ValidationError(
            `${connector.name} is rate-limiting requests. Please wait a moment and try again.`,
            429,
            'RATE_LIMITED'
          );
        }
        if (status >= 500) {
          throw new ValidationError(
            `${connector.name} is temporarily unavailable (server error). Please try again later.`,
            502,
            'EXTERNAL_ISSUER_UNAVAILABLE'
          );
        }
      }
      if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
        throw new ValidationError(
          `Request to ${connector.name} timed out. Please try again later.`,
          504,
          'EXTERNAL_ISSUER_TIMEOUT'
        );
      }
      throw new ValidationError(
        `Failed to reach ${connector.name} (${label}). Please check your connection and try again.`,
        502,
        'EXTERNAL_ISSUER_UNREACHABLE'
      );
    }
  };

  // ── Credly: 2-step OBI v2 fetch ──────────────────────────────────────────
  if (connector.id === 'credly') {
    // Step 1: fetch assertion (badge field is a URL, not inline)
    const assertion = await fetchWithErrors(url, 'assertion');
    logger.info(`[OnDemand][credly] Assertion fetched`, { issuedOn: assertion.issuedOn });

    // Step 2: fetch badge class from the URL inside assertion.badge
    const badgeClassUrl: string = typeof assertion.badge === 'string'
      ? assertion.badge
      : (assertion.badge?.id || '');

    if (!badgeClassUrl) {
      throw new ValidationError(
        'Credly badge assertion did not include a badge class URL. Cannot retrieve badge details.',
        502,
        'CREDLY_MISSING_BADGE_CLASS_URL'
      );
    }

    logger.info(`[OnDemand][credly] Fetching badge class`, { badgeClassUrl });
    const badgeClass = await fetchWithErrors(badgeClassUrl, 'badge class');
    logger.info(`[OnDemand][credly] Badge class fetched`, {
      name: badgeClass.name,
      issuer: badgeClass.issuer?.name,
    });

    return { assertion, badgeClass };
  }

  // ── All other (dummy) issuers: single fetch ───────────────────────────────
  return fetchWithErrors(url, 'credential');
}
