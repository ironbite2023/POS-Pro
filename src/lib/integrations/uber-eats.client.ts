/**
 * Uber Eats API Client
 * Handles OAuth 2.0 authentication and API interactions with Uber Eats platform
 * 
 * API Documentation: https://developer.uber.com/docs/eats
 */

import type {
  IPlatformClient,
  PlatformOrder,
  PlatformMenu,
  AuthToken,
  PlatformApiResponse,
  PlatformApiError,
} from './types';
import { mapPlatformStatusToInternal } from './types';

interface UberEatsCredentials {
  client_id: string;
  client_secret: string;
  store_id: string;
}

interface UberEatsConfig {
  authUrl: string;
  apiUrl: string;
  timeout: number;
}

export class UberEatsClient implements IPlatformClient {
  private credentials: UberEatsCredentials;
  private config: UberEatsConfig;
  private token: AuthToken | null = null;

  constructor(credentials: UberEatsCredentials) {
    this.credentials = credentials;
    this.config = {
      authUrl: 'https://login.uber.com/oauth/v2',
      apiUrl: 'https://api.uber.com/v1/eats',
      timeout: 30000, // 30 seconds
    };
  }

  /**
   * Authenticate with Uber Eats using OAuth 2.0 Client Credentials flow
   */
  async authenticate(): Promise<boolean> {
    try {
      console.log('[Uber Eats] Authenticating...');

      const response = await fetch(`${this.config.authUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.credentials.client_id,
          client_secret: this.credentials.client_secret,
          scope: 'eats.store eats.orders eats.menu',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Uber Eats] Authentication failed:', error);
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

      console.log('[Uber Eats] Authentication successful');
      return true;
    } catch (error) {
      console.error('[Uber Eats] Authentication error:', error);
      return false;
    }
  }

  /**
   * Refresh access token if expired
   */
  private async ensureAuthenticated(): Promise<boolean> {
    if (!this.token || new Date() >= this.token.expires_at) {
      console.log('[Uber Eats] Token expired, re-authenticating...');
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
          message: 'Failed to authenticate with Uber Eats',
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
            code: data.code || `HTTP_${response.status}`,
            message: data.message || response.statusText,
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
      console.error('[Uber Eats] API request failed:', error);
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
   * Get orders from Uber Eats
   */
  async getOrders(params?: { status?: string; since?: Date }): Promise<PlatformOrder[]> {
    console.log('[Uber Eats] Fetching orders...');

    const queryParams = new URLSearchParams({
      store_id: this.credentials.store_id,
    });

    if (params?.status) {
      queryParams.append('status', params.status);
    }

    if (params?.since) {
      queryParams.append('since', params.since.toISOString());
    }

    const response = await this.makeRequest<{ orders: unknown[] }>(
      `/stores/${this.credentials.store_id}/orders?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      console.error('[Uber Eats] Failed to fetch orders:', response.error);
      return [];
    }

    return response.data.orders.map((order: any) => this.transformOrder(order));
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: string): Promise<PlatformOrder> {
    console.log('[Uber Eats] Fetching order:', orderId);

    const response = await this.makeRequest<any>(
      `/stores/${this.credentials.store_id}/orders/${orderId}`
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch order from Uber Eats'
      );
    }

    return this.transformOrder(response.data);
  }

  /**
   * Update order status on Uber Eats
   * Uses platform-specific endpoints per status
   */
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    console.log('[Uber Eats] Updating order status:', orderId, status);

    // Map status to correct Uber Eats endpoint
    const endpointMap: Record<string, string> = {
      'preparing': `/stores/${this.credentials.store_id}/orders/${orderId}/preparing`,
      'ready': `/stores/${this.credentials.store_id}/orders/${orderId}/ready_for_pickup`,
    };

    const endpoint = endpointMap[status];
    if (!endpoint) {
      console.error('[Uber Eats] Unsupported status for direct update:', status);
      return false;
    }

