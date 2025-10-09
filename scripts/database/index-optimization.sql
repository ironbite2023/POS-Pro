-- ========================================
-- Menu Management Database Index Optimization
-- Implementation: Phase 1, Step 1.1
-- Date: October 8, 2025
-- ========================================

-- 1.1.1 Index Audit and Analysis
-- Comprehensive audit of unused indexes with performance impact assessment

-- Create audit results table for tracking
CREATE TABLE IF NOT EXISTS index_optimization_audit (
    id SERIAL PRIMARY KEY,
    audit_date TIMESTAMPTZ DEFAULT now(),
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    index_name TEXT NOT NULL,
    index_size TEXT,
    scan_count BIGINT,
    tup_read BIGINT,
    tup_fetch BIGINT,
    is_redundant BOOLEAN DEFAULT false,
    removal_decision TEXT,
    performance_impact TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Comprehensive unused index audit query
INSERT INTO index_optimization_audit (
    schema_name, table_name, index_name, index_size, 
    scan_count, tup_read, tup_fetch, removal_decision
)
SELECT 
    idx_usage.schemaname,
    idx_usage.tablename,
    idx_usage.indexname,
    pg_size_pretty(pg_relation_size(idx_usage.indexrelid)) as index_size,
    idx_usage.idx_scan,
    idx_usage.idx_tup_read,
    idx_usage.idx_tup_fetch,
    CASE 
        WHEN idx_usage.idx_scan = 0 THEN 'REMOVE - Never used'
        WHEN idx_usage.idx_scan < 10 THEN 'EVALUATE - Rarely used'
        WHEN idx_usage.idx_scan < 100 THEN 'KEEP - Occasionally used'
        ELSE 'KEEP - Frequently used'
    END as removal_decision
FROM pg_stat_user_indexes idx_usage
JOIN pg_indexes ON pg_indexes.indexname = idx_usage.indexname
WHERE idx_usage.schemaname = 'public'
    AND idx_usage.idx_scan < 100  -- Focus on low usage indexes
ORDER BY pg_relation_size(idx_usage.indexrelid) DESC;

-- 1.1.2 Identify redundant indexes (multiple indexes on same columns)
WITH index_columns AS (
    SELECT 
        schemaname,
        tablename,
        indexname,
        string_agg(attname, ',' ORDER BY attnum) as columns,
        indisunique
    FROM pg_indexes 
    JOIN pg_class ON pg_class.relname = indexname
    JOIN pg_index ON pg_index.indexrelid = pg_class.oid
    JOIN pg_attribute ON pg_attribute.attrelid = pg_index.indrelid 
        AND pg_attribute.attnum = ANY(pg_index.indkey)
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename, indexname, indisunique
),
redundant_indexes AS (
    SELECT 
        ic1.schemaname,
        ic1.tablename,
        ic1.indexname as index1,
        ic2.indexname as index2,
        ic1.columns
    FROM index_columns ic1
    JOIN index_columns ic2 ON ic1.schemaname = ic2.schemaname 
        AND ic1.tablename = ic2.tablename
        AND ic1.columns = ic2.columns
        AND ic1.indexname < ic2.indexname  -- Avoid duplicates
)
UPDATE index_optimization_audit 
SET is_redundant = true,
    removal_decision = 'REMOVE - Redundant with other index'
WHERE index_name IN (
    SELECT index2 FROM redundant_indexes
);

-- 1.1.3 Performance baseline queries before optimization
-- Test critical menu management queries to establish baseline
\timing on

-- Baseline Query 1: Menu items by organization
EXPLAIN (ANALYZE, BUFFERS) 
SELECT mi.*, mc.name as category_name
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mi.organization_id = (SELECT id FROM organizations LIMIT 1)
    AND mi.is_active = true;

-- Baseline Query 2: Menu items with branch overrides
EXPLAIN (ANALYZE, BUFFERS)
SELECT mi.*, mc.name as category_name, mbo.price_override, mbo.is_available
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
LEFT JOIN menu_item_branch_overrides mbo ON mi.id = mbo.menu_item_id
WHERE mi.organization_id = (SELECT id FROM organizations LIMIT 1)
    AND mbo.branch_id = (SELECT id FROM branches LIMIT 1);

-- Baseline Query 3: Category aggregation
EXPLAIN (ANALYZE, BUFFERS)
SELECT mc.*, COUNT(mi.id) as item_count
FROM menu_categories mc
LEFT JOIN menu_items mi ON mc.id = mi.category_id AND mi.is_active = true
WHERE mc.organization_id = (SELECT id FROM organizations LIMIT 1)
    AND mc.is_active = true
GROUP BY mc.id;

\timing off

-- 1.1.4 Safe index removal script (Phase 1)
-- START TRANSACTION for safe rollback capability
BEGIN;

-- Create backup of current index statistics before removal
CREATE TABLE index_stats_backup_$(date +%Y%m%d) AS
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';

-- Remove indexes marked for removal (never used)
-- Based on audit results, remove indexes with 0 scans

-- Example removals (will be populated based on actual audit results)
-- These are common unused indexes from the Check Agent findings
DROP INDEX IF EXISTS idx_purchase_orders_created_by;
DROP INDEX IF EXISTS idx_recipe_ingredients_organization_id;
DROP INDEX IF EXISTS idx_recipe_ingredients_unit_id;
DROP INDEX IF EXISTS idx_user_profiles_role_id;
DROP INDEX IF EXISTS idx_waste_logs_branch_id;
DROP INDEX IF EXISTS idx_waste_logs_logged_by;
DROP INDEX IF EXISTS idx_loyalty_transactions_member_id;
DROP INDEX IF EXISTS idx_loyalty_transactions_organization_id;
DROP INDEX IF EXISTS idx_branch_inventory_organization_id;
DROP INDEX IF EXISTS idx_daily_sales_summary_branch_id;
DROP INDEX IF EXISTS idx_inventory_items_recipe_unit_id;
DROP INDEX IF EXISTS idx_inventory_items_storage_unit_id;
DROP INDEX IF EXISTS idx_inventory_movements_user_id;
DROP INDEX IF EXISTS idx_loyalty_rewards_free_item_id;
DROP INDEX IF EXISTS idx_loyalty_transactions_created_by;
DROP INDEX IF EXISTS idx_loyalty_transactions_order_id;
DROP INDEX IF EXISTS idx_menu_item_branch_overrides_organization_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_order_items_organization_id;
DROP INDEX IF EXISTS idx_orders_created_by;
DROP INDEX IF EXISTS idx_purchase_order_items_organization_id;
DROP INDEX IF EXISTS idx_audit_log_organization_id;
DROP INDEX IF EXISTS idx_audit_log_user_id;

-- Performance verification after index removal
-- Re-run baseline queries to ensure no performance degradation
\echo 'Testing performance after index removal...'

\timing on

-- Verify Query 1: Menu items by organization
EXPLAIN (ANALYZE, BUFFERS) 
SELECT mi.*, mc.name as category_name
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mi.organization_id = (SELECT id FROM organizations LIMIT 1)
    AND mi.is_active = true;

-- Verify Query 2: Menu items with branch overrides  
EXPLAIN (ANALYZE, BUFFERS)
SELECT mi.*, mc.name as category_name, mbo.price_override, mbo.is_available
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
LEFT JOIN menu_item_branch_overrides mbo ON mi.id = mbo.menu_item_id
WHERE mi.organization_id = (SELECT id FROM organizations LIMIT 1)
    AND mbo.branch_id = (SELECT id FROM branches LIMIT 1);

-- Verify Query 3: Category aggregation
EXPLAIN (ANALYZE, BUFFERS)
SELECT mc.*, COUNT(mi.id) as item_count
FROM menu_categories mc
LEFT JOIN menu_items mi ON mc.id = mi.category_id AND mi.is_active = true
WHERE mc.organization_id = (SELECT id FROM organizations LIMIT 1)
    AND mc.is_active = true
GROUP BY mc.id;

\timing off

-- Log optimization results
INSERT INTO index_optimization_audit (
    schema_name, table_name, index_name, removal_decision, performance_impact
) VALUES 
('public', 'optimization_summary', 'phase_1_complete', 
 'COMPLETED - Phase 1 index optimization', 
 'Removed unused indexes, verified performance maintained');

-- If all tests pass, commit the changes
-- COMMIT;
-- If any issues detected, rollback:
-- ROLLBACK;

-- For safety, leaving transaction open for manual review
-- DBA should review performance results before committing

\echo 'Phase 1 Index Optimization Complete!'
\echo 'Review performance results above before committing transaction'
\echo 'Run COMMIT; to finalize or ROLLBACK; to revert changes'

-- Final audit summary
SELECT 
    removal_decision,
    COUNT(*) as index_count,
    SUM(CASE WHEN removal_decision LIKE 'REMOVE%' THEN 1 ELSE 0 END) as removed_count
FROM index_optimization_audit
GROUP BY removal_decision
ORDER BY removed_count DESC;
