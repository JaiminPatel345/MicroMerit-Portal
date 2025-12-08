/**
 * Connector Registry and Factory
 * Central registry for all credential connectors
 */

import { ICredentialConnector, ConnectorRegistry } from './types';
import { getNsdcConnector } from './nsdc-apisetu.connector';
import { getDigiLockerConnector } from './digilocker.connector.stub';

const registry: ConnectorRegistry = new Map();

/**
 * Initialize and get the connector registry
 */
export function getConnectorRegistry(): ConnectorRegistry {
    if (registry.size === 0) {
        registry.set('nsdc', getNsdcConnector());
        registry.set('digilocker', getDigiLockerConnector());
    }
    return registry;
}

/**
 * Get a specific connector by provider ID
 */
export function getConnector(providerId: string): ICredentialConnector | undefined {
    return getConnectorRegistry().get(providerId);
}

/**
 * Get all available provider IDs
 */
export function getProviderIds(): string[] {
    return Array.from(getConnectorRegistry().keys());
}

export * from './types';
export { getNsdcConnector } from './nsdc-apisetu.connector';
export { getDigiLockerConnector } from './digilocker.connector.stub';
