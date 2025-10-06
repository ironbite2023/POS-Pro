/**
 * Platform Integration Types
 * Shared types and interfaces for delivery platform API clients
 */

import type { Database } from '../supabase/database.types';

export type PlatformEnum = Database['public']['Enums']['platform_enum'];

// Common interfaces for all platforms
export interface PlatformConfig {
  baseUrl: string;
  apiVersion?: string;
  timeout?: number;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: Date;
  refresh_token?: string;
}

export interface PlatformCredentials {
  client_id?: string;
  client_secret?: string;
  api_token?: string;
  store_id?: string;
  restaurant_id?: string;
}

// Order-related types
export interface PlatformOrder {
  id: string;
  display_id: string;
  status: string;
  created_at: string;
  customer: PlatformCustomer;
  items: PlatformOrderItem[];
  totals: PlatformOrderTotals;
  delivery_info?: PlatformDeliveryInfo;
  special_instructions?: string;
  raw_data: Record<string, unknown>;
}

export interface PlatformCustomer {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface PlatformOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  modifiers?: PlatformModifier[];
  special_instructions?: string;
}

export interface PlatformModifier {
  id: string;
  name: string;
  price?: number;
  quantity?: number;
}

export interface PlatformOrderTotals {
  subtotal: number;
  tax: number;
  delivery_fee?: number;
  service_fee?: number;
  tip?: number;
  total: number;
  currency: string;
}

export interface PlatformDeliveryInfo {
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    notes?: string;
  };
  estimated_pickup_time?: string;
  estimated_delivery_time?: string;
  driver_info?: {
    name?: string;
    phone?: string;
  };
}

// Menu-related types
export interface PlatformMenu {
  categories: PlatformCategory[];
  items: PlatformMenuItem[];
  modifier_groups?: PlatformModifierGroup[];
}

export interface PlatformCategory {
  id: string;
  external_id?: string;
  name: string;
  description?: string;
  sort_order?: number;
  item_ids: string[];
}

export interface PlatformMenuItem {
  id: string;
  external_id?: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  is_available: boolean;
  image_url?: string;
  preparation_time?: number;
  allergen_info?: string[];
  dietary_labels?: string[];
  modifier_group_ids?: string[];
}

export interface PlatformModifierGroup {
  id: string;
  external_id?: string;
  name: string;
  modifiers: PlatformModifierOption[];
  min_selections: number;
  max_selections: number;
  required: boolean;
}

export interface PlatformModifierOption {
  id: string;
  external_id?: string;
  name: string;
  price: number;
  is_available: boolean;
}

// API Response types
export interface PlatformApiResponse<T> {
  success: boolean;
  data?: T;
  error?: PlatformApiError;
  meta?: {
    request_id?: string;
    timestamp?: string;
  };
}

export interface PlatformApiError {
  code: string;
  message: string;
  details?: unknown;
  retry_after?: number;
}

// Status mapping types
export interface StatusMapping {
  internal: string;
  platform_specific: Record<PlatformEnum, string>;
}

export const ORDER_STATUS_MAPPINGS: StatusMapping[] = [
  {
    internal: 'pending',
    platform_specific: {
      uber_eats: 'created',
      deliveroo: 'PENDING',
      just_eat: 'new',
    },
  },
  {
    internal: 'accepted',
    platform_specific: {
      uber_eats: 'accepted',
      deliveroo: 'ACCEPT_ORDER',
      just_eat: 'acknowledged',
    },
  },
  {
    internal: 'preparing',
    platform_specific: {
      uber_eats: 'in_progress',
      deliveroo: 'PREPARATION_STARTED',
      just_eat: 'cooking',
    },
  },
  {
    internal: 'ready',
    platform_specific: {
      uber_eats: 'ready_for_pickup',
      deliveroo: 'READY_FOR_COLLECTION',
      just_eat: 'ready',
    },
  },
  {
    internal: 'completed',
    platform_specific: {
      uber_eats: 'delivered',
      deliveroo: 'COLLECTED',
      just_eat: 'delivered',
    },
  },
  {
    internal: 'cancelled',
    platform_specific: {
      uber_eats: 'cancelled',
      deliveroo: 'REJECT_ORDER',
      just_eat: 'cancelled',
    },
  },
];

// Platform client interface (all clients should implement this)
export interface IPlatformClient {
  authenticate(): Promise<boolean>;
  getOrders(params?: { status?: string; since?: Date }): Promise<PlatformOrder[]>;
  getOrder(orderId: string): Promise<PlatformOrder>;
  updateOrderStatus(orderId: string, status: string): Promise<boolean>;
  syncMenu(menu: PlatformMenu): Promise<{ success: boolean; itemMappings?: Record<string, string> }>;
  setStoreAvailability(isOpen: boolean): Promise<boolean>;
  
  // Critical order acceptance methods
  acceptOrder(orderId: string, ...args: any[]): Promise<boolean>;
  denyOrder(orderId: string, reason: string, explanation?: string): Promise<boolean>;
}

// Helper functions
export const mapInternalStatusToPlatform = (
  internalStatus: string,
  platform: PlatformEnum
): string => {
  const mapping = ORDER_STATUS_MAPPINGS.find(m => m.internal === internalStatus);
  return mapping?.platform_specific[platform] || internalStatus;
};

export const mapPlatformStatusToInternal = (
  platformStatus: string,
  platform: PlatformEnum
): string => {
  const mapping = ORDER_STATUS_MAPPINGS.find(
    m => m.platform_specific[platform] === platformStatus
  );
  return mapping?.internal || 'pending';
};
