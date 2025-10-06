'use client';

import { useEffect, useState, useCallback } from 'react';
import { Table, Badge, Skeleton, Text, Box } from '@radix-ui/themes';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ordersService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

interface RecentOrdersProps {
  limit?: number;
}

const RecentOrders: React.FC<RecentOrdersProps> = ({ limit = 5 }) => {
  const { currentOrganization, currentBranch } = useOrganization();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!currentOrganization || !currentBranch) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedOrders = await ordersService.getOrders(currentBranch.id, {
        limit,
      });
      setOrders(fetchedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, currentBranch, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusColor = (status: string): "green" | "yellow" | "blue" | "red" | "gray" => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'yellow';
      case 'new': return 'blue';
      case 'confirmed': return 'blue';
      case 'preparing': return 'blue';
      case 'ready': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Box>
        {[...Array(limit)].map((_, i) => (
          <Skeleton key={i} height="60px" className="mb-2" />
        ))}
      </Box>
    );
  }

  if (error) {
    return <Text color="red">Error loading orders: {error.message}</Text>;
  }

  if (orders.length === 0) {
    return (
      <Box className="text-center py-8">
        <Text color="gray">No recent orders</Text>
      </Box>
    );
  }

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Order #</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Customer</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {orders.map((order) => (
          <Table.Row key={order.id}>
            <Table.Cell>{order.order_number}</Table.Cell>
            <Table.Cell>{order.customer_name || 'Guest'}</Table.Cell>
            <Table.Cell>${order.total_amount.toFixed(2)}</Table.Cell>
            <Table.Cell>
              <Badge color={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              {new Date(order.created_at).toLocaleTimeString()}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default RecentOrders;
