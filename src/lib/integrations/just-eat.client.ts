/**
 * Just Eat API Client
 * Handles API token authentication and API interactions with Just Eat platform
 * 
 * API Documentation: https://developers.just-eat.com/
 */

import type {
  IPlatformClient,
  PlatformOrder,
  PlatformMenu,
  PlatformApiResponse,
} from './types';
import { mapPlatformStatusToInternal } from './types';

interface JustEatCredentials {
  api_token: string;
  restaurant_id: string;
}

interface JustEatConfig {
  apiUrl: string;
  timeout: number;
}

export class JustEatClient implements IPlatformClient {
  private credentials: JustEatCredentials;
  private config: JustEatConfig;

  constructor(credentials: JustEatCredentials) {
    this.credentials = credentials;
    this.config = {
      apiUrl: 'https://partner-api.just-eat.co.uk/v1',
      timeout: 30000,
    };
  }

  /**
   * Authenticate with Just Eat (token-based, no OAuth flow needed)
   */
  async authenticate(): Promise<boolean> {
    try {
      console.log('[Just Eat] Validating API token...');

      // Test the API token by making a simple request
      const response = await fetch(
        `${this.config.apiUrl}/restaurants/${this.credentials.restaurant_id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.credentials.api_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('[Just Eat] Token validation failed:', response.status);
        return false;
      }

      console.log('[Just Eat] Token validated successfully');
      return true;
    } catch (error) {
      console.error('[Just Eat] Authentication error:', error);
      return false;
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<PlatformApiResponse<T>> {
    try {
      const url = `${this.config.apiUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.credentials.api_token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.errorCode || `HTTP_${response.status}`,
            message: data.errorMessage || response.statusText,
            details: data,
          },
        };
      }

      return {
        success: true,
        data,
        meta: {
          request_id: response.headers.get('x-je-request-id') || undefined,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[Just Eat] API request failed:', error);
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
   * Get orders from Just Eat
   */
  async getOrders(params?: { status?: string; since?: Date }): Promise<PlatformOrder[]> {
    console.log('[Just Eat] Fetching orders...');

    const queryParams = new URLSearchParams();

    if (params?.status) {
      queryParams.append('status', params.status);
    }

    if (params?.since) {
      queryParams.append('from', params.since.toISOString());
    }

    const response = await this.makeRequest<{ orders: unknown[] }>(
      `/restaurants/${this.credentials.restaurant_id}/orders?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      console.error('[Just Eat] Failed to fetch orders:', response.error);
      return [];
    }

    return response.data.orders.map((order: any) => this.transformOrder(order));
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: string): Promise<PlatformOrder> {
    console.log('[Just Eat] Fetching order:', orderId);

    const response = await this.makeRequest<any>(
      `/restaurants/${this.credentials.restaurant_id}/orders/${orderId}`
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch order from Just Eat'
      );
    }

    return this.transformOrder(response.data);
  }

  /**
   * Update order status on Just Eat
   */
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    console.log('[Just Eat] Updating order status:', orderId, status);

    const response = await this.makeRequest<void>(
      `/restaurants/${this.credentials.restaurant_id}/orders/${orderId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({
          status,
          updatedAt: new Date().toISOString(),
        }),
      }
    );

    if (!response.success) {
      console.error('[Just Eat] Failed to update order status:', response.error);
      return false;
    }

    console.log('[Just Eat] Order status updated successfully');
    return true;
  }

  /**
   * Sync menu to Just Eat
   */
  async syncMenu(menu: PlatformMenu): Promise<{ success: boolean; itemMappings?: Record<string, string> }> {
    console.log('[Just Eat] Syncing menu...');

    // Transform menu to Just Eat format
    const justEatMenu = {
      categories: menu.categories.map(category => ({
        id: category.external_id || category.id,
        name: category.name,
        description: category.description,
        displayOrder: category.sort_order || 0,
        products: category.item_ids,
      })),
      products: menu.items.map(item => ({
        id: item.external_id || item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        available: item.is_available,
        imageUrl: item.image_url,
        allergenInfo: item.allergen_info || [],
        dietaryLabels: item.dietary_labels || [],
        preparationTimeMinutes: item.preparation_time,
        modifierGroups: item.modifier_group_ids?.map(id => id) || [],
      })),
      modifierGroups: menu.modifier_groups?.map(group => ({
        id: group.external_id || group.id,
        name: group.name,
        minSelections: group.min_selections,
        maxSelections: group.max_selections,
        required: group.required,
        modifiers: group.modifiers.map(mod => ({
          id: mod.external_id || mod.id,
          name: mod.name,
          price: mod.price,
          available: mod.is_available,
        })),
      })) || [],
    };

    const response = await this.makeRequest<{ productMappings: Record<string, string> }>(
      `/restaurants/${this.credentials.restaurant_id}/menu`,
      {
        method: 'PUT',
        body: JSON.stringify(justEatMenu),
      }
    );

    if (!response.success) {
      console.error('[Just Eat] Failed to sync menu:', response.error);
      return { success: false };
    }

    console.log('[Just Eat] Menu synced successfully');
    return {
      success: true,
      itemMappings: response.data?.productMappings,
    };
  }

  /**
   * Accept an order from Just Eat
   * Timeout varies by order type:
   * - Same-day: 15 minutes
   * - <24hrs: 2 hours
   * - >48hrs: 24 hours
   */
  async acceptOrder(
    orderId: string, 
    estimatedPrepTime?: number
  ): Promise<boolean> {
    console.log('[Just Eat] Accepting order:', orderId);

    const response = await this.makeRequest<{ orderId: string; status: string }>(
      `/restaurants/${this.credentials.restaurant_id}/orders/${orderId}/accept`,
      {
        method: 'POST',
        body: JSON.stringify({
          acceptedAt: new Date().toISOString(),
          estimatedPrepTime: estimatedPrepTime || 30
        }),
      }
    );

    if (!response.success) {
      console.error('[Just Eat] Failed to accept order:', response.error);
      return false;
    }

    console.log('[Just Eat] Order accepted successfully');
    return true;
  }

  /**
   * Reject an order from Just Eat
   */
  async denyOrder(
    orderId: string, 
    reason: 'OUT_OF_STOCK' | 'TOO_BUSY' | 'CLOSING' | 'TECHNICAL_ISSUE',
    notes?: string
  ): Promise<boolean> {
    console.log('[Just Eat] Rejecting order:', orderId, 'Reason:', reason);

    const response = await this.makeRequest<{ orderId: string; status: string }>(
      `/restaurants/${this.credentials.restaurant_id}/orders/${orderId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({
          rejectedAt: new Date().toISOString(),
          reason: reason,
          notes: notes || 'Unable to fulfill order'
        }),
      }
    );

    if (!response.success) {
      console.error('[Just Eat] Failed to reject order:', response.error);
      return false;
    }

    console.log('[Just Eat] Order rejected successfully');
    return true;
  }

  /**
   * Calculate acceptance timeout based on order details
   */
  calculateAcceptanceTimeout(
    placedDate: Date, 
    deliveryDate?: Date
  ): { timeout: number; unit: string } {
    const hoursUntilDelivery = deliveryDate 
      ? (deliveryDate.getTime() - placedDate.getTime()) / (1000 * 60 * 60)
      : 0;

    if (!deliveryDate || hoursUntilDelivery < 24) {
      return { timeout: 15, unit: 'minutes' };
    } else if (hoursUntilDelivery < 48) {
      return { timeout: 2, unit: 'hours' };
    } else {
      return { timeout: 24, unit: 'hours' };
    }
  }

  /**
   * Set restaurant availability (open/closed)
   */
  async setStoreAvailability(isOpen: boolean): Promise<boolean> {
    console.log('[Just Eat] Setting restaurant availability:', isOpen);

    const response = await this.makeRequest<void>(
      `/restaurants/${this.credentials.restaurant_id}/availability`,
      {
        method: 'PUT',
        body: JSON.stringify({
          isOpen,
          updatedAt: new Date().toISOString(),
        }),
      }
    );

    if (!response.success) {
      console.error('[Just Eat] Failed to set availability:', response.error);
      return false;
    }

    console.log('[Just Eat] Restaurant availability updated');
    return true;
  }

  /**
   * Transform Just Eat order to platform-agnostic format
   */
  private transformOrder(justEatOrder: any): PlatformOrder {
    return {
      id: justEatOrder.orderId,
      display_id: justEatOrder.orderId.slice(-8),
      status: mapPlatformStatusToInternal(justEatOrder.status, 'just_eat'),
      created_at: justEatOrder.placedDate,
      customer: {
        full_name: justEatOrder.customer.name,
        phone: justEatOrder.customer.phoneNumber,
      },
      items: justEatOrder.basket.items.map((item: any) => ({
        id: item.productId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price / item.quantity,
        total_price: item.price,
        modifiers: [],
        special_instructions: item.instructions,
      })),
      totals: {
        subtotal: justEatOrder.basket.subTotal,
        tax: 0, // Just Eat includes tax in prices
        delivery_fee: justEatOrder.basket.deliveryCharge,
        service_fee: 0,
        tip: 0,
        total: justEatOrder.basket.total,
        currency: 'GBP',
      },
      delivery_info: justEatOrder.customer.address ? {
        address: {
          street: justEatOrder.customer.address.street,
          city: justEatOrder.customer.address.city,
          postal_code: justEatOrder.customer.address.postcode,
          country: 'GB',
        },
      } : undefined,
      special_instructions: justEatOrder.deliveryInstructions,
      raw_data: justEatOrder,
    };
  }
}
