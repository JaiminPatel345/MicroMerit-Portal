/**
 * Matching Engine
 * Matches external credentials to existing learners based on email, phone, name+DOB
 */

import { distance } from 'fastest-levenshtein';
import { prisma } from '../../../utils/prisma';
import { CanonicalCredential } from '../connectors/types';
import { featureFlags } from '../../../infrastructure/config/feature-flags';
import { logger } from '../../../utils/logger';

export interface MatchResult {
    learnerId: number | null;
    confidence: number;
    matchType: 'email' | 'other_email' | 'phone' | 'fuzzy' | 'none';
    matchDetails?: string;
}

/**
 * Match a canonical credential to an existing learner
 * Order of matching: primary_email > other_emails > phone > fuzzy (name+dob)
 */
export async function matchCredentialToLearner(
    credential: CanonicalCredential
): Promise<MatchResult> {
    // 1. Try exact primary email match
    if (credential.recipientEmail) {
        const learner = await prisma.learner.findUnique({
            where: { email: credential.recipientEmail.toLowerCase() },
            select: { id: true },
        });
        if (learner) {
            return {
                learnerId: learner.id,
                confidence: 1.0,
                matchType: 'email',
                matchDetails: `Exact email match: ${credential.recipientEmail}`
            };
        }

        // 2. Check other_emails
        const learnerByOther = await prisma.learner.findFirst({
            where: {
                other_emails: { has: credential.recipientEmail.toLowerCase() }
            },
            select: { id: true },
        });
        if (learnerByOther) {
            return {
                learnerId: learnerByOther.id,
                confidence: 0.95,
                matchType: 'other_email',
                matchDetails: `Secondary email match: ${credential.recipientEmail}`
            };
        }
    }

    // 3. Try phone match
    if (credential.recipientPhone) {
        const normalizedPhone = normalizePhone(credential.recipientPhone);
        const learner = await prisma.learner.findFirst({
            where: {
                phone: { contains: normalizedPhone.slice(-10) } // Last 10 digits
            },
            select: { id: true },
        });
        if (learner) {
            return {
                learnerId: learner.id,
                confidence: 0.9,
                matchType: 'phone',
                matchDetails: `Phone match: ${credential.recipientPhone}`
            };
        }
    }

    // 4. Fuzzy matching on name + DOB
    if (credential.recipientName && credential.recipientDob) {
        const fuzzyMatch = await fuzzyMatchByNameAndDob(
            credential.recipientName,
            credential.recipientDob
        );
        if (fuzzyMatch.learnerId && fuzzyMatch.confidence >= featureFlags.matchThreshold) {
            return fuzzyMatch;
        }
    }

    // No match found
    return { learnerId: null, confidence: 0, matchType: 'none' };
}

/**
 * Normalize phone number (remove spaces, dashes, country code)
 */
function normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+91/, '');
}

/**
 * Fuzzy match by name and DOB
 */
async function fuzzyMatchByNameAndDob(
    name: string,
    dob: string
): Promise<MatchResult> {
    // Parse DOB
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
        return { learnerId: null, confidence: 0, matchType: 'none' };
    }

    // Find learners with matching DOB (within 1 day tolerance)
    const startDate = new Date(dobDate);
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date(dobDate);
    endDate.setDate(endDate.getDate() + 1);

    const candidates = await prisma.learner.findMany({
        where: {
            dob: {
                gte: startDate,
                lte: endDate,
            },
            name: { not: null },
        },
        select: { id: true, name: true, dob: true },
        take: 100, // Limit candidates
    });

    if (candidates.length === 0) {
        return { learnerId: null, confidence: 0, matchType: 'none' };
    }

    // Normalize the input name
    const normalizedName = normalizeName(name);
    let bestMatch: { id: number; similarity: number; name: string } | null = null;

    for (const candidate of candidates) {
        if (!candidate.name) continue;

        const candidateName = normalizeName(candidate.name);
        const similarity = calculateNameSimilarity(normalizedName, candidateName);

        if (!bestMatch || similarity > bestMatch.similarity) {
            bestMatch = { id: candidate.id, similarity, name: candidate.name };
        }
    }

    if (bestMatch && bestMatch.similarity >= featureFlags.matchThreshold) {
        return {
            learnerId: bestMatch.id,
            confidence: bestMatch.similarity,
            matchType: 'fuzzy',
            matchDetails: `Fuzzy match: "${name}" ~ "${bestMatch.name}" (${(bestMatch.similarity * 100).toFixed(1)}%)`,
        };
    }

    return { learnerId: null, confidence: bestMatch?.similarity || 0, matchType: 'none' };
}

/**
 * Normalize name for comparison
 */
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z\s]/g, '') // Remove non-alphabetic
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
}

/**
 * Calculate name similarity using Levenshtein distance
 * Returns value between 0 and 1
 */
function calculateNameSimilarity(name1: string, name2: string): number {
    if (name1 === name2) return 1;
    if (!name1 || !name2) return 0;

    const maxLen = Math.max(name1.length, name2.length);
    if (maxLen === 0) return 1;

    const dist = distance(name1, name2);
    return 1 - (dist / maxLen);
}

/**
 * Batch match multiple credentials
 */
export async function batchMatchCredentials(
    credentials: CanonicalCredential[]
): Promise<Map<string, MatchResult>> {
    const results = new Map<string, MatchResult>();

    for (const credential of credentials) {
        try {
            const match = await matchCredentialToLearner(credential);
            results.set(credential.providerCredentialId, match);
        } catch (error) {
            logger.error(`Failed to match credential ${credential.providerCredentialId}:`, error);
            results.set(credential.providerCredentialId, {
                learnerId: null,
                confidence: 0,
                matchType: 'none'
            });
        }
    }

    return results;
}
