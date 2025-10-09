import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

// Types for modifier system
export interface ModifierGroup {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  selection_type: 'single' | 'multiple';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Modifier {
  id: string;
  organization_id: string;
  modifier_group_id: string;
  name: string;
  description?: string;
  price_adjustment: number;
  display_order: number;
  is_default: boolean;
  is_active: boolean;
  inventory_impact?: any[];
  nutritional_impact?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MenuItemModifierGroup {
  id: string;
  organization_id: string;
  menu_item_id: string;
  modifier_group_id: string;
  is_required?: boolean;
  min_selections?: number;
  max_selections?: number;
  display_order: number;
  available_branches?: string[];
  created_at: string;
  created_by?: string;
}

export interface ModifierGroupWithModifiers extends ModifierGroup {
  modifiers: Modifier[];
}

export interface MenuItemWithModifiers {
  menu_item: Database['public']['Tables']['menu_items']['Row'];
  modifier_groups: Array<{
    group: ModifierGroup;
    rules: {
      is_required: boolean;
      min_selections: number;
      max_selections: number;
    };
    modifiers: Modifier[];
    display_order: number;
  }>;
}

export interface SelectedModifier {
  modifier_id: string;
  modifier_group_id: string;
  quantity: number;
}

export interface ModifierGroupInput {
  name: string;
  description?: string;
  display_order?: number;
  is_required?: boolean;
  min_selections?: number;
  max_selections?: number;
  selection_type?: 'single' | 'multiple';
}

export interface ModifierInput {
  name: string;
  description?: string;
  price_adjustment?: number;
  display_order?: number;
  is_default?: boolean;
  inventory_impact?: any[];
  nutritional_impact?: Record<string, any>;
}

export const modifierService = {
  /**
   * MODIFIER GROUPS MANAGEMENT
   */
  
  /**
   * Get all modifier groups for an organization
   */
  getModifierGroups: async (organizationId: string): Promise<ModifierGroup[]> => {
    const { data, error } = await supabase
      .from('menu_modifier_groups')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return (data || []) as ModifierGroup[];
  },

  /**
   * Create a new modifier group
   */
  createModifierGroup: async (organizationId: string, groupData: ModifierGroupInput): Promise<ModifierGroup> => {
    const { data, error } = await supabase
      .from('menu_modifier_groups')
      .insert({
        organization_id: organizationId,
        name: groupData.name,
        description: groupData.description || null,
        display_order: groupData.display_order || 0,
        is_required: groupData.is_required || false,
        min_selections: groupData.min_selections || 0,
        max_selections: groupData.max_selections || 1,
        selection_type: groupData.selection_type || 'single'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as ModifierGroup;
  },

  /**
   * Update a modifier group
   */
  updateModifierGroup: async (groupId: string, updates: Partial<ModifierGroup>): Promise<ModifierGroup> => {
    const { data, error } = await supabase
      .from('menu_modifier_groups')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', groupId)
      .select()
      .single();
    
    if (error) throw error;
    return data as ModifierGroup;
  },

  /**
   * Delete a modifier group (soft delete)
   */
  deleteModifierGroup: async (groupId: string): Promise<void> => {
    const { error } = await supabase
      .from('menu_modifier_groups')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', groupId);
    
    if (error) throw error;
  },

  /**
   * INDIVIDUAL MODIFIERS MANAGEMENT
   */

  /**
   * Get modifiers for a specific group
   */
  getModifiers: async (groupId: string): Promise<Modifier[]> => {
    const { data, error } = await supabase
      .from('menu_modifiers')
      .select('*')
      .eq('modifier_group_id', groupId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return (data || []) as Modifier[];
  },

  /**
   * Get all modifiers for an organization
   */
  getAllModifiers: async (organizationId: string): Promise<Modifier[]> => {
    const { data, error } = await supabase
      .from('menu_modifiers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('modifier_group_id', { ascending: true })
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return (data || []) as Modifier[];
  },

  /**
   * Create a new modifier
   */
  createModifier: async (organizationId: string, groupId: string, modifierData: ModifierInput): Promise<Modifier> => {
    const { data, error } = await supabase
      .from('menu_modifiers')
      .insert({
        organization_id: organizationId,
        modifier_group_id: groupId,
        name: modifierData.name,
        description: modifierData.description || null,
        price_adjustment: modifierData.price_adjustment || 0,
        display_order: modifierData.display_order || 0,
        is_default: modifierData.is_default || false,
        inventory_impact: modifierData.inventory_impact || [],
        nutritional_impact: modifierData.nutritional_impact || {}
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Modifier;
  },

  /**
   * Update a modifier
   */
  updateModifier: async (modifierId: string, updates: Partial<Modifier>): Promise<Modifier> => {
    const { data, error} = await supabase
      .from('menu_modifiers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', modifierId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Modifier;
  },

  /**
   * Delete a modifier (soft delete)
   */
  deleteModifier: async (modifierId: string): Promise<void> => {
    const { error } = await supabase
      .from('menu_modifiers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', modifierId);
    
    if (error) throw error;
  },

  /**
   * MENU ITEM MODIFIER ASSIGNMENTS
   */

  /**
   * Get modifier groups assigned to a menu item
   */
  getMenuItemModifierGroups: async (menuItemId: string): Promise<MenuItemModifierGroup[]> => {
    const { data, error } = await supabase
      .from('menu_item_modifier_groups')
      .select('*')
      .eq('menu_item_id', menuItemId)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return (data || []) as MenuItemModifierGroup[];
  },

  /**
   * Assign modifier group to menu item
   */
  assignModifierGroupToItem: async (
    organizationId: string,
    menuItemId: string, 
    groupId: string, 
    rules?: {
      is_required?: boolean;
      min_selections?: number;
      max_selections?: number;
      display_order?: number;
    }
  ): Promise<MenuItemModifierGroup> => {
    const { data, error } = await supabase
      .from('menu_item_modifier_groups')
      .insert({
        organization_id: organizationId,
        menu_item_id: menuItemId,
        modifier_group_id: groupId,
        is_required: rules?.is_required || null,
        min_selections: rules?.min_selections || null,
        max_selections: rules?.max_selections || null,
        display_order: rules?.display_order || 0
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as MenuItemModifierGroup;
  },

  /**
   * Remove modifier group from menu item
   */
  removeModifierGroupFromItem: async (menuItemId: string, groupId: string): Promise<void> => {
    const { error } = await supabase
      .from('menu_item_modifier_groups')
      .delete()
      .eq('menu_item_id', menuItemId)
      .eq('modifier_group_id', groupId);
    
    if (error) throw error;
  },

  /**
   * COMPLEX QUERIES AND CALCULATIONS
   */

  /**
   * Get menu item with all modifier information
   */
  getMenuItemWithModifiers: async (menuItemId: string): Promise<MenuItemWithModifiers | null> => {
    // Get menu item
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', menuItemId)
      .single();
    
    if (menuError) throw menuError;
    if (!menuItem) return null;

    // Get modifier groups with assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from('menu_item_modifier_groups')
      .select(`
        *,
        modifier_group:menu_modifier_groups!inner(*)
      `)
      .eq('menu_item_id', menuItemId)
      .order('display_order', { ascending: true });
    
    if (assignmentError) throw assignmentError;

    // Get modifiers for each group
    const modifierGroups = await Promise.all(
      (assignments || []).map(async (assignment: any) => {
        const modifiers = await modifierService.getModifiers(assignment.modifier_group_id);
        
        return {
          group: assignment.modifier_group,
          rules: {
            is_required: assignment.is_required ?? assignment.modifier_group.is_required,
            min_selections: assignment.min_selections ?? assignment.modifier_group.min_selections,
            max_selections: assignment.max_selections ?? assignment.modifier_group.max_selections,
          },
          modifiers: modifiers,
          display_order: assignment.display_order
        };
      })
    );

    return {
      menu_item: menuItem,
      modifier_groups: modifierGroups
    };
  },

  /**
   * Calculate price with selected modifiers
   */
  calculateModifierPrice: async (menuItemId: string, selectedModifiers: SelectedModifier[]): Promise<number> => {
    // Get base price
    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('base_price')
      .eq('id', menuItemId)
      .single();

    if (!menuItem) throw new Error('Menu item not found');

    let totalAdjustment = 0;

    // Calculate adjustments from selected modifiers
    for (const selected of selectedModifiers) {
      const { data: modifier } = await supabase
        .from('menu_modifiers')
        .select('price_adjustment')
        .eq('id', selected.modifier_id)
        .single();

      if (modifier) {
        totalAdjustment += modifier.price_adjustment * selected.quantity;
      }
    }

    return (menuItem.base_price || 0) + totalAdjustment;
  },

  /**
   * Validate modifier selection against business rules
   */
  validateModifierSelection: async (
    menuItemId: string, 
    selectedModifiers: Array<{
      modifier_group_id: string;
      modifiers: SelectedModifier[];
    }>
  ): Promise<{ isValid: boolean; errors: string[] }> => {
    const errors: string[] = [];

    // Get modifier group rules for the menu item
    const { data: assignments } = await supabase
      .from('menu_item_modifier_groups')
      .select(`
        *,
        modifier_group:menu_modifier_groups!inner(*)
      `)
      .eq('menu_item_id', menuItemId);

    if (!assignments) {
      return { isValid: true, errors: [] };
    }

    // Validate each group
    for (const assignment of assignments) {
      const group = assignment.modifier_group;
      const isRequired = assignment.is_required ?? group.is_required;
      const minSelections = assignment.min_selections ?? group.min_selections;
      const maxSelections = assignment.max_selections ?? group.max_selections;

      // Find selections for this group
      const groupSelections = selectedModifiers.find(
        sel => sel.modifier_group_id === group.id
      );

      const selectionCount = groupSelections?.modifiers?.length || 0;

      // Validate required groups
      if (isRequired && selectionCount < minSelections) {
        errors.push(`${group.name} requires at least ${minSelections} selection(s)`);
      }

      // Validate maximum selections
      if (selectionCount > maxSelections) {
        errors.push(`${group.name} allows maximum ${maxSelections} selection(s)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * UTILITY METHODS
   */

  /**
   * Get modifier groups with their modifiers
   */
  getModifierGroupsWithModifiers: async (organizationId: string): Promise<ModifierGroupWithModifiers[]> => {
    const groups = await modifierService.getModifierGroups(organizationId);
    
    return await Promise.all(
      groups.map(async (group) => ({
        ...group,
        modifiers: await modifierService.getModifiers(group.id)
      }))
    );
  },

  /**
   * Search modifiers by name
   */
  searchModifiers: async (organizationId: string, searchTerm: string): Promise<Modifier[]> => {
    const { data, error } = await supabase
      .from('menu_modifiers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('name');
    
    if (error) throw error;
    return (data || []) as Modifier[];
  },

  /**
   * Get popular modifiers (by usage in orders)
   */
  getPopularModifiers: async (organizationId: string, limit: number = 10): Promise<any[]> => {
    // This would require integration with order analytics
    // For now, return empty array - to be implemented with analytics
    return [];
  },

  /**
   * Batch operations for efficiency
   */
  batchCreateModifiers: async (
    organizationId: string,
    groupId: string,
    modifiers: ModifierInput[]
  ): Promise<Modifier[]> => {
    const modifiersToInsert = modifiers.map(modifier => ({
      organization_id: organizationId,
      modifier_group_id: groupId,
      name: modifier.name,
      description: modifier.description || null,
      price_adjustment: modifier.price_adjustment || 0,
      display_order: modifier.display_order || 0,
      is_default: modifier.is_default || false,
      inventory_impact: modifier.inventory_impact || [],
      nutritional_impact: modifier.nutritional_impact || {}
    }));

    const { data, error } = await supabase
      .from('menu_modifiers')
      .insert(modifiersToInsert)
      .select();
    
    if (error) throw error;
    return (data || []) as Modifier[];
  }
};
