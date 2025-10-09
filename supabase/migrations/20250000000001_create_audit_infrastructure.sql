-- Emergency Migration: Create Audit Infrastructure
-- Created: 2025-01-08
-- Purpose: Fix critical authentication system failures due to missing tables

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  resource VARCHAR(500),
  details JSONB DEFAULT '{}',
  success BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id VARCHAR(255)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON public.audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON public.audit_logs(ip_address);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
    ) OR
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY IF NOT EXISTS "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT WITH CHECK (true); -- Allow service role to insert

-- Verify/Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, module)
);

-- Create indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON public.role_permissions(module);

-- Enable RLS for role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for role_permissions
CREATE POLICY IF NOT EXISTS "role_permissions_select_policy" ON public.role_permissions
  FOR SELECT USING (
    role_id IN (
      SELECT role_id FROM public.user_profiles WHERE id = auth.uid()
    ) OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Insert default permission modules for existing roles
INSERT INTO public.role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
SELECT 
  r.id,
  unnest(ARRAY['dashboard', 'inventory', 'menu_management', 'sales', 'pos', 'loyalty_program', 'purchasing', 'delivery', 'waste_management', 'admin_settings', 'users', 'roles', 'organization']) as module,
  true as can_view,
  CASE WHEN r.name = 'Admin' THEN true ELSE false END as can_create,
  CASE WHEN r.name = 'Admin' THEN true ELSE false END as can_edit,
  CASE WHEN r.name = 'Admin' THEN true ELSE false END as can_delete
FROM public.roles r
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions rp WHERE rp.role_id = r.id
)
ON CONFLICT (role_id, module) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Security audit log for authentication and authorization events';
COMMENT ON TABLE public.role_permissions IS 'Role-based permission matrix for fine-grained access control';

-- Grant necessary permissions
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO service_role;
GRANT SELECT ON public.role_permissions TO authenticated;
