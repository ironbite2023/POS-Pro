# Task 1.5: Sales & Reporting Integration

**Task ID**: TASK-01-005  
**Phase**: 1 - Frontend Integration  
**Priority**: 🔴 P0 - Critical  
**Estimated Time**: 3-4 days  
**Complexity**: 🟡 Medium  
**Status**: 📋 Not Started

---

## 1. Detailed Request Analysis

### What is Being Requested

Replace mock sales data with real Supabase API calls, implementing:
- Live orders tracking with real-time status updates
- Order history with advanced filtering and search
- Sales analytics and reporting dashboards
- Export functionality for reports (PDF, Excel)
- Revenue tracking and trend analysis

### Current State
- Sales pages use mock data from `OrderHistoryData.ts` and `LiveOrdersData.ts`
- Static order displays with no real functionality
- No connection to actual order database
- No export capabilities
- No real sales metrics or analytics

### Target State
- Live sales data from Supabase database
- Real-time order status tracking
- Advanced order filtering and search capabilities
- Interactive sales charts and analytics
- Export functionality for various report formats
- Revenue tracking with trend analysis
- Integration with dashboard metrics

### Affected Files
```
src/app/(default)/sales/
├── live-orders/page.tsx
├── order-history/page.tsx
├── analytics/page.tsx
└── reports/page.tsx

src/components/sales/
├── LiveOrdersTable.tsx
├── OrderHistoryTable.tsx
├── SalesChart.tsx
├── RevenueMetrics.tsx
├── OrderFilters.tsx
└── ExportButtons.tsx

src/data/
├── LiveOrdersData.ts (to be replaced)
└── OrderHistoryData.ts (to be replaced)
```

---

## 2. Justification and Benefits

### Why This Task is Critical

**Business Value**:
- ✅ Real-time visibility into current operations
- ✅ Historical sales data for business decisions
- ✅ Revenue tracking and trend analysis
- ✅ Performance metrics for staff and management
- ✅ Export capabilities for accounting and reporting

**Technical Benefits**:
- ✅ Validates advanced orderService queries
- ✅ Tests data aggregation and analytics
- ✅ Proves export functionality
- ✅ Establishes reporting patterns

**User Impact**:
- ✅ Managers can track real-time performance
- ✅ Staff can monitor order completion rates
- ✅ Financial reports for business analysis
- ✅ Data-driven insights for menu optimization

### Problems It Solves
1. **No Sales Visibility**: Currently can't see real sales data
2. **No Historical Analysis**: No way to analyze past performance
3. **Manual Reporting**: No automated report generation
4. **No Export Options**: Can't extract data for external use
5. **No Real-time Tracking**: Orders not tracked in real-time

---

## 3. Prerequisites

### Knowledge Requirements
- ✅ Data visualization with charts
- ✅ Advanced database queries and aggregations
- ✅ Export functionality (PDF, Excel)
- ✅ Date range handling and filtering
- ✅ Performance optimization for large datasets

### Technical Prerequisites
- ✅ Task 1.1 (Dashboard Integration) completed
- ✅ Task 1.4 (POS Operations) completed
- ✅ orderService with analytics methods implemented
- ✅ Database with order data for testing
- ✅ Real-time subscriptions working

### Environment Prerequisites
- ✅ Sample order data for testing
- ✅ Multiple date ranges of data
- ✅ Different order types and statuses
- ✅ Organization and branch context working

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "recharts": "^2.x",
  "date-fns": "^2.x",
  "jspdf": "^2.x",
  "xlsx": "^0.18.x",
  "react-datepicker": "^4.x"
}
```

---

## 4. Implementation Methodology

### Step 1: Create Sales Data Hooks (2-3 hours)

#### 1.1 Create `src/hooks/useSalesData.ts`

```typescript
import { useState, useEffect, useMemo } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { orderService } from '@/lib/services';
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
    status = ['completed', 'preparing', 'ready']
  } = params;

  const fetchSalesData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      const ordersData = await orderService.getOrders({
        organizationId: currentOrganization.id,
        branchId: branchId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: status,
      });

      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [currentOrganization, branchId, startDate, endDate, status]);

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

    // Top selling items (would need additional query to order_items)
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
```

#### 1.2 Create `src/hooks/useOrderExport.ts`

```typescript
import { useState } from 'react';
import { orderService } from '@/lib/services';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface UseOrderExportReturn {
  exportToExcel: (orders: any[], filename?: string) => void;
  exportToPDF: (orders: any[], title?: string) => void;
  exporting: boolean;
  error: Error | null;
}

