'use client';

import React, { useState, useEffect } from 'react';
import { Card, Box, Flex, Text, Grid, Badge, Inset, Table, Avatar, Select, Container, Heading } from '@radix-ui/themes';
import { 
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Activity,
  AlertTriangle
} from 'lucide-react';
import MetricCard from '@/components/common/MetricCard';
import StatsCard from '@/components/common/StatsCard';
import RecentOrders from '@/components/common/RecentOrders';
import ChartLoadingPlaceholder from '@/components/common/ChartLoadingPlaceholder';
import dynamic from 'next/dynamic';
import { useChartOptions, chartColorPalettes } from '@/utilities/chartOptions';
import { PageHeading } from '@/components/common/PageHeading';
import CardHeading from '@/components/common/CardHeading';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useOrganization } from '@/contexts/OrganizationContext';

// Dynamically import ApexCharts with SSR disabled
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function BranchDashboard() {
  usePageTitle('Branch Dashboard');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const { currentOrganization, currentBranch } = useOrganization();
  const metrics = useDashboardData(timeRange);
  
  const [isClient, setIsClient] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(true);
  const chartOptions = useChartOptions();
  
  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => {
      setChartsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading or error states
  if (!currentOrganization || !currentBranch) {
    return (
      <Container size="4">
        <Box className="text-center py-12">
          <Text size="3" color="gray">Please select a branch to view dashboard</Text>
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
  
  return (
    <Box className="space-y-6">
      {/* Header with Time Range Selector */}
      <Flex justify="between" align="center">
        <PageHeading 
          title={`${currentBranch.name} - Branch Dashboard`}
          description={currentOrganization.name}
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

      {/* Real-time Metrics Grid */}
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

      {/* Recent Orders Section */}
      <Grid columns={{ initial: "1", md: "2" }} gap="4">
        <Card size="3">
          <CardHeading title="Recent Orders" mb="4" />
          <RecentOrders limit={8} />
        </Card>

        <Card size="3">
          <CardHeading title="Hourly Order Trends" />
          <div className="h-[300px]">
            {isClient ? (
              chartsLoading || metrics.loading ? (
                <ChartLoadingPlaceholder height={300} />
              ) : metrics.hourlyTrends.length > 0 ? (
                <ReactApexChart
                  type="line"
                  height={300}
                  options={chartOptions.getLineOptions({
                    colors: [chartColorPalettes.cool[3]],
                    xaxis: {
                      ...chartOptions.getBaseXAxisOptions(),
                      categories: metrics.hourlyTrends.map(item => item.hour),
                    },
                    tooltip: {
                      ...chartOptions.getBaseTooltipOptions(),
                    },
                  })}
                  series={[
                    {
                      name: 'Orders',
                      data: metrics.hourlyTrends.map(item => item.orders),
                    }
                  ]}
                />
              ) : (
                <Box className="flex items-center justify-center h-full">
                  <Text color="gray">No order data available for this period</Text>
                </Box>
              )
            ) : (
              <ChartLoadingPlaceholder height={300} />
            )}
          </div>
        </Card>
      </Grid>

      {/* Top Selling Items with Real Data */}
      <Card size="3">
        <CardHeading title="Top Selling Items" mb="4" />
        {metrics.loading ? (
          <Box>
            {[...Array(5)].map((_, i) => (
              <Box key={i} className="mb-2">
                <Text>Loading...</Text>
              </Box>
            ))}
          </Box>
        ) : metrics.topSellingItems.length > 0 ? (
          <Inset>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Item</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Quantity Sold</Table.ColumnHeaderCell>
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

      {/* Staff Section with Real Data from Database */}
      <Card size="3">
        <CardHeading title="Staff On Duty" mb="4" />
        {metrics.loading ? (
          <Box className="text-center py-8">
            <Text color="gray">Loading staff data...</Text>
          </Box>
        ) : metrics.staffOnDuty.length > 0 ? (
          <Inset>
            {metrics.staffOnDuty.map((staff, index) => (
              <React.Fragment key={staff.id}>
                <Flex align="center" justify="between" px="5" py="3" className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                  <Flex align="center" gap="3">
                    <Avatar 
                      src={staff.avatar || undefined} 
                      fallback={`${staff.firstName[0] || '?'}${staff.lastName[0] || '?'}`}
                      size="2"
                      radius="full"
                    />
                    <Box>
                      <Text as="p" size="2" weight="medium">{staff.name}</Text>
                      <Text as="p" size="1" color="gray">{staff.role}</Text>
                    </Box>
                  </Flex>
                  <Flex align="center" gap="3">
                    <Badge color={staff.status === 'active' ? 'green' : 'yellow'}>
                      {staff.status}
                    </Badge>
                    {staff.lastLogin && (
                      <Text size="1" color="gray">
                        Last active: {new Date(staff.lastLogin).toLocaleDateString()}
                      </Text>
                    )}
                  </Flex>
                </Flex>
                {index < metrics.staffOnDuty.length - 1 && (
                  <Box style={{ height: '1px', backgroundColor: 'var(--gray-4)' }} />
                )}
              </React.Fragment>
            ))}
          </Inset>
        ) : (
          <Box className="text-center py-8">
            <Text color="gray">No staff members assigned to this branch</Text>
          </Box>
        )}
      </Card>

      {/* Inventory Alert */}
      <Grid columns={{ initial: "1", md: "2" }} gap="4">
        <MetricCard
          title="Low Stock Items"
          value={metrics.lowStockItems}
          description="Items needing restock"
          trend={metrics.lowStockItems > 0 ? 'down' : 'up'}
          trendValue={metrics.lowStockItems > 0 ? 'Action Required' : 'All Good'}
        />
        <MetricCard
          title="Active Orders"
          value={metrics.activeOrders}
          description="Orders in progress"
        />
      </Grid>
    </Box>
  );
}