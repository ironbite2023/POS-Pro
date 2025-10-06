import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { organizationService } from '@/lib/services';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

type Branch = Database['public']['Tables']['branches']['Row'];
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];

interface AdminMetrics {
  totalBranches: number;
  totalStaff: number;
  activeUsers: number;
  totalRoles: number;
  lastLoginActivity: string;
}

interface UseAdminDataReturn {
  branches: Branch[];
  staff: UserProfile[];
  roles: Role[];
  metrics: AdminMetrics;
  loading: boolean;
  error: Error | null;
  refetchBranches: () => Promise<void>;
  refetchStaff: () => Promise<void>;
  refetchRoles: () => Promise<void>;
}

export const useAdminData = (): UseAdminDataReturn => {
  const { currentOrganization } = useOrganization();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalBranches: 0,
    totalStaff: 0,
    activeUsers: 0,
    totalRoles: 0,
    lastLoginActivity: '-',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBranches = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const branchesData = await organizationService.getBranches(currentOrganization.id);
      setBranches(branchesData);
    } catch (err) {
      console.error('Error fetching branches:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchStaff = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const { data, error: staffError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('first_name');

      if (staffError) throw staffError;
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchRoles = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const { data, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (rolesError) throw rolesError;
      setRoles(data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchAllData = useCallback(async () => {
    if (!currentOrganization) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchBranches(),
        fetchStaff(),
        fetchRoles(),
      ]);

      // Calculate metrics after all data is fetched
      // Note: These will be calculated in the next render cycle
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, fetchBranches, fetchStaff, fetchRoles]);

  // Calculate metrics when data changes
  useEffect(() => {
    const totalBranches = branches.length;
    const totalStaff = staff.length;
    const activeUsers = staff.filter(user => user.status === 'active').length;
    const totalRoles = roles.length;
    
    // Find most recent login
    const recentLogins = staff
      .filter(user => user.last_login)
      .sort((a, b) => new Date(b.last_login!).getTime() - new Date(a.last_login!).getTime());
    const lastLoginActivity = recentLogins[0]?.last_login 
      ? new Date(recentLogins[0].last_login).toLocaleString()
      : '-';

    setMetrics({
      totalBranches,
      totalStaff,
      activeUsers,
      totalRoles,
      lastLoginActivity,
    });
  }, [branches, staff, roles]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    branches,
    staff,
    roles,
    metrics,
    loading,
    error,
    refetchBranches: fetchBranches,
    refetchStaff: fetchStaff,
    refetchRoles: fetchRoles,
  };
};
