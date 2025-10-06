/**
 * Platform Integrations Module
 * Export all platform API clients and shared types
 */

// Export types
export * from './types';

// Export platform clients
export { UberEatsClient } from './uber-eats.client';
export { DeliverooClient } from './deliveroo.client';
export { JustEatClient } from './just-eat.client';

// Platform client factory function
import type { PlatformEnum, IPlatformClient } from './types';
import { UberEatsClient } from './uber-eats.client';
import { DeliverooClient } from './deliveroo.client';
import { JustEatClient } from './just-eat.client';

export interface PlatformClientFactory {
  createClient(
    platform: PlatformEnum,
    credentials: Record<string, string>
  ): IPlatformClient;
}

/**
 * Factory function to create platform-specific API clients
 */
export const createPlatformClient = (
  platform: PlatformEnum,
  credentials: Record<string, string>
): IPlatformClient => {
  switch (platform) {
    case 'uber_eats':
      return new UberEatsClient({
        client_id: credentials.client_id || '',
        client_secret: credentials.client_secret || '',
        store_id: credentials.store_id || credentials.restaurant_id || '',
      });

    case 'deliveroo':
      return new DeliverooClient({
        client_id: credentials.client_id || '',
        client_secret: credentials.client_secret || '',
        restaurant_id: credentials.restaurant_id || '',
      });

    case 'just_eat':
      return new JustEatClient({
        api_token: credentials.api_token || '',
        restaurant_id: credentials.restaurant_id || '',
      });

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};
