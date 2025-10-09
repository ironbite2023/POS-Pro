-- ========================================
-- Branch-Menu Relationship Enhancement
-- Implementation: Phase 1, Step 1.2.1
-- Date: October 8, 2025
-- ========================================

-- Create enhanced branch-menu relationships table
-- This replaces the basic menu_item_branch_overrides with comprehensive functionality

-- First, backup existing branch overrides if they exist
CREATE TABLE IF NOT EXISTS menu_item_branch_overrides_backup AS
SELECT * FROM menu_item_branch_overrides WHERE false; -- Structure only

-- Enhanced branch-menu availability table
CREATE TABLE IF NOT EXISTS menu_item_branch_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    
    -- Availability Controls
    is_available BOOLEAN DEFAULT true,
    
    -- Pricing Controls
    price_override DECIMAL(10,2), -- NULL means use base price from menu_items
    
    -- Stock Management
    stock_quantity INTEGER DEFAULT NULL, -- NULL means unlimited
    daily_limit INTEGER DEFAULT NULL,    -- Daily sales limit
    
    -- Scheduling Controls
    start_date DATE DEFAULT NULL,        -- Availability start date
    end_date DATE DEFAULT NULL,          -- Availability end date
    start_time TIME DEFAULT NULL,        -- Daily availability start time
    end_time TIME DEFAULT NULL,          -- Daily availability end time
    
    -- Days of week availability (JSON array of day numbers: 0=Sunday, 6=Saturday)
    available_days JSONB DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
    
    -- Special notes and metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Create optimized indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_branch_availability_branch 
ON menu_item_branch_availability(branch_id);

CREATE INDEX IF NOT EXISTS idx_menu_branch_availability_item 
ON menu_item_branch_availability(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_menu_branch_availability_org 
ON menu_item_branch_availability(organization_id);

CREATE INDEX IF NOT EXISTS idx_menu_branch_availability_composite 
ON menu_item_branch_availability(organization_id, branch_id, menu_item_id);

CREATE INDEX IF NOT EXISTS idx_menu_branch_availability_date_range 
ON menu_item_branch_availability(start_date, end_date) 
WHERE start_date IS NOT NULL OR end_date IS NOT NULL;

-- Unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_branch_availability_unique 
ON menu_item_branch_availability(menu_item_id, branch_id);

-- Enable Row Level Security
ALTER TABLE menu_item_branch_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access data for their organization
DROP POLICY IF EXISTS "Users can manage branch menu availability for their organization" 
ON menu_item_branch_availability;

CREATE POLICY "Users can manage branch menu availability for their organization"
ON menu_item_branch_availability
FOR ALL
USING (organization_id IN (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
));

-- RLS Policy: Read access for branch users
DROP POLICY IF EXISTS "Branch users can view their branch menu availability" 
ON menu_item_branch_availability;

CREATE POLICY "Branch users can view their branch menu availability"
ON menu_item_branch_availability
FOR SELECT
USING (
    branch_id = ANY(
        SELECT unnest(branch_access) FROM user_profiles WHERE id = auth.uid()
    )
);

-- Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_branch_availability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_menu_branch_availability_timestamp 
ON menu_item_branch_availability;

CREATE TRIGGER trigger_menu_branch_availability_timestamp
    BEFORE UPDATE ON menu_item_branch_availability
    FOR EACH ROW EXECUTE FUNCTION update_menu_branch_availability_timestamp();

-- Migrate existing data from menu_item_branch_overrides if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'menu_item_branch_overrides') THEN
        
        INSERT INTO menu_item_branch_availability (
            organization_id, menu_item_id, branch_id, 
            is_available, price_override, created_at, updated_at
        )
        SELECT DISTINCT
            mbo.organization_id,
            mbo.menu_item_id,
            mbo.branch_id,
            COALESCE(mbo.is_available, true),
            mbo.price_override,
            COALESCE(mbo.created_at, now()),
            COALESCE(mbo.updated_at, now())
        FROM menu_item_branch_overrides mbo
        ON CONFLICT (menu_item_id, branch_id) DO NOTHING;
        
        RAISE NOTICE 'Migrated % records from menu_item_branch_overrides', 
            (SELECT COUNT(*) FROM menu_item_branch_overrides);
    END IF;
END $$;

-- Create helper functions for branch availability checks

-- Function to check if item is available at branch on specific date/time
CREATE OR REPLACE FUNCTION is_menu_item_available_at_branch(
    p_menu_item_id UUID,
    p_branch_id UUID,
    p_check_date DATE DEFAULT CURRENT_DATE,
    p_check_time TIME DEFAULT CURRENT_TIME
) RETURNS BOOLEAN AS $$
DECLARE
    availability_record menu_item_branch_availability%ROWTYPE;
    day_of_week INTEGER;
