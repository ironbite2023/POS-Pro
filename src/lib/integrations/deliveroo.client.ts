/**
 * Deliveroo API Client
 * Handles OAuth 2.0 authentication and API interactions with Deliveroo platform
 * 
 * API Documentation: https://developer.deliveroo.com/
 */

import type {
  IPlatformClient,
  PlatformOrder,
  PlatformMenu,
  AuthToken,
  PlatformApiResponse,
} from './types';
import { mapPlatformStatusToInternal } from './types';

interface DeliverooCredentials {
  client_id: string;
  client_secret: string;
  restaurant_id: string;
}

interface DeliverooConfig {
  authUrl: string;
  apiUrl: string;
  timeout: number;
}

export class DeliverooClient implements IPlatformClient {
  private credentials: DeliverooCredentials;
  private config: DeliverooConfig;
  private token: AuthToken | null = null;

  constructor(credentials: DeliverooCredentials) {
    this.credentials = credentials;
    this.config = {
      authUrl: 'https://api.deliveroo.com/oauth',
      apiUrl: 'https://api.deliveroo.com/v1',
      timeout: 30000,
    };
  }

  /**
   * Authenticate with Deliveroo using OAuth 2.0 Client Credentials flow
   */
  async authenticate(): Promise<boolean> {
    try {
      console.log('[Deliveroo] Authenticating...');

      const response = await fetch(`${this.config.authUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.credentials.client_id,
          client_secret: this.credentials.client_secret,
          scope: 'orders:read orders:write menu:write restaurant:write',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Deliveroo] Authentication failed:', error);
        return false;
      }

      const data = await response.json();

      this.token = {
        access_token: data.access_token,
        token_type: data.token_type || 'Bearer',
        expires_in: data.expires_in,
        expires_at: new Date(Date.now() + data.expires_in * 1000),
        refresh_token: data.refresh_token,
      };

      console.log('[Deliveroo] Authentication successful');
      return true;
    } catch (error) {
      console.error('[Deliveroo] Authentication error:', error);
      return false;
    }
  }

  /**
   * Ensure token is valid
   */
  private async ensureAuthenticated(): Promise<boolean> {
    if (!this.token || new Date() >= this.token.expires_at) {
      console.log('[Deliveroo] Token expired, re-authenticating...');
      return await this.authenticate();
    }
    return true;
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<PlatformApiResponse<T>> {
    const authenticated = await this.ensureAuthenticated();

    if (!authenticated) {
      return {
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Failed to authenticate with Deliveroo',
        },
      };
    }

    try {
      const url = `${this.config.apiUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `${this.token!.token_type} ${this.token!.access_token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error_code || `HTTP_${response.status}`,
            message: data.error_message || response.statusText,
            details: data,
          },
        };
      }

      return {
        success: true,
        data,
        meta: {
          request_id: response.headers.get('x-request-id') || undefined,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[Deliveroo] API request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }

  /**
   * Get orders from Deliveroo
   */
  async getOrders(params?: { status?: string; since?: Date }): Promise<PlatformOrder[]> {
    console.log('[Deliveroo] Fetching orders...');

    const queryParams = new URLSearchParams();

    if (params?.status) {
      queryParams.append('status', params.status);
    }

    if (params?.since) {
      queryParams.append('created_after', params.since.toISOString());
    }

    const response = await this.makeRequest<{ orders: unknown[] }>(
      `/restaurants/${this.credentials.restaurant_id}/orders?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      console.error('[Deliveroo] Failed to fetch orders:', response.error);
      return [];
    }

    return response.data.orders.map((order: any) => this.transformOrder(order));
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: string): Promise<PlatformOrder> {
    console.log('[Deliveroo] Fetching order:', orderId);

    const response = await this.makeRequest<any>(
      `/restaurants/${this.credentials.restaurant_id}/orders/${orderId}`
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch order from Deliveroo'
      );
    }

    return this.transformOrder(response.data);
  }

  /**
   * Update order status on Deliveroo
   */
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    console.log('[Deliveroo] Updating order status:', orderId, status);

    // Deliveroo uses action-based status updates
    const actionMap: Record<string, string> = {
      'ACCEPT_ORDER': 'accept',
      'PREPARATION_STARTED': 'start_preparation',
      'READY_FOR_COLLECTION': 'mark_ready',
      'REJECT_ORDER': 'reject',
    };

    const action = actionMap[status] || status;

    const response = await this.makeRequest<void>(
      `/restaurants/${this.credentials.restaurant_id}/orders/${orderId}/actions`,
      {
        method: 'POST',
        body: JSON.stringify({
          action,
          reason: action === 'reject' ? 'Item unavailable' : undefined,
        }),
      }
    );

    if (!response.success) {
      console.error('[Deliveroo] Failed to update order status:', response.error);
      return false;
    }

    console.log('[Deliveroo] Order status updated successfully');
    return true;
  }