export const useOrderExport = (): UseOrderExportReturn => {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportToExcel = (orders: any[], filename?: string) => {
    try {
      setExporting(true);
      setError(null);

      // Prepare data for export
      const exportData = orders.map(order => ({
        'Order Number': order.order_number,
        'Date': format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
        'Customer': order.customer_name || 'Guest',
        'Type': order.order_type,
        'Status': order.status,
        'Payment Status': order.payment_status,
        'Payment Method': order.payment_method || '-',
        'Subtotal': order.subtotal,
        'Tax': order.tax_amount,
        'Total': order.total_amount,
        'Items Count': order.order_items?.length || 0,
        'Table': order.table_number || '-',
        'Phone': order.customer_phone || '-',
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');

      // Download file
      const defaultFilename = `orders-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, filename || defaultFilename);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError(err as Error);
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = (orders: any[], title?: string) => {
    try {
      setExporting(true);
      setError(null);

      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(title || 'Sales Report', 20, 20);
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 30);

      // Prepare table data
      const tableData = orders.map(order => [
        order.order_number,
        format(new Date(order.created_at), 'MM/dd HH:mm'),
        order.customer_name || 'Guest',
        order.order_type,
        order.status,
        `$${order.total_amount.toFixed(2)}`,
      ]);

      // Add table
      doc.autoTable({
        startY: 40,
        head: [['Order #', 'Date/Time', 'Customer', 'Type', 'Status', 'Total']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Add summary
      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.text(`Total Orders: ${totalOrders}`, 20, finalY);
      doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 20, finalY + 10);
      doc.text(`Average Order Value: $${avgOrderValue.toFixed(2)}`, 20, finalY + 20);

      // Download PDF
      const defaultFilename = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(defaultFilename);
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      setError(err as Error);
    } finally {
      setExporting(false);
    }
  };

  return { exportToExcel, exportToPDF, exporting, error };
};
```

**Success Criteria**:
- ✅ Hooks compile without errors
- ✅ Sales data fetching works correctly
- ✅ Export functionality operational
- ✅ Metrics calculations accurate

---

### Step 2: Create Sales Analytics Components (3-4 hours)

#### 2.1 Create `src/components/sales/SalesChart.tsx`

```typescript
'use client';

import { 
  Card, 
  Heading, 
  Text, 
  Flex, 
  Box,
  Select 
} from '@radix-ui/themes';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useState } from 'react';

interface SalesChartProps {
  data: Array<{
    date?: string;
    hour?: string;
    revenue: number;
    orders: number;
  }>;
  title: string;
  type?: 'line' | 'bar';
  loading?: boolean;
}

export default function SalesChart({ 
  data, 
  title, 
  type = 'line', 
  loading = false 
}: SalesChartProps) {
  const [chartType, setChartType] = useState(type);

  if (loading) {
    return (
      <Card>
        <Box className="h-80 flex items-center justify-center">
          <Text color="gray">Loading chart data...</Text>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Flex justify="between" align="center" className="mb-4">
        <Heading size="4">{title}</Heading>
        <Select.Root value={chartType} onValueChange={(value) => setChartType(value as any)}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="line">Line Chart</Select.Item>
            <Select.Item value="bar">Bar Chart</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      <Box className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={data[0]?.date ? 'date' : 'hour'} 
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="revenue"
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#82ca9d" 
                strokeWidth={2}
                yAxisId="right"
                name="orders"
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={data[0]?.date ? 'date' : 'hour'} 
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Bar dataKey="revenue" fill="#8884d8" name="revenue" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}
```

#### 2.2 Create `src/components/sales/OrderFilters.tsx`

```typescript
'use client';

import { 
  Card, 
  Flex, 
  Text, 
  Select, 
  TextField,
  Button 
} from '@radix-ui/themes';
import { Search, Calendar, Filter } from 'lucide-react';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface OrderFiltersProps {
  onFilterChange: (filters: {
    search?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    orderType?: string;
    paymentMethod?: string;
  }) => void;
  loading?: boolean;
}

export default function OrderFilters({ onFilterChange, loading }: OrderFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endDate: new Date(),
    status: 'all',
    orderType: 'all',
    paymentMethod: 'all',
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      status: 'all',
      orderType: 'all',
      paymentMethod: 'all',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Text size="4" weight="medium">Filters</Text>
          <Button size="1" variant="soft" onClick={resetFilters}>
            Reset
          </Button>
        </Flex>

        <Flex gap="4" wrap="wrap">
          {/* Search */}
          <Box className="flex-1 min-w-64">
            <Text size="2" weight="medium" className="mb-1">Search</Text>
            <TextField.Root
              placeholder="Order number, customer name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            >
              <TextField.Slot>
                <Search size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          {/* Date Range */}
          <Box>
            <Text size="2" weight="medium" className="mb-1">Start Date</Text>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
              selectsStart
              startDate={filters.startDate}
              endDate={filters.endDate}
              className="radix-ui-input"
            />
          </Box>

          <Box>
            <Text size="2" weight="medium" className="mb-1">End Date</Text>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
              selectsEnd
              startDate={filters.startDate}
              endDate={filters.endDate}
              minDate={filters.startDate}
              className="radix-ui-input"
            />
          </Box>

          {/* Status Filter */}
          <Box>
            <Text size="2" weight="medium" className="mb-1">Status</Text>
            <Select.Root
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">All Statuses</Select.Item>
                <Select.Item value="pending">Pending</Select.Item>
                <Select.Item value="preparing">Preparing</Select.Item>
                <Select.Item value="ready">Ready</Select.Item>
                <Select.Item value="completed">Completed</Select.Item>
                <Select.Item value="cancelled">Cancelled</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Order Type Filter */}
          <Box>
            <Text size="2" weight="medium" className="mb-1">Order Type</Text>
            <Select.Root
              value={filters.orderType}
              onValueChange={(value) => handleFilterChange('orderType', value)}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">All Types</Select.Item>
                <Select.Item value="dine_in">Dine In</Select.Item>
                <Select.Item value="takeaway">Takeaway</Select.Item>
                <Select.Item value="delivery">Delivery</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>
        </Flex>
      </Flex>
    </Card>
  );
}
```

**Success Criteria**:
- ✅ Charts render correctly with real data
- ✅ Filters update data appropriately
- ✅ Export functions work without errors
- ✅ Date handling works properly

---

### Step 3: Create Sales Pages (2-3 hours)

#### 3.1 Update `src/app/(default)/sales/live-orders/page.tsx`

```typescript
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
  Grid,
  Select
} from '@radix-ui/themes';
import { RefreshCw, Download, Eye } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { orderService } from '@/lib/services';
import { useOrderExport } from '@/hooks/useOrderExport';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function LiveOrdersPage() {
  usePageTitle('Live Orders');
  const [statusFilter, setStatusFilter] = useState<string[]>(['pending', 'preparing', 'ready']);
  const { orders, loading } = useRealtimeOrders(statusFilter);
  const { exportToExcel, exportToPDF, exporting } = useOrderExport();

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
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

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Box>
            <Heading size="7">Live Orders</Heading>
            <Text size="2" color="gray">{orders.length} active orders</Text>
          </Box>
          
          <Flex gap="2">
            <Select.Root
              value={statusFilter.join(',')}
              onValueChange={(value) => setStatusFilter(value.split(',').filter(Boolean))}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="pending,preparing,ready">Active Orders</Select.Item>
                <Select.Item value="completed">Completed Only</Select.Item>
                <Select.Item value="cancelled">Cancelled Only</Select.Item>
                <Select.Item value="pending,preparing,ready,completed,cancelled">All Orders</Select.Item>
              </Select.Content>
            </Select.Root>

            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={exporting}
            >
              <Download size={16} />
              Export
            </Button>
          </Flex>
        </Flex>

        {/* Orders Table */}
        {loading ? (
          <Text>Loading live orders...</Text>
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
                          <Text size="1" color="gray">Table {order.table_number}</Text>
                        )}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="soft">{order.order_type}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{order.order_items?.length || 0} items</Text>
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
                        {order.status === 'pending' && (
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
```

#### 3.2 Update `src/app/(default)/sales/analytics/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Grid,
  Button,
  Text,
  Box,
  Select
} from '@radix-ui/themes';
import { Download, TrendingUp, DollarSign, ShoppingCart, Clock } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSalesData } from '@/hooks/useSalesData';
import { useOrderExport } from '@/hooks/useOrderExport';
import { useOrganization } from '@/contexts/OrganizationContext';
import StatsCard from '@/components/common/StatsCard';
import SalesChart from '@/components/sales/SalesChart';
import OrderFilters from '@/components/sales/OrderFilters';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export default function SalesAnalyticsPage() {
  usePageTitle('Sales Analytics');
  const { currentBranch } = useOrganization();
  const [dateRange, setDateRange] = useState('7d');
  const [filters, setFilters] = useState({
    startDate: startOfDay(subDays(new Date(), 7)),
    endDate: endOfDay(new Date()),
  });
  
  const { orders, metrics, loading } = useSalesData({
    startDate: filters.startDate,
    endDate: filters.endDate,
    branchId: currentBranch?.id,
  });
  
  const { exportToPDF, exporting } = useOrderExport();

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
        startDate = startOfDay(subDays(now, 7));
    }
    
    setFilters({
      startDate,
      endDate: endOfDay(now),
    });
  };

  const handleExportReport = () => {
    exportToPDF(orders, `Sales Analytics Report - ${currentBranch?.name || 'All Branches'}`);
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Box>
            <Heading size="7">Sales Analytics</Heading>
            {currentBranch && (
              <Text size="2" color="gray">{currentBranch.name}</Text>
            )}
          </Box>
          
          <Flex gap="2" align="center">
            <Select.Root value={dateRange} onValueChange={handleDateRangeChange}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="today">Today</Select.Item>
                <Select.Item value="7d">Last 7 Days</Select.Item>
                <Select.Item value="30d">Last 30 Days</Select.Item>
                <Select.Item value="90d">Last 90 Days</Select.Item>
              </Select.Content>
            </Select.Root>

            <Button 
              variant="outline" 
              onClick={handleExportReport}
              disabled={exporting}
            >
              <Download size={16} />
              Export Report
            </Button>
          </Flex>
        </Flex>

        {/* Metrics Cards */}
        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
          <StatsCard
            title="Total Revenue"
            value={`$${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<DollarSign />}
            loading={loading}
          />
          
          <StatsCard
            title="Total Orders"
            value={metrics.totalOrders.toString()}
            icon={<ShoppingCart />}
            loading={loading}
          />
          
          <StatsCard
            title="Average Order Value"
            value={`$${metrics.averageOrderValue.toFixed(2)}`}
            icon={<TrendingUp />}
            loading={loading}
          />
          
          <StatsCard
            title="Completion Rate"
            value={`${metrics.completionRate.toFixed(1)}%`}
            icon={<Clock />}
            loading={loading}
          />
        </Grid>

        {/* Charts */}
        <Grid columns={{ initial: '1', lg: '2' }} gap="6">
          <SalesChart
            data={metrics.revenueByDay}
            title="Daily Revenue Trend"
            type="line"
            loading={loading}
          />
          
          <SalesChart
            data={metrics.revenueByHour}
            title="Hourly Sales Pattern"
            type="bar"
            loading={loading}
          />
        </Grid>

        {/* Advanced Filters */}
        <OrderFilters
          onFilterChange={(newFilters) => {
            if (newFilters.startDate && newFilters.endDate) {
              setFilters({
                startDate: newFilters.startDate,
                endDate: newFilters.endDate,
              });
            }
          }}
          loading={loading}
        />
      </Flex>
    </Container>
  );
}
```

**Success Criteria**:
- ✅ Analytics page displays correctly
- ✅ Charts show real sales data
- ✅ Date range filters work
- ✅ Export functionality operational

---

### Step 4: Testing and Validation (1-2 hours)

#### 4.1 Manual Testing Checklist
```
Live Orders:
- [ ] Live orders page loads correctly
- [ ] Orders appear in real-time
- [ ] Status updates work immediately
- [ ] Filters apply correctly
- [ ] Export to Excel works
- [ ] Time display accurate

Order History:
- [ ] Historical orders load correctly
- [ ] Date range filters work
- [ ] Search functionality works
- [ ] Pagination works (if implemented)
- [ ] Export to PDF works

Analytics:
- [ ] Metrics calculate correctly
- [ ] Charts display real data
- [ ] Date range changes update charts
- [ ] Revenue calculations accurate
- [ ] Completion rates correct

Export:
- [ ] Excel export includes all data
- [ ] PDF export formatted correctly
- [ ] Exported data matches display
- [ ] File downloads successfully
```

---

## 5. Success Criteria

### Functional Requirements
- ✅ **Live Orders**: Real-time order tracking working
- ✅ **Order History**: Complete order search and filtering
- ✅ **Analytics**: Accurate sales metrics and charts
- ✅ **Export**: Excel and PDF generation functional
- ✅ **Real-time Updates**: Orders update automatically

### Technical Requirements
- ✅ **No Mock Data**: All imports from `data/` folder removed
- ✅ **Performance**: Charts and tables load quickly
- ✅ **Type Safety**: Proper TypeScript types throughout
- ✅ **Error Handling**: Graceful error recovery

### Business Requirements
- ✅ **Accurate Metrics**: Revenue and order calculations correct
- ✅ **Export Quality**: Professional report formatting
- ✅ **Real-time Visibility**: Current operations visible
- ✅ **Historical Analysis**: Past performance accessible

---

## 6. Deliverables

### Code Files
```
✅ src/hooks/useSalesData.ts (new)
✅ src/hooks/useOrderExport.ts (new)
✅ src/components/sales/SalesChart.tsx (new)
✅ src/components/sales/OrderFilters.tsx (new)
✅ src/app/(default)/sales/live-orders/page.tsx (updated)
✅ src/app/(default)/sales/order-history/page.tsx (updated)
✅ src/app/(default)/sales/analytics/page.tsx (updated)
```

---

## 7. Rollback Plan

If integration fails:
1. Restore mock sales data temporarily
2. Keep existing UI using mock data
3. Debug orderService analytics queries separately
4. Test export functionality in isolation
5. Fix issues incrementally

---

## 8. Next Steps After Completion

1. **Advanced Analytics**: Add more sophisticated metrics
2. **Real-time Notifications**: Add alerts for order milestones
3. **Performance Optimization**: Add caching for heavy queries
4. **Move to Next Task**: Loyalty Program Integration (Task 1.6)

---

**Status**: 📋 Ready to Start  
**Dependencies**: Task 1.1 (Dashboard), Task 1.4 (POS Operations), orderService  
**Blocked By**: Task 1.4 must be completed first  
**Blocks**: Advanced reporting features
