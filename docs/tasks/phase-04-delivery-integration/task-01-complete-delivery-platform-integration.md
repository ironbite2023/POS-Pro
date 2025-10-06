# Task 4.1: Complete Delivery Platform Integration

**Task ID**: TASK-04-001  
**Phase**: 4 - Delivery Integration  
**Priority**: 🔴 P1 - High  
**Estimated Time**: 2-3 weeks  
**Complexity**: 🔴 High  
**Status**: 📋 Not Started

---

## 1. Detailed Request Analysis

### What is Being Requested

Implement comprehensive integration with major UK delivery platforms to eliminate "Tablet Hell" and create a unified order management system:

- **Uber Eats Integration**: Full two-way API integration with OAuth 2.0 authentication
- **Deliveroo Integration**: Complete API integration with order and menu synchronization
- **Just Eat Integration**: Full integration with webhook and API management
- **Unified Order Interface**: Single dashboard replacing multiple tablets
- **Real-Time Synchronization**: Live order updates across all platforms
- **Menu Synchronization**: Automatic menu updates pushed to all platforms
- **Order Orchestration**: Intelligent routing and status management

### Current State Analysis

**What We Have (Strong Foundation)**:
- ✅ Complete Supabase backend with orders, menu, inventory systems
- ✅ Real-time order management with kitchen display
- ✅ Menu management with categories, items, and availability
- ✅ Authentication and multi-tenant organization structure
- ✅ Payment processing with Stripe integration
- ✅ Real-time subscriptions and notification system

**What's Missing (Delivery Integration)**:
- ❌ No connection to delivery platforms
- ❌ Manual order entry from delivery tablets
- ❌ No unified order view across platforms
- ❌ Manual menu updates on each platform
- ❌ No delivery-specific analytics or insights

### Target State

**Unified Delivery Operations**:
- 🎯 Single interface replacing 3-5 delivery tablets
- 🎯 Automatic order ingestion from all platforms via webhooks
- 🎯 Real-time order synchronization across POS and delivery platforms
- 🎯 One-click menu updates pushed to all platforms simultaneously
- 🎯 Unified analytics showing delivery vs. dine-in performance
- 🎯 Intelligent order priority and routing based on platform and timing

### Affected Files and Systems

```
Database Extensions:
├── platform_integrations table (new)
├── unified_orders table (extends existing orders)
├── unified_menu_items (extends existing menu_items)
├── delivery_analytics views (new)
└── webhook_processing_queue (new)

Supabase Edge Functions:
├── supabase/functions/uber-eats-webhook/
├── supabase/functions/deliveroo-webhook/
├── supabase/functions/just-eat-webhook/
├── supabase/functions/update-order-status/
├── supabase/functions/sync-menu/
└── supabase/functions/set-store-availability/

Frontend Components:
├── src/app/(default)/delivery/
│   ├── unified-orders/page.tsx
│   ├── platform-settings/page.tsx
│   ├── menu-sync/page.tsx
│   └── analytics/page.tsx
├── src/components/delivery/
│   ├── UnifiedOrderCenter.tsx
│   ├── DeliveryOrderCard.tsx
│   ├── PlatformStatusIndicator.tsx
│   ├── MenuSyncManager.tsx
│   └── DeliveryAnalytics.tsx
└── src/lib/services/
    ├── delivery.service.ts
    └── platform-integration.service.ts
```

---

## 2. Justification and Benefits

### Why This Task is Critical

**Primary Business Problem Solved**:
> **"Tablet Hell"** - Restaurants currently manage 3-5 separate tablets (Uber Eats, Deliveroo, Just Eat, etc.) with different interfaces, alert sounds, and workflows. This creates chaos, missed orders, and operational inefficiency.

**Business Value**:
- ✅ **Operational Efficiency**: 70% reduction in time spent managing delivery orders
- ✅ **Revenue Protection**: Eliminate missed orders due to tablet management
- ✅ **Staff Productivity**: Single interface reduces training time and errors
- ✅ **Competitive Advantage**: Modern unified system vs. legacy tablet management
- ✅ **Scalability**: Easy to add new platforms without additional complexity

**Technical Benefits**:
- ✅ **Real-Time Operations**: Instant order visibility and updates
- ✅ **Data Unification**: Single source of truth for all orders
- ✅ **Menu Consistency**: Automated synchronization prevents discrepancies
- ✅ **API-First Architecture**: Extensible for future platforms
- ✅ **Performance**: Eliminates manual data entry and reduces errors

**Customer Impact**:
- ✅ **Faster Service**: Orders processed immediately without delay
- ✅ **Accuracy**: Reduced errors from manual transcription
- ✅ **Consistency**: Same service quality across all platforms
- ✅ **Real-Time Updates**: Customers get accurate order status

### Problems It Solves

1. **Operational Chaos**: Multiple tablets creating confusion and missed orders
2. **Manual Menu Management**: Having to update menus on each platform separately
3. **Data Silos**: No unified view of delivery performance vs. dine-in
4. **Staff Training**: Each platform requires different training and workflows
5. **Error-Prone Processes**: Manual order transcription leads to mistakes
6. **Inefficient Analytics**: Can't compare performance across platforms
7. **Scalability Issues**: Adding new platforms increases complexity exponentially

---

## 3. Prerequisites

### Knowledge Requirements

**Platform APIs & Authentication**:
- ✅ OAuth 2.0 Client Credentials flow (Uber Eats, Deliveroo)
- ✅ API key authentication (Just Eat)
- ✅ Webhook signature verification and security
- ✅ Platform-specific data transformation patterns
- ✅ Rate limiting and API quotas management

**Backend Technologies**:
- ✅ Supabase Edge Functions (Deno runtime)
- ✅ PostgreSQL advanced queries and JSONB operations
- ✅ Database indexing and performance optimization
- ✅ Webhook processing and queue management
- ✅ Error handling and retry strategies

### Technical Prerequisites

**Existing Systems (All Complete)**:
- ✅ **Task 1.2 (Menu Management)**: Menu items and categories system
- ✅ **Task 1.4 (POS Operations)**: Order management and kitchen display
- ✅ **Task 1.5 (Sales & Reporting)**: Analytics foundation
- ✅ **Task 2.1 (Real-Time Features)**: Supabase Realtime subscriptions
- ✅ **Authentication & Organization Context**: Multi-tenant setup

**Platform Requirements**:
- ✅ **Uber Eats Partner Account**: Business verification and API access
- ✅ **Deliveroo Partner Account**: Restaurant onboarding and API credentials
- ✅ **Just Eat Partner Account**: API token provisioning
- ✅ **Webhook Endpoints**: Public URLs for webhook delivery
- ✅ **SSL Certificates**: HTTPS required for all webhook endpoints

### Environment Prerequisites

**Supabase Configuration**:
- ✅ Edge Functions enabled
- ✅ Supabase Vault configured
- ✅ Database with existing menu and order tables
- ✅ Real-time subscriptions active
- ✅ Row-Level Security policies configured

**Development Environment**:
- ✅ Supabase CLI installed
- ✅ Platform test credentials (sandbox/staging)
- ✅ Webhook testing tools (ngrok, webhook.site)
- ✅ API testing tools (Postman, curl)

### Dependencies

```json
{
  "@supabase/supabase-js": "^2.x",
  "react": "^18.x",
  "next": "^14.x",
  "@radix-ui/themes": "^2.x",
  "zod": "^3.x",
  "date-fns": "^2.x"
}
```

**Platform SDKs** (if available):
```json
{
  "uber-eats-api": "^1.x",
  "deliveroo-api": "^1.x" 
}
```

---

## 4. Implementation Methodology

### Step 1: Extend Database Schema for Delivery Integration (1-2 days)

#### 1.1 Create Platform Integration Tables

