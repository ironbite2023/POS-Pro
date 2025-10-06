'use client';

import { useState } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Button, 
  Table, 
  Badge,
  Text,
  Box,
  Select
} from '@radix-ui/themes';
import { Download, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { ordersService } from '@/lib/services';
import { useOrderExport } from '@/hooks/useOrderExport';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function LiveOrdersPage() {
  usePageTitle('Live Orders');
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string[]>(['new', 'confirmed', 'preparing', 'ready']);
  const { orders, loading } = useRealtimeOrders(statusFilter);
  const { exportToExcel, exporting } = useOrderExport();

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus as any);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status: string): 'yellow' | 'blue' | 'green' | 'gray' | 'red' => {
    switch (status) {
      case 'new':
      case 'pending': return 'yellow';
      case 'confirmed':
      case 'preparing': return 'blue';
      case 'ready': return 'green';
      case 'completed': return 'gray';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const handleExport = () => {
    exportToExcel(orders, 'live-orders.xlsx');
  };

  const handleFilterChange = (value: string) => {
    const filterMap: Record<string, string[]> = {
      'active': ['new', 'confirmed', 'preparing', 'ready'],
      'completed': ['completed'],
      'cancelled': ['cancelled'],
      'all': ['new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
    };
    setStatusFilter(filterMap[value] || filterMap['active']);
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Box>
            <Heading size="7">Live Orders</Heading>
            <Text size="2" color="gray">{orders.length} orders</Text>
          </Box>
          
          <Flex gap="2">
            <Select.Root
              value="active"
              onValueChange={handleFilterChange}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="active">Active Orders</Select.Item>
                <Select.Item value="completed">Completed Only</Select.Item>
                <Select.Item value="cancelled">Cancelled Only</Select.Item>
                <Select.Item value="all">All Orders</Select.Item>
              </Select.Content>
            </Select.Root>

            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={exporting || orders.length === 0}
            >
              <Download size={16} />
              Export
            </Button>
          </Flex>
        </Flex>

        {/* Orders Table */}
        {loading ? (
          <Box className="text-center py-12">
            <Text>Loading live orders...</Text>
          </Box>
        ) : orders.length === 0 ? (
          <Box className="text-center py-12">
            <Text size="3" color="gray">No orders found for selected filters</Text>
          </Box>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Order #</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Customer</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Items</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {orders.map(order => {
                const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });
                
                return (
                  <Table.Row key={order.id}>
                    <Table.Cell>
                      <Text weight="medium">{order.order_number}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Box>
                        <Text>{order.customer_name || 'Guest'}</Text>
                        {order.table_number && (
                          <Text size="1" color="gray" className="block">Table {order.table_number}</Text>
                        )}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="soft">{order.order_type}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{order.items?.length || 0} items</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text weight="medium">${order.total_amount.toFixed(2)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">{timeAgo}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="1">
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => router.push(`/sales/live-orders/${order.id}`)}
                        >
                          <Eye size={14} />
                          View
                        </Button>
                        
                        {order.status === 'new' && (
                          <Button
                            size="1"
                            onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          >
                            Start
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            size="1"
                            color="green"
                            onClick={() => handleStatusUpdate(order.id, 'ready')}
                          >
                            Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="1"
                            variant="outline"
                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        )}
      </Flex>
    </Container>
  );
}
