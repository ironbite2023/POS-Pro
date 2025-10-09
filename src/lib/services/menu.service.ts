import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type MenuCategoryInsert = Database['public']['Tables']['menu_categories']['Insert'];
type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert'];

// Enhanced types for branch availability using proper database types
type MenuItemBranchAvailabilityRow = Database['public']['Tables']['menu_item_branch_availability']['Row'];
type MenuItemBranchAvailabilityInsert = Database['public']['Tables']['menu_item_branch_availability']['Insert'];

export interface MenuItemBranchAvailability extends MenuItemBranchAvailabilityRow {}

export interface BranchAvailabilityUpdate {
  is_available?: boolean;
  price_override?: number | null;
  stock_quantity?: number | null;
  daily_limit?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  available_days?: number[];
  notes?: string;
  metadata?: Record<string, any>;
}

export interface MenuItemWithBranchData extends MenuItem {
  category?: MenuCategory;
  branch_availability?: Partial<MenuItemBranchAvailability>;
  effective_price?: number;
  is_available_at_branch?: boolean;
  is_currently_available?: boolean;
}

export interface MenuItemWithCategory extends MenuItem {
  category?: MenuCategory;
}

export const menuService = {
  /**
   * Get all menu categories for an organization
   */
  getCategories: async (organizationId: string): Promise<MenuCategory[]> => {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Get menu items for an organization, optionally filtered by category
   */
  getMenuItems: async (organizationId: string, categoryId?: string): Promise<MenuItemWithCategory[]> => {
    let query = supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true);
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data || [];
  },

  /**
   * Get menu items with branch-specific availability and pricing
   * Restored with proper database types
   */
  getMenuItemsForBranch: async (organizationId: string, branchId: string): Promise<MenuItemWithBranchData[]> => {
    // Get menu items first
    const menuItems = await menuService.getMenuItems(organizationId);
    
    // Get branch availability data
    const { data: branchAvailability, error: branchError } = await supabase
      .from('menu_item_branch_availability')
      .select('*')
      .eq('branch_id', branchId);
    
    if (branchError) throw branchError;

    // Combine the data
    return (menuItems || []).map(item => {
      const availability = branchAvailability?.find(ba => ba.menu_item_id === item.id);
      
      return {
        ...item,
        branch_availability: availability || undefined,
        effective_price: availability?.price_override || item.base_price,
        is_available_at_branch: availability?.is_available ?? true,
        is_currently_available: availability?.is_available ?? true
      };
    });
  },

  /**
   * Get comprehensive branch menu data using materialized view
   * Restored with proper database types
   */
  getBranchMenuOverview: async (organizationId: string, branchId?: string): Promise<any[]> => {
    let query = supabase
      .from('menu_items_with_branch_availability')
      .select('*')
      .eq('organization_id', organizationId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query.order('item_name');
    if (error) throw error;
    return data || [];
  },

  /**
   * Update branch-specific menu item availability
   * Restored with proper database types
   */
  updateBranchAvailability: async (
    menuItemId: string,
    branchId: string,
    updates: BranchAvailabilityUpdate
  ): Promise<MenuItemBranchAvailability> => {
    // Get organization ID from menu item
    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('organization_id')
      .eq('id', menuItemId)
      .single();

    if (!menuItem) {
      throw new Error('Menu item not found');
    }

    const { data, error } = await supabase
      .from('menu_item_branch_availability')
      .upsert({
        menu_item_id: menuItemId,
        branch_id: branchId,
        organization_id: menuItem.organization_id,
        ...updates,
        updated_at: new Date().toISOString()
      } as MenuItemBranchAvailabilityInsert, {
        onConflict: 'menu_item_id,branch_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Batch update multiple items' branch availability
   * Restored with proper database types
   */
  batchUpdateBranchAvailability: async (
    branchId: string,
    updates: Array<{
      menuItemId: string;
      updates: BranchAvailabilityUpdate;
    }>
  ): Promise<MenuItemBranchAvailability[]> => {
    const results: MenuItemBranchAvailability[] = [];
    
    // Process in chunks to avoid overwhelming the database
    const chunkSize = 10;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(({ menuItemId, updates: itemUpdates }) =>
        menuService.updateBranchAvailability(menuItemId, branchId, itemUpdates)
      );
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    return results;
  },

  /**
   * Delete branch-specific availability (revert to default)
   * Restored with proper database types
   */
  deleteBranchAvailability: async (menuItemId: string, branchId: string): Promise<void> => {
    const { error } = await supabase
      .from('menu_item_branch_availability')
      .delete()
      .eq('menu_item_id', menuItemId)
      .eq('branch_id', branchId);
    
    if (error) throw error;
  },

  /**
   * Get branch availability settings for a specific menu item
   * Restored with proper database types
   */
  getBranchAvailability: async (
    menuItemId: string, 
    branchId: string
  ): Promise<MenuItemBranchAvailability | null> => {
    const { data, error } = await supabase
      .from('menu_item_branch_availability')
      .select('*')
      .eq('menu_item_id', menuItemId)
      .eq('branch_id', branchId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  /**
   * Check if menu item is currently available at branch
   * Restored with proper database function integration
   */
  checkItemAvailabilityAtBranch: async (
    menuItemId: string,
    branchId: string,
    checkDate?: string,
    checkTime?: string
  ): Promise<boolean> => {
    const { data, error } = await supabase.rpc('is_menu_item_available_at_branch', {
      p_menu_item_id: menuItemId,
      p_branch_id: branchId,
      p_check_date: checkDate || new Date().toISOString().split('T')[0],
      p_check_time: checkTime || new Date().toTimeString().split(' ')[0]
    });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get effective price for menu item at specific branch
   * Restored with proper database function integration
   */
  getItemPriceAtBranch: async (
    menuItemId: string,
    branchId: string
  ): Promise<number> => {
    const { data, error } = await supabase.rpc('get_menu_item_price_at_branch', {
      p_menu_item_id: menuItemId,
      p_branch_id: branchId
    });
    
    if (error) throw error;
    return data;
  },

  /**
   * Refresh materialized view for updated branch availability data
   * Restored with proper database function integration
   */
  refreshBranchAvailabilityView: async (): Promise<void> => {
    const { error } = await supabase.rpc('refresh_menu_branch_availability_view');
    if (error) throw error;
  },

  /**
   * Get branch-specific menu performance analytics
   * Enhanced with proper database types
   */
  getBranchMenuAnalytics: async (
    organizationId: string,
    branchId: string,
    startDate?: string,
    endDate?: string
  ) => {
    const menuItems = await menuService.getMenuItemsForBranch(organizationId, branchId);
    
    return {
      totalItems: menuItems.length,
      availableItems: menuItems.filter(item => item.is_available_at_branch).length,
      itemsWithPriceOverride: menuItems.filter(item => item.branch_availability?.price_override).length,
      stockLimitedItems: menuItems.filter(item => item.branch_availability?.stock_quantity).length,
      menuItems: menuItems
    };
  },

  /**
   * Get a single menu item by ID
   */
  getMenuItemById: async (itemId: string): Promise<MenuItemWithCategory | null> => {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(*)
      `)
      .eq('id', itemId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new menu category
   */
  createCategory: async (organizationId: string, category: Omit<MenuCategoryInsert, 'organization_id'>): Promise<MenuCategory> => {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({ 
        ...category, 
        organization_id: organizationId 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new menu item
   */
  createMenuItem: async (organizationId: string, item: Omit<MenuItemInsert, 'organization_id'>): Promise<MenuItem> => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({ 
        ...item, 
        organization_id: organizationId 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update a menu category
   */
  updateCategory: async (categoryId: string, updates: Partial<MenuCategory>): Promise<MenuCategory> => {
    const { data, error } = await supabase
      .from('menu_categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', categoryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update a menu item
   */
  updateMenuItem: async (itemId: string, updates: Partial<MenuItem>): Promise<MenuItem> => {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Delete a menu category (soft delete - set inactive)
   */
  deleteCategory: async (categoryId: string): Promise<void> => {
    const { error } = await supabase
      .from('menu_categories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', categoryId);
    
    if (error) throw error;
  },

  /**
   * Delete a menu item (soft delete - set inactive)
   */
  deleteMenuItem: async (itemId: string): Promise<void> => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', itemId);
    
    if (error) throw error;
  },

  /**
   * Get menu items with branch-specific pricing (legacy method)
   * @deprecated Use getMenuItemsForBranch instead
   */
  getMenuItemsWithBranchPricing: async (organizationId: string, branchId: string): Promise<MenuItemWithCategory[]> => {
    console.warn('getMenuItemsWithBranchPricing is deprecated. Use getMenuItemsForBranch instead.');
    return menuService.getMenuItemsForBranch(organizationId, branchId);
  },

  /**
   * Search menu items by name or description
   */
  searchMenuItems: async (organizationId: string, searchTerm: string): Promise<MenuItemWithCategory[]> => {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Search menu items at specific branch with availability filtering
   */
  searchMenuItemsAtBranch: async (
    organizationId: string, 
    branchId: string, 
    searchTerm: string,
    onlyAvailable: boolean = false
  ): Promise<MenuItemWithBranchData[]> => {
    const items = await menuService.getMenuItemsForBranch(organizationId, branchId);
    
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAvailability = !onlyAvailable || item.is_available_at_branch;
      
      return matchesSearch && matchesAvailability;
    });
  }
};
