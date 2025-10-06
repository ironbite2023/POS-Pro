import { supabase } from '../supabase/client';
import type { Database, Json } from '../supabase/database.types';

// Type aliases for better readability
type PlatformIntegration = Database['public']['Tables']['platform_integrations']['Row'];
type PlatformIntegrationInsert = Database['public']['Tables']['platform_integrations']['Insert'];
type Order = Database['public']['Tables']['orders']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type PlatformEnum = Database['public']['Enums']['platform_enum'];

// Platform-specific credential interfaces
export interface UberEatsCredentials {
  client_id: string;
  client_secret: string;
  store_id: string;
}

export interface DeliverooCredentials {
  client_id: string;
  client_secret: string;
  restaurant_id: string;
}

export interface JustEatCredentials {
  api_token: string;
  restaurant_id: string;
}

export type PlatformCredentials = UberEatsCredentials | DeliverooCredentials | JustEatCredentials;

// Service response types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface MenuSyncResult {
  success: boolean;
  platform: PlatformEnum;
  message: string;
  itemMappings?: Record<string, string>;
}

export interface DeliveryAnalytics {
  platform: string;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  completed_orders: number;
  cancelled_orders: number;
  average_prep_time_minutes: number;
}

/**
 * Delivery Platform Service
 * Manages integrations with Uber Eats, Deliveroo, and Just Eat
 */
