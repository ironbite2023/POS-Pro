import { supabase } from '../supabase/client';
import type { Database } from '../supabase/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
type Branch = Database['public']['Tables']['branches']['Row'];
type BranchInsert = Database['public']['Tables']['branches']['Insert'];

export const organizationService = {
  /**
   * Get organization by ID
   */
  getById: async (organizationId: string): Promise<Organization | null> => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get organization by slug
   */
  getBySlug: async (slug: string): Promise<Organization | null> => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new organization
   */
  create: async (organization: OrganizationInsert): Promise<Organization> => {
    const { data, error } = await supabase
      .from('organizations')
      .insert(organization)
      .select()
      .single();

    if (error) throw error;

    // Initialize organization with default roles
    if (data) {
      await supabase.rpc('initialize_organization', {
        org_id: data.id,
        org_name: data.name,
      });
    }

    return data;
  },

  /**
   * Update organization
   */
  update: async (
    organizationId: string,
    updates: Partial<Omit<Organization, 'id' | 'created_at'>>
  ): Promise<Organization> => {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all branches for an organization
   */
  getBranches: async (organizationId: string): Promise<Branch[]> => {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get branch by ID
   */
  getBranchById: async (branchId: string): Promise<Branch | null> => {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new branch
   */
  createBranch: async (branch: BranchInsert): Promise<Branch> => {
    const { data, error } = await supabase
      .from('branches')
      .insert(branch)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update branch
   */
  updateBranch: async (
    branchId: string,
    updates: Partial<Omit<Branch, 'id' | 'created_at' | 'organization_id'>>
  ): Promise<Branch> => {
    const { data, error } = await supabase
      .from('branches')
      .update(updates)
      .eq('id', branchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete branch
   */
  deleteBranch: async (branchId: string): Promise<void> => {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', branchId);

    if (error) throw error;
  },
};
