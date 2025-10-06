-- =====================================================================
-- DELIVERY PLATFORM INTEGRATION MIGRATION
-- Task 4.1: Complete Delivery Platform Integration
-- Created: 2025-01-06
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- ENUMS
-- =====================================================================

-- Enum for supported delivery platforms
DO $$ BEGIN
    CREATE TYPE platform_enum AS ENUM ('uber_eats', 'deliveroo', 'just_eat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum for delivery order status (extends existing order status)
DO $$ BEGIN
    CREATE TYPE delivery_order_status_enum AS ENUM (
        'pending',
        'accepted',
        'rejected',
        'preparing',
        'ready_for_pickup',
        'out_for_delivery',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================================
-- TABLES
-- =====================================================================

-- Platform Integrations: Store credentials and settings per organization per platform
CREATE TABLE IF NOT EXISTS platform_integrations (
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
CREATE INDEX IF NOT EXISTS idx_platform_integrations_org_id 
    ON platform_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_active 
    ON platform_integrations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_platform_integrations_platform 
    ON platform_integrations(platform);

-- Extend existing orders table with delivery-specific fields
DO $$ 
BEGIN
    -- Add platform_integration_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'platform_integration_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN platform_integration_id UUID REFERENCES platform_integrations(id);
    END IF;
    
    -- Add platform_order_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'platform_order_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN platform_order_id TEXT;
    END IF;
    
    -- Add delivery_platform if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_platform'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_platform platform_enum;
    END IF;
    
    -- Add raw_payload if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'raw_payload'
    ) THEN
        ALTER TABLE orders ADD COLUMN raw_payload JSONB;
    END IF;
    
    -- Add platform_customer_info if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'platform_customer_info'
    ) THEN
        ALTER TABLE orders ADD COLUMN platform_customer_info JSONB;
    END IF;
END $$;

-- Create unique constraint for platform orders
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_platform_order'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT unique_platform_order 
            UNIQUE(platform_integration_id, platform_order_id);
    END IF;
END $$;

-- Create indexes on orders for delivery queries
CREATE INDEX IF NOT EXISTS idx_orders_platform_integration 
    ON orders(platform_integration_id) WHERE platform_integration_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_delivery_platform 
    ON orders(delivery_platform) WHERE delivery_platform IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_platform_order_id 
    ON orders(platform_order_id) WHERE platform_order_id IS NOT NULL;

-- Webhook Processing Queue for resilience
CREATE TABLE IF NOT EXISTS webhook_processing_queue (
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

-- Indexes for webhook queue
CREATE INDEX IF NOT EXISTS idx_webhook_queue_next_attempt 
    ON webhook_processing_queue(next_attempt_at) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_webhook_queue_platform 
    ON webhook_processing_queue(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_queue_processed 
    ON webhook_processing_queue(processed);

-- Extend menu_items table with platform mappings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' AND column_name = 'platform_mappings'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN platform_mappings JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create index on platform_mappings
CREATE INDEX IF NOT EXISTS idx_menu_items_platform_mappings 
    ON menu_items USING gin(platform_mappings);

-- =====================================================================
-- FUNCTIONS
-- =====================================================================

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

-- Function to get delivery analytics
CREATE OR REPLACE FUNCTION get_delivery_analytics(
    org_id UUID,
    branch_id UUID DEFAULT NULL,
    days_back INT DEFAULT 30
) RETURNS TABLE (
    platform TEXT,
    total_orders BIGINT,
    total_revenue NUMERIC,
    average_order_value NUMERIC,
    completed_orders BIGINT,
    cancelled_orders BIGINT,
    average_prep_time_minutes NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(o.delivery_platform::TEXT, 'internal') as platform,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as average_order_value,
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(AVG(
            EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 60
        ), 0) as average_prep_time_minutes
    FROM orders o
    WHERE o.organization_id = org_id
        AND (branch_id IS NULL OR o.branch_id = branch_id)
        AND o.created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY COALESCE(o.delivery_platform::TEXT, 'internal');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update platform integration last sync timestamp
CREATE OR REPLACE FUNCTION update_platform_integration_sync_time(
    integration_id UUID
) RETURNS void AS $$
BEGIN
    UPDATE platform_integrations
    SET last_sync_at = NOW(),
        updated_at = NOW()
    WHERE id = integration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old processed webhooks
CREATE OR REPLACE FUNCTION cleanup_processed_webhooks(days_to_keep INT DEFAULT 7)
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM webhook_processing_queue
    WHERE processed = TRUE
        AND created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS on new tables
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_processing_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_integrations
CREATE POLICY "Users can view their organization's platform integrations"
    ON platform_integrations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage platform integrations"
    ON platform_integrations FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- RLS Policies for webhook_processing_queue (service role only)
CREATE POLICY "Service role can manage webhook queue"
    ON webhook_processing_queue FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_platform_integrations_updated_at'
    ) THEN
        CREATE TRIGGER update_platform_integrations_updated_at
            BEFORE UPDATE ON platform_integrations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE platform_integrations IS 'Stores delivery platform integration credentials and settings for each organization';
COMMENT ON TABLE webhook_processing_queue IS 'Queue for failed webhook processing with automatic retry logic';
COMMENT ON COLUMN orders.platform_integration_id IS 'Reference to the platform integration if this is a delivery order';
COMMENT ON COLUMN orders.platform_order_id IS 'The order ID from the external delivery platform';
COMMENT ON COLUMN orders.delivery_platform IS 'Which delivery platform this order came from';
COMMENT ON COLUMN orders.raw_payload IS 'Original webhook payload from the delivery platform for debugging';
COMMENT ON COLUMN orders.platform_customer_info IS 'Customer information provided by the delivery platform';
COMMENT ON COLUMN menu_items.platform_mappings IS 'JSONB mapping of internal menu item IDs to platform-specific IDs';

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================
