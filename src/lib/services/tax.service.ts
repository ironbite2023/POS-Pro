import { supabase } from '../supabase/client';
import type { Database } from '../supabase/database.types';

// Use generated database types instead of custom interfaces
export type TaxSetting = Database['public']['Tables']['tax_settings']['Row'];
export type TaxSettingInsert = Database['public']['Tables']['tax_settings']['Insert'];
export type TaxSettingUpdate = Database['public']['Tables']['tax_settings']['Update'];

export interface CreateTaxSettingParams {
  organization_id: string;
  branch_id?: string | null;
  tax_name: string;
  tax_rate: number;
  tax_type?: string;
  applies_to_delivery?: boolean;
  applies_to_dine_in?: boolean;
  applies_to_takeaway?: boolean;
  description?: string | null;
  created_by?: string | null;
}

export interface TaxCalculationContext {
  orderType: Database['public']['Enums']['order_type'];
  subtotal: number;
  organizationId: string;
  branchId?: string;
}

export interface TaxBreakdown {
  tax_name: string;
  tax_rate: number;
  tax_amount: number;
  applies: boolean;
}

/**
 * Tax Service - Manages configurable tax rates for organizations and branches
 * Now uses proper database types for type safety
 */
export const taxService = {
  /**
   * Get effective tax rate for organization/branch
   * Branch-specific rates take precedence over organization rates
   */
  getTaxRate: async (organizationId: string, branchId?: string): Promise<number> => {
    try {
      // Use database function for optimal performance
      const { data, error } = await supabase.rpc('get_effective_tax_rate', {
        org_id: organizationId,
        branch_id: branchId || null,
      });

      if (error) {
        console.warn('Error fetching tax rate from database function, falling back:', error);
        
        // Fallback: Manual query if database function fails
        return await taxService.getTaxRateFallback(organizationId, branchId);
      }

      return data ?? 0.1; // Default 10% if no rate configured
    } catch (error) {
      console.error('Error getting tax rate:', error);
      return 0.1; // Default 10% fallback
    }
  },

  /**
   * Fallback method to get tax rate with manual queries
   */
  getTaxRateFallback: async (organizationId: string, branchId?: string): Promise<number> => {
    try {
      // 1. Try branch-specific rate first if branch provided
      if (branchId) {
        const { data: branchTax } = await supabase
          .from('tax_settings')
          .select('tax_rate')
          .eq('branch_id', branchId)
          .eq('is_active', true)
          .single();

        if (branchTax) {
          return branchTax.tax_rate;
        }
      }

      // 2. Fall back to organization rate
      const { data: orgTax } = await supabase
        .from('tax_settings')
        .select('tax_rate')
        .eq('organization_id', organizationId)
        .is('branch_id', null)
        .eq('is_active', true)
        .single();

      return orgTax?.tax_rate ?? 0.1; // Default 10% if no rate found
    } catch (error) {
      console.error('Error in fallback tax rate query:', error);
      return 0.1; // Default 10% fallback
    }
  },

  /**
   * Get full tax setting with context for order type
   */
  getTaxSetting: async (organizationId: string, branchId?: string): Promise<TaxSetting | null> => {
    try {
      // 1. Try branch-specific setting first if branch provided
      if (branchId) {
        const { data: branchTax, error: branchError } = await supabase
          .from('tax_settings')
          .select('*')
          .eq('branch_id', branchId)
          .eq('is_active', true)
          .single();

        if (!branchError && branchTax) {
          return branchTax;
        }
      }

      // 2. Fall back to organization setting
      const { data: orgTax, error: orgError } = await supabase
        .from('tax_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .is('branch_id', null)
        .eq('is_active', true)
        .single();

      if (orgError) {
        console.warn('No tax setting found for organization:', organizationId);
        return null;
      }

      return orgTax;
    } catch (error) {
      console.error('Error getting tax setting:', error);
      return null;
    }
  },

  /**
   * Calculate tax amount with context-aware rules
   */
  calculateTax: async (context: TaxCalculationContext): Promise<TaxBreakdown> => {
    const taxSetting = await taxService.getTaxSetting(context.organizationId, context.branchId);

    if (!taxSetting) {
      // Default tax calculation if no setting found
      return {
        tax_name: 'VAT',
        tax_rate: 0.1,
        tax_amount: context.subtotal * 0.1,
        applies: true,
      };
    }

    // Check if tax applies to this order type
    let applies = false;
    switch (context.orderType) {
      case 'dine_in':
        applies = taxSetting.applies_to_dine_in;
        break;
      case 'takeout':
        applies = taxSetting.applies_to_takeaway;
        break;
      case 'delivery':
        applies = taxSetting.applies_to_delivery;
        break;
    }

    const taxAmount = applies ? context.subtotal * taxSetting.tax_rate : 0;

    return {
      tax_name: taxSetting.tax_name,
      tax_rate: taxSetting.tax_rate,
      tax_amount: taxAmount,
      applies,
    };
  },

  /**
   * Create a new tax setting
   */
  createTaxSetting: async (params: CreateTaxSettingParams): Promise<TaxSetting> => {
    try {
      // First deactivate any existing active tax settings for this scope
      if (params.branch_id) {
        // Deactivate existing branch tax settings
        await supabase
          .from('tax_settings')
          .update({ 
            is_active: false, 
            updated_by: params.created_by 
          })
          .eq('branch_id', params.branch_id)
          .eq('is_active', true);
      } else {
        // Deactivate existing organization tax settings
        await supabase
          .from('tax_settings')
          .update({ 
            is_active: false, 
            updated_by: params.created_by 
          })
          .eq('organization_id', params.organization_id)
          .is('branch_id', null)
          .eq('is_active', true);
      }

      // Prepare insert data with database types
      const insertData: TaxSettingInsert = {
        organization_id: params.organization_id,
        branch_id: params.branch_id || null,
        tax_name: params.tax_name,
        tax_rate: params.tax_rate,
        tax_type: params.tax_type || 'percentage',
        applies_to_delivery: params.applies_to_delivery ?? true,
        applies_to_dine_in: params.applies_to_dine_in ?? true,
        applies_to_takeaway: params.applies_to_takeaway ?? true,
        description: params.description || null,
        created_by: params.created_by || null,
        is_active: true,
      };

      // Create new tax setting
      const { data, error } = await supabase
        .from('tax_settings')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tax setting:', error);
      throw error;
    }
  },

  /**
   * Update an existing tax setting
   */
  updateTaxSetting: async (
    id: string,
    updates: TaxSettingUpdate,
    updatedBy?: string
  ): Promise<void> => {
    try {
      const updateData: TaxSettingUpdate = {
        ...updates,
        updated_by: updatedBy || null,
      };

      const { error } = await supabase
        .from('tax_settings')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating tax setting:', error);
      throw error;
    }
  },

  /**
   * Get all tax settings for an organization
   */
  getTaxSettings: async (organizationId: string): Promise<TaxSetting[]> => {
    try {
      const { data, error } = await supabase
        .from('tax_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      throw error;
    }
  },

  /**
   * Delete a tax setting
   */
  deleteTaxSetting: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('tax_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting tax setting:', error);
      throw error;
    }
  },

  /**
   * Activate/Deactivate a tax setting
   */
  toggleTaxSetting: async (id: string, isActive: boolean, updatedBy?: string): Promise<void> => {
    try {
      const updateData: TaxSettingUpdate = {
        is_active: isActive,
        updated_by: updatedBy || null,
      };

      const { error } = await supabase
        .from('tax_settings')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling tax setting:', error);
      throw error;
    }
  },
};
