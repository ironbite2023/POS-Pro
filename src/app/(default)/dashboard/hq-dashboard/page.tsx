'use client';

import React, { useState, useEffect } from 'react';
import { Card, Box, Heading, Flex, Text, Grid, Inset, Table, Select, Container } from '@radix-ui/themes';
import {
  TrendingUp, 
  Store, 
  AlertTriangle, 
  Activity,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import StatsCard from '@/components/common/StatsCard';
import RecentOrders from '@/components/common/RecentOrders';
import dynamic from 'next/dynamic';
import { useChartOptions } from '@/utilities/chartOptions';
import { PageHeading } from '@/components/common/PageHeading';
import CardHeading from '@/components/common/CardHeading';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useOrganization } from '@/contexts/OrganizationContext';

// Dynamically import ApexCharts with SSR disabled
const _ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function HQDashboard() {
  usePageTitle('Headquarters Dashboard');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const { currentOrganization, currentBranch: _currentBranch, branches } = useOrganization();
  const metrics = useDashboardData(timeRange);
  
  const [_isClient, setIsClient] = useState(false);
  const [_isRefreshingInventory, setIsRefreshingInventory] = useState(false);
  const [_chartsLoading, setChartsLoading] = useState(true);
  const _chartOptions = useChartOptions();
  
  useEffect(() => {
    setIsClient(true);
    // Add a small delay to simulate chart loading
    const timer = setTimeout(() => {
      setChartsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const _handleRefreshInventory = () => {
    setIsRefreshingInventory(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setIsRefreshingInventory(false);
    }, 1500);
  };

  // Show loading or error states
  if (!currentOrganization) {
    return (
      <Container size="4">
        <Box className="text-center py-12">
          <Text size="3" color="gray">Please select an organization to view dashboard</Text>
        </Box>
      </Container>
    );
  }

  // Show message if no branches are available
  if (branches.length === 0 && !metrics.loading) {
    return (
      <Container size="4">
        <Box className="text-center py-12">
          <Store className="mx-auto mb-4" size={48} color="gray" />
          <Heading size="5" className="mb-2">No Branches Found</Heading>
          <Text size="2" color="gray" className="mb-4">
            {currentOrganization.name} doesn&apos;t have any branches set up yet.
          </Text>
          <Text size="2" color="gray">
            Contact your administrator to set up branches for your organization.
          </Text>
        </Box>
      </Container>
    );
  }

  if (metrics.error) {
    return (
      <Container size="4">
        <Box className="text-center py-12">
          <AlertTriangle className="mx-auto mb-4" size={48} color="red" />
          <Heading size="5" className="mb-2">Error Loading Dashboard</Heading>
          <Text size="2" color="red">{metrics.error.message}</Text>
        </Box>
      </Container>
    );
  }

  // NOTE: The charts below use placeholder data for demonstration
  // Real data integration for sales trends, hourly patterns, and inventory 
  // will be implemented when sufficient order data is available
  
  return (
    <Box className="space-y-6">
      {/* Header with Time Range Selector */}
      <Flex justify="between" align="center">
        <PageHeading 
          title={`${currentOrganization.name} - HQ Dashboard`} 
          description={`${branches.length} ${branches.length === 1 ? 'branch' : 'branches'}`}
        />
        
        <Select.Root value={timeRange} onValueChange={(value) => setTimeRange(value as 'today' | 'week' | 'month')}>
          <Select.Trigger placeholder="Select time range" />
          <Select.Content>
            <Select.Item value="today">Today</Select.Item>
            <Select.Item value="week">Last 7 Days</Select.Item>
            <Select.Item value="month">Last 30 Days</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      {/* Real-time Metrics Grid - REAL DATA */}
      <Grid columns={{ initial: "1", md: "2", lg: "4" }} gap="4">
        <StatsCard
          title="Total Sales"
          value={`$${metrics.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign />}
          loading={metrics.loading}
          description={`${timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}`}
        />
        
        <StatsCard
          title="Total Orders"
          value={metrics.totalOrders.toString()}
          icon={<ShoppingCart />}
          loading={metrics.loading}
          description="Completed orders"
        />
        
        <StatsCard
          title="Avg Order Value"
          value={`$${metrics.averageOrderValue.toFixed(2)}`}
          icon={<TrendingUp />}
          loading={metrics.loading}
          description="Per order"
        />
        
        <StatsCard
          title="Active Orders"
          value={metrics.activeOrders.toString()}
          icon={<Activity />}
          loading={metrics.loading}
          description="Currently processing"
        />
      </Grid>

      {/* Top Selling Items with Real Data */}
      <Box>
        <Card size="3">
          <CardHeading title="Top Performing Menu Items" mb="8" />
          {metrics.loading ? (
            <Box>
              {[...Array(5)].map((_, i) => (
                <Box key={i} className="mb-2">
                  <Flex gap="2">
                    <Box style={{ flex: 1 }}><Text>Loading...</Text></Box>
                  </Flex>
                </Box>
              ))}
            </Box>
          ) : metrics.topSellingItems.length > 0 ? (
            <Inset>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Item</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Sales (Units)</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Revenue</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {metrics.topSellingItems.map((item, index) => (
                    <Table.Row key={index} className="hover:bg-slate-50 dark:hover:bg-neutral-800">
                      <Table.Cell>{item.name}</Table.Cell>
                      <Table.Cell>{item.quantity}</Table.Cell>
                      <Table.Cell>${item.revenue.toLocaleString()}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Inset>
          ) : (
            <Box className="text-center py-8">
              <Text color="gray">No sales data available for this period</Text>
            </Box>
          )}
        </Card>
      </Box>

      {/* Recent Orders Section with Real Data */}
      <Box>
        <Card size="3">
          <CardHeading title="Recent Orders" mb="4" />
          <RecentOrders limit={10} />
        </Card>
      </Box>

      {/* Low Stock Alert - Real Data */}
      <Box>
        <Card size="3">
          <Flex justify="between" align="center" mb="5">
            <CardHeading title="Low Stock Alerts" mb="0" />
            <Flex align="center" gap="1">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <Text as="p" size="2" weight="medium" className="text-orange-600">
                {metrics.lowStockItems} items below reorder level
              </Text>
            </Flex>
          </Flex>
          {metrics.lowStockItems === 0 ? (
            <Box className="text-center py-8">
              <Text color="gray">All inventory levels are healthy</Text>
            </Box>
          ) : (
            <Text size="2" color="gray">Check inventory management for details</Text>
          )}
        </Card>
      </Box>

      {/* Info Message about Demo Charts */}
      <Card size="3">
        <Flex direction="column" gap="3" align="center" className="py-8">
          <Box className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full">
            <Activity className="h-6 w-6 text-blue-500" />
          </Box>
          <Heading size="4">Charts and Analytics Coming Soon</Heading>
          <Text size="2" color="gray" align="center" className="max-w-md">
            Sales trends, hourly patterns, and inventory analytics will appear here as you start processing orders and managing inventory.
          </Text>
          <Text size="1" color="gray" align="center">
            Start by creating menu items and processing your first orders!
          </Text>
        </Flex>
      </Card>
    </Box>
  );
}