    const response = await this.makeRequest<void>(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Updated from POS system',
      }),
    });

    if (!response.success) {
      console.error('[Uber Eats] Failed to update order status:', response.error);
      return false;
    }

    console.log('[Uber Eats] Order status updated successfully');
    return true;
  }

  /**
   * Sync menu to Uber Eats
   */
  async syncMenu(menu: PlatformMenu): Promise<{ success: boolean; itemMappings?: Record<string, string> }> {
    console.log('[Uber Eats] Syncing menu...');

    // Transform menu to Uber Eats format
    const uberEatsMenu = {
      store_id: this.credentials.store_id,
      categories: menu.categories.map(category => ({
        id: category.external_id || category.id,
        title: {
          translations: {
            'en-US': category.name,
          },
        },
        entities: category.item_ids,
      })),
      items: menu.items.map(item => ({
        id: item.external_id || item.id,
        title: {
          translations: {
            'en-US': item.name,
          },
        },
        description: item.description ? {
          translations: {
            'en-US': item.description,
          },
        } : undefined,
        price_info: {
          price: Math.round(item.price * 100), // Convert to cents
          core_price: Math.round(item.price * 100),
        },
        quantity_info: {
          quantity: {
            max_permitted: 999,
          },
        },
        suspension_info: {
          suspension: {
            suspended_until: item.is_available ? 0 : 9999999999,
          },
        },
        image_url: item.image_url,
        modifier_group_ids: item.modifier_group_ids || [],
      })),
      modifier_groups: menu.modifier_groups?.map(group => ({
        id: group.external_id || group.id,
        title: {
          translations: {
            'en-US': group.name,
          },
        },
        modifiers: group.modifiers.map(mod => ({
          id: mod.external_id || mod.id,
          title: {
            translations: {
              'en-US': mod.name,
            },
          },
          price_info: {
            price: Math.round(mod.price * 100),
          },
          quantity_info: {
            quantity: {
              max_permitted: group.max_selections,
            },
          },
        })),
        quantity_info: {
          quantity: {
            min_permitted: group.min_selections,
            max_permitted: group.max_selections,
          },
        },
      })) || [],
    };

    const response = await this.makeRequest<{ item_ids: Record<string, string> }>(
      `/stores/${this.credentials.store_id}/menus`,
      {
        method: 'PUT',
        body: JSON.stringify(uberEatsMenu),
      }
    );

    if (!response.success) {
      console.error('[Uber Eats] Failed to sync menu:', response.error);
      return { success: false };
    }

    console.log('[Uber Eats] Menu synced successfully');
    return {
      success: true,
      itemMappings: response.data?.item_ids,
    };
  }

  /**
   * Accept an order from Uber Eats
   * CRITICAL: Must be called within 11.5 minutes or order auto-cancels
   */
  async acceptOrder(orderId: string): Promise<boolean> {
    console.log('[Uber Eats] Accepting order:', orderId);

    const response = await this.makeRequest<void>(
      `/stores/${this.credentials.store_id}/orders/${orderId}/accept_pos_order`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Order accepted and preparing'
        }),
      }
    );

    if (!response.success) {
      console.error('[Uber Eats] Failed to accept order:', response.error);
      return false;
    }

    console.log('[Uber Eats] Order accepted successfully');
    return true;
  }

  /**
   * Deny an order from Uber Eats
   * CRITICAL: Must be called within 11.5 minutes or order auto-cancels
   */
  async denyOrder(
    orderId: string, 
    reasonCode: 'STORE_CLOSED' | 'OUT_OF_STOCK' | 'TOO_BUSY' | 'OTHER',
    explanation?: string
  ): Promise<boolean> {
    console.log('[Uber Eats] Denying order:', orderId, 'Reason:', reasonCode);

    const response = await this.makeRequest<void>(
      `/stores/${this.credentials.store_id}/orders/${orderId}/deny_pos_order`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason: {
            code: reasonCode,
            explanation: explanation || 'Unable to fulfill order'
          }
        }),
      }
    );

    if (!response.success) {
      console.error('[Uber Eats] Failed to deny order:', response.error);
      return false;
    }

    console.log('[Uber Eats] Order denied successfully');
    return true;
  }

  /**
   * Set store availability (open/closed)
   */
  async setStoreAvailability(isOpen: boolean): Promise<boolean> {
    console.log('[Uber Eats] Setting store availability:', isOpen);

    const response = await this.makeRequest<void>(
      `/stores/${this.credentials.store_id}/status`,
      {
        method: 'POST',
        body: JSON.stringify({
          status: isOpen ? 'ONLINE' : 'OFFLINE',
        }),
      }
    );

    if (!response.success) {
      console.error('[Uber Eats] Failed to set store availability:', response.error);
      return false;
    }

    console.log('[Uber Eats] Store availability updated');
    return true;
  }

  /**
   * Transform Uber Eats order to platform-agnostic format
   */
  private transformOrder(uberOrder: any): PlatformOrder {
    return {
      id: uberOrder.id,
      display_id: uberOrder.display_id || uberOrder.id.slice(-8),
      status: mapPlatformStatusToInternal(uberOrder.current_state, 'uber_eats'),
      created_at: uberOrder.placed_at || new Date().toISOString(),
      customer: {
        first_name: uberOrder.eater?.first_name,
        last_name: uberOrder.eater?.last_name,
        phone: uberOrder.eater?.phone,
      },
      items: uberOrder.cart?.items?.map((item: any) => ({
        id: item.id,
        name: item.title,
        quantity: item.quantity,
        unit_price: (item.price?.unit_price || 0) / 100,
        total_price: (item.price?.total || 0) / 100,
        modifiers: item.selected_modifier_groups?.flatMap((group: any) =>
          group.modifiers?.map((mod: any) => ({
            id: mod.id,
            name: mod.title,
            price: (mod.price || 0) / 100,
            quantity: mod.quantity || 1,
          }))
        ) || [],
        special_instructions: item.special_instructions,
      })) || [],
      totals: {
        subtotal: (uberOrder.payment?.charges?.sub_total?.amount || 0) / 100,
        tax: (uberOrder.payment?.charges?.tax?.amount || 0) / 100,
        delivery_fee: (uberOrder.payment?.charges?.delivery_fee?.amount || 0) / 100,
        service_fee: (uberOrder.payment?.charges?.small_order_fee?.amount || 0) / 100,
        tip: (uberOrder.payment?.charges?.tip?.amount || 0) / 100,
        total: (uberOrder.payment?.charges?.total?.amount || 0) / 100,
        currency: uberOrder.payment?.charges?.total?.currency_code || 'USD',
      },
      delivery_info: {
        address: uberOrder.cart?.fulfillment?.dropoff?.address ? {
          street: uberOrder.cart.fulfillment.dropoff.address.street_address,
          city: uberOrder.cart.fulfillment.dropoff.address.city,
          postal_code: uberOrder.cart.fulfillment.dropoff.address.zip_code,
          country: uberOrder.cart.fulfillment.dropoff.address.country,
          notes: uberOrder.cart.fulfillment.dropoff.notes,
        } : undefined,
        estimated_pickup_time: uberOrder.estimated_ready_for_pickup_at,
        estimated_delivery_time: uberOrder.estimated_delivery_time,
      },
      special_instructions: uberOrder.special_instructions,
      raw_data: uberOrder,
    };
  }
}
