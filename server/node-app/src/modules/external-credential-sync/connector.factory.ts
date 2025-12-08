/**
 * Connector Factory - Instantiates connectors based on provider configuration
 */

import { Connector, ProviderConfig } from './types';
import { NSDCConnector } from './connectors/nsdc.connector';
import { UdemyConnector } from './connectors/udemy.connector';
import { JaiminConnector } from './connectors/jaimin.connector';
import { SIHConnector } from './connectors/sih.connector';
import { logger } from '../../utils/logger';

/**
 * Get provider configurations from environment
 */
export function getProviderConfigs(): ProviderConfig[] {
    const configs: ProviderConfig[] = [];

    // NSDC Provider
    if (process.env.NSDC_BASE_URL) {
        configs.push({
            id: 'nsdc',
            name: 'NSDC (National Skill Development Corporation)',
            issuer_id: parseInt(process.env.NSDC_ISSUER_ID || '0'),
            base_url: process.env.NSDC_BASE_URL,
            auth_type: 'jwt',
            credentials: {
                client_id: process.env.NSDC_CLIENT_ID || '',
                client_secret: process.env.NSDC_CLIENT_SECRET || '',
            },
            enabled: process.env.NSDC_ENABLED !== 'false',
        });
    }

    // Udemy Provider
    if (process.env.UDEMY_BASE_URL) {
        configs.push({
            id: 'udemy',
            name: 'Udemy',
            issuer_id: parseInt(process.env.UDEMY_ISSUER_ID || '0'),
            base_url: process.env.UDEMY_BASE_URL,
            auth_type: 'oauth2',
            credentials: {
                client_id: process.env.UDEMY_CLIENT_ID || '',
                client_secret: process.env.UDEMY_CLIENT_SECRET || '',
            },
            enabled: process.env.UDEMY_ENABLED !== 'false',
        });
    }

    // Jaimin Pvt Ltd Provider
    if (process.env.JAIMIN_BASE_URL) {
        configs.push({
            id: 'jaimin',
            name: 'Jaimin Pvt Ltd',
            issuer_id: parseInt(process.env.JAIMIN_ISSUER_ID || '0'),
            base_url: process.env.JAIMIN_BASE_URL,
            auth_type: 'api_key',
            credentials: {
                api_key: process.env.JAIMIN_API_KEY || '',
            },
            enabled: process.env.JAIMIN_ENABLED !== 'false',
        });
    }

    // SIH (Smart India Hackathon) Provider
    if (process.env.SIH_BASE_URL) {
        configs.push({
            id: 'sih',
            name: 'SIH (Smart India Hackathon)',
            issuer_id: parseInt(process.env.SIH_ISSUER_ID || '0'),
            base_url: process.env.SIH_BASE_URL,
            auth_type: 'api_key',
            credentials: {
                api_key: process.env.SIH_API_KEY || '',
            },
            enabled: process.env.SIH_ENABLED !== 'false',
        });
    }

    return configs;
}

/**
 * Create a connector instance for a given provider ID
 */
export function createConnector(providerId: string): Connector | null {
    const configs = getProviderConfigs();
    const config = configs.find(c => c.id === providerId && c.enabled);

    if (!config) {
        logger.warn(`Provider not found or disabled: ${providerId}`);
        return null;
    }

    return createConnectorFromConfig(config);
}

/**
 * Create a connector instance from a provider configuration
 */
export function createConnectorFromConfig(config: ProviderConfig): Connector {
    switch (config.id) {
        case 'nsdc':
            return new NSDCConnector(config);
        case 'udemy':
            return new UdemyConnector(config);
        case 'jaimin':
            return new JaiminConnector(config);
        case 'sih':
            return new SIHConnector(config);
        default:
            throw new Error(`Unknown provider: ${config.id}`);
    }
}

/**
 * Get all enabled connectors
 */
export function getAllEnabledConnectors(): Connector[] {
    const configs = getProviderConfigs().filter(c => c.enabled && c.issuer_id > 0);
    return configs.map(config => createConnectorFromConfig(config));
}

/**
 * Get provider config by ID
 */
export function getProviderConfig(providerId: string): ProviderConfig | undefined {
    return getProviderConfigs().find(c => c.id === providerId);
}
