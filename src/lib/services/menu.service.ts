import { supabase } from '../supabase/client';
import type { Database } from '../supabase/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert'];
type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type MenuCategoryInsert = Database['public']['Tables']['menu_categories']['Insert'];
type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row'];
type RecipeIngredientInsert = Database['public']['Tables']['recipe_ingredients']['Insert'];

export interface MenuItemWithCategory extends MenuItem {
  category?: MenuCategory | null;
}

export interface MenuItemWithRecipe extends MenuItem {
  recipe_ingredients?: Array<RecipeIngredient & {
    inventory_item?: {
      name: string;
      sku: string;
    };
  }>;
}

export const menuService = {
  // ========== Menu Categories ==========
  
  /**
   * Get all menu categories for an organization
   */
  getCategories: async (organizationId: string): Promise<MenuCategory[]> => {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new menu category
   */
  createCategory: async (category: MenuCategoryInsert): Promise<MenuCategory> => {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update menu category
   */
  updateCategory: async (
    categoryId: string,
    updates: Partial<Omit<MenuCategory, 'id' | 'created_at' | 'organization_id'>>
  ): Promise<MenuCategory> => {
    const { data, error } = await supabase
      .from('menu_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete menu category (soft delete by setting is_active to false)
   */
  deleteCategory: async (categoryId: string): Promise<void> => {
    const { error } = await supabase
      .from('menu_categories')
      .update({ is_active: false })
      .eq('id', categoryId);

    if (error) throw error;
  },

  // ========== Menu Items ==========

  /**
   * Get all menu items for an organization
   */
  getMenuItems: async (organizationId: string): Promise<MenuItemWithCategory[]> => {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get menu items by category
   */
  getMenuItemsByCategory: async (
    organizationId: string,
    categoryId: string
  ): Promise<MenuItem[]> => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get menu item by ID with recipe
   */
  getMenuItemById: async (menuItemId: string): Promise<MenuItemWithRecipe | null> => {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        recipe_ingredients(
          *,
          inventory_item:inventory_items(name, sku)
        )
      `)
      .eq('id', menuItemId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new menu item
   */
  createMenuItem: async (menuItem: MenuItemInsert): Promise<MenuItem> => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert(menuItem)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update menu item
   */
  updateMenuItem: async (
    menuItemId: string,
    updates: Partial<Omit<MenuItem, 'id' | 'created_at' | 'organization_id'>>
  ): Promise<MenuItem> => {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', menuItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete menu item (soft delete by setting is_active to false)
   */
  deleteMenuItem: async (menuItemId: string): Promise<void> => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_active: false })
      .eq('id', menuItemId);

    if (error) throw error;
  },

  // ========== Recipe Management ==========

  /**
   * Get recipe ingredients for a menu item
   */
  getRecipeIngredients: async (menuItemId: string): Promise<RecipeIngredient[]> => {
    const { data, error } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('menu_item_id', menuItemId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Add ingredient to recipe
   */
  addRecipeIngredient: async (
    ingredient: RecipeIngredientInsert
  ): Promise<RecipeIngredient> => {
    const { data, error } = await supabase
      .from('recipe_ingredients')
      .insert(ingredient)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update recipe ingredient
   */
  updateRecipeIngredient: async (
    ingredientId: string,
    updates: Partial<Omit<RecipeIngredient, 'id' | 'created_at' | 'organization_id'>>
  ): Promise<RecipeIngredient> => {
    const { data, error } = await supabase
      .from('recipe_ingredients')
      .update(updates)
      .eq('id', ingredientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove ingredient from recipe
   */
  removeRecipeIngredient: async (ingredientId: string): Promise<void> => {
    const { error } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('id', ingredientId);

    if (error) throw error;
  },

  // ========== Branch-Specific Overrides ==========

  /**
   * Get menu items for a specific branch (with overrides)
   */
  getMenuItemsForBranch: async (
    organizationId: string,
    branchId: string
  ): Promise<MenuItem[]> => {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        overrides:menu_item_branch_overrides!left(
          is_available,
          price_override
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or(`branch_id.eq.${branchId}`, { foreignTable: 'menu_item_branch_overrides' });

    if (error) throw error;
    return data || [];
  },

  /**
   * Set branch-specific menu item override
   */
  setBranchOverride: async (
    menuItemId: string,
    branchId: string,
    organizationId: string,
    isAvailable?: boolean,
    priceOverride?: number
  ) => {
    const { data, error } = await supabase
      .from('menu_item_branch_overrides')
      .upsert({
        menu_item_id: menuItemId,
        branch_id: branchId,
        organization_id: organizationId,
        is_available: isAvailable ?? null,
        price_override: priceOverride ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
