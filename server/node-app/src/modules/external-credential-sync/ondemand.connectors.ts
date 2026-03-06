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
// Badge assertion endpoint:
//   GET https://api.credly.com/v1/obi/v2/badge_assertions/{UUID}
//
// UUID = the badge UUID from a Credly badge URL:
//   https://www.credly.com/badges/{UUID}
//
// Verification: recipient.identity = "sha256$<hash>"
//   Compare sha256(loggedInEmail.toLowerCase()) to the hash.
//
// NOTE: Credly returns JSON metadata only (no PDF).
//   The onDemandCertService will generate a PDF from the metadata.
// ─────────────────────────────────────────────────────────────────────────────
const credlyConnector: OnDemandConnector = {
  id: 'credly',
  name: 'Credly',
  issuerId: parseInt(process.env.CREDLY_ISSUER_ID || '0', 10),

  buildUrl(credentialId) {
    // credentialId = the badge UUID from a Credly badge URL
    return `https://api.credly.com/v1/obi/v2/badge_assertions/${credentialId}`;
  },

  normalize(rawData) {
    // rawData = the raw OBI v2 badge assertion response
    const issued = rawData.issuedOn || rawData.issued_on || '';
    const badgeClass = rawData.badge || rawData.badgeClass || {};
    const issuerOrg = badgeClass.issuer || {};

    return {
      learner_email:  '', // Not available in plain text — verified via hash
      learner_name:   rawData.recipientProfile?.name || rawData.recipient_profile?.name || '',
      title:          badgeClass.name || 'Credly Badge',
      issued_date:    typeof issued === 'string' ? issued.substring(0, 10) : String(issued),
      description:    badgeClass.description || '',
      // No pdf_base64 — service will generate PDF from metadata
      issuer_name:    issuerOrg.name || 'Credly Partner',
      external_id:    rawData.uid || rawData.id || '',
      extra: {
        badge_image_url: badgeClass.image?.id || badgeClass.image || '',
        skills: (badgeClass.alignment || []).map((a: any) => a.targetTitle || a.targetName || '').filter(Boolean),
        credly_badge_url: rawData.id || '',
      },
      raw_data: rawData,
    };
  },

  verify(rawData, loggedInEmail) {
    // Credly stores hashed email: "sha256$<hex-hash>"
    const identity: string = rawData?.recipient?.identity || rawData?.recipientProfile?.identity || '';
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
 * For Credly (and other native REST APIs), the response is the direct object (no .success wrapper).
 * For dummy issuers, the response has { success: true, data: {...} }.
 */
export async function fetchFromExternalIssuer(connector: OnDemandConnector, credentialId: string): Promise<any> {
  const url = connector.buildUrl(credentialId);
  logger.info(`[OnDemand][${connector.id}] Fetching credential`, { url, credentialId });

  const response = await axios.get(url, { timeout: 15000 });

  // Credly and native OBI APIs return the object directly (no success wrapper)
  // Dummy issuers return { success: true, data: {...} }
  return response.data;
}
