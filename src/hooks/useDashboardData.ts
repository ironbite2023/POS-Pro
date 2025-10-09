import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ordersService, inventoryService } from '@/lib/services';
import { staffService, type StaffMember } from '@/lib/services/staff.service';

interface DashboardMetrics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: Array<{ name: string; quantity: number; revenue: number }>;
  lowStockItems: number;
  activeOrders: number;
  hourlyTrends: Array<{ hour: string; orders: number }>;
  staffOnDuty: StaffMember[];
  loading: boolean;
  error: Error | null;
}

export const useDashboardData = (timeRange: 'today' | 'week' | 'month' = 'today') => {
  const { currentOrganization, currentBranch, branches } = useOrganization();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItems: [],
    lowStockItems: 0,
    activeOrders: 0,
    hourlyTrends: [],
    staffOnDuty: [],
    loading: true,
    error: null,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!currentOrganization) {
      setMetrics(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setMetrics(prev => ({ ...prev, loading: true, error: null }));

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Determine branch IDs to query
      const branchIds = currentBranch 
        ? currentBranch.id // Single branch selected
        : branches.map(b => b.id); // All branches for HQ view

      // Validate we have branches to query
      if (!branchIds || (Array.isArray(branchIds) && branchIds.length === 0)) {
        console.warn('Dashboard: No branches available. Organization:', currentOrganization?.name, 'Branch count:', branches.length);
        setMetrics({
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          topSellingItems: [],
          lowStockItems: 0,
          activeOrders: 0,
          hourlyTrends: [],
          staffOnDuty: [],
          loading: false,
          error: null, // Don't show error, just show zero state
        });
        return;
      }

      // Fetch orders for the branch or organization
      const orders = await ordersService.getOrders(
        currentOrganization.id,
        branchIds,
        {
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        }
      );

      // Calculate metrics
      const totalSales = orders.reduce((sum, order) => {
        // Only count completed orders for sales metrics
        if (order.status !== 'cancelled') {
          return sum + order.total_amount;
        }
        return sum;
      }, 0);
      
      const totalOrders = orders.filter(order => order.status !== 'cancelled').length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Get active orders (new, confirmed, preparing, ready)
      const activeOrdersCount = orders.filter(
        order => ['new', 'confirmed', 'preparing', 'ready'].includes(order.status)
      ).length;

      // Get top selling items
      let topItems: Array<{ name: string; quantity: number; revenue: number }> = [];
      try {
        const rawTopItems = await ordersService.getTopMenuItems(
          currentOrganization.id,
          startDate.toISOString(),
          now.toISOString(),
          5
        );
        // Map the service response to expected format
        topItems = rawTopItems.map((item: { item_name: string; total_quantity: number; total_revenue: number }) => ({
          name: item.item_name,
          quantity: item.total_quantity,
          revenue: item.total_revenue,
        }));
      } catch (error) {
        console.error('Error fetching top menu items:', error);
        // Continue without top items if this fails
      }

      // Get low stock items
      let lowStockCount = 0;
      if (currentBranch) {
        // Single branch view
        try {
          const stockItems = await inventoryService.getLowStockItems(currentBranch.id);
          lowStockCount = stockItems.length;
        } catch (error) {
          console.error('Error fetching low stock items:', error);
          // Continue without low stock data if this fails
        }
      } else if (branches.length > 0) {
        // Organization-wide view
        try {
          const stockItems = await inventoryService.getLowStockItemsForOrganization(
            currentOrganization.id,
            branches.map(b => b.id)
          );
          lowStockCount = stockItems.length;
        } catch (error) {
          console.error('Error fetching organization-wide low stock items:', error);
          // Continue without low stock data if this fails
        }
      }

      // Get hourly trends
      let hourlyData: Array<{ hour: string; orders: number }> = [];
      try {
        hourlyData = await ordersService.getHourlyTrends(
          currentOrganization.id,
          branchIds,
          startDate.toISOString(),
          now.toISOString()
        );
      } catch (error) {
        console.error('Error fetching hourly trends:', error);
        // Continue without hourly trends if this fails
      }

      // Get staff on duty
      let staff: StaffMember[] = [];
      try {
        if (currentBranch) {
          // Single branch view
          staff = await staffService.getStaffByBranch(currentOrganization.id, currentBranch.id);
        } else if (branches.length > 0) {
          // Organization-wide view
          staff = await staffService.getStaffByOrganization(currentOrganization.id);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        // Continue without staff data if this fails
      }

      setMetrics({
        totalSales,
        totalOrders,
        averageOrderValue,
        topSellingItems: topItems,
        lowStockItems: lowStockCount,
        activeOrders: activeOrdersCount,
        hourlyTrends: hourlyData,
        staffOnDuty: staff,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  }, [currentOrganization, currentBranch, branches, timeRange]);

  useEffect(() => {
    fetchDashboardData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return metrics;
};
