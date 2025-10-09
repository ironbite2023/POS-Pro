import { supabase } from '../supabase/client';
import type { Database } from '../supabase/database.types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
type BranchInventory = Database['public']['Tables']['branch_inventory']['Row'];
type BranchInventoryInsert = Database['public']['Tables']['branch_inventory']['Insert'];
type InventoryMovement = Database['public']['Tables']['inventory_movements']['Row'];
type InventoryMovementInsert = Database['public']['Tables']['inventory_movements']['Insert'];

// Stock Request Types from Database
type StockRequestRow = Database['public']['Tables']['stock_requests']['Row'];
type StockRequestInsert = Database['public']['Tables']['stock_requests']['Insert'];
type StockRequestItemRow = Database['public']['Tables']['stock_request_items']['Row'];
type StockRequestItemInsert = Database['public']['Tables']['stock_request_items']['Insert'];

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
   * Get recent movements for a branch (OPTIMIZED - single query)
   */
  getRecentMovements: async (branchId: string, limit = 50): Promise<InventoryMovement[]> => {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory_item:inventory_items(name, sku)
      `)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })
      .limit(limit);

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
  getLowStockItems: async (branchId: string): Promise<Array<BranchInventory & {
    inventory_item?: InventoryItem;
  }>> => {
    const { data, error } = await supabase
      .from('branch_inventory')
      .select(`
        *,
        inventory_item:inventory_items(*)
      `)
      .eq('branch_id', branchId);

    if (error) throw error;
    
    // Filter in JavaScript since comparing columns in Supabase filter is complex
    return (data || []).filter(item => 
      item.current_quantity !== null && 
      item.reorder_point !== null && 
      Number(item.current_quantity) <= Number(item.reorder_point)
    );
  },

  /**
   * Get low stock items across multiple branches (organization-wide)
   */
  getLowStockItemsForOrganization: async (
    organizationId: string,
    branchIds: string[]
  ): Promise<Array<BranchInventory & {
    inventory_item?: InventoryItem;
  }>> => {
    if (branchIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('branch_inventory')
      .select(`
        *,
        inventory_item:inventory_items(*)
      `)
      .eq('organization_id', organizationId)
      .in('branch_id', branchIds);

    if (error) throw error;
    
    // Filter in JavaScript since comparing columns in Supabase filter is complex
    return (data || []).filter(item => 
      item.current_quantity !== null && 
      item.reorder_point !== null && 
      Number(item.current_quantity) <= Number(item.reorder_point)
    );
  },

  /**
   * Get expiring items for a branch (NEW - Phase 4 Implementation)
   */
  getExpiringItems: async (branchId: string, daysAhead = 7): Promise<Array<BranchInventory & {
    inventory_item?: InventoryItem;
  }>> => {
    const { data, error } = await supabase
      .from('branch_inventory')
      .select(`
        *,
        inventory_item:inventory_items(*)
      `)
      .eq('branch_id', branchId)
      .gte('current_quantity', 0)
      .not('last_restocked_at', 'is', null);

    if (error) throw error;

    if (!data) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    // Filter items that expire within the specified days
    return data.filter(item => {
      if (!item.inventory_item?.track_expiration || !item.last_restocked_at) {
        return false;
      }
      
      const shelfLifeDays = item.inventory_item.default_shelf_life_days;
      if (!shelfLifeDays) return false;

      const restockedDate = new Date(item.last_restocked_at);
      const expirationDate = new Date(restockedDate);
      expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);

      return expirationDate <= cutoffDate && expirationDate > new Date();
    });
  },

  /**
   * Get expiring items with detailed expiration info
   */
  getExpiringItemsWithDetails: async (branchId: string): Promise<Array<BranchInventory & {
    inventory_item?: InventoryItem;
    expirationDate?: Date;
    daysUntilExpiration?: number;
    urgencyLevel?: 'critical' | 'warning' | 'notice';
  }>> => {
    const expiringItems = await inventoryService.getExpiringItems(branchId, 14); // 2 weeks ahead
    
    return expiringItems.map(item => {
      if (!item.inventory_item?.track_expiration || !item.last_restocked_at) {
        return item;
      }

      const shelfLifeDays = item.inventory_item.default_shelf_life_days;
      if (!shelfLifeDays) return item;

      const restockedDate = new Date(item.last_restocked_at);
      const expirationDate = new Date(restockedDate);
      expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);

      const today = new Date();
      const timeDiff = expirationDate.getTime() - today.getTime();
      const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));

      let urgencyLevel: 'critical' | 'warning' | 'notice' = 'notice';
      if (daysUntilExpiration <= 1) urgencyLevel = 'critical';
      else if (daysUntilExpiration <= 3) urgencyLevel = 'warning';

      return {
        ...item,
        expirationDate,
        daysUntilExpiration,
        urgencyLevel
      };
    });
  },

  // ========== Stock Request System ==========

  /**
   * Generate next request number for organization
   */
  generateRequestNumber: async (organizationId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_stock_request_number', {
      org_id: organizationId
    });

    if (error) throw error;
    return data;
  },

  /**
   * Create stock request
   */
  createStockRequest: async (request: {
    organizationId: string;
    originBranchId: string;
    destinationBranchId: string;
    requestDate: string;
    requiredDate?: string;
    notes?: string;
    requestedBy: string;
    items: Array<{
      inventoryItemId: string;
      inventoryItemName: string;
      quantityRequested: number;
      unit: string;
      priority?: string;
      notes?: string;
    }>;
  }): Promise<StockRequestRow & { items: StockRequestItemRow[] }> => {
    // Generate request number
    const requestNumber = await inventoryService.generateRequestNumber(request.organizationId);

    // Create the stock request
    const { data: stockRequest, error: requestError } = await supabase
      .from('stock_requests')
      .insert({
        organization_id: request.organizationId,
        request_number: requestNumber,
        origin_branch_id: request.originBranchId,
        destination_branch_id: request.destinationBranchId,
        request_date: request.requestDate,
        required_date: request.requiredDate,
        notes: request.notes,
        total_items: request.items.length,
        requested_by: request.requestedBy,
        status: 'draft'
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Create stock request items
    const itemsToInsert = request.items.map(item => ({
      stock_request_id: stockRequest.id,
      inventory_item_id: item.inventoryItemId,
      inventory_item_name: item.inventoryItemName,
      quantity_requested: item.quantityRequested,
      unit: item.unit,
      priority: item.priority || 'medium',
      notes: item.notes
    }));

    const { data: stockRequestItems, error: itemsError } = await supabase
      .from('stock_request_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) throw itemsError;

    return { ...stockRequest, items: stockRequestItems };
  },

  /**
   * Get stock requests for a branch (either origin or destination)
   */
  getStockRequests: async (
    branchId: string,
    status?: string,
    limit = 50
  ): Promise<Array<StockRequestRow & { items: StockRequestItemRow[] }>> => {
    let query = supabase
      .from('stock_requests')
      .select(`
        *,
        origin_branch:branches!origin_branch_id(name, code),
        destination_branch:branches!destination_branch_id(name, code),
        requested_by_user:user_profiles!requested_by(first_name, last_name),
        approved_by_user:user_profiles!approved_by(first_name, last_name)
      `)
      .or(`origin_branch_id.eq.${branchId},destination_branch_id.eq.${branchId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: requests, error: requestsError } = await query;
    if (requestsError) throw requestsError;

    if (!requests || requests.length === 0) {
      return [];
    }

    // Get items for all requests
    const requestIds = requests.map(r => r.id);
    const { data: items, error: itemsError } = await supabase
      .from('stock_request_items')
      .select('*')
      .in('stock_request_id', requestIds)
      .order('created_at');

    if (itemsError) throw itemsError;

    // Group items by request ID
    const itemsByRequest = (items || []).reduce((acc, item) => {
      if (!acc[item.stock_request_id]) {
        acc[item.stock_request_id] = [];
      }
      acc[item.stock_request_id].push(item);
      return acc;
    }, {} as Record<string, StockRequestItemRow[]>);

    // Combine requests with their items
    return requests.map(request => ({
      ...request,
      items: itemsByRequest[request.id] || []
    }));
  },

  /**
   * Update stock request status
   */
  updateStockRequestStatus: async (
    requestId: string,
    status: string,
    approvedBy?: string
  ): Promise<StockRequestRow> => {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved' && approvedBy) {
      updates.approved_by = approvedBy;
      updates.approved_date = new Date().toISOString();
    }

    if (status === 'completed') {
      updates.completed_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('stock_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get stock request by ID with items
   */
  getStockRequestById: async (
    requestId: string
  ): Promise<(StockRequestRow & { items: StockRequestItemRow[] }) | null> => {
    const { data: request, error: requestError } = await supabase
      .from('stock_requests')
      .select(`
        *,
        origin_branch:branches!origin_branch_id(name, code),
        destination_branch:branches!destination_branch_id(name, code),
        requested_by_user:user_profiles!requested_by(first_name, last_name),
        approved_by_user:user_profiles!approved_by(first_name, last_name)
      `)
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;
    if (!request) return null;

    const { data: items, error: itemsError } = await supabase
      .from('stock_request_items')
      .select('*')
      .eq('stock_request_id', requestId)
      .order('created_at');

    if (itemsError) throw itemsError;

    return { ...request, items: items || [] };
  },
};
