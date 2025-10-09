import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ordersService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export interface OrderWithItems extends Order {
  items?: OrderItem[];
}

interface UseRealtimeOrdersReturn {
  orders: OrderWithItems[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useRealtimeOrders = (statusFilter?: string[]): UseRealtimeOrdersReturn => {
  const { currentOrganization, currentBranch } = useOrganization();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!currentOrganization?.id || !currentBranch?.id) return;

    try {
      setLoading(true);
      setError(null);

      const liveOrders = await ordersService.getLiveOrders(
        currentOrganization.id,
        currentBranch.id
      );
      
      // Apply status filter if provided
      const filteredOrders = statusFilter && statusFilter.length > 0
        ? liveOrders.filter(order => statusFilter.includes(order.status))
        : liveOrders;
      
      setOrders(filteredOrders);
    } catch (err) {
      console.error('Error fetching live orders:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, currentBranch?.id, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentBranch?.id) return;

    const subscription = ordersService.subscribeToOrders(
      currentBranch.id,
      () => {
        // Refetch orders when changes detected
        fetchOrders();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [currentBranch?.id, fetchOrders]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
  };
};
