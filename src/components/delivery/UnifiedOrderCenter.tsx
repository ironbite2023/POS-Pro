'use client';

import { useState, useCallback, useEffect } from 'react';
import { Flex, Text, Box, Select, TextField, Grid, Badge } from '@radix-ui/themes';
import { Search, Filter } from 'lucide-react';
import DeliveryOrderCard from './DeliveryOrderCard';
import PlatformStatusIndicator from './PlatformStatusIndicator';
import { deliveryPlatformService } from '@/lib/services/delivery-platform.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type PlatformEnum = Database['public']['Enums']['platform_enum'];
type PlatformIntegration = Database['public']['Tables']['platform_integrations']['Row'];

interface UnifiedOrderCenterProps {
  branchId?: string;
}

const UnifiedOrderCenter: React.FC<UnifiedOrderCenterProps> = ({ branchId }) => {
  const { currentOrganization } = useOrganization();
  const [orders, setOrders] = useState<Order[]>([]);
  const [platforms, setPlatforms] = useState<PlatformIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [filters, setFilters] = useState({
    platform: 'all' as PlatformEnum | 'all',
    status: 'active' as string,
    search: '',
  });

  const loadPlatforms = useCallback(async () => {
    if (!currentOrganization?.id) return;

    const result = await deliveryPlatformService.getActivePlatforms(currentOrganization.id);
    if (result.success && result.data) {
      setPlatforms(result.data);
    }
  }, [currentOrganization?.id]);

  const loadOrders = useCallback(async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      // For active orders, we'll fetch all and filter in memory
      // since the service method doesn't support multiple status values
      const statusFilter = filters.status === 'active' || filters.status === 'all'
        ? undefined
        : filters.status;

      const result = await deliveryPlatformService.getDeliveryOrders(
        currentOrganization.id,
        {
          branchId,
          platform: filters.platform !== 'all' ? filters.platform : undefined,
          status: statusFilter,
        }
      );

      if (result.success && result.data) {
        // Client-side filtering for active orders
        const filteredOrders = filters.status === 'active'
          ? result.data.filter(o => ['new', 'confirmed', 'preparing', 'ready'].includes(o.status))
          : result.data;
        setOrders(filteredOrders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, branchId, filters]);

  useEffect(() => {
    loadPlatforms();
    loadOrders();
  }, [loadPlatforms, loadOrders]);

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const result = await deliveryPlatformService.updateOrderStatus(orderId, newStatus);
      if (result.success) {
        toast.success(`Order status updated to ${newStatus}`);
        loadOrders();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  }, [loadOrders]);

  const handleAcceptOrder = useCallback(async (orderId: string) => {
    setUpdating(true);
    try {
      const result = await deliveryPlatformService.acceptOrder(orderId);
      if (result.success) {
        toast.success('Order accepted successfully');
        loadOrders();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to accept order:', error);
      toast.error('Failed to accept order');
    } finally {
      setUpdating(false);
    }
  }, [loadOrders]);

  const handleRejectOrder = useCallback(async (orderId: string, reason: string) => {
    setUpdating(true);
    try {
      const result = await deliveryPlatformService.rejectOrder(orderId, reason);
      if (result.success) {
        toast.success('Order rejected successfully');
        loadOrders();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to reject order:', error);
      toast.error('Failed to reject order');
    } finally {
      setUpdating(false);
    }
  }, [loadOrders]);

  const handleViewDetails = useCallback((orderId: string) => {
    // Navigate to order details page
    window.location.href = `/sales/live-orders/${orderId}`;
  }, []);

  const filteredOrders = orders.filter(order => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        order.order_number.toLowerCase().includes(searchLower) ||
        order.customer_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getOrderCounts = () => {
    return {
      new: orders.filter(o => o.status === 'new').length,
      preparing: orders.filter(o => o.status === 'preparing' || o.status === 'confirmed').length,
      ready: orders.filter(o => o.status === 'ready').length,
      total: orders.length,
    };
  };

  const counts = getOrderCounts();

  return (
    <Flex direction="column" gap="4">
      {/* Platform Status Bar */}
      <Flex gap="2" wrap="wrap">
        {platforms.map(platform => (
          <PlatformStatusIndicator
            key={platform.id}
            platform={platform.platform}
            isActive={platform.is_active}
            lastSyncAt={platform.last_sync_at}
            size="2"
          />
        ))}
        {platforms.length === 0 && (
          <Text size="2" color="gray">
            No active platforms configured
          </Text>
        )}
      </Flex>

      {/* Order Counts */}
      <Flex gap="3" wrap="wrap">
        <Badge size="2" color="yellow">
          {counts.new} New
        </Badge>
        <Badge size="2" color="blue">
          {counts.preparing} Preparing
        </Badge>
        <Badge size="2" color="green">
          {counts.ready} Ready
        </Badge>
        <Badge size="2" variant="outline">
          {counts.total} Total
        </Badge>
      </Flex>

      {/* Filters */}
      <Flex gap="3" wrap="wrap">
        <Box className="flex-1 min-w-64">
          <TextField.Root
            placeholder="Search orders..."
            value={filters.search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        <Select.Root
          value={filters.platform}
          onValueChange={(value: string) =>
            setFilters(prev => ({ ...prev, platform: value as PlatformEnum | 'all' }))
          }
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="all">All Platforms</Select.Item>
            {platforms.map(platform => (
              <Select.Item key={platform.id} value={platform.platform}>
                {platform.platform.replace('_', ' ').toUpperCase()}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Select.Root
          value={filters.status}
          onValueChange={(value: string) => setFilters(prev => ({ ...prev, status: value }))}
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="active">Active Orders</Select.Item>
            <Select.Item value="new">New Only</Select.Item>
            <Select.Item value="preparing">Preparing Only</Select.Item>
            <Select.Item value="ready">Ready Only</Select.Item>
            <Select.Item value="all">All Orders</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      {/* Orders Grid */}
      {loading ? (
        <Box className="text-center py-12">
          <Text>Loading orders...</Text>
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Box className="text-center py-12">
          <Text size="3" color="gray">
            {filters.search
              ? 'No orders found matching your search'
              : 'No orders available'}
          </Text>
        </Box>
      ) : (
        <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
          {filteredOrders.map(order => (
            <DeliveryOrderCard
              key={order.id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
              onAcceptOrder={handleAcceptOrder}
              onRejectOrder={handleRejectOrder}
              onViewDetails={handleViewDetails}
              loading={updating}
            />
          ))}
        </Grid>
      )}
    </Flex>
  );
};

export default UnifiedOrderCenter;
