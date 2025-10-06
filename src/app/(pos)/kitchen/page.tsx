'use client';

import { useState } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Grid,
  Card,
  Button,
  Text,
  Badge,
  Box,
  Spinner
} from '@radix-ui/themes';
import { Clock, CheckCircle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { ordersService } from '@/lib/services';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function KitchenDisplayPage() {
  usePageTitle('Kitchen Display');
  const { orders, loading } = useRealtimeOrders(['new', 'confirmed', 'preparing']);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const handleStatusUpdate = async (orderId: string, newStatus: 'confirmed' | 'preparing' | 'ready') => {
    try {
      setUpdatingOrder(orderId);
      await ordersService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getOrderPriority = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const minutesAgo = (now.getTime() - createdDate.getTime()) / (1000 * 60);
    
    if (minutesAgo > 20) return 'high';
    if (minutesAgo > 10) return 'medium';
    return 'normal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      default: return 'green';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'blue';
      case 'confirmed': return 'yellow';
      case 'preparing': return 'orange';
      case 'ready': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Box className="min-h-screen bg-gray-100 p-4">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Header */}
          <Flex justify="between" align="center">
            <Heading size="8">Kitchen Display</Heading>
            <Text size="3" color="gray">
              {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
            </Text>
          </Flex>

          {/* Orders Grid */}
          {loading ? (
            <Flex justify="center" align="center" className="h-64">
              <Spinner size="3" />
            </Flex>
          ) : orders.length === 0 ? (
            <Box className="text-center py-12">
              <CheckCircle size={64} color="green" className="mx-auto mb-4" />
              <Heading size="5" className="mb-2">All Caught Up!</Heading>
              <Text size="3" color="gray">No pending orders</Text>
            </Box>
          ) : (
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
              {orders.map(order => {
                const priority = getOrderPriority(order.created_at);
                const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });

                return (
                  <Card 
                    key={order.id}
                    className={`${priority === 'high' ? 'border-red-500 border-2' : ''}`}
                  >
                    <Flex direction="column" gap="3">
                      {/* Order Header */}
                      <Flex justify="between" align="center">
                        <Box>
                          <Text size="4" weight="bold">#{order.order_number}</Text>
                          <Text size="2" color="gray">{order.customer_name || 'Guest'}</Text>
                        </Box>
                        
                        <Box className="text-right">
                          <Badge color={getPriorityColor(priority)}>
                            {priority === 'high' ? 'URGENT' : priority.toUpperCase()}
                          </Badge>
                          <Text size="1" color="gray" className="block mt-1">
                            {timeAgo}
                          </Text>
                        </Box>
                      </Flex>

                      {/* Order Type & Status */}
                      <Flex gap="2">
                        <Badge>{order.order_type}</Badge>
                        <Badge color={getStatusColor(order.status)}>{order.status}</Badge>
                      </Flex>

                      {/* Order Items */}
                      <Box>
                        {order.items?.map((item, index) => (
                          <Flex key={index} justify="between" className="py-1">
                            <Box className="flex-1">
                              <Text weight="medium">
                                {item.quantity}x {item.item_name}
                              </Text>
                              {item.special_instructions && (
                                <Text size="1" color="blue" className="block">
                                  Note: {item.special_instructions}
                                </Text>
                              )}
                            </Box>
                          </Flex>
                        ))}
                      </Box>

                      {/* Order Actions */}
                      <Flex gap="2">
                        {order.status === 'new' && (
                          <Button
                            className="flex-1"
                            onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                            disabled={updatingOrder === order.id}
                          >
                            <Clock size={16} />
                            Confirm Order
                          </Button>
                        )}

                        {order.status === 'confirmed' && (
                          <Button
                            className="flex-1"
                            color="orange"
                            onClick={() => handleStatusUpdate(order.id, 'preparing')}
                            disabled={updatingOrder === order.id}
                          >
                            Start Cooking
                          </Button>
                        )}

                        {order.status === 'preparing' && (
                          <Button
                            className="flex-1"
                            color="green"
                            onClick={() => handleStatusUpdate(order.id, 'ready')}
                            disabled={updatingOrder === order.id}
                          >
                            <CheckCircle size={16} />
                            Mark Ready
                          </Button>
                        )}
                      </Flex>

                      {/* Order Info */}
                      <Box className="text-sm text-gray-600 border-t pt-2">
                        <Flex justify="between">
                          <span>Total: ${order.total_amount.toFixed(2)}</span>
                          {order.table_number && (
                            <span>Table: {order.table_number}</span>
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  </Card>
                );
              })}
            </Grid>
          )}
        </Flex>
      </Container>
    </Box>
  );
} 