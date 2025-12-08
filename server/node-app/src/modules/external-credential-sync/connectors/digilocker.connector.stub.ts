/**
 * DigiLocker Connector Stub
 * Placeholder for future DigiLocker integration
 */

import {
    ICredentialConnector,
    RawProviderCredential,
    CanonicalCredential,
    FetchOptions,
    FetchResult,
    VerificationResult,
    WebhookSubscriptionResult
} from './types';
import { logger } from '../../../utils/logger';

export class DigiLockerConnector implements ICredentialConnector {
    readonly providerId = 'digilocker';

    async fetchCredentials(_issuerId: number, _options: FetchOptions): Promise<FetchResult> {
        logger.warn('DigiLocker connector is a stub - not implemented');
        return { credentials: [], hasMore: false };
    }

    async subscribeWebhook(
        _issuerId: number,
        _callbackUrl: string
    ): Promise<WebhookSubscriptionResult> {
        return {
            subscribed: false,
            requiresApproval: false,
            error: 'DigiLocker connector not implemented'
        };
    }

    async verify(_credential: RawProviderCredential): Promise<VerificationResult> {
        return { verified: false, method: 'JWS', error: 'Not implemented' };
    }

    normalize(raw: RawProviderCredential): CanonicalCredential {
        const data = raw.rawData;
        return {
            providerCredentialId: raw.id,
            recipientEmail: data.email as string | undefined,
            recipientName: data.name as string | undefined,
            certificateTitle: (data.title as string) || 'DigiLocker Document',
            issueDate: new Date().toISOString(),
            metadata: { provider: 'digilocker', originalData: data },
        };
    }

    async verifyWebhookSignature(
        _payload: string | Buffer,
        _signature: string
    ): Promise<boolean> {
        return false;
    }
}

let digiLockerConnector: DigiLockerConnector | null = null;

export function getDigiLockerConnector(): DigiLockerConnector {
    if (!digiLockerConnector) {
        digiLockerConnector = new DigiLockerConnector();
    }
    return digiLockerConnector;
}
