import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

// Database types
type Organization = Database['public']['Tables']['organizations']['Row'];
type Branch = Database['public']['Tables']['branches']['Row'];
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];

// Response types
interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Input types for create/update operations
interface CreateRoleData {
  name: string;
  description?: string;
  permissions?: Record<string, any>;
  is_system_role?: boolean;
}

interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: Record<string, any>;
}

interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  role_id?: string;
  branch_access?: string[];
}

interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role_id?: string;
  status?: string;
  branch_access?: string[];
}

interface CreateBranchData {
  name: string;
  code: string;
  address: Record<string, any>;
  phone?: string;
  email?: string;
  region?: string;
  timezone?: string;
  business_hours?: Record<string, any>[];
  services?: Record<string, any>;
  settings?: Record<string, any>;
}

interface UpdateBranchData {
  name?: string;
  code?: string;
  address?: Record<string, any>;
  phone?: string;
  email?: string;
  status?: string;
  region?: string;
  timezone?: string;
  business_hours?: Record<string, any>[];
  services?: Record<string, any>;
  settings?: Record<string, any>;
}

class AdminService {
  private getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  private getUserOrganizationId = async (): Promise<string | null> => {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    return profile?.organization_id || null;
  };

  private logActivity = async (
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any
  ) => {
    try {
      const user = await this.getCurrentUser();
      const organizationId = await this.getUserOrganizationId();
      
      if (!user || !organizationId) return;

      await supabase.from('audit_log').insert({
        organization_id: organizationId,
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  // ==================== ROLE MANAGEMENT ====================

  async createRole(data: CreateRoleData): Promise<ServiceResponse<Role>> {
    try {
      const organizationId = await this.getUserOrganizationId();
      if (!organizationId) {
        return { success: false, error: 'User organization not found' };
      }

      // Check if role name already exists
      const { data: existingRole } = await supabase
        .from('roles')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', data.name)
        .single();

      if (existingRole) {
        return { success: false, error: 'Role name already exists' };
      }

      const { data: newRole, error } = await supabase
        .from('roles')
        .insert({
          organization_id: organizationId,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          permissions: data.permissions || {},
          is_system_role: data.is_system_role || false,
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('CREATE', 'role', newRole.id, null, newRole);

      return { success: true, data: newRole };
    } catch (error: any) {
      console.error('Create role error:', error);
      return { success: false, error: error.message || 'Failed to create role' };
    }
  }

  async updateRole(roleId: string, data: UpdateRoleData): Promise<ServiceResponse<Role>> {
    try {
      const organizationId = await this.getUserOrganizationId();
      if (!organizationId) {
        return { success: false, error: 'User organization not found' };
      }

      // Get existing role for audit log
      const { data: existingRole } = await supabase
        .from('roles')
        .select()
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .single();

      if (!existingRole) {
        return { success: false, error: 'Role not found' };
      }

      if (existingRole.is_system_role && (data.name || data.permissions)) {
        return { success: false, error: 'Cannot modify system role name or permissions' };
      }

      const { data: updatedRole, error } = await supabase
        .from('roles')
        .update({
          name: data.name?.trim(),
          description: data.description?.trim(),
          permissions: data.permissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('UPDATE', 'role', roleId, existingRole, updatedRole);

      return { success: true, data: updatedRole };
    } catch (error: any) {
      console.error('Update role error:', error);
      return { success: false, error: error.message || 'Failed to update role' };
    }
  }

  async deleteRole(roleId: string): Promise<ServiceResponse<void>> {
    try {
      const organizationId = await this.getUserOrganizationId();
      if (!organizationId) {
        return { success: false, error: 'User organization not found' };
      }

      // Check if role exists and get details for audit
      const { data: existingRole } = await supabase
        .from('roles')
        .select()
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .single();

      if (!existingRole) {
        return { success: false, error: 'Role not found' };
      }

      if (existingRole.is_system_role) {
        return { success: false, error: 'Cannot delete system role' };
      }

      // Check if role is assigned to any users
      const { data: assignedUsers } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role_id', roleId)
        .eq('organization_id', organizationId);

      if (assignedUsers && assignedUsers.length > 0) {
        return { 
          success: false, 
          error: `Cannot delete role. It is assigned to ${assignedUsers.length} user(s)` 
        };
      }

      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      await this.logActivity('DELETE', 'role', roleId, existingRole, null);

      return { success: true };
    } catch (error: any) {
      console.error('Delete role error:', error);
      return { success: false, error: error.message || 'Failed to delete role' };
    }
  }

  // ==================== USER MANAGEMENT ====================

  async createUser(data: CreateUserData): Promise<ServiceResponse<UserProfile>> {
    try {
      const organizationId = await this.getUserOrganizationId();
      if (!organizationId) {
        return { success: false, error: 'User organization not found' };
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingUser) {
        return { success: false, error: 'Email already exists' };
      }

      // For now, we'll create the user profile without auth user creation
      // In a real implementation, this would involve Supabase auth admin API
      // Generate a temporary UUID for the user profile
      const tempUserId = crypto.randomUUID();
      
      const { data: newUser, error } = await supabase
        .from('user_profiles')
        .insert({
          id: tempUserId, // Temporary ID until auth user creation is implemented
          organization_id: organizationId,
          first_name: data.first_name.trim(),
          last_name: data.last_name.trim(),
          email: data.email.trim().toLowerCase(),
          role_id: data.role_id || null,
          branch_access: data.branch_access || [],
          status: 'invited',
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('CREATE', 'user', newUser.id, null, newUser);

      return { success: true, data: newUser };
    } catch (error: any) {
      console.error('Create user error:', error);
      return { success: false, error: error.message || 'Failed to create user' };
    }
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<ServiceResponse<UserProfile>> {
    try {
      const organizationId = await this.getUserOrganizationId();
      if (!organizationId) {
        return { success: false, error: 'User organization not found' };
      }

      // Get existing user for audit log
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select()
        .eq('id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (!existingUser) {
        return { success: false, error: 'User not found' };
      }

      const { data: updatedUser, error } = await supabase
        .from('user_profiles')
        .update({
          first_name: data.first_name?.trim(),
          last_name: data.last_name?.trim(),
          phone: data.phone?.trim(),
          avatar_url: data.avatar_url?.trim(),
          role_id: data.role_id,
          status: data.status,
          branch_access: data.branch_access,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('UPDATE', 'user', userId, existingUser, updatedUser);

      return { success: true, data: updatedUser };
    } catch (error: any) {
      console.error('Update user error:', error);
      return { success: false, error: error.message || 'Failed to update user' };
    }
  }

  // ==================== BRANCH MANAGEMENT ====================

  async createBranch(data: CreateBranchData): Promise<ServiceResponse<Branch>> {
    try {
      const organizationId = await this.getUserOrganizationId();
      if (!organizationId) {
        return { success: false, error: 'User organization not found' };
      }

      // Check if branch code already exists
      const { data: existingBranch } = await supabase
        .from('branches')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('code', data.code)
        .single();

      if (existingBranch) {
        return { success: false, error: 'Branch code already exists' };
      }

      const { data: newBranch, error } = await supabase
        .from('branches')
        .insert({
          organization_id: organizationId,
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          address: data.address,
          phone: data.phone?.trim() || null,
          email: data.email?.trim() || null,
          region: data.region?.trim() || null,
          timezone: data.timezone || 'UTC',
          business_hours: data.business_hours || [],
          services: data.services || { dine_in: true, delivery: false, takeaway: true },
          settings: data.settings || {},
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('CREATE', 'branch', newBranch.id, null, newBranch);

      return { success: true, data: newBranch };
    } catch (error: any) {
      console.error('Create branch error:', error);
      return { success: false, error: error.message || 'Failed to create branch' };
    }
  }

  async updateBranch(branchId: string, data: UpdateBranchData): Promise<ServiceResponse<Branch>> {
    try {
      const organizationId = await this.getUserOrganizationId();
      if (!organizationId) {
        return { success: false, error: 'User organization not found' };
      }

      // Get existing branch for audit log
      const { data: existingBranch } = await supabase
        .from('branches')
        .select()
        .eq('id', branchId)
        .eq('organization_id', organizationId)
        .single();

      if (!existingBranch) {
        return { success: false, error: 'Branch not found' };
      }

      // If code is being changed, check for conflicts
      if (data.code && data.code !== existingBranch.code) {
        const { data: codeExists } = await supabase
          .from('branches')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('code', data.code)
          .neq('id', branchId)
          .single();

        if (codeExists) {
          return { success: false, error: 'Branch code already exists' };
        }
      }

      const { data: updatedBranch, error } = await supabase
        .from('branches')
        .update({
          name: data.name?.trim(),
          code: data.code?.trim().toUpperCase(),
          address: data.address,
          phone: data.phone?.trim(),
          email: data.email?.trim(),
          status: data.status,
          region: data.region?.trim(),
          timezone: data.timezone,
          business_hours: data.business_hours,
          services: data.services,
          settings: data.settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', branchId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('UPDATE', 'branch', branchId, existingBranch, updatedBranch);

      return { success: true, data: updatedBranch };
    } catch (error: any) {
      console.error('Update branch error:', error);
      return { success: false, error: error.message || 'Failed to update branch' };
    }
  }

  // ==================== ORGANIZATION MANAGEMENT ====================

  async updateOrganization(
    organizationId: string, 
    data: { name?: string; settings?: Record<string, any> }
  ): Promise<ServiceResponse<Organization>> {
    try {
      const userOrgId = await this.getUserOrganizationId();
      if (!userOrgId || userOrgId !== organizationId) {
        return { success: false, error: 'Unauthorized to update this organization' };
      }

      // Get existing organization for audit log
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select()
        .eq('id', organizationId)
        .single();

      if (!existingOrg) {
        return { success: false, error: 'Organization not found' };
      }

      const { data: updatedOrg, error } = await supabase
        .from('organizations')
        .update({
          name: data.name?.trim(),
          settings: data.settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId)
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('UPDATE', 'organization', organizationId, existingOrg, updatedOrg);

      return { success: true, data: updatedOrg };
    } catch (error: any) {
      console.error('Update organization error:', error);
      return { success: false, error: error.message || 'Failed to update organization' };
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();