  /**
   * Sync menu to Deliveroo
   */
  async syncMenu(menu: PlatformMenu): Promise<{ success: boolean; itemMappings?: Record<string, string> }> {
    console.log('[Deliveroo] Syncing menu...');

    // Transform menu to Deliveroo format
    const deliverooMenu = {
      categories: menu.categories.map(category => ({
        id: category.external_id || category.id,
        name: category.name,
        description: category.description,
        sort_position: category.sort_order || 0,
        items: category.item_ids,
      })),
      items: menu.items.map(item => ({
        id: item.external_id || item.id,
        name: item.name,
        description: item.description,
        price: {
          amount: Math.round(item.price * 100), // Convert to pence/cents
          currency: 'GBP',
        },
        available: item.is_available,
        image_url: item.image_url,
        dietary_labels: item.dietary_labels || [],
        allergen_info: item.allergen_info || [],
        preparation_time_minutes: item.preparation_time,
        modifier_groups: item.modifier_group_ids?.map(id => ({
          id,
          reference: id,
        })) || [],
      })),
      modifier_groups: menu.modifier_groups?.map(group => ({
        id: group.external_id || group.id,
        name: group.name,
        min_selections: group.min_selections,
        max_selections: group.max_selections,
        required: group.required,
        modifiers: group.modifiers.map(mod => ({
          id: mod.external_id || mod.id,
          name: mod.name,
          price: {
            amount: Math.round(mod.price * 100),
            currency: 'GBP',
          },
          available: mod.is_available,
        })),
      })) || [],
    };

    const response = await this.makeRequest<{ item_mappings: Record<string, string> }>(
      `/restaurants/${this.credentials.restaurant_id}/menu`,
      {
        method: 'PUT',
        body: JSON.stringify(deliverooMenu),
      }
    );

    if (!response.success) {
      console.error('[Deliveroo] Failed to sync menu:', response.error);
      return { success: false };
    }

    console.log('[Deliveroo] Menu synced successfully');
    return {
      success: true,
      itemMappings: response.data?.item_mappings,
    };
  }

