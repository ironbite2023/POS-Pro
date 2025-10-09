import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  status: string;
  lastLogin: string | null;
  branchAccess: string[];
}

export const staffService = {
  /**
   * Get staff members for a specific organization and branch
   */
  getStaffByBranch: async (organizationId: string, branchId: string): Promise<StaffMember[]> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        role:roles(name)
      `)
      .eq('organization_id', organizationId)
      .contains('branch_access', [branchId])
      .eq('status', 'active');

    if (error) throw error;

    return (data || []).map(profile => ({
      id: profile.id,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User',
      email: profile.email,
      role: (profile.role as any)?.name || 'No Role',
      avatar: profile.avatar_url,
      phone: profile.phone,
      status: profile.status || 'inactive',
      lastLogin: profile.last_login,
      branchAccess: profile.branch_access || [],
    }));
  },

  /**
   * Get all staff members for an organization (HQ view)
   */
  getStaffByOrganization: async (organizationId: string): Promise<StaffMember[]> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        role:roles(name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error) throw error;

    return (data || []).map(profile => ({
      id: profile.id,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User',
      email: profile.email,
      role: (profile.role as any)?.name || 'No Role',
      avatar: profile.avatar_url,
      phone: profile.phone,
      status: profile.status || 'inactive',
      lastLogin: profile.last_login,
      branchAccess: profile.branch_access || [],
    }));
  },

  /**
   * Get staff member by ID
   */
  getStaffById: async (id: string): Promise<StaffMember | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        role:roles(name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown User',
      email: data.email,
      role: (data.role as any)?.name || 'No Role',
      avatar: data.avatar_url,
      phone: data.phone,
      status: data.status || 'inactive',
      lastLogin: data.last_login,
      branchAccess: data.branch_access || [],
    };
  },
};