export const deliveryPlatformService = {
  /**
   * Get active platform integrations for an organization
   */
  getActivePlatforms: async (organizationId: string): Promise<ServiceResponse<PlatformIntegration[]>> => {
    try {
      const { data, error } = await supabase
        .from('platform_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active platforms:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Exception in getActivePlatforms:', error);
      return {
        success: false,
        error: 'Failed to fetch active platforms',
        details: error,
      };
    }
  },

  /**
   * Get all platform integrations (active and inactive) for an organization
   */
  getAllPlatforms: async (organizationId: string): Promise<ServiceResponse<PlatformIntegration[]>> => {
    try {
      const { data, error } = await supabase
        .from('platform_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('platform', { ascending: true });

      if (error) {
        console.error('Error fetching all platforms:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Exception in getAllPlatforms:', error);
      return {
        success: false,
        error: 'Failed to fetch platforms',
        details: error,
      };
    }
  },

  /**
   * Get a specific platform integration by ID
   */
  getPlatformById: async (integrationId: string): Promise<ServiceResponse<PlatformIntegration>> => {
    try {
      const { data, error } = await supabase
        .from('platform_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error) {
        console.error('Error fetching platform:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Exception in getPlatformById:', error);
      return {
        success: false,
        error: 'Failed to fetch platform',
        details: error,
      };
    }
  },

  /**
   * Create or update a platform integration
   */
  upsertPlatformIntegration: async (integration: {
    organization_id: string;
    platform: PlatformEnum;
    platform_restaurant_id: string;
    credentials: PlatformCredentials;
    settings?: Record<string, unknown>;
  }): Promise<ServiceResponse<PlatformIntegration>> => {
    try {
      // In production, credentials should be stored in Supabase Vault
      // For now, we'll store them as JSONB (ensure encryption at rest)
      const credentialsJson = JSON.parse(JSON.stringify(integration.credentials)) as Json;

      const { data, error } = await supabase
        .from('platform_integrations')
        .upsert({
          organization_id: integration.organization_id,
          platform: integration.platform,
          platform_restaurant_id: integration.platform_restaurant_id,
          credentials: credentialsJson,
          settings: (integration.settings || {}) as Json,
          webhook_url: deliveryPlatformService.generateWebhookUrl(
            integration.platform,
            integration.organization_id
          ),
          is_active: false, // Will be activated after successful test
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id,platform',
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting platform integration:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Exception in upsertPlatformIntegration:', error);
      return {
        success: false,
        error: 'Failed to save platform integration',
        details: error,
      };
    }
  },

  /**
   * Activate or deactivate a platform integration
   */
  togglePlatformActive: async (
    integrationId: string,
    isActive: boolean
  ): Promise<ServiceResponse<PlatformIntegration>> => {
    try {
      const { data, error } = await supabase
        .from('platform_integrations')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling platform active status:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Exception in togglePlatformActive:', error);
      return {
        success: false,
        error: 'Failed to update platform status',
        details: error,
      };
    }
  },

  /**
   * Delete a platform integration
   */
  deletePlatformIntegration: async (integrationId: string): Promise<ServiceResponse<void>> => {
    try {
      const { error } = await supabase
        .from('platform_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) {
        console.error('Error deleting platform integration:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Exception in deletePlatformIntegration:', error);
      return {
        success: false,
        error: 'Failed to delete platform integration',
        details: error,
      };
    }
  },

  /**
   * Test platform connectivity (calls Edge Function)
   */
  testPlatformConnection: async (integrationId: string): Promise<ServiceResponse<{
    connected: boolean;
    message: string;
    details?: unknown;
  }>> => {
    try {
      const { data, error } = await supabase.functions.invoke('test-platform-connection', {
        body: { integrationId },
      });

      if (error) {
        console.error('Error testing platform connection:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: data?.connected || false,
        data: data || { connected: false, message: 'Unknown error' },
      };
    } catch (error) {
      console.error('Exception in testPlatformConnection:', error);
      return {
        success: false,
        error: 'Failed to test platform connection',
        details: error,
      };
    }
  },

  /**
   * Sync menu to all active platforms
   */
  syncMenuToAllPlatforms: async (organizationId: string): Promise<ServiceResponse<{
    results: Record<string, MenuSyncResult>;
    overallSuccess: boolean;
  }>> => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-menu', {
        body: { organizationId, syncAll: true },
      });

      if (error) {
        console.error('Error syncing menu to all platforms:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: data?.overallSuccess || false,
        data: data || { results: {}, overallSuccess: false },
      };
    } catch (error) {
      console.error('Exception in syncMenuToAllPlatforms:', error);
      return {
        success: false,
        error: 'Failed to sync menu to platforms',
        details: error,
      };
    }
  },

  /**
   * Sync menu to a specific platform
   */
  syncMenuToPlatform: async (
    integrationId: string,
    platform: PlatformEnum
  ): Promise<ServiceResponse<MenuSyncResult>> => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-menu', {
        body: { integrationId, platform },
      });

      if (error) {
        console.error(`Error syncing menu to ${platform}:`, error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: data?.success || false,
        data: data || { success: false, platform, message: 'Unknown error' },
      };
    } catch (error) {
      console.error(`Exception in syncMenuToPlatform for ${platform}:`, error);
      return {
        success: false,
        error: `Failed to sync menu to ${platform}`,
        details: error,
      };
    }
  },

  /**
   * Accept an order on its delivery platform
   * CRITICAL: Must be called within platform timeout windows
   */
  acceptOrder: async (orderId: string): Promise<ServiceResponse<void>> => {
    try {
      // Get order and platform information
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          platform_integrations(platform, credentials)
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return {
          success: false,
          error: 'Order not found',
          details: orderError,
        };
      }

      if (!order.platform_order_id || !order.delivery_platform) {
        return {
          success: false,
          error: 'Order is not from a delivery platform',
        };
      }

      // Use appropriate platform client to accept order
      const { createPlatformClient } = await import('../integrations');
      const platformIntegration = (order as any).platform_integrations;
      
      if (!platformIntegration) {
        return {
          success: false,
          error: 'Platform integration not found',
        };
      }

      const client = createPlatformClient(
        order.delivery_platform,
        platformIntegration.credentials
      );

      const success = await (client as any).acceptOrder(order.platform_order_id);
      
      if (success) {
        // Update order status in database
        await supabase
          .from('orders')
          .update({ 
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }

      return {
        success,
        error: success ? undefined : 'Failed to accept order on platform',
      };
    } catch (error) {
      console.error('Exception in acceptOrder:', error);
      return {
        success: false,
        error: 'Failed to accept order',
        details: error,
      };
    }
  },

  /**
   * Reject an order on its delivery platform
   * CRITICAL: Must be called within platform timeout windows
   */
  rejectOrder: async (
    orderId: string, 
    reason: string,
    explanation?: string
  ): Promise<ServiceResponse<void>> => {
    try {
      // Get order and platform information
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          platform_integrations(platform, credentials)
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return {
          success: false,
          error: 'Order not found',
          details: orderError,
        };
      }

      if (!order.platform_order_id || !order.delivery_platform) {
        return {
          success: false,
          error: 'Order is not from a delivery platform',
        };
      }

      // Use appropriate platform client to reject order
      const { createPlatformClient } = await import('../integrations');
      const platformIntegration = (order as any).platform_integrations;
      
      if (!platformIntegration) {
        return {
          success: false,
          error: 'Platform integration not found',
        };
      }

      const client = createPlatformClient(
        order.delivery_platform,
        platformIntegration.credentials
      );

      const success = await (client as any).denyOrder(order.platform_order_id, reason, explanation);
      
      if (success) {
        // Update order status in database
        await supabase
          .from('orders')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }

      return {
        success,
        error: success ? undefined : 'Failed to reject order on platform',
      };
    } catch (error) {
      console.error('Exception in rejectOrder:', error);
      return {
        success: false,
        error: 'Failed to reject order',
        details: error,
      };
    }
  },

  /**
   * Update order status (syncs to platform if delivery order)
   */
  updateOrderStatus: async (orderId: string, newStatus: string): Promise<ServiceResponse<void>> => {
    try {
      // First update the order in our database
      const { error: dbError } = await supabase
        .from('orders')
        .update({
          status: newStatus as Database['public']['Enums']['order_status'],
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (dbError) {
        console.error('Error updating order status:', dbError);
        return {
          success: false,
          error: dbError.message,
          details: dbError,
        };
      }

      // Then invoke Edge Function to sync with platform if it's a delivery order
      const { error: functionError } = await supabase.functions.invoke('update-order-status', {
        body: { orderId, newStatus },
      });

      if (functionError) {
        console.warn('Warning: Order updated locally but platform sync failed:', functionError);
        // Don't fail the entire operation, just log the warning
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Exception in updateOrderStatus:', error);
      return {
        success: false,
        error: 'Failed to update order status',
        details: error,
      };
    }
  },

  /**
   * Get delivery analytics for an organization
   */
  getDeliveryAnalytics: async (
    organizationId: string,
    branchId?: string,
    daysBack: number = 30
  ): Promise<ServiceResponse<DeliveryAnalytics[]>> => {
    try {
      const { data, error } = await supabase.rpc('get_delivery_analytics', {
        org_id: organizationId,
        branch_id: branchId || null,
        days_back: daysBack,
      });

      if (error) {
        console.error('Error fetching delivery analytics:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Exception in getDeliveryAnalytics:', error);
      return {
        success: false,
        error: 'Failed to fetch delivery analytics',
        details: error,
      };
    }
  },

  /**
   * Get delivery orders for an organization with filters
   */
  getDeliveryOrders: async (
    organizationId: string,
    filters?: {
      branchId?: string;
      platform?: PlatformEnum;
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<ServiceResponse<Order[]>> => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          platform_integrations(platform, platform_restaurant_id),
          order_items(*)
        `)
        .eq('organization_id', organizationId)
        .not('delivery_platform', 'is', null);

      if (filters?.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }

      if (filters?.platform) {
        query = query.eq('delivery_platform', filters.platform);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status as Database['public']['Enums']['order_status']);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching delivery orders:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Exception in getDeliveryOrders:', error);
      return {
        success: false,
        error: 'Failed to fetch delivery orders',
        details: error,
      };
    }
  },

  /**
   * Update last sync time for a platform integration
   */
  updateSyncTime: async (integrationId: string): Promise<ServiceResponse<void>> => {
    try {
      const { error } = await supabase.rpc('update_platform_integration_sync_time', {
        integration_id: integrationId,
      });

      if (error) {
        console.error('Error updating sync time:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Exception in updateSyncTime:', error);
      return {
        success: false,
        error: 'Failed to update sync time',
        details: error,
      };
    }
  },

  /**
   * Clean up old processed webhooks (maintenance function)
   */
  cleanupWebhooks: async (daysToKeep: number = 7): Promise<ServiceResponse<{ deletedCount: number }>> => {
    try {
      const { data, error } = await supabase.rpc('cleanup_processed_webhooks', {
        days_to_keep: daysToKeep,
      });

      if (error) {
        console.error('Error cleaning up webhooks:', error);
        return {
          success: false,
          error: error.message,
          details: error,
        };
      }

      return {
        success: true,
        data: { deletedCount: data || 0 },
      };
    } catch (error) {
      console.error('Exception in cleanupWebhooks:', error);
      return {
        success: false,
        error: 'Failed to cleanup webhooks',
        details: error,
      };
    }
  },

  /**
   * Private helper: Generate webhook URL for a platform
   */
  generateWebhookUrl: (platform: PlatformEnum, organizationId: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || '';
    return `${baseUrl}/functions/v1/${platform}-webhook?org=${organizationId}`;
  },

  /**
   * Get platform statistics
   */
  getPlatformStats: async (organizationId: string): Promise<ServiceResponse<{
    totalIntegrations: number;
    activeIntegrations: number;
    platformBreakdown: Record<PlatformEnum, { active: boolean; orderCount: number }>;
  }>> => {
    try {
      // Get all integrations
      const integrationsResponse = await deliveryPlatformService.getAllPlatforms(organizationId);
      
      if (!integrationsResponse.success || !integrationsResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch integrations',
        };
      }

      const integrations = integrationsResponse.data;
      const totalIntegrations = integrations.length;
      const activeIntegrations = integrations.filter(i => i.is_active).length;

      // Get order counts per platform
      const platformBreakdown: Record<string, { active: boolean; orderCount: number }> = {};
      
      for (const integration of integrations) {
        const { count } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('delivery_platform', integration.platform);

        platformBreakdown[integration.platform] = {
          active: integration.is_active,
          orderCount: count || 0,
        };
      }

      return {
        success: true,
        data: {
          totalIntegrations,
          activeIntegrations,
          platformBreakdown: platformBreakdown as Record<PlatformEnum, { active: boolean; orderCount: number }>,
        },
      };
    } catch (error) {
      console.error('Exception in getPlatformStats:', error);
      return {
        success: false,
        error: 'Failed to fetch platform statistics',
        details: error,
      };
    }
  },
};

export default deliveryPlatformService;