  /**
   * Accept an order from Deliveroo
   * CRITICAL: Must complete both calls within 3 minutes or order escalates to tablet
   * Uses two-call pattern: action + sync_status
   */
  async acceptOrder(orderId: string): Promise<boolean> {
    console.log('[Deliveroo] Accepting order:', orderId);

    // 1. Send ACCEPT_ORDER action
    const actionResponse = await this.makeRequest<void>(
      `/restaurants/${this.credentials.restaurant_id}/orders/${orderId}/actions`,
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'ACCEPT_ORDER'
        }),
      }
    );

    if (!actionResponse.success) {
      console.error('[Deliveroo] Failed to accept order:', actionResponse.error);
      return false;
    }

    // 2. Send sync status (required by Deliveroo)
    const syncResponse = await this.makeRequest<void>(
      `/orders/${orderId}/sync_status`,
      {
        method: 'POST',
        body: JSON.stringify({
          status: 'Succeeded'
        }),
      }
    );

    if (!syncResponse.success) {
      console.error('[Deliveroo] Failed to sync status:', syncResponse.error);
      return false;
    }

    console.log('[Deliveroo] Order accepted and synced successfully');
    return true;
  }

  /**
   * Deny an order from Deliveroo
   * CRITICAL: Must complete both calls within 3 minutes
   * Uses two-call pattern: action + sync_status
   */
  async denyOrder(
    orderId: string, 
    reason: 'OUT_OF_STOCK' | 'TOO_BUSY' | 'CLOSING_SOON' | 'OTHER',
    explanation?: string
  ): Promise<boolean> {
    console.log('[Deliveroo] Rejecting order:', orderId, 'Reason:', reason);

    // 1. Send REJECT_ORDER action
    const actionResponse = await this.makeRequest<void>(
      `/restaurants/${this.credentials.restaurant_id}/orders/${orderId}/actions`,
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'REJECT_ORDER',
          reason: reason
        }),
      }
    );

    if (!actionResponse.success) {
      console.error('[Deliveroo] Failed to reject order:', actionResponse.error);
      return false;
    }

    // 2. Send sync status with failure reason (required by Deliveroo)
    const syncResponse = await this.makeRequest<void>(
      `/orders/${orderId}/sync_status`,
      {
        method: 'POST',
        body: JSON.stringify({
          status: 'Failed',
          failure_reason: reason
        }),
      }
    );

    if (!syncResponse.success) {
      console.error('[Deliveroo] Failed to sync status:', syncResponse.error);
      return false;
    }

    console.log('[Deliveroo] Order rejected and synced successfully');
    return true;
  }

  /**
   * Set restaurant availability (open/closed)
   */
  async setStoreAvailability(isOpen: boolean): Promise<boolean> {
    console.log('[Deliveroo] Setting restaurant availability:', isOpen);

    const response = await this.makeRequest<void>(
      `/restaurants/${this.credentials.restaurant_id}/availability`,
      {
        method: 'PUT',
        body: JSON.stringify({
          available: isOpen,
        }),
      }
    );

    if (!response.success) {
      console.error('[Deliveroo] Failed to set availability:', response.error);
      return false;
    }

    console.log('[Deliveroo] Restaurant availability updated');
    return true;
  }

  /**
   * Transform Deliveroo order to platform-agnostic format
   */
  private transformOrder(deliverooOrder: any): PlatformOrder {
    return {
      id: deliverooOrder.order_id,
      display_id: deliverooOrder.order_id.slice(-8),
      status: mapPlatformStatusToInternal(deliverooOrder.status, 'deliveroo'),
      created_at: deliverooOrder.placed_at,
      customer: {
        first_name: deliverooOrder.customer.first_name,
        last_name: deliverooOrder.customer.last_name,
        phone: deliverooOrder.customer.phone_number,
      },
      items: deliverooOrder.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price / item.quantity,
        total_price: item.price,
        modifiers: item.modifiers?.map((mod: any) => ({
          id: mod.id,
          name: mod.name,
          price: mod.price,
          quantity: 1,
        })) || [],
        special_instructions: item.special_instructions,
      })),
      totals: {
        subtotal: deliverooOrder.pricing.subtotal,
        tax: 0, // Deliveroo includes tax in item prices
        delivery_fee: deliverooOrder.pricing.delivery_fee,
        service_fee: deliverooOrder.pricing.service_fee,
        tip: 0,
        total: deliverooOrder.pricing.total,
        currency: deliverooOrder.pricing.currency,
      },
      delivery_info: deliverooOrder.delivery_address ? {
        address: {
          street: deliverooOrder.delivery_address.street,
          city: deliverooOrder.delivery_address.city,
          postal_code: deliverooOrder.delivery_address.postcode,
          country: 'GB',
        },
      } : undefined,
      special_instructions: deliverooOrder.special_instructions,
      raw_data: deliverooOrder,
    };
  }
}
