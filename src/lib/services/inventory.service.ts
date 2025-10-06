import { supabase } from '../supabase/client';
import type { Database } from '../supabase/database.types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
type BranchInventory = Database['public']['Tables']['branch_inventory']['Row'];
type BranchInventoryInsert = Database['public']['Tables']['branch_inventory']['Insert'];
type InventoryMovement = Database['public']['Tables']['inventory_movements']['Row'];
type InventoryMovementInsert = Database['public']['Tables']['inventory_movements']['Insert'];

export const inventoryService = {
  // ========== Inventory Items ==========

  /**
   * Get all inventory items for an organization
   */
  getItems: async (organizationId: string): Promise<InventoryItem[]> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get inventory item by ID
   */
  getItemById: async (itemId: string): Promise<InventoryItem | null> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create inventory item
   */
  createItem: async (item: InventoryItemInsert): Promise<InventoryItem> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update inventory item
   */
  updateItem: async (
    itemId: string,
    updates: Partial<Omit<InventoryItem, 'id' | 'created_at' | 'organization_id'>>
  ): Promise<InventoryItem> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ========== Branch Inventory ==========

  /**
   * Get branch inventory levels
   */
  getBranchInventory: async (branchId: string): Promise<BranchInventory[]> => {
    const { data, error } = await supabase
      .from('branch_inventory')
      .select(`
        *,
        inventory_item:inventory_items(*)
      `)
      .eq('branch_id', branchId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get specific item inventory for a branch
   */
  getBranchItemInventory: async (
    branchId: string,
    inventoryItemId: string
  ): Promise<BranchInventory | null> => {
    const { data, error } = await supabase
      .from('branch_inventory')
      .select('*')
      .eq('branch_id', branchId)
      .eq('inventory_item_id', inventoryItemId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Update branch inventory levels
   */
  updateBranchInventory: async (
    branchId: string,
    inventoryItemId: string,
    updates: Partial<BranchInventory>
  ): Promise<BranchInventory> => {
    const { data, error } = await supabase
      .from('branch_inventory')
      .upsert({
        branch_id: branchId,
        inventory_item_id: inventoryItemId,
        organization_id: updates.organization_id!,
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ========== Inventory Movements ==========

  /**
   * Record inventory movement
   */
  recordMovement: async (
    movement: InventoryMovementInsert
  ): Promise<InventoryMovement> => {
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert(movement)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get inventory movements for an item
   */
  getItemMovements: async (
    inventoryItemId: string,
    branchId?: string,
    limit = 50
  ): Promise<InventoryMovement[]> => {
    let query = supabase
      .from('inventory_movements')
      .select('*')
      .eq('inventory_item_id', inventoryItemId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Adjust inventory (add/remove stock)
   */
  adjustInventory: async (
    branchId: string,
    inventoryItemId: string,
    organizationId: string,
    quantity: number,
    movementType: string,
    userId?: string,
    notes?: string
  ): Promise<{ inventory: BranchInventory; movement: InventoryMovement }> => {
    // Get current inventory
    const currentInventory = await inventoryService.getBranchItemInventory(
      branchId,
      inventoryItemId
    );

    const newQuantity = (currentInventory?.current_quantity || 0) + quantity;

    // Update branch inventory
    const inventory = await inventoryService.updateBranchInventory(
      branchId,
      inventoryItemId,
      {
        organization_id: organizationId,
        current_quantity: newQuantity,
        last_counted_at: new Date().toISOString(),
      }
    );

    // Record movement
    const movement = await inventoryService.recordMovement({
      branch_id: branchId,
      inventory_item_id: inventoryItemId,
      organization_id: organizationId,
      quantity,
      movement_type: movementType,
      user_id: userId || null,
      notes: notes || null,
    });

    return { inventory, movement };
  },

  /**
   * Get low stock items for a branch
   */
  getLowStockItems: async (branchId: string): Promise<BranchInventory[]> => {
    const { data, error } = await supabase
      .from('branch_inventory')
      .select(`
        *,
        inventory_item:inventory_items(*)
      `)
      .eq('branch_id', branchId)
      .filter('current_quantity', 'lte', 'reorder_point');

    if (error) throw error;
    return data || [];
  },
};
