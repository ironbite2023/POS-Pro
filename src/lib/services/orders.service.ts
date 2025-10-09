import { supabase } from '../supabase/client';
import type { Database, Json } from '../supabase/database.types';
import { taxService } from './tax.service';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];
type OrderStatus = Database['public']['Enums']['order_status'];
type OrderType = Database['public']['Enums']['order_type'];
type PaymentStatus = Database['public']['Enums']['payment_status'];

export interface CreateOrderParams {
  branchId: string;
  organizationId: string;
  orderType: OrderType;
  items: Array<{
    menuItemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    modifiers?: Json;
    specialInstructions?: string;
  }>;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: Json;
  tableNumber?: string;
  specialInstructions?: string;
  deliveryNotes?: string;
  discountAmount?: number;
  tipAmount?: number;
  createdBy?: string;
}

export interface OrderWithItems extends Order {
  items?: OrderItem[];
}

export const ordersService = {
  /**
   * Create a new order with items - now with dynamic tax calculation
   */
  createOrder: async (params: CreateOrderParams): Promise<OrderWithItems> => {
    // Calculate subtotal
    const subtotal = params.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    
    // Get dynamic tax rate based on organization and branch
    const taxRate = await taxService.getTaxRate(
      params.organizationId, 
      params.branchId
    );
    const taxAmount = subtotal * taxRate;
    
    const totalAmount =
      subtotal + taxAmount + (params.tipAmount || 0) - (params.discountAmount || 0);

    // Generate order number
    const { data: orderNumberData } = await supabase.rpc('generate_order_number', {
      org_id: params.organizationId,
    });

    // Create order
    const orderData: OrderInsert = {
      branch_id: params.branchId,
      organization_id: params.organizationId,
      order_number: orderNumberData || `ORD-${Date.now()}`,
      order_type: params.orderType,
      subtotal,
      tax_amount: taxAmount,
      tip_amount: params.tipAmount || 0,
      discount_amount: params.discountAmount || 0,
      total_amount: totalAmount,
      customer_name: params.customerName || null,
      customer_email: params.customerEmail || null,
      customer_phone: params.customerPhone || null,
      customer_address: params.customerAddress || null,
      table_number: params.tableNumber || null,
      special_instructions: params.specialInstructions || null,
      delivery_notes: params.deliveryNotes || null,
      created_by: params.createdBy || null,
      status: 'new',
      payment_status: 'pending',
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems: OrderItemInsert[] = params.items.map((item) => ({
      order_id: order.id,
      organization_id: params.organizationId,
      menu_item_id: item.menuItemId,
      item_name: item.itemName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.quantity * item.unitPrice,
      modifiers: item.modifiers || null,
      special_instructions: item.specialInstructions || null,
    }));

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) throw itemsError;

    return {
      ...order,
      items: items || [],
    };
  },

  /**
   * Get order by ID with items
   */
  getOrderById: async (orderId: string): Promise<OrderWithItems | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get orders for an organization (single branch or multiple branches)
   */
  getOrders: async (
    organizationId: string,
    branchIds: string | string[],
    filters?: {
      status?: OrderStatus;
      orderType?: OrderType;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<Order[]> => {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Handle both single branch and multiple branches
    if (Array.isArray(branchIds)) {
      if (branchIds.length > 0) {
        query = query.in('branch_id', branchIds);
      }
    } else {
      query = query.eq('branch_id', branchIds);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.orderType) {
      query = query.eq('order_type', filters.orderType);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get live orders (new, confirmed, preparing) for organization or branch(es)
   */
  getLiveOrders: async (
    organizationId: string,
    branchIds: string | string[]
  ): Promise<OrderWithItems[]> => {
    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('organization_id', organizationId)
      .in('status', ['new', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    // Handle both single branch and multiple branches
    if (Array.isArray(branchIds)) {
      if (branchIds.length > 0) {
        query = query.in('branch_id', branchIds);
      }
    } else {
      query = query.eq('branch_id', branchIds);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (
    orderId: string,
    status: OrderStatus
  ): Promise<Order> => {
    const updates: Partial<Order> = { status };

    // Set timestamps based on status
    if (status === 'confirmed') {
      updates.confirmed_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update payment status
   */
  updatePaymentStatus: async (
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentMethod?: string,
    paymentReference?: string
  ): Promise<Order> => {
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        payment_method: paymentMethod || null,
        payment_reference: paymentReference || null,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cancel order
   */
  cancelOrder: async (orderId: string): Promise<Order> => {
    return ordersService.updateOrderStatus(orderId, 'cancelled');
  },

  /**
   * Get order statistics for organization or branch(es)
   */
  getOrderStats: async (
    organizationId: string,
    branchIds: string | string[],
    startDate: string,
    endDate: string
  ): Promise<{
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    ordersByType: Record<string, number>;
  }> => {
    let query = supabase
      .from('orders')
      .select('total_amount, order_type')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .neq('status', 'cancelled');

    // Handle both single branch and multiple branches
    if (Array.isArray(branchIds)) {
      if (branchIds.length > 0) {
        query = query.in('branch_id', branchIds);
      }
    } else {
      query = query.eq('branch_id', branchIds);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByType: Record<string, number> = {};
    orders?.forEach((order) => {
      ordersByType[order.order_type] = (ordersByType[order.order_type] || 0) + 1;
    });

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      ordersByType,
    };
  },

  /**
   * Subscribe to order changes (real-time) for a specific branch
   */
  subscribeToOrders: (
    branchId: string,
    callback: (payload: unknown) => void
  ) => {
    return supabase
      .channel(`orders:${branchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `branch_id=eq.${branchId}`,
        },
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe to order changes (real-time) for an organization
   */
  subscribeToOrganizationOrders: (
    organizationId: string,
    callback: (payload: unknown) => void
  ) => {
    return supabase
      .channel(`orders:org:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `organization_id=eq.${organizationId}`,
        },
        callback
      )
      .subscribe();
  },

  /**
   * Get top menu items for a period
   */
  getTopMenuItems: async (
    organizationId: string,
    startDate: string,
    endDate: string,
    limit = 10
  ) => {
    const { data, error } = await supabase.rpc('get_top_menu_items', {
      org_id: organizationId,
      start_date: startDate,
      end_date: endDate,
      item_limit: limit,
    });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get hourly order trends for a specific date range
   */
  getHourlyTrends: async (
    organizationId: string,
    branchIds: string | string[],
    startDate: string,
    endDate: string
  ): Promise<{ hour: string; orders: number }[]> => {
    let query = supabase
      .from('orders')
      .select('created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .neq('status', 'cancelled');

    // Handle both single branch and multiple branches
    if (Array.isArray(branchIds)) {
      if (branchIds.length > 0) {
        query = query.in('branch_id', branchIds);
      }
    } else {
      query = query.eq('branch_id', branchIds);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    // Group orders by hour
    const hourlyData: Record<number, number> = {};
    
    // Initialize all hours with 0
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }

    // Count orders per hour
    orders?.forEach((order) => {
      const date = new Date(order.created_at);
      const hour = date.getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    // Convert to array format with formatted hour labels
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`,
      orders: hourlyData[i] || 0,
    }));
  },
};
