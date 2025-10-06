import { supabase } from '../supabase/client';
import type { Database } from '../supabase/database.types';

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];
type PurchaseOrderInsert = Database['public']['Tables']['purchase_orders']['Insert'];
type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row'];
type PurchaseOrderItemInsert = Database['public']['Tables']['purchase_order_items']['Insert'];
type Supplier = Database['public']['Tables']['suppliers']['Row'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];

export interface CreatePurchaseOrderParams {
  branchId: string;
  organizationId: string;
  supplierId: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  createdBy?: string;
  items: Array<{
    inventoryItemId: string;
    quantityOrdered: number;
    unitCost: number;
  }>;
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items?: PurchaseOrderItem[];
  supplier?: Supplier;
}

export const purchasingService = {
  // ========== Suppliers ==========

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
   * Create supplier
   */
  createSupplier: async (supplier: SupplierInsert): Promise<Supplier> => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update supplier
   */
  updateSupplier: async (
    supplierId: string,
    updates: Partial<Omit<Supplier, 'id' | 'created_at' | 'organization_id'>>
  ): Promise<Supplier> => {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', supplierId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ========== Purchase Orders ==========

  /**
   * Get all purchase orders for a branch
   */
  getPurchaseOrders: async (
    branchId: string,
    filters?: {
      status?: string;
      supplierId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<PurchaseOrderWithItems[]> => {
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        items:purchase_order_items(*),
        supplier:suppliers(*)
      `)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.supplierId) {
      query = query.eq('supplier_id', filters.supplierId);
    }

    if (filters?.startDate) {
      query = query.gte('order_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('order_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get purchase order by ID
   */
  getPurchaseOrderById: async (
    purchaseOrderId: string
  ): Promise<PurchaseOrderWithItems | null> => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        items:purchase_order_items(*),
        supplier:suppliers(*)
      `)
      .eq('id', purchaseOrderId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create purchase order with items
   */
  createPurchaseOrder: async (
    params: CreatePurchaseOrderParams
  ): Promise<PurchaseOrderWithItems> => {
    // Calculate total
    const totalAmount = params.items.reduce(
      (sum, item) => sum + item.quantityOrdered * item.unitCost,
      0
    );

    // Generate PO number
    const { data: poNumberData } = await supabase.rpc('generate_po_number', {
      org_id: params.organizationId,
    });

    // Create purchase order
    const poData: PurchaseOrderInsert = {
      branch_id: params.branchId,
      organization_id: params.organizationId,
      supplier_id: params.supplierId,
      po_number: poNumberData || `PO-${Date.now()}`,
      order_date: params.orderDate || new Date().toISOString(),
      expected_delivery_date: params.expectedDeliveryDate || null,
      notes: params.notes || null,
      status: 'pending',
      total_amount: totalAmount,
      created_by: params.createdBy || null,
    };

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert(poData)
      .select()
      .single();

    if (poError) throw poError;

    // Create PO items
    const poItems: PurchaseOrderItemInsert[] = params.items.map((item) => ({
      purchase_order_id: po.id,
      organization_id: params.organizationId,
      inventory_item_id: item.inventoryItemId,
      quantity_ordered: item.quantityOrdered,
      unit_cost: item.unitCost,
      line_total: item.quantityOrdered * item.unitCost,
    }));

    const { data: items, error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(poItems)
      .select();

    if (itemsError) throw itemsError;

    return {
      ...po,
      items: items || [],
    };
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
      .update({ status })
      .eq('id', purchaseOrderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Receive purchase order items
   */
  receivePurchaseOrder: async (
    purchaseOrderId: string,
    receivedItems: Array<{
      itemId: string;
      quantityReceived: number;
    }>
  ): Promise<void> => {
    // Update received quantities for each item
    for (const item of receivedItems) {
      const { error } = await supabase
        .from('purchase_order_items')
        .update({ quantity_received: item.quantityReceived })
        .eq('id', item.itemId);

      if (error) throw error;
    }

    // Update PO status to received
    await purchasingService.updatePurchaseOrderStatus(purchaseOrderId, 'received');
  },

  /**
   * Cancel purchase order
   */
  cancelPurchaseOrder: async (purchaseOrderId: string): Promise<PurchaseOrder> => {
    return purchasingService.updatePurchaseOrderStatus(purchaseOrderId, 'cancelled');
  },
};