BEGIN
    -- Get availability record
    SELECT * INTO availability_record
    FROM menu_item_branch_availability
    WHERE menu_item_id = p_menu_item_id 
    AND branch_id = p_branch_id;
    
    -- If no record exists, item is available by default
    IF availability_record.id IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check basic availability flag
    IF NOT availability_record.is_available THEN
        RETURN false;
    END IF;
    
    -- Check date range
    IF availability_record.start_date IS NOT NULL 
    AND p_check_date < availability_record.start_date THEN
        RETURN false;
    END IF;
    
    IF availability_record.end_date IS NOT NULL 
    AND p_check_date > availability_record.end_date THEN
        RETURN false;
    END IF;
    
    -- Check time range
    IF availability_record.start_time IS NOT NULL 
    AND p_check_time < availability_record.start_time THEN
        RETURN false;
    END IF;
    
    IF availability_record.end_time IS NOT NULL 
    AND p_check_time > availability_record.end_time THEN
        RETURN false;
    END IF;
    
    -- Check day of week (0=Sunday, 6=Saturday)
    day_of_week := EXTRACT(DOW FROM p_check_date);
    IF NOT (availability_record.available_days ? day_of_week::text) THEN
        RETURN false;
    END IF;
    
    -- Check stock quantity (if tracked)
    -- This would need integration with order system for real-time stock tracking
    -- For now, we'll assume stock is available
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get effective price for item at branch
CREATE OR REPLACE FUNCTION get_menu_item_price_at_branch(
    p_menu_item_id UUID,
    p_branch_id UUID
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    base_price DECIMAL(10,2);
    price_override DECIMAL(10,2);
BEGIN
    -- Get base price from menu item
    SELECT base_price INTO base_price
    FROM menu_items
    WHERE id = p_menu_item_id;
    
    -- Check for branch-specific price override
    SELECT mba.price_override INTO price_override
    FROM menu_item_branch_availability mba
    WHERE mba.menu_item_id = p_menu_item_id 
    AND mba.branch_id = p_branch_id;
    
    -- Return override price if exists, otherwise base price
    RETURN COALESCE(price_override, base_price);
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for performance optimization
CREATE MATERIALIZED VIEW IF NOT EXISTS menu_items_with_branch_availability AS
SELECT 
    mi.id as menu_item_id,
    mi.organization_id,
    mi.name as item_name,
    mi.base_price,
    mi.is_active,
    mi.category_id,
    mc.name as category_name,
    b.id as branch_id,
    b.name as branch_name,
    COALESCE(mba.is_available, true) as is_available_at_branch,
    COALESCE(mba.price_override, mi.base_price) as effective_price,
    mba.stock_quantity,
    mba.daily_limit,
    mba.start_date,
    mba.end_date,
    mba.start_time,
    mba.end_time,
    mba.available_days,
    is_menu_item_available_at_branch(mi.id, b.id) as is_currently_available
FROM menu_items mi
CROSS JOIN branches b
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
LEFT JOIN menu_item_branch_availability mba ON mi.id = mba.menu_item_id 
    AND b.id = mba.branch_id
WHERE mi.is_active = true 
    AND b.status = 'active'
    AND mi.organization_id = b.organization_id;

-- Index for the materialized view
CREATE INDEX IF NOT EXISTS idx_menu_branch_mv_org_branch 
ON menu_items_with_branch_availability(organization_id, branch_id);

CREATE INDEX IF NOT EXISTS idx_menu_branch_mv_item 
ON menu_items_with_branch_availability(menu_item_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_menu_branch_availability_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY menu_items_with_branch_availability;
END;
$$ LANGUAGE plpgsql;

-- Set up automatic refresh trigger (refresh when underlying data changes)
CREATE OR REPLACE FUNCTION trigger_refresh_menu_branch_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh asynchronously to avoid blocking the transaction
    PERFORM pg_notify('refresh_menu_branch_view', '');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic view refresh
DROP TRIGGER IF EXISTS trigger_menu_items_refresh ON menu_items;
CREATE TRIGGER trigger_menu_items_refresh
    AFTER INSERT OR UPDATE OR DELETE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_menu_branch_availability();

DROP TRIGGER IF EXISTS trigger_menu_branch_availability_refresh ON menu_item_branch_availability;
CREATE TRIGGER trigger_menu_branch_availability_refresh
    AFTER INSERT OR UPDATE OR DELETE ON menu_item_branch_availability
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_menu_branch_availability();

-- Initial refresh of materialized view
SELECT refresh_menu_branch_availability_view();

-- Create sample data for testing (only if no branch availability records exist)
DO $$
DECLARE
    org_id UUID;
    branch_id UUID;
    menu_item_id UUID;
BEGIN
    -- Only create sample data if table is empty
    IF (SELECT COUNT(*) FROM menu_item_branch_availability) = 0 THEN
        
        -- Get first organization, branch, and menu item for testing
        SELECT id INTO org_id FROM organizations LIMIT 1;
        SELECT id INTO branch_id FROM branches WHERE organization_id = org_id LIMIT 1;
        SELECT id INTO menu_item_id FROM menu_items WHERE organization_id = org_id LIMIT 1;
        
        IF org_id IS NOT NULL AND branch_id IS NOT NULL AND menu_item_id IS NOT NULL THEN
            -- Create sample availability record
            INSERT INTO menu_item_branch_availability (
                organization_id, menu_item_id, branch_id,
                is_available, price_override, stock_quantity,
                start_time, end_time, available_days,
                notes
            ) VALUES (
                org_id, menu_item_id, branch_id,
                true, NULL, 50,
                '09:00'::time, '22:00'::time, 
                '[1,2,3,4,5,6]'::jsonb, -- Monday-Saturday
                'Sample branch-specific availability with business hours'
            );
            
            RAISE NOTICE 'Created sample branch availability record';
        END IF;
    END IF;
END $$;

COMMIT;

-- Summary of changes
\echo '========================================'
\echo 'Branch-Menu Relationship Enhancement Complete!'
\echo '========================================'
\echo 'Created tables:'
\echo '  - menu_item_branch_availability (with comprehensive controls)'
\echo 'Created indexes:'
\echo '  - Performance optimized indexes for queries'
\echo 'Created functions:'
\echo '  - is_menu_item_available_at_branch()'
\echo '  - get_menu_item_price_at_branch()'
\echo 'Created materialized view:'
\echo '  - menu_items_with_branch_availability'
\echo 'Setup RLS policies and triggers for data integrity'
\echo '========================================'
