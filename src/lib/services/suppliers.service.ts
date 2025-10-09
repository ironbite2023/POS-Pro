import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { PurchaseOrderWithItems } from './purchasing.service';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];
type PurchaseOrderInsert = Database['public']['Tables']['purchase_orders']['Insert'];
type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row'];
type PurchaseOrderItemInsert = Database['public']['Tables']['purchase_order_items']['Insert'];

// PurchaseOrderWithItems is imported from purchasing.service

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalPurchaseOrders: number;
  totalSpent: number;
}

export const suppliersService = {
  /**
   * Get all suppliers for an organization
   */
  getSuppliers: async (organizationId: string): Promise<Supplier[]> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get supplier by ID
   */
  getSupplierById: async (supplierId: string): Promise<Supplier | null> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Search suppliers by name or contact info
   */
  searchSuppliers: async (organizationId: string, searchTerm: string): Promise<Supplier[]> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new supplier
   */
  createSupplier: async (organizationId: string, supplier: Omit<SupplierInsert, 'organization_id'>): Promise<Supplier> => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        ...supplier,
        organization_id: organizationId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a supplier
   */
  updateSupplier: async (supplierId: string, updates: Partial<Supplier>): Promise<Supplier> => {
    const { data, error } = await supabase
      .from('suppliers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', supplierId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a supplier (soft delete)
   */
  deleteSupplier: async (supplierId: string): Promise<void> => {
    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', supplierId);

    if (error) throw error;
  },

  /**
   * Get purchase orders for an organization
   */
  getPurchaseOrders: async (organizationId: string, branchId?: string): Promise<PurchaseOrderWithItems[]> => {
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get purchase order by ID
   */
  getPurchaseOrderById: async (purchaseOrderId: string): Promise<PurchaseOrderWithItems | null> => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(
          *,
          inventory_item:inventory_items(name, sku)
        )
      `)
      .eq('id', purchaseOrderId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new purchase order
   */
  createPurchaseOrder: async (
    organizationId: string,
    purchaseOrder: Omit<PurchaseOrderInsert, 'organization_id' | 'po_number'>,
    items: Omit<PurchaseOrderItemInsert, 'organization_id' | 'purchase_order_id'>[]
  ): Promise<PurchaseOrderWithItems> => {
    // Generate PO number
    const poNumber = `PO${Date.now()}`;

    // Create purchase order
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        ...purchaseOrder,
        organization_id: organizationId,
        po_number: poNumber
      })
      .select()
      .single();

    if (poError) throw poError;

    // Create purchase order items
    if (items.length > 0) {
      const poItems = items.map(item => ({
        ...item,
        organization_id: organizationId,
        purchase_order_id: po.id
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems)
        .select();

      if (itemsError) throw itemsError;

      // Calculate total amount
      const totalAmount = createdItems.reduce((sum, item) => sum + item.line_total, 0);

      // Update PO with total amount
      await supabase
        .from('purchase_orders')
        .update({ total_amount: totalAmount })
        .eq('id', po.id);

      return { ...po, items: createdItems };
    }

    return po;
  },

  /**
   * Update purchase order status
   */
  updatePurchaseOrderStatus: async (
    purchaseOrderId: string,
    status: string
  ): Promise<PurchaseOrder> => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseOrderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Add item to purchase order
   */
  addPurchaseOrderItem: async (
    organizationId: string,
    purchaseOrderId: string,
    item: Omit<PurchaseOrderItemInsert, 'organization_id' | 'purchase_order_id'>
  ): Promise<PurchaseOrderItem> => {
    const { data, error } = await supabase
      .from('purchase_order_items')
      .insert({
        ...item,
        organization_id: organizationId,
        purchase_order_id: purchaseOrderId
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculate PO total
    await suppliersService.recalculatePurchaseOrderTotal(purchaseOrderId);

    return data;
  },

  /**
   * Update purchase order item
   */
  updatePurchaseOrderItem: async (
    itemId: string,
    updates: Partial<PurchaseOrderItem>
  ): Promise<PurchaseOrderItem> => {
    // Recalculate line total if quantity or unit cost changed
    if (updates.quantity_ordered || updates.unit_cost) {
      const { data: currentItem } = await supabase
        .from('purchase_order_items')
        .select('quantity_ordered, unit_cost')
        .eq('id', itemId)
        .single();

      if (currentItem) {
        const quantity = updates.quantity_ordered || currentItem.quantity_ordered;
        const unitCost = updates.unit_cost || currentItem.unit_cost;
        updates.line_total = quantity * unitCost;
      }
    }

    const { data, error } = await supabase
      .from('purchase_order_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    // Recalculate PO total
    const { data: item } = await supabase
      .from('purchase_order_items')
      .select('purchase_order_id')
      .eq('id', itemId)
      .single();

    if (item) {
      await suppliersService.recalculatePurchaseOrderTotal(item.purchase_order_id);
    }

    return data;
  },

  /**
   * Remove item from purchase order
   */
  removePurchaseOrderItem: async (itemId: string): Promise<void> => {
    // Get purchase order ID before deleting
    const { data: item } = await supabase
      .from('purchase_order_items')
      .select('purchase_order_id')
      .eq('id', itemId)
      .single();

    const { error } = await supabase
      .from('purchase_order_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    // Recalculate PO total
    if (item) {
      await suppliersService.recalculatePurchaseOrderTotal(item.purchase_order_id);
    }
  },

  /**
   * Recalculate purchase order total amount
   */
  recalculatePurchaseOrderTotal: async (purchaseOrderId: string): Promise<void> => {
    const { data: items } = await supabase
      .from('purchase_order_items')
      .select('line_total')
      .eq('purchase_order_id', purchaseOrderId);

    const totalAmount = items?.reduce((sum, item) => sum + item.line_total, 0) || 0;

    await supabase
      .from('purchase_orders')
      .update({ total_amount: totalAmount })
      .eq('id', purchaseOrderId);
  },

  /**
   * Get supplier statistics
   */
  getSupplierStats: async (organizationId: string): Promise<SupplierStats> => {
    // Get supplier counts
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('is_active')
      .eq('organization_id', organizationId);

    const totalSuppliers = suppliers?.length || 0;
    const activeSuppliers = suppliers?.filter(s => s.is_active).length || 0;

    // Get purchase order stats
    const { data: purchaseOrders } = await supabase
      .from('purchase_orders')
      .select('total_amount')
      .eq('organization_id', organizationId);

    const totalPurchaseOrders = purchaseOrders?.length || 0;
    const totalSpent = purchaseOrders?.reduce((sum, po) => sum + (po.total_amount || 0), 0) || 0;

    return {
      totalSuppliers,
      activeSuppliers,
      totalPurchaseOrders,
      totalSpent
    };
  },

  /**
   * Get purchase orders by status
   */
  getPurchaseOrdersByStatus: async (
    organizationId: string,
    status: string
  ): Promise<PurchaseOrderWithItems[]> => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(*)
      `)
      .eq('organization_id', organizationId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
