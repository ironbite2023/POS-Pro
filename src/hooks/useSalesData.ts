import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ordersService } from '@/lib/services';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import type { Database } from '@/lib/supabase/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completionRate: number;
  topSellingItems: Array<{
    menu_item_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  revenueByHour: Array<{
    hour: string;
    revenue: number;
    orders: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

interface UseSalesDataReturn {
  orders: Order[];
  metrics: SalesMetrics;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface SalesDataParams {
  startDate?: Date;
  endDate?: Date;
  branchId?: string;
  status?: string[];
}

export const useSalesData = (params: SalesDataParams = {}): UseSalesDataReturn => {
  const { currentOrganization, currentBranch } = useOrganization();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    startDate = startOfDay(new Date()),
    endDate = endOfDay(new Date()),
    branchId = currentBranch?.id,
  } = params;

  const fetchSalesData = useCallback(async () => {
    if (!currentOrganization?.id || !currentBranch?.id) return;

    try {
      setLoading(true);
      setError(null);

      const ordersData = await ordersService.getOrders(
        currentOrganization.id,
        currentBranch.id,
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }
      );

      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, currentBranch?.id, startDate, endDate]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  // Calculate metrics
  const metrics = useMemo((): SalesMetrics => {
    const completedOrders = orders.filter(order => order.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = orders.length;
    const completedOrdersCount = completedOrders.length;
    
    // Group orders by hour for hourly revenue
    const revenueByHour = Array.from({ length: 24 }, (_, hour) => {
      const hourOrders = completedOrders.filter(order => {
        const orderHour = new Date(order.created_at).getHours();
        return orderHour === hour;
      });
      
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        revenue: hourOrders.reduce((sum, order) => sum + order.total_amount, 0),
        orders: hourOrders.length,
      };
    });

    // Group orders by day for daily revenue (last 7 days)
    const revenueByDay = Array.from({ length: 7 }, (_, dayOffset) => {
      const date = subDays(new Date(), dayOffset);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayOrders = completedOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });
      
      return {
        date: format(date, 'MMM dd'),
        revenue: dayOrders.reduce((sum, order) => sum + order.total_amount, 0),
        orders: dayOrders.length,
      };
    }).reverse();

    // Top selling items placeholder (would need additional query to order_items)
    const topSellingItems: SalesMetrics['topSellingItems'] = [];

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0,
      completionRate: totalOrders > 0 ? (completedOrdersCount / totalOrders) * 100 : 0,
      topSellingItems,
      revenueByHour,
      revenueByDay,
    };
  }, [orders]);

  return {
    orders,
    metrics,
    loading,
    error,
    refetch: fetchSalesData,
  };
};