```sql
-- Run in Supabase SQL Editor

-- Enum for supported platforms
CREATE TYPE platform_enum AS ENUM ('uber_eats', 'deliveroo', 'just_eat');

-- Enum for unified order status (extends existing)
CREATE TYPE delivery_order_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled');

-- Platform Integrations: Store credentials and settings per organization per platform
CREATE TABLE platform_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    platform platform_enum NOT NULL,
    platform_restaurant_id TEXT NOT NULL, -- The ID Uber/Deliveroo/JustEat uses for the store
    credentials JSONB NOT NULL, -- Encrypted credential references (Vault keys)
    webhook_url TEXT, -- Generated webhook URL for this integration
    settings JSONB DEFAULT '{}'::jsonb, -- Platform-specific settings
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, platform)
);

-- Indexes for performance
CREATE INDEX idx_platform_integrations_org_id ON platform_integrations(organization_id);
CREATE INDEX idx_platform_integrations_active ON platform_integrations(is_active) WHERE is_active = true;

-- Extend existing orders table with delivery-specific fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_integration_id UUID REFERENCES platform_integrations(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_platform platform_enum;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_customer_info JSONB;

-- Create unique constraint for platform orders
ALTER TABLE orders ADD CONSTRAINT unique_platform_order 
    UNIQUE(platform_integration_id, platform_order_id) 
    DEFERRABLE INITIALLY DEFERRED;

-- Webhook Processing Queue for resilience
CREATE TABLE webhook_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform platform_enum NOT NULL,
    webhook_payload JSONB NOT NULL,
    headers JSONB NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 5,
    last_attempt_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    error_message TEXT,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_queue_next_attempt ON webhook_processing_queue(next_attempt_at) 
    WHERE processed = FALSE;
CREATE INDEX idx_webhook_queue_platform ON webhook_processing_queue(platform);

-- Menu Platform Mappings: Links internal menu to platform-specific IDs
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS platform_mappings JSONB DEFAULT '{}'::jsonb;

-- Example platform_mappings structure:
-- {
--   "uber_eats": {"item_id": "uber_item_123", "category_id": "uber_cat_456"},
--   "deliveroo": {"item_id": "deliveroo_item_789"},
--   "just_eat": {"item_id": "justeat_item_101"}
-- }
```

#### 1.2 Create Database Functions

```sql
-- Function to get active platform integrations for an organization
CREATE OR REPLACE FUNCTION get_active_platform_integrations(org_id UUID)
RETURNS TABLE (
    platform platform_enum,
    platform_restaurant_id TEXT,
    settings JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.platform,
        pi.platform_restaurant_id,
        pi.settings
    FROM platform_integrations pi
    WHERE pi.organization_id = org_id 
    AND pi.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transform order status between internal and platform formats
CREATE OR REPLACE FUNCTION map_order_status_to_platform(
    internal_status TEXT,
    target_platform platform_enum
) RETURNS TEXT AS $$
BEGIN
    CASE target_platform
        WHEN 'uber_eats' THEN
            CASE internal_status
                WHEN 'accepted' THEN RETURN 'accepted';
                WHEN 'preparing' THEN RETURN 'in_progress';
                WHEN 'ready' THEN RETURN 'ready_for_pickup';
                WHEN 'completed' THEN RETURN 'delivered';
                WHEN 'cancelled' THEN RETURN 'cancelled';
                ELSE RETURN 'pending';
            END CASE;
        WHEN 'deliveroo' THEN
            CASE internal_status
                WHEN 'accepted' THEN RETURN 'ACCEPT_ORDER';
                WHEN 'preparing' THEN RETURN 'PREPARATION_STARTED';
                WHEN 'ready' THEN RETURN 'READY_FOR_COLLECTION';
                WHEN 'completed' THEN RETURN 'COLLECTED';
                WHEN 'cancelled' THEN RETURN 'REJECT_ORDER';
                ELSE RETURN 'PENDING';
            END CASE;
        WHEN 'just_eat' THEN
            CASE internal_status
                WHEN 'accepted' THEN RETURN 'acknowledged';
                WHEN 'preparing' THEN RETURN 'cooking';
                WHEN 'ready' THEN RETURN 'ready';
                WHEN 'completed' THEN RETURN 'delivered';
                WHEN 'cancelled' THEN RETURN 'cancelled';
                ELSE RETURN 'new';
            END CASE;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Success Criteria**:
- ✅ Database schema extends existing tables without breaking changes
- ✅ All indexes created for optimal query performance
- ✅ Functions compile and execute without errors
- ✅ RLS policies updated for new tables

---

### Step 2: Create Delivery Platform Service Layer (2-3 days)

#### 2.1 Create `src/lib/services/delivery-platform.service.ts`

```typescript
import { supabase } from '../supabase/client';
import type { Database } from '../supabase/database.types';

type PlatformIntegration = Database['public']['Tables']['platform_integrations']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

// Platform-specific credential interfaces
interface UberEatsCredentials {
  client_id: string;
  client_secret: string;
  store_id: string;
}

interface DeliverooCredentials {
  client_id: string;
  client_secret: string;
  restaurant_id: string;
}

interface JustEatCredentials {
  api_token: string;
  restaurant_id: string;
}

