# Task 1.1: Dashboard Integration

**Task ID**: TASK-01-001  
**Phase**: 1 - Frontend Integration  
**Priority**: 🔴 P0 - Critical  
**Estimated Time**: 3-5 days  
**Complexity**: 🟡 Medium  
**Status**: 📋 Not Started

---

## 1. Detailed Request Analysis

### What is Being Requested

Replace mock data in all dashboard pages with real Supabase API calls, implementing:
- HQ Dashboard with organization-wide metrics
- Branch Dashboard with branch-specific metrics
- Analytics Dashboard with advanced reporting

### Current State
- Dashboard uses mock data from `src/data/` files
- Static displays with no real-time updates
- No connection to actual database
- Mock organization context

### Target State
- Live data from Supabase database
- Real-time metric updates
- Branch-specific filtering
- Proper error handling and loading states
- Cached data for performance

### Affected Files
```
src/app/(default)/dashboard/
├── hq-dashboard/page.tsx
├── branch-dashboard/page.tsx
└── analytics-dashboard/page.tsx

src/components/common/
├── TopBar.tsx
├── RecentOrders.tsx
├── StatsCard.tsx
└── Various dashboard widgets

src/data/
├── BranchData.ts (to be replaced)
├── OrderHistoryData.ts (to be replaced)
├── MenuData.ts (to be replaced)
└── LiveOrdersData.ts (to be replaced)
```

---

## 2. Justification and Benefits

### Why This Task is Critical

**Business Value**:
- ✅ Real-time visibility into restaurant performance
- ✅ Data-driven decision making
- ✅ Multi-location management capability
- ✅ Accurate inventory and sales tracking

**Technical Benefits**:
- ✅ Establishes pattern for other integrations
- ✅ Validates backend services
- ✅ Tests authentication and authorization
- ✅ Proves multi-tenancy architecture

**User Impact**:
- ✅ Immediate access to accurate data
- ✅ Reliable reporting for management
- ✅ Foundation for all other features
- ✅ Professional, production-ready feel

### Problems It Solves
1. **Lack of Real Data**: Currently showing fake data
2. **No Multi-Tenant Support**: Can't distinguish between organizations
3. **Static Information**: No updates without page refresh
4. **Testing Limitations**: Can't validate backend functionality

---

## 3. Prerequisites

### Knowledge Requirements
- ✅ React hooks (useState, useEffect, useMemo)
- ✅ Next.js App Router patterns
- ✅ TypeScript interfaces and types
- ✅ Supabase client usage
- ✅ Error handling patterns
- ✅ Loading state management

### Technical Prerequisites
- ✅ Backend services implemented (`src/lib/services/`)
- ✅ Database schema deployed
- ✅ Authentication working
- ✅ OrganizationContext implemented
- ✅ Supabase client configured

### Environment Prerequisites
- ✅ `.env.local` configured with Supabase keys
- ✅ Test data in database (organizations, branches, orders)
- ✅ User authenticated with organization
- ✅ Development server running

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "react": "^18.x",
  "next": "^14.x",
  "@radix-ui/themes": "^2.x",
  "recharts": "^2.x" // for charts
}
```

---

## 4. Implementation Methodology

### Step 1: Create Custom Hooks (1-2 hours)

#### 1.1 Create `src/hooks/useDashboardData.ts`

```typescript
import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { orderService, inventoryService, menuService } from '@/lib/services';

interface DashboardMetrics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: Array<{ name: string; quantity: number }>;
  lowStockItems: number;
  activeOrders: number;
  loading: boolean;
  error: Error | null;
}

