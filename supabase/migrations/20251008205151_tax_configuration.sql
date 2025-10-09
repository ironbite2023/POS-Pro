-- Tax Configuration System Migration
-- Created: 2025-10-08
-- Purpose: Implement dynamic tax configuration for organizations and branches

-- Create tax_settings table for configurable tax rates
CREATE TABLE IF NOT EXISTS tax_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE, -- NULL for organization-wide settings
  tax_name VARCHAR(100) NOT NULL DEFAULT 'VAT',
  tax_rate DECIMAL(5,4) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 1),
  tax_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
  is_active BOOLEAN DEFAULT true NOT NULL,
  applies_to_delivery BOOLEAN DEFAULT true NOT NULL,
  applies_to_dine_in BOOLEAN DEFAULT true NOT NULL,
  applies_to_takeaway BOOLEAN DEFAULT true NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create unique partial indexes to ensure only one active tax setting per scope
-- One active tax per organization (when branch_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_tax_per_organization 
ON tax_settings(organization_id) 
WHERE branch_id IS NULL AND is_active = true;

-- One active tax per branch (when branch_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_tax_per_branch 
ON tax_settings(branch_id) 
WHERE branch_id IS NOT NULL AND is_active = true;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_tax_settings_organization_id 
ON tax_settings(organization_id);

CREATE INDEX IF NOT EXISTS idx_tax_settings_branch_id 
ON tax_settings(branch_id) 
WHERE branch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tax_settings_active 
ON tax_settings(is_active) 
WHERE is_active = true;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_tax_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS trigger_tax_settings_updated_at ON tax_settings;
CREATE TRIGGER trigger_tax_settings_updated_at
  BEFORE UPDATE ON tax_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_settings_updated_at();

-- Create RLS (Row Level Security) policies
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tax settings for their organization
CREATE POLICY "Users can view organization tax settings" ON tax_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.organization_id = tax_settings.organization_id
  )
);

-- Policy: Organization admins can manage tax settings
CREATE POLICY "Organization admins can manage tax settings" ON tax_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    JOIN roles ON user_profiles.role_id = roles.id
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.organization_id = tax_settings.organization_id
    AND roles.name IN ('admin', 'owner', 'manager')
  )
);

-- Insert default tax settings for existing organizations
INSERT INTO tax_settings (organization_id, tax_name, tax_rate, description)
SELECT 
  id as organization_id,
  'VAT' as tax_name,
  0.1 as tax_rate, -- 10% default rate
  'Default VAT rate - automatically created during migration' as description
FROM organizations
ON CONFLICT DO NOTHING;

-- Create helper function to get effective tax rate
CREATE OR REPLACE FUNCTION get_effective_tax_rate(
  org_id UUID,
  branch_id UUID DEFAULT NULL
)
RETURNS DECIMAL(5,4)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  effective_rate DECIMAL(5,4);
BEGIN
  -- Try branch-specific rate first if branch_id is provided
  IF branch_id IS NOT NULL THEN
    SELECT tax_rate INTO effective_rate
    FROM tax_settings
    WHERE tax_settings.branch_id = get_effective_tax_rate.branch_id
    AND is_active = true
    LIMIT 1;
    
    -- Return branch rate if found
    IF FOUND THEN
      RETURN effective_rate;
    END IF;
  END IF;
  
  -- Fall back to organization rate
  SELECT tax_rate INTO effective_rate
  FROM tax_settings
  WHERE organization_id = org_id
  AND tax_settings.branch_id IS NULL
  AND is_active = true
  LIMIT 1;
  
  -- Return organization rate if found, otherwise default to 0.1 (10%)
  RETURN COALESCE(effective_rate, 0.1);
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tax_settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_effective_tax_rate(UUID, UUID) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE tax_settings IS 'Configurable tax rates for organizations and branches';
COMMENT ON COLUMN tax_settings.tax_rate IS 'Tax rate as decimal (0.1 = 10%)';
COMMENT ON COLUMN tax_settings.branch_id IS 'NULL for organization-wide tax, specific branch ID for branch-specific tax';
COMMENT ON FUNCTION get_effective_tax_rate(UUID, UUID) IS 'Returns effective tax rate for given organization and optional branch';