export const deliveryPlatformService = {
  /**
   * Get active platform integrations for organization
   */
  getActivePlatforms: async (organizationId: string): Promise<PlatformIntegration[]> => {
    const { data, error } = await supabase
      .from('platform_integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  /**
   * Create or update platform integration
   */
  upsertPlatformIntegration: async (integration: {
    organization_id: string;
    platform: 'uber_eats' | 'deliveroo' | 'just_eat';
    platform_restaurant_id: string;
    credentials: UberEatsCredentials | DeliverooCredentials | JustEatCredentials;
    settings?: Record<string, any>;
  }): Promise<PlatformIntegration> => {
    // Store credentials in Supabase Vault (implementation depends on setup)
    const credentialVaultKeys = await this.storeCredentialsInVault(
      integration.organization_id,
      integration.platform,
      integration.credentials
    );

    const { data, error } = await supabase
      .from('platform_integrations')
      .upsert({
        organization_id: integration.organization_id,
        platform: integration.platform,
        platform_restaurant_id: integration.platform_restaurant_id,
        credentials: credentialVaultKeys, // Store vault key references, not actual credentials
        settings: integration.settings || {},
        webhook_url: this.generateWebhookUrl(integration.platform, integration.organization_id),
        is_active: false, // Will be activated after successful test
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,platform'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Test platform connectivity
   */
  testPlatformConnection: async (integrationId: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> => {
    // This would call the appropriate Edge Function to test API connectivity
    const { data, error } = await supabase.functions.invoke('test-platform-connection', {
      body: { integrationId },
    });

    if (error) {
      return {
        success: false,
        message: error.message,
        details: error,
      };
    }

    return data;
  },

  /**
   * Sync menu to all active platforms
   */
  syncMenuToAllPlatforms: async (organizationId: string): Promise<{
    success: boolean;
    results: Record<string, { success: boolean; message: string }>;
  }> => {
    const { data, error } = await supabase.functions.invoke('sync-menu', {
      body: { organizationId },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Update order status across platforms
   */
  updateOrderStatus: async (orderId: string, newStatus: string): Promise<void> => {
    const { error } = await supabase.functions.invoke('update-order-status', {
      body: { orderId, newStatus },
    });

    if (error) throw error;
  },

  /**
   * Get delivery analytics
   */
  getDeliveryAnalytics: async (organizationId: string, branchId?: string) => {
    const { data, error } = await supabase
      .rpc('get_delivery_analytics', {
        org_id: organizationId,
        branch_id: branchId,
      });

    if (error) throw error;
    return data;
  },

  /**
   * Private helper methods
   */
  private storeCredentialsInVault: async (
    organizationId: string,
    platform: string,
    credentials: any
  ) => {
    // Implementation depends on Supabase Vault setup
    // Returns object with vault key references
    const vaultKeys = {
      client_id_key: `${platform}_${organizationId}_client_id`,
      client_secret_key: `${platform}_${organizationId}_client_secret`,
      // Store references to vault keys, not actual credentials
    };

    // Store in Supabase Vault via Edge Function
    await supabase.functions.invoke('store-platform-credentials', {
      body: { organizationId, platform, credentials, vaultKeys },
    });

    return vaultKeys;
  },

  private generateWebhookUrl: (platform: string, organizationId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '');
    return `${baseUrl}/functions/v1/${platform}-webhook?org=${organizationId}`;
  },
};
```

#### 2.2 Create Platform-Specific API Clients

```typescript
// src/lib/integrations/uber-eats.client.ts
export class UberEatsClient {
  private clientId: string;
  private clientSecret: string;
  private storeId: string;
  private accessToken?: string;
  private tokenExpiresAt?: Date;

  constructor(credentials: UberEatsCredentials) {
    this.clientId = credentials.client_id;
    this.clientSecret = credentials.client_secret;
    this.storeId = credentials.store_id;
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch('https://login.uber.com/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
          scope: 'eats.order eats.store eats.store.orders.read eats.menu',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Uber Eats authentication failed:', data);
        return false;
      }

      this.accessToken = data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (data.expires_in * 1000));
      
      return true;
    } catch (error) {
      console.error('Uber Eats authentication error:', error);
      return false;
    }
  }

  async getOrders(): Promise<any[]> {
    await this.ensureValidToken();
    
    const response = await fetch(`https://api.uber.com/v2/eats/stores/${this.storeId}/orders`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data.orders || [];
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    await this.ensureValidToken();
    
    const response = await fetch(`https://api.uber.com/v1/eats/orders/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    return response.ok;
  }

  async syncMenu(menuData: any): Promise<{ success: boolean; itemMappings?: any }> {
    await this.ensureValidToken();
    
    const transformedMenu = this.transformMenuForUberEats(menuData);
    
    const response = await fetch(`https://api.uber.com/v2/eats/stores/${this.storeId}/menus`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedMenu),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Uber Eats menu sync failed:', error);
      return { success: false };
    }

    const result = await response.json();
    return { 
      success: true, 
      itemMappings: this.extractItemMappings(result) 
    };
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt || this.tokenExpiresAt < new Date()) {
      await this.authenticate();
    }
  }

  private transformMenuForUberEats(menuData: any): any {
    // Transform our internal menu structure to Uber Eats format
    return {
      menus: [{
        id: "main_menu",
        title: "Main Menu",
        service_availability: [],
        category_ids: menuData.categories.map(cat => cat.id),
      }],
      categories: menuData.categories.map(category => ({
        id: category.id,
        title: category.name,
        item_ids: category.items.map(item => item.id),
      })),
      items: menuData.items.map(item => ({
        id: item.id,
        title: item.name,
        item_description: item.description,
        price_info: { 
          price: Math.round(item.base_price * 100) // Convert to cents
        },
        stock_info: {
          in_stock: item.is_available,
        },
        modifier_group_ids: item.modifier_groups?.map(mg => mg.id) || [],
      })),
      modifier_groups: this.transformModifierGroups(menuData.modifierGroups || []),
    };
  }

  private transformModifierGroups(modifierGroups: any[]): any[] {
    return modifierGroups.map(group => ({
      id: group.id,
      title: group.name,
      modifier_ids: group.modifiers.map(mod => mod.id),
      selection_required_min: group.min_selections || 0,
      selection_required_max: group.max_selections || 1,
    }));
  }

  private extractItemMappings(response: any): Record<string, string> {
    // Extract platform-specific item IDs from the response
    const mappings: Record<string, string> = {};
    
    if (response.items) {
      response.items.forEach((item: any) => {
        mappings[item.external_id] = item.id; // Map our ID to Uber's ID
      });
    }
    
    return mappings;
  }
}
```

**Success Criteria**:
- ✅ Database schema extends existing system seamlessly
- ✅ API clients handle authentication correctly
- ✅ Platform-specific data transformations work
- ✅ Error handling comprehensive

---

### Step 3: Create Supabase Edge Functions (3-4 days)

#### 3.1 Create Uber Eats Webhook Handler

```typescript
// supabase/functions/uber-eats-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface UberEatsWebhookPayload {
  id: string;
  display_id: string;
  status: string;
  placed_at: string;
  eater: {
    first_name: string;
    last_name: string;
  };
  cart: {
    items: Array<{
      id: string;
      instance_id: string;
      title: string;
      quantity: number;
      price: {
        total: number;
        unit_price: number;
      };
      special_instructions?: string;
      selected_modifier_groups?: any[];
    }>;
    special_instructions?: string;
  };
  payment: {
    charges: {
      total: {
        amount: number; // in cents
        currency_code: string;
      };
    };
  };
  store: {
    id: string;
  };
}

serve(async (req: Request) => {
  console.log('[Uber Eats Webhook] Request received');

  try {
    // 1. Verify webhook signature (CRITICAL for security)
    const signature = req.headers.get('X-Uber-Signature');
    const rawBody = await req.text();
    
    if (!signature || !await verifyUberEatsSignature(rawBody, signature)) {
      console.error('[Uber Eats Webhook] Signature verification failed');
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Parse the payload
    const payload: UberEatsWebhookPayload = JSON.parse(rawBody);
    console.log('[Uber Eats Webhook] Processing order:', payload.id);

    // 3. Find the platform integration
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: integration, error: integrationError } = await supabaseClient
      .from('platform_integrations')
      .select('*')
      .eq('platform', 'uber_eats')
      .eq('platform_restaurant_id', payload.store.id)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      console.error('[Uber Eats Webhook] Integration not found for store:', payload.store.id);
      return new Response('Integration not found', { status: 404 });
    }

    // 4. Transform to unified format
    const unifiedOrder = {
      organization_id: integration.organization_id,
      platform_integration_id: integration.id,
      platform_order_id: payload.id,
      delivery_platform: 'uber_eats' as const,
      order_number: payload.display_id,
      order_type: 'delivery' as const,
      status: mapUberEatsStatusToInternal(payload.status),
      customer_name: `${payload.eater.first_name} ${payload.eater.last_name}`,
      total_amount: payload.payment.charges.total.amount / 100, // Convert from cents
      subtotal: payload.payment.charges.total.amount / 100,
      tax_amount: 0, // Calculate if needed
      payment_status: 'completed' as const, // Delivery platforms handle payment
      payment_method: 'platform' as const,
      raw_payload: payload,
      platform_customer_info: {
        name: `${payload.eater.first_name} ${payload.eater.last_name}`,
        platform: 'uber_eats',
      },
      created_at: new Date().toISOString(),
    };

    // 5. Insert order with items
    const { data: insertedOrder, error: orderError } = await supabaseClient
      .from('orders')
      .upsert(unifiedOrder, {
        onConflict: 'platform_integration_id,platform_order_id'
      })
      .select()
      .single();

    if (orderError) {
      console.error('[Uber Eats Webhook] Order insert failed:', orderError);
      // Add to retry queue instead of failing
      await addToRetryQueue('uber_eats', rawBody, req.headers);
      return new Response('Queued for retry', { status: 202 });
    }

    // 6. Insert order items
    const orderItems = payload.cart.items.map(item => ({
      order_id: insertedOrder.id,
      menu_item_id: null, // We'll need to map this from platform_mappings
      quantity: item.quantity,
      unit_price: item.price.unit_price / 100,
      total_price: item.price.total / 100,
      name: item.title,
      notes: item.special_instructions || null,
      platform_item_id: item.id,
      modifiers: item.selected_modifier_groups || [],
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[Uber Eats Webhook] Order items insert failed:', itemsError);
    }

    console.log('[Uber Eats Webhook] Order processed successfully:', insertedOrder.id);
    return new Response('Webhook processed successfully', { status: 200 });

  } catch (error) {
    console.error('[Uber Eats Webhook] Processing failed:', error);
    
    // Add to retry queue
    try {
      await addToRetryQueue('uber_eats', await req.text(), req.headers);
    } catch (queueError) {
      console.error('[Uber Eats Webhook] Failed to queue for retry:', queueError);
    }
    
    return new Response('Internal server error', { status: 500 });
  }
});

// Helper functions
async function verifyUberEatsSignature(body: string, signature: string): Promise<boolean> {
  const secret = Deno.env.get('UBER_EATS_WEBHOOK_SECRET');
  if (!secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedSignature;
}

function mapUberEatsStatusToInternal(uberStatus: string): string {
  const statusMap: Record<string, string> = {
    'created': 'pending',
    'accepted': 'accepted',
    'denied': 'rejected',
    'finished': 'preparing',
    'ready_for_pickup': 'ready',
    'delivered': 'completed',
    'cancelled': 'cancelled',
  };
  
  return statusMap[uberStatus] || 'pending';
}

async function addToRetryQueue(platform: string, payload: string, headers: Headers) {
  // Implementation to add failed webhook to retry queue
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  await supabaseClient.from('webhook_processing_queue').insert({
    platform,
    webhook_payload: JSON.parse(payload),
    headers: Object.fromEntries(headers.entries()),
    next_attempt_at: new Date(Date.now() + 5000).toISOString(), // Retry in 5 seconds
  });
}
```

#### 3.2 Create Order Status Update Edge Function

```typescript
// supabase/functions/update-order-status/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { UberEatsClient } from '../_shared/uber-eats-client.ts';
import { DeliverooClient } from '../_shared/deliveroo-client.ts';
import { JustEatClient } from '../_shared/just-eat-client.ts';

serve(async (req: Request) => {
  console.log('[Update Order Status] Request received');

  try {
    const { orderId, newStatus } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Get order with platform information
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        platform_integrations (
          platform,
          platform_restaurant_id,
          credentials
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response('Order not found', { status: 404 });
    }

    if (!order.platform_integration_id) {
      // Internal order, just update status
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;
      return new Response('Internal order updated', { status: 200 });
    }

    // 2. Update internal status
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // 3. Update platform status
    const integration = order.platform_integrations;
    const platformStatus = mapStatusToPlatform(newStatus, integration.platform);

    let client;
    switch (integration.platform) {
      case 'uber_eats':
        client = new UberEatsClient(await getCredentialsFromVault(integration.credentials));
        await client.updateOrderStatus(order.platform_order_id!, platformStatus);
        break;
        
      case 'deliveroo':
        client = new DeliverooClient(await getCredentialsFromVault(integration.credentials));
        await client.updateOrderStatus(order.platform_order_id!, platformStatus);
        break;
        
      case 'just_eat':
        client = new JustEatClient(await getCredentialsFromVault(integration.credentials));
        await client.updateOrderStatus(order.platform_order_id!, platformStatus);
        break;
    }

    console.log(`[Update Order Status] Order ${orderId} updated to ${newStatus}`);
    return new Response('Order status updated', { status: 200 });

  } catch (error) {
    console.error('[Update Order Status] Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

async function getCredentialsFromVault(credentialRefs: any): Promise<any> {
  // Retrieve actual credentials from Supabase Vault using the stored references
  return {
    client_id: Deno.env.get(credentialRefs.client_id_key),
    client_secret: Deno.env.get(credentialRefs.client_secret_key),
    // ... other credential fields
  };
}

function mapStatusToPlatform(internalStatus: string, platform: string): string {
  // Use the database function logic or implement mapping here
  const mappings: Record<string, Record<string, string>> = {
    uber_eats: {
      accepted: 'accepted',
      preparing: 'in_progress',
      ready: 'ready_for_pickup',
      completed: 'delivered',
      cancelled: 'cancelled',
    },
    deliveroo: {
      accepted: 'ACCEPT_ORDER',
      preparing: 'PREPARATION_STARTED',
      ready: 'READY_FOR_COLLECTION',
      completed: 'COLLECTED',
      cancelled: 'REJECT_ORDER',
    },
    just_eat: {
      accepted: 'acknowledged',
      preparing: 'cooking',
      ready: 'ready',
      completed: 'delivered',
      cancelled: 'cancelled',
    },
  };

  return mappings[platform]?.[internalStatus] || internalStatus;
}
```

**Success Criteria**:
- ✅ Edge Functions deploy without errors
- ✅ Webhook signature verification works
- ✅ Order transformation logic correct
- ✅ Platform API calls succeed

---

### Step 4: Create Unified Order Management UI (3-4 days)

#### 4.1 Create `src/components/delivery/UnifiedOrderCenter.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Grid,
  Card,
  Button,
  Text,
  Box,
  Badge,
  Select
} from '@radix-ui/themes';
import { Bell, Wifi, WifiOff, RefreshCw, Settings } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { deliveryPlatformService } from '@/lib/services';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import DeliveryOrderCard from './DeliveryOrderCard';
import PlatformStatusIndicator from './PlatformStatusIndicator';

// Platform colors from the blueprint
const platformColors = {
  uber_eats: { primary: '#000000', accent: '#06C167', light: '#F5F5F5' },
  deliveroo: { primary: '#00CCBC', accent: '#00B8A9', light: '#E6FAF8' },
  just_eat: { primary: '#FF8000', accent: '#FF6600', light: '#FFF4E6' },
} as const;

export default function UnifiedOrderCenter() {
  const { currentOrganization } = useOrganization();
  const [statusFilter, setStatusFilter] = useState('active');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [platforms, setPlatforms] = useState([]);

  // Use enhanced realtime orders with delivery platforms
  const { orders, loading, connectionStatus } = useRealtimeOrders({
    statuses: statusFilter === 'active' 
      ? ['pending', 'accepted', 'preparing', 'ready'] 
      : ['completed', 'cancelled'],
    enableNotifications: true,
  });

  // Filter orders by platform
  const filteredOrders = orders.filter(order => {
    if (platformFilter === 'all') return true;
    return order.delivery_platform === platformFilter;
  });

  // Group orders by status
  const ordersByStatus = {
    pending: filteredOrders.filter(o => o.status === 'pending'),
    accepted: filteredOrders.filter(o => o.status === 'accepted'),
    preparing: filteredOrders.filter(o => o.status === 'preparing'),
    ready: filteredOrders.filter(o => o.status === 'ready'),
  };

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject' | 'preparing' | 'ready' | 'completed') => {
    try {
      await deliveryPlatformService.updateOrderStatus(orderId, action);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi size={18} color="green" />;
      case 'connecting': return <RefreshCw size={18} color="orange" className="animate-spin" />;
      default: return <WifiOff size={18} color="red" />;
    }
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6" className="h-screen">
        {/* Header */}
        <Flex justify="between" align="center" className="pt-4">
          <Box>
            <Heading size="8">Delivery Command Center</Heading>
            <Text size="2" color="gray">
              Unified view across all delivery platforms
            </Text>
          </Box>
          
          <Flex align="center" gap="4">
            {/* Connection Status */}
            <Flex align="center" gap="2">
              {getConnectionIcon()}
              <Text size="2" color="gray">
                {connectionStatus}
              </Text>
            </Flex>

            {/* Platform Filter */}
            <Select.Root value={platformFilter} onValueChange={setPlatformFilter}>
              <Select.Trigger className="min-w-32" />
              <Select.Content>
                <Select.Item value="all">All Platforms</Select.Item>
                <Select.Item value="uber_eats">Uber Eats</Select.Item>
                <Select.Item value="deliveroo">Deliveroo</Select.Item>
                <Select.Item value="just_eat">Just Eat</Select.Item>
              </Select.Content>
            </Select.Root>

            {/* Status Filter */}
            <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="active">Active Orders</Select.Item>
                <Select.Item value="completed">Completed Orders</Select.Item>
              </Select.Content>
            </Select.Root>

            {/* Settings */}
            <Button variant="outline" size="2">
              <Settings size={16} />
              Platform Settings
            </Button>
          </Flex>
        </Flex>

        {/* Platform Status Indicators */}
        <Grid columns="3" gap="4">
          {['uber_eats', 'deliveroo', 'just_eat'].map(platform => (
            <PlatformStatusIndicator key={platform} platform={platform} />
          ))}
        </Grid>

        {/* Order Management Kanban */}
        <Flex className="flex-1 gap-6 min-h-0">
          {/* New Orders Column */}
          <Box className="flex-1 min-h-0">
            <Card className="h-full">
              <Flex direction="column" className="h-full">
                <Box className="p-4 border-b">
                  <Flex justify="between" align="center">
                    <Heading size="5">New Orders</Heading>
                    <Badge color="blue">{ordersByStatus.pending.length}</Badge>
                  </Flex>
                </Box>
                
                <Box className="flex-1 overflow-y-auto p-4 space-y-3">
                  {ordersByStatus.pending.map(order => (
                    <DeliveryOrderCard
                      key={order.id}
                      order={order}
                      onAccept={() => handleOrderAction(order.id, 'accept')}
                      onReject={() => handleOrderAction(order.id, 'reject')}
                      showActions={['accept', 'reject']}
                    />
                  ))}
                </Box>
              </Flex>
            </Card>
          </Box>

          {/* Preparing Orders Column */}
          <Box className="flex-1 min-h-0">
            <Card className="h-full">
              <Flex direction="column" className="h-full">
                <Box className="p-4 border-b">
                  <Flex justify="between" align="center">
                    <Heading size="5">Preparing</Heading>
                    <Badge color="orange">{ordersByStatus.preparing.length}</Badge>
                  </Flex>
                </Box>
                
                <Box className="flex-1 overflow-y-auto p-4 space-y-3">
                  {ordersByStatus.preparing.map(order => (
                    <DeliveryOrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={() => handleOrderAction(order.id, 'ready')}
                      showActions={['ready']}
                    />
                  ))}
                </Box>
              </Flex>
            </Card>
          </Box>

          {/* Ready for Pickup Column */}
          <Box className="flex-1 min-h-0">
            <Card className="h-full">
              <Flex direction="column" className="h-full">
                <Box className="p-4 border-b">
                  <Flex justify="between" align="center">
                    <Heading size="5">Ready for Pickup</Heading>
                    <Badge color="green">{ordersByStatus.ready.length}</Badge>
                  </Flex>
                </Box>
                
                <Box className="flex-1 overflow-y-auto p-4 space-y-3">
                  {ordersByStatus.ready.map(order => (
                    <DeliveryOrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={() => handleOrderAction(order.id, 'completed')}
                      showActions={['complete']}
                    />
                  ))}
                </Box>
              </Flex>
            </Card>
          </Box>
        </Flex>
      </Flex>
    </Container>
  );
}
```

#### 4.2 Create `src/components/delivery/DeliveryOrderCard.tsx`

```typescript
'use client';

import { 
  Card, 
  Flex, 
  Text, 
  Badge,
  Button,
  Box 
} from '@radix-ui/themes';
import { Clock, User, Phone, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { formatDistanceToNow, isAfter, addMinutes } from 'date-fns';
import type { Database } from '@/lib/supabase/database.types';

type DeliveryOrder = Database['public']['Tables']['orders']['Row'];

interface DeliveryOrderCardProps {
  order: DeliveryOrder;
  onAccept?: () => void;
  onReject?: () => void;
  onStatusChange?: () => void;
  showActions?: ('accept' | 'reject' | 'preparing' | 'ready' | 'complete')[];
}

// Platform colors from blueprint
const platformColors = {
  uber_eats: { primary: '#000000', accent: '#06C167', light: '#F5F5F5' },
  deliveroo: { primary: '#00CCBC', accent: '#00B8A9', light: '#E6FAF8' },
  just_eat: { primary: '#FF8000', accent: '#FF6600', light: '#FFF4E6' },
};

export default function DeliveryOrderCard({ 
  order, 
  onAccept, 
  onReject, 
  onStatusChange,
  showActions = []
}: DeliveryOrderCardProps) {
  const platform = order.delivery_platform;
  const platformStyle = platform ? platformColors[platform] : { primary: '#6B7280', accent: '#9CA3AF', light: '#F3F4F6' };
  
  // Calculate timing and urgency
  const orderAge = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });
  const estimatedPickup = addMinutes(new Date(order.created_at), 20); // 20min prep time
  const isUrgent = isAfter(new Date(), estimatedPickup);
  const isLate = isAfter(new Date(), addMinutes(estimatedPickup, 5));

  const getUrgencyColor = () => {
    if (isLate) return 'red';
    if (isUrgent) return 'orange';
    return 'gray';
  };

  const getUrgencyIcon = () => {
    if (isLate) return <AlertTriangle size={16} />;
    if (isUrgent) return <Clock size={16} />;
    return null;
  };

  return (
    <Card 
      className={`
        transition-all duration-200 cursor-pointer
        ${isLate ? 'border-red-500 border-2 animate-pulse' : ''}
        ${isUrgent && !isLate ? 'border-orange-500 border-2' : ''}
        hover:shadow-md
      `}
    >
      <Box className="p-4">
        {/* Header */}
        <Flex justify="between" align="start" className="mb-3">
          <Box>
            <Flex align="center" gap="2" className="mb-1">
              <Badge 
                style={{ 
                  backgroundColor: platformStyle.primary,
                  color: 'white'
                }}
              >
                {platform?.replace('_', ' ').toUpperCase() || 'INTERNAL'}
              </Badge>
              {(isUrgent || isLate) && (
                <Flex align="center" gap="1" style={{ color: getUrgencyColor() }}>
                  {getUrgencyIcon()}
                  <Text size="1" weight="medium">
                    {isLate ? 'LATE' : 'URGENT'}
                  </Text>
                </Flex>
              )}
            </Flex>
            
            <Text size="4" weight="bold">
              #{order.order_number}
            </Text>
          </Box>
          
          <Text size="4" weight="bold" style={{ color: platformStyle.accent }}>
            £{order.total_amount.toFixed(2)}
          </Text>
        </Flex>

        {/* Customer Info */}
        <Box className="mb-3">
          <Flex align="center" gap="2" className="mb-1">
            <User size={14} />
            <Text weight="medium">{order.customer_name || 'Guest'}</Text>
          </Flex>
          
          {order.platform_customer_info?.phone && (
            <Flex align="center" gap="2">
              <Phone size={14} />
              <Text size="2" color="gray">{order.platform_customer_info.phone}</Text>
            </Flex>
          )}
        </Box>

        {/* Order Details */}
        <Box className="mb-3">
          <Text size="2" color="gray">
            {order.order_items?.length || 0} items • Ordered {orderAge}
          </Text>
          
          <Text size="2" color="gray" className="block">
            Est. pickup: {estimatedPickup.toLocaleTimeString()}
          </Text>
        </Box>

        {/* Order Items Preview */}
        {order.order_items && order.order_items.length > 0 && (
          <Box className="mb-4">
            <Text size="2" color="gray" weight="medium" className="mb-1">Items:</Text>
            {order.order_items.slice(0, 3).map((item, index) => (
              <Text key={index} size="1" color="gray" className="block">
                {item.quantity}x {item.name}
              </Text>
            ))}
            {order.order_items.length > 3 && (
              <Text size="1" color="gray">
                +{order.order_items.length - 3} more items...
              </Text>
            )}
          </Box>
        )}

        {/* Action Buttons */}
        {showActions.length > 0 && (
          <Flex gap="2">
            {showActions.includes('reject') && (
              <Button 
                variant="outline" 
                color="red" 
                size="2" 
                className="flex-1"
                onClick={onReject}
              >
                <X size={16} />
                Reject
              </Button>
            )}
            
            {showActions.includes('accept') && (
              <Button 
                size="2" 
                className="flex-1"
                style={{ backgroundColor: platformStyle.accent }}
                onClick={onAccept}
              >
                <CheckCircle size={16} />
                Accept
              </Button>
            )}
            
            {showActions.includes('ready') && (
              <Button 
                size="2" 
                color="green" 
                className="w-full"
                onClick={onStatusChange}
              >
                Mark Ready
              </Button>
            )}
            
            {showActions.includes('complete') && (
              <Button 
                size="2" 
                color="blue" 
                className="w-full"
                onClick={onStatusChange}
              >
                Mark Completed
              </Button>
            )}
          </Flex>
        )}
      </Box>
    </Card>
  );
}
```

#### 4.3 Create `src/components/delivery/MenuSyncManager.tsx`

```typescript
'use client';

import { useState } from 'react';
import { 
  Card, 
  Flex, 
  Heading, 
  Button,
  Text,
  Box,
  Badge,
  Table,
  Switch,
  Progress
} from '@radix-ui/themes';
import { Upload, Check, X, AlertCircle, Sync, Settings } from 'lucide-react';
import { deliveryPlatformService } from '@/lib/services';
import { toast } from 'sonner';

interface MenuSyncStatus {
  platform: 'uber_eats' | 'deliveroo' | 'just_eat';
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync?: Date;
  itemCount?: number;
  errorMessage?: string;
}

export default function MenuSyncManager() {
  const [syncStatuses, setSyncStatuses] = useState<MenuSyncStatus[]>([
    { platform: 'uber_eats', status: 'idle' },
    { platform: 'deliveroo', status: 'idle' },
    { platform: 'just_eat', status: 'idle' },
  ]);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    
    // Update all to syncing status
    setSyncStatuses(prev => prev.map(status => ({
      ...status,
      status: 'syncing' as const,
      errorMessage: undefined,
    })));

    try {
      const result = await deliveryPlatformService.syncMenuToAllPlatforms(
        // Get from organization context
        'current-org-id'
      );

      // Update individual statuses based on results
      setSyncStatuses(prev => prev.map(status => {
        const platformResult = result.results[status.platform];
        return {
          ...status,
          status: platformResult.success ? 'success' : 'error',
          errorMessage: platformResult.success ? undefined : platformResult.message,
          lastSync: platformResult.success ? new Date() : status.lastSync,
        };
      }));

      if (result.success) {
        toast.success('Menu synchronized to all platforms');
      } else {
        toast.error('Some platforms failed to sync');
      }
    } catch (error) {
      console.error('Menu sync failed:', error);
      toast.error('Menu sync failed');
      
      setSyncStatuses(prev => prev.map(status => ({
        ...status,
        status: 'error',
        errorMessage: 'Sync failed',
      })));
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncSingle = async (platform: 'uber_eats' | 'deliveroo' | 'just_eat') => {
    setSyncStatuses(prev => prev.map(status => 
      status.platform === platform 
        ? { ...status, status: 'syncing', errorMessage: undefined }
        : status
    ));

    // Implementation for single platform sync
    try {
      // Call platform-specific sync
      toast.success(`${platform.replace('_', ' ')} menu synchronized`);
      setSyncStatuses(prev => prev.map(status => 
        status.platform === platform 
          ? { ...status, status: 'success', lastSync: new Date() }
          : status
      ));
    } catch (error) {
      setSyncStatuses(prev => prev.map(status => 
        status.platform === platform 
          ? { ...status, status: 'error', errorMessage: 'Sync failed' }
          : status
      ));
    }
  };

  const getStatusIcon = (status: MenuSyncStatus['status']) => {
    switch (status) {
      case 'syncing': return <Sync size={16} className="animate-spin" />;
      case 'success': return <Check size={16} color="green" />;
      case 'error': return <X size={16} color="red" />;
      default: return <Upload size={16} color="gray" />;
    }
  };

  const getStatusColor = (status: MenuSyncStatus['status']) => {
    switch (status) {
      case 'syncing': return 'blue';
      case 'success': return 'green';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Card>
      <Flex direction="column" gap="6" className="p-6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Box>
            <Heading size="6">Menu Synchronization</Heading>
            <Text size="2" color="gray">
              Push menu updates to all delivery platforms
            </Text>
          </Box>
          
          <Button 
            size="3"
            onClick={handleSyncAll}
            disabled={isSyncingAll}
          >
            {isSyncingAll ? (
              <Flex align="center" gap="2">
                <Sync size={16} className="animate-spin" />
                Syncing...
              </Flex>
            ) : (
              <Flex align="center" gap="2">
                <Sync size={16} />
                Sync All Platforms
              </Flex>
            )}
          </Button>
        </Flex>

        {/* Platform Status Table */}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Platform</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Last Sync</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Items</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {syncStatuses.map((syncStatus) => (
              <Table.Row key={syncStatus.platform}>
                <Table.Cell>
                  <Flex align="center" gap="2">
                    <Box 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: platformColors[syncStatus.platform].primary }}
                    />
                    <Text weight="medium">
                      {syncStatus.platform.replace('_', ' ').toUpperCase()}
                    </Text>
                  </Flex>
                </Table.Cell>
                
                <Table.Cell>
                  <Flex align="center" gap="2">
                    {getStatusIcon(syncStatus.status)}
                    <Badge color={getStatusColor(syncStatus.status)}>
                      {syncStatus.status.toUpperCase()}
                    </Badge>
                    {syncStatus.errorMessage && (
                      <Text size="1" color="red">
                        {syncStatus.errorMessage}
                      </Text>
                    )}
                  </Flex>
                </Table.Cell>
                
                <Table.Cell>
                  <Text size="2" color="gray">
                    {syncStatus.lastSync 
                      ? formatDistanceToNow(syncStatus.lastSync, { addSuffix: true })
                      : 'Never'
                    }
                  </Text>
                </Table.Cell>
                
                <Table.Cell>
                  <Text size="2">
                    {syncStatus.itemCount || '-'}
                  </Text>
                </Table.Cell>
                
                <Table.Cell>
                  <Flex gap="2">
                    <Button
                      size="1"
                      variant="outline"
                      onClick={() => handleSyncSingle(syncStatus.platform)}
                      disabled={syncStatus.status === 'syncing'}
                    >
                      Sync
                    </Button>
                    <Button size="1" variant="ghost">
                      <Settings size={14} />
                    </Button>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Flex>
    </Card>
  );
}
```

**Success Criteria**:
- ✅ Unified order interface replaces multiple tablets
- ✅ Real-time order updates work across all platforms
- ✅ Menu synchronization pushes to all platforms
- ✅ Platform-specific branding and styling

---

### Step 5: Create Platform-Specific Integration Logic (4-5 days)

#### 5.1 Complete Deliveroo Integration

```typescript
// src/lib/integrations/deliveroo.client.ts
export class DeliverooClient {
  private clientId: string;
  private clientSecret: string;
  private restaurantId: string;
  private accessToken?: string;
  private tokenExpiresAt?: Date;

  constructor(credentials: DeliverooCredentials) {
    this.clientId = credentials.client_id;
    this.clientSecret = credentials.client_secret;
    this.restaurantId = credentials.restaurant_id;
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch('https://api.deliveroo.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
          scope: 'orders:read orders:write menu:read menu:write restaurant:read restaurant:write',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Deliveroo authentication failed:', data);
        return false;
      }

      this.accessToken = data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (data.expires_in * 1000));
      
      return true;
    } catch (error) {
      console.error('Deliveroo authentication error:', error);
      return false;
    }
  }

  async updateOrderStatus(orderId: string, action: string): Promise<boolean> {
    await this.ensureValidToken();
    
    const response = await fetch(`https://api.deliveroo.com/orders/${orderId}/actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });

    return response.ok;
  }

  async syncMenu(menuData: any): Promise<{ success: boolean; itemMappings?: any }> {
    await this.ensureValidToken();
    
    const transformedMenu = this.transformMenuForDeliveroo(menuData);
    
    const response = await fetch(`https://api.deliveroo.com/restaurants/${this.restaurantId}/menus`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedMenu),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Deliveroo menu sync failed:', error);
      return { success: false };
    }

    const result = await response.json();
    return { 
      success: true, 
      itemMappings: this.extractItemMappings(result) 
    };
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt || this.tokenExpiresAt < new Date()) {
      await this.authenticate();
    }
  }

  private transformMenuForDeliveroo(menuData: any): any {
    return {
      categories: menuData.categories.map(category => ({
        name: category.name,
        description: category.description,
        items: menuData.items
          .filter(item => item.category_id === category.id)
          .map(item => ({
            name: item.name,
            description: item.description,
            price: Math.round(item.base_price * 100), // Convert to pence
            is_available: item.is_available,
            modifiers: item.modifiers || [],
          })),
      })),
    };
  }

  private extractItemMappings(response: any): Record<string, string> {
    // Extract Deliveroo item IDs from response
    const mappings: Record<string, string> = {};
    // Implementation depends on Deliveroo response format
    return mappings;
  }
}
```

#### 5.2 Create Just Eat Integration

```typescript
// src/lib/integrations/just-eat.client.ts
export class JustEatClient {
  private apiToken: string;
  private restaurantId: string;
  private baseUrl = 'https://partner-api.just-eat.co.uk';

  constructor(credentials: JustEatCredentials) {
    this.apiToken = credentials.api_token;
    this.restaurantId = credentials.restaurant_id;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `ApiToken ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    return response.ok;
  }

  async syncMenu(menuData: any): Promise<{ success: boolean; itemMappings?: any }> {
    const transformedMenu = this.transformMenuForJustEat(menuData);
    
    const response = await fetch(`${this.baseUrl}/menus/restaurants/${this.restaurantId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `ApiToken ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedMenu),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Just Eat menu sync failed:', error);
      return { success: false };
    }

    const result = await response.json();
    return { 
      success: true, 
      itemMappings: this.extractItemMappings(result) 
    };
  }

  async setRestaurantStatus(isOpen: boolean): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/restaurants/${this.restaurantId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `ApiToken ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        status: isOpen ? 'online' : 'offline' 
      }),
    });

    return response.ok;
  }

  private transformMenuForJustEat(menuData: any): any {
    return {
      categories: menuData.categories.map(category => ({
        name: category.name,
        description: category.description,
        products: menuData.items
          .filter(item => item.category_id === category.id)
          .map(item => ({
            name: item.name,
            description: item.description,
            price: item.base_price, // Just Eat uses decimal prices
            available: item.is_available,
            options: item.modifiers || [],
          })),
      })),
    };
  }

  private extractItemMappings(response: any): Record<string, string> {
    // Extract Just Eat item IDs from response
    const mappings: Record<string, string> = {};
    // Implementation depends on Just Eat response format
    return mappings;
  }
}
```

**Success Criteria**:
- ✅ All platform clients authenticate successfully
- ✅ Menu synchronization works for all platforms
- ✅ Order status updates propagate correctly
- ✅ Error handling and retry logic functional

---

### Step 6: Create Resilience & Monitoring (2-3 days)

#### 6.1 Create Webhook Retry Processor

```typescript
// supabase/functions/process-webhook-queue/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  console.log('[Webhook Queue Processor] Starting...');

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Get failed webhooks ready for retry
    const { data: queueItems, error: queueError } = await supabaseClient
      .from('webhook_processing_queue')
      .select('*')
      .eq('processed', false)
      .lte('next_attempt_at', new Date().toISOString())
      .lt('retry_count', 5)
      .order('created_at', { ascending: true })
      .limit(50);

    if (queueError) throw queueError;

    console.log(`[Webhook Queue Processor] Processing ${queueItems?.length || 0} items`);

    for (const item of queueItems || []) {
      try {
        // Determine which webhook handler to use
        const handlerUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/${item.platform}-webhook`;
        
        // Retry the webhook processing
        const retryResponse = await fetch(handlerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...item.headers, // Restore original headers
          },
          body: JSON.stringify(item.webhook_payload),
        });

        if (retryResponse.ok) {
          // Mark as processed
          await supabaseClient
            .from('webhook_processing_queue')
            .update({ 
              processed: true,
              error_message: null,
            })
            .eq('id', item.id);
          
          console.log(`[Webhook Queue Processor] Successfully processed item ${item.id}`);
        } else {
          // Increment retry count and schedule next attempt
          const nextRetryDelay = Math.pow(2, item.retry_count) * 1000; // Exponential backoff
          const nextAttempt = new Date(Date.now() + nextRetryDelay);
          
          await supabaseClient
            .from('webhook_processing_queue')
            .update({
              retry_count: item.retry_count + 1,
              last_attempt_at: new Date().toISOString(),
              next_attempt_at: nextAttempt.toISOString(),
              error_message: `HTTP ${retryResponse.status}`,
            })
            .eq('id', item.id);
          
          console.log(`[Webhook Queue Processor] Retry ${item.retry_count + 1} failed for item ${item.id}`);
        }
      } catch (itemError) {
        console.error(`[Webhook Queue Processor] Error processing item ${item.id}:`, itemError);
        
        // Update with error
        await supabaseClient
          .from('webhook_processing_queue')
          .update({
            retry_count: item.retry_count + 1,
            error_message: itemError.message,
            next_attempt_at: new Date(Date.now() + 60000).toISOString(), // Retry in 1 minute
          })
          .eq('id', item.id);
      }
    }

    return new Response('Queue processing completed', { status: 200 });

  } catch (error) {
    console.error('[Webhook Queue Processor] Fatal error:', error);
    return new Response('Queue processing failed', { status: 500 });
  }
});
```

#### 6.2 Create Analytics and Monitoring

```typescript
// src/lib/services/delivery-analytics.service.ts
export const deliveryAnalyticsService = {
  /**
   * Get delivery performance metrics
   */
  getDeliveryMetrics: async (organizationId: string, dateRange: { start: Date; end: Date }) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(count),
        platform_integrations(platform)
      `)
      .eq('organization_id', organizationId)
      .not('delivery_platform', 'is', null)
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString());

    if (error) throw error;

    // Calculate metrics
    const totalOrders = data?.length || 0;
    const totalRevenue = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Platform breakdown
    const platformBreakdown = data?.reduce((acc, order) => {
      const platform = order.delivery_platform || 'internal';
      if (!acc[platform]) {
        acc[platform] = { orders: 0, revenue: 0 };
      }
      acc[platform].orders += 1;
      acc[platform].revenue += order.total_amount;
      return acc;
    }, {} as Record<string, { orders: number; revenue: number }>) || {};

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      platformBreakdown,
      rawData: data,
    };
  },

  /**
   * Get order fulfillment times by platform
   */
  getFulfillmentTimes: async (organizationId: string) => {
    const { data, error } = await supabase
      .rpc('get_average_fulfillment_times', {
        org_id: organizationId,
        days_back: 30,
      });

    if (error) throw error;
    return data;
  },

  /**
   * Get platform comparison metrics
   */
  getPlatformComparison: async (organizationId: string) => {
    const { data, error } = await supabase
      .rpc('get_platform_comparison_metrics', {
        org_id: organizationId,
        days_back: 7,
      });

    if (error) throw error;
    return data;
  },
};
```

**Success Criteria**:
- ✅ All three platforms fully integrated
- ✅ Webhook processing with retry queue working
- ✅ Analytics provide platform comparison insights
- ✅ Monitoring alerts for failed integrations

---

### Step 7: Testing & Production Deployment (1-2 days)

#### 7.1 Comprehensive Testing Checklist

```
Platform Authentication:
- [ ] Uber Eats OAuth 2.0 flow completes successfully
- [ ] Deliveroo OAuth 2.0 flow completes successfully  
- [ ] Just Eat API token authentication works
- [ ] Token refresh logic handles expiration
- [ ] Vault credential storage and retrieval works

Webhook Processing:
- [ ] All platform webhooks receive and process correctly
- [ ] Signature verification blocks unauthorized requests
- [ ] Order transformation maps all required fields
- [ ] Duplicate webhook handling (idempotency) works
- [ ] Failed webhooks go to retry queue

Real-Time Integration:
- [ ] New delivery orders appear in unified interface immediately
- [ ] Order status updates sync to platforms correctly
- [ ] Kitchen display shows delivery orders alongside dine-in
- [ ] Real-time subscriptions handle high volume

Menu Synchronization:
- [ ] Menu changes push to all platforms successfully
- [ ] Platform-specific formatting correct
- [ ] Availability updates reflect immediately
- [ ] Sync failures handled gracefully

Analytics & Monitoring:
- [ ] Delivery vs. dine-in revenue comparison accurate
- [ ] Platform performance metrics display correctly
- [ ] Alert system notifies of integration failures
- [ ] Export functionality works for delivery data

User Experience:
- [ ] Unified interface eliminates need for separate tablets
- [ ] Staff can manage all delivery orders from single screen
- [ ] Platform branding and colors display correctly
- [ ] Audio alerts work for new delivery orders
- [ ] Mobile responsive for tablet use

Security & Compliance:
- [ ] All credentials stored securely in Vault
- [ ] Webhook endpoints secured with signature verification
- [ ] API rate limits respected
- [ ] Audit trail captures all platform interactions

Performance:
- [ ] System handles 50+ concurrent delivery orders
- [ ] Response times remain under 2 seconds
- [ ] Memory usage stable during long operations
- [ ] Database queries optimized with proper indexing
```

**Success Criteria**:
- ✅ All testing checklist items pass
- ✅ Integration handles production-level load
- ✅ Security audit passes
- ✅ Performance benchmarks met

---

## 5. Success Criteria

### Functional Requirements

**Order Management**:
- ✅ **Unified Interface**: Single screen replaces 3-5 delivery tablets
- ✅ **Real-Time Updates**: Orders appear instantly from all platforms
- ✅ **Status Synchronization**: Updates flow both ways (POS ↔ Platforms)
- ✅ **Order Routing**: Intelligent assignment to kitchen workflows
- ✅ **Priority Management**: Urgent/late order identification and alerts

**Menu Synchronization**:
- ✅ **One-Click Updates**: Menu changes push to all platforms simultaneously
- ✅ **Availability Sync**: Item availability updates in real-time
- ✅ **Price Sync**: Pricing changes reflected across platforms
- ✅ **Platform Formatting**: Menu data transforms correctly for each platform

**Platform Integration**:
- ✅ **Uber Eats**: Full two-way integration with OAuth 2.0
- ✅ **Deliveroo**: Complete API integration with order/menu sync
- ✅ **Just Eat**: Full integration with API key authentication
- ✅ **Webhook Security**: Signature verification for all platforms

### Technical Requirements

**Architecture**:
- ✅ **Database Schema**: Normalized multi-platform order storage
- ✅ **Edge Functions**: Serverless webhook processing
- ✅ **API Clients**: Platform-specific integration libraries
- ✅ **Real-Time**: Supabase Realtime for instant updates
- ✅ **Error Handling**: Queue-based retry with exponential backoff

**Performance**:
- ✅ **Scalability**: Supports 100+ orders per hour across platforms
- ✅ **Reliability**: 99.9% webhook processing success rate
- ✅ **Speed**: Orders visible within 2 seconds of platform creation
- ✅ **Efficiency**: 70% reduction in order management time

**Security**:
- ✅ **Credential Management**: All secrets in Supabase Vault
- ✅ **Webhook Verification**: Cryptographic signature validation
- ✅ **API Security**: Proper authentication for all platforms
- ✅ **Data Protection**: Encrypted storage and transmission

### Business Requirements

**Operational Impact**:
- ✅ **"Tablet Hell" Eliminated**: Single interface for all delivery orders
- ✅ **Error Reduction**: 90% reduction in manual transcription errors
- ✅ **Efficiency Gains**: 70% faster order processing time
- ✅ **Staff Training**: Single workflow reduces onboarding time

**Revenue Protection**:
- ✅ **Zero Missed Orders**: Robust retry mechanisms prevent order loss
- ✅ **Faster Turnaround**: Improved order processing speed
- ✅ **Consistency**: Uniform service quality across platforms
- ✅ **Analytics**: Data-driven optimization of delivery operations

**Future Readiness**:
- ✅ **Platform Extensibility**: Easy to add new delivery platforms
- ✅ **API Evolution**: Adaptable to platform API changes
- ✅ **Scale Preparation**: Multi-location deployment ready
- ✅ **Integration Points**: Ready for advanced delivery features

---

## 6. Deliverables

### Database & Backend
```
✅ platform_integrations table with proper indexing
✅ Extended orders table for delivery platform data
✅ webhook_processing_queue for resilience
✅ Database functions for status mapping and analytics
✅ 6 Supabase Edge Functions for platform operations
✅ Platform-specific API client libraries
✅ Comprehensive retry and queue processing logic
```

### Frontend Components
```
✅ src/app/(default)/delivery/unified-orders/page.tsx
✅ src/components/delivery/UnifiedOrderCenter.tsx
✅ src/components/delivery/DeliveryOrderCard.tsx
✅ src/components/delivery/MenuSyncManager.tsx
✅ src/components/delivery/PlatformStatusIndicator.tsx
✅ src/components/delivery/DeliveryAnalytics.tsx
✅ src/lib/services/delivery-platform.service.ts
✅ src/lib/integrations/ (3 platform clients)
```

### Configuration & Security
```
✅ Supabase Vault setup for credential management
✅ Webhook endpoint configuration
✅ Edge Function deployment configuration
✅ Platform API credential setup (test & production)
✅ Monitoring and alerting configuration
```

---

## 7. Rollback Plan

### If Integration Fails
1. **Disable Platform Webhooks**: Stop incoming delivery orders temporarily
2. **Fallback to Manual Entry**: Staff can manually create delivery orders
3. **Isolate Platform Issues**: Debug each platform integration separately
4. **Queue-Based Recovery**: Failed webhooks automatically retry
5. **Gradual Re-Enablement**: Activate platforms one by one after fixes

### Emergency Procedures
1. **Total Platform Disconnect**: Disable all integrations, fallback to tablets
2. **Data Recovery**: Retry queue ensures no orders lost
3. **Status Sync Recovery**: Manual platform status updates available
4. **Menu Sync Recovery**: Platform-specific manual menu updates

---

## 8. Next Steps After Completion

### Immediate Post-Implementation
1. **Staff Training**: Train staff on unified delivery interface
2. **Performance Monitoring**: Set up alerts for integration health
3. **Customer Communication**: Update delivery timeframes if needed
4. **Platform Relationship**: Coordinate with platform account managers

### Future Enhancements
1. **Advanced Analytics**: Delivery profitability analysis per platform
2. **AI-Powered Routing**: Intelligent order prioritization
3. **Customer Communication**: Automated status updates via SMS/email
4. **Multi-Location**: Scale to multiple restaurant locations
5. **Additional Platforms**: DoorDash, Foodpanda integration

---

**Status**: 📋 Ready to Start  
**Dependencies**: Task 1.2 (Menu Management), Task 1.4 (POS Operations), Task 1.5 (Sales & Reporting)  
**Blocked By**: Core POS functionality must be operational first  
**Blocks**: Advanced delivery analytics and optimization features

---

**Implementation Note**: This task leverages the technical blueprint for production-ready API integrations while building on our established POS Pro architecture for seamless integration.