export const useDashboardData = (timeRange: 'today' | 'week' | 'month' = 'today') => {
  const { currentOrganization, currentBranch } = useOrganization();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItems: [],
    lowStockItems: 0,
    activeOrders: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!currentOrganization) return;

    const fetchDashboardData = async () => {
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

        // Fetch orders
        const orders = await orderService.getOrders({
          organizationId: currentOrganization.id,
          branchId: currentBranch?.id,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        });

        // Calculate metrics
        const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Get top selling items
        const topItems = await orderService.getTopMenuItems({
          organizationId: currentOrganization.id,
          branchId: currentBranch?.id,
          limit: 5,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        });

        // Get low stock items
        const stockItems = await inventoryService.getLowStockItems({
          organizationId: currentOrganization.id,
          branchId: currentBranch?.id,
        });

        // Get active orders
        const activeOrdersCount = orders.filter(
          order => order.status === 'pending' || order.status === 'preparing'
        ).length;

        setMetrics({
          totalSales,
          totalOrders,
          averageOrderValue,
          topSellingItems: topItems,
          lowStockItems: stockItems.length,
          activeOrders: activeOrdersCount,
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
    };

    fetchDashboardData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [currentOrganization, currentBranch, timeRange]);

  return metrics;
};
```

**Success Criteria**:
- ✅ Hook compiles without errors
- ✅ Fetches data from correct services
- ✅ Handles loading states
- ✅ Handles errors gracefully
- ✅ Auto-refreshes every 30 seconds

---

### Step 2: Update HQ Dashboard (2-3 hours)

#### 2.1 Update `src/app/(default)/dashboard/hq-dashboard/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Box, Container, Flex, Heading, Select, Text, Grid } from '@radix-ui/themes';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useOrganization } from '@/contexts/OrganizationContext';
import StatsCard from '@/components/common/StatsCard';
import RecentOrders from '@/components/common/RecentOrders';
import { DollarSign, ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';

export default function HQDashboard() {
  usePageTitle('HQ Dashboard');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const { currentOrganization, branches } = useOrganization();
  const metrics = useDashboardData(timeRange);

  if (!currentOrganization) {
    return (
      <Container size="4">
        <Box className="text-center py-12">
          <Text size="3" color="gray">Please select an organization to view dashboard</Text>
        </Box>
      </Container>
    );
  }

  if (metrics.error) {
    return (
      <Container size="4">
        <Box className="text-center py-12">
          <AlertCircle className="mx-auto mb-4" size={48} color="red" />
          <Heading size="5" className="mb-2">Error Loading Dashboard</Heading>
          <Text size="2" color="red">{metrics.error.message}</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Box>
            <Heading size="7">{currentOrganization.name} - HQ Dashboard</Heading>
            <Text size="2" color="gray">{branches.length} branches</Text>
          </Box>
          
          <Select.Root value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <Select.Trigger placeholder="Select time range" />
            <Select.Content>
              <Select.Item value="today">Today</Select.Item>
              <Select.Item value="week">Last 7 Days</Select.Item>
              <Select.Item value="month">Last 30 Days</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>

        {/* Metrics Grid */}
        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
          <StatsCard
            title="Total Sales"
            value={`$${metrics.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<DollarSign />}
            loading={metrics.loading}
          />
          
          <StatsCard
            title="Total Orders"
            value={metrics.totalOrders.toString()}
            icon={<ShoppingCart />}
            loading={metrics.loading}
          />
          
          <StatsCard
            title="Avg Order Value"
            value={`$${metrics.averageOrderValue.toFixed(2)}`}
            icon={<TrendingUp />}
            loading={metrics.loading}
          />
          
          <StatsCard
            title="Low Stock Items"
            value={metrics.lowStockItems.toString()}
            icon={<AlertCircle />}
            loading={metrics.loading}
            trend={metrics.lowStockItems > 0 ? 'down' : 'neutral'}
          />
        </Grid>

        {/* Recent Orders */}
        <Box>
          <Heading size="5" className="mb-4">Recent Orders</Heading>
          <RecentOrders limit={10} />
        </Box>
      </Flex>
    </Container>
  );
}
```

**Success Criteria**:
- ✅ Displays real data from database
- ✅ Shows loading states during fetch
- ✅ Handles errors gracefully
- ✅ Time range selector works
- ✅ Auto-refreshes data
- ✅ Organization context integrated

---

### Step 3: Update StatsCard Component (30 minutes)

#### 3.1 Update `src/components/common/StatsCard.tsx`

```typescript
'use client';

import { Card, Flex, Text, Box, Skeleton } from '@radix-ui/themes';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  loading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  loading = false,
  trend = 'neutral',
  trendValue 
}: StatsCardProps) {
  if (loading) {
    return (
      <Card>
        <Flex direction="column" gap="2">
          <Skeleton height="20px" />
          <Skeleton height="32px" />
          <Skeleton height="16px" />
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Text size="2" color="gray">{title}</Text>
          <Box className="text-gray-500">{icon}</Box>
        </Flex>
        
        <Text size="7" weight="bold">{value}</Text>
        
        {trendValue && (
          <Text 
            size="1" 
            color={trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'gray'}
          >
            {trendValue}
          </Text>
        )}
      </Flex>
    </Card>
  );
}
```

**Success Criteria**:
- ✅ Shows skeleton loading state
- ✅ Displays value and icon
- ✅ Optional trend indicator
- ✅ Responsive design

---

### Step 4: Update RecentOrders Component (1-2 hours)

#### 4.1 Update `src/components/common/RecentOrders.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Table, Badge, Skeleton, Text, Box } from '@radix-ui/themes';
import { useOrganization } from '@/contexts/OrganizationContext';
import { orderService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

interface RecentOrdersProps {
  limit?: number;
}

export default function RecentOrders({ limit = 5 }: RecentOrdersProps) {
  const { currentOrganization, currentBranch } = useOrganization();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentOrganization) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const fetchedOrders = await orderService.getOrders({
          organizationId: currentOrganization.id,
          branchId: currentBranch?.id,
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
    };

    fetchOrders();
  }, [currentOrganization, currentBranch, limit]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'yellow';
      case 'preparing': return 'blue';
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
    return <Text color="gray">No recent orders</Text>;
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
}
```

**Success Criteria**:
- ✅ Fetches real orders from database
- ✅ Shows loading skeletons
- ✅ Handles errors
- ✅ Formats data correctly
- ✅ Responsive table

---

### Step 5: Update Branch Dashboard (1-2 hours)

#### 5.1 Similar approach for `branch-dashboard/page.tsx`
- Use same `useDashboardData` hook
- Filter by specific branch
- Add branch-specific metrics

---

### Step 6: Update Analytics Dashboard (2-3 hours)

#### 6.1 Add charts and graphs
- Install Recharts if needed
- Create revenue charts
- Create order trends
- Create top products chart

---

### Step 7: Testing (1-2 hours)

#### 7.1 Manual Testing Checklist
```
- [ ] HQ Dashboard loads without errors
- [ ] All metrics show real data
- [ ] Time range selector updates data
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Auto-refresh works (wait 30 seconds)
- [ ] Branch Dashboard loads correctly
- [ ] Analytics Dashboard loads correctly
- [ ] Works with different organizations
- [ ] Works with different branches
- [ ] Responsive on mobile
- [ ] No console errors
```

#### 7.2 Test Data Verification
```sql
-- Verify test data exists
SELECT COUNT(*) FROM orders WHERE organization_id = 'your-org-id';
SELECT COUNT(*) FROM menu_items WHERE organization_id = 'your-org-id';
SELECT COUNT(*) FROM inventory_items WHERE organization_id = 'your-org-id';
```

---

## 5. Success Criteria

### Functional Requirements
- ✅ **Data Display**: All dashboards show real data from Supabase
- ✅ **Loading States**: Skeleton loaders during data fetch
- ✅ **Error Handling**: Graceful error messages
- ✅ **Auto-Refresh**: Data refreshes every 30 seconds
- ✅ **Time Ranges**: Today, Week, Month filters work
- ✅ **Organization Context**: Respects current organization/branch

### Technical Requirements
- ✅ **No Mock Data**: All imports from `data/` folder removed
- ✅ **Type Safety**: Proper TypeScript types throughout
- ✅ **Performance**: Dashboard loads in < 2 seconds
- ✅ **Code Quality**: No console errors, clean code

### User Experience Requirements
- ✅ **Responsive**: Works on mobile, tablet, desktop
- ✅ **Intuitive**: Easy to understand metrics
- ✅ **Fast**: No unnecessary re-renders
- ✅ **Reliable**: Handles edge cases (no data, errors)

### Testing Requirements
- ✅ **Manual Testing**: All test cases pass
- ✅ **Multiple Users**: Works for different organizations
- ✅ **Multiple Branches**: Branch filtering works
- ✅ **Edge Cases**: Empty states, error states tested

---

## 6. Deliverables

### Code Files
```
✅ src/hooks/useDashboardData.ts (new)
✅ src/app/(default)/dashboard/hq-dashboard/page.tsx (updated)
✅ src/app/(default)/dashboard/branch-dashboard/page.tsx (updated)
✅ src/app/(default)/dashboard/analytics-dashboard/page.tsx (updated)
✅ src/components/common/StatsCard.tsx (updated)
✅ src/components/common/RecentOrders.tsx (updated)
```

### Documentation
```
✅ Code comments explaining logic
✅ Update README if needed
✅ Testing results documented
```

### Testing Artifacts
```
✅ Manual testing checklist completed
✅ Screenshots of working dashboards
✅ Performance metrics recorded
```

---

## 7. Rollback Plan

If integration fails:
1. Restore mock data imports temporarily
2. Keep components using mock data
3. Debug backend services separately
4. Fix issues incrementally
5. Re-attempt integration

---

## 8. Next Steps After Completion

1. **Review & Code Review**: Get team feedback
2. **Performance Optimization**: Add caching if needed
3. **Real-Time Updates**: Implement Supabase Realtime (next task)
4. **Move to Next Task**: Menu Management Integration

---

**Status**: 📋 Ready to Start  
**Dependencies**: Backend services, Authentication, Organization Context  
**Blocked By**: None  
**Blocks**: All other frontend integration tasks
