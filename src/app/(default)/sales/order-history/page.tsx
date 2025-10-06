'use client';

import { useState } from 'react';
import {
  Container,
  Flex,
  Heading,
  Button,
  Badge,
  TextField,
  Select,
  Table,
  Text,
  Box,
} from '@radix-ui/themes';
import { 
  Search,
  Download,
  Eye,
  RefreshCcw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSalesData } from '@/hooks/useSalesData';
import { useOrderExport } from '@/hooks/useOrderExport';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export default function OrderHistoryPage() {
  usePageTitle('Order History');
  const router = useRouter();
  const { currentBranch } = useOrganization();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState('30d');
  
  const [filters, setFilters] = useState({
    startDate: startOfDay(subDays(new Date(), 30)),
    endDate: endOfDay(new Date()),
  });
  
  const { orders, loading, refetch } = useSalesData({
    startDate: filters.startDate,
    endDate: filters.endDate,
    branchId: currentBranch?.id,
  });
  
  const { exportToExcel, exportToPDF, exporting } = useOrderExport();

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case '7d':
        startDate = startOfDay(subDays(now, 7));
        break;
      case '30d':
        startDate = startOfDay(subDays(now, 30));
        break;
      case '90d':
        startDate = startOfDay(subDays(now, 90));
        break;
      default:
        startDate = startOfDay(subDays(now, 30));
    }
    
    setFilters({
      startDate,
      endDate: endOfDay(now),
    });
  };

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        order.order_number.toLowerCase().includes(term) ||
        (order.customer_name?.toLowerCase() || '').includes(term);
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }
    
    // Type filter
    if (typeFilter !== 'all' && order.order_type !== typeFilter) {
      return false;
    }
    
    return true;
  });

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

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateRange('30d');
    setFilters({
      startDate: startOfDay(subDays(new Date(), 30)),
      endDate: endOfDay(new Date()),
    });
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Box>
            <Heading size="7">Order History</Heading>
            <Text size="2" color="gray">
              {filteredOrders.length} of {orders.length} orders
            </Text>
          </Box>
          
          <Flex gap="2">
            <Button 
              variant="soft" 
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => exportToExcel(filteredOrders)}
              disabled={exporting || filteredOrders.length === 0}
            >
              <Download size={16} />
              Excel
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => exportToPDF(filteredOrders, 'Order History Report')}
              disabled={exporting || filteredOrders.length === 0}
            >
              <Download size={16} />
              PDF
            </Button>
          </Flex>
        </Flex>

        {/* Filters */}
        <Flex gap="4" wrap="wrap" align="end">
          <Box className="flex-1 min-w-64">
            <Text size="2" weight="medium" className="mb-1 block">Search</Text>
            <TextField.Root
              placeholder="Order number or customer name..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            >
              <TextField.Slot>
                <Search size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          <Box>
            <Text size="2" weight="medium" className="mb-1 block">Date Range</Text>
            <Select.Root value={dateRange} onValueChange={handleDateRangeChange}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="today">Today</Select.Item>
                <Select.Item value="7d">Last 7 Days</Select.Item>
                <Select.Item value="30d">Last 30 Days</Select.Item>
                <Select.Item value="90d">Last 90 Days</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Box>
            <Text size="2" weight="medium" className="mb-1 block">Status</Text>
            <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">All Statuses</Select.Item>
                <Select.Item value="completed">Completed</Select.Item>
                <Select.Item value="cancelled">Cancelled</Select.Item>
                <Select.Item value="ready">Ready</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Box>
            <Text size="2" weight="medium" className="mb-1 block">Type</Text>
            <Select.Root value={typeFilter} onValueChange={setTypeFilter}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">All Types</Select.Item>
                <Select.Item value="dine_in">Dine In</Select.Item>
                <Select.Item value="takeaway">Takeaway</Select.Item>
                <Select.Item value="delivery">Delivery</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Button 
            variant="soft" 
            color="gray"
            onClick={handleResetFilters}
          >
            <RefreshCcw size={16} />
            Reset
          </Button>
        </Flex>

        {/* Orders Table */}
        {loading ? (
          <Box className="text-center py-12">
            <Text>Loading order history...</Text>
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Box className="text-center py-12">
            <Text size="3" color="gray">No orders found for selected filters</Text>
          </Box>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Order #</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Customer</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Items</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Payment</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredOrders.map(order => (
                <Table.Row key={order.id}>
                  <Table.Cell>
                    <Text weight="medium">{order.order_number}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{format(new Date(order.created_at), 'MMM dd, yyyy')}</Text>
                    <Text size="1" color="gray" className="block">
                      {format(new Date(order.created_at), 'HH:mm')}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Box>
                      <Text>{order.customer_name || 'Guest'}</Text>
                      {order.table_number && (
                        <Text size="1" color="gray" className="block">
                          Table {order.table_number}
                        </Text>
                      )}
                    </Box>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="soft">{order.order_type}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>{order.subtotal.toFixed(2)}</Text>
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
                    <Box>
                      <Badge 
                        color={order.payment_status === 'paid' ? 'green' : 'yellow'}
                        variant="soft"
                      >
                        {order.payment_status}
                      </Badge>
                      {order.payment_method && (
                        <Text size="1" color="gray" className="block mt-1">
                          {order.payment_method}
                        </Text>
                      )}
                    </Box>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="1"
                      variant="soft"
                      onClick={() => router.push(`/sales/order-history/${order.id}`)}
                    >
                      <Eye size={14} />
                      View
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}

        {/* Summary */}
        {!loading && filteredOrders.length > 0 && (
          <Flex justify="between" align="center" className="pt-4 border-t">
            <Text size="2" color="gray">
              Showing {filteredOrders.length} orders
            </Text>
            <Box>
              <Text size="2" weight="medium">
                Total Revenue: ${filteredOrders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}
              </Text>
            </Box>
          </Flex>
        )}
      </Flex>
    </Container>
  );
}
