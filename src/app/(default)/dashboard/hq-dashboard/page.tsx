'use client';

import React, { useState, useEffect } from 'react';
import { Card, Box, Heading, Flex, Text, Grid, Badge, Separator, Inset, Button, Table, Select, Container } from '@radix-ui/themes';
import {
  TrendingUp, 
  Store, 
  AlertTriangle, 
  Activity,
  ChevronRight,
  RefreshCw,
  Package,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import MetricCard from '@/components/common/MetricCard';
import StatsCard from '@/components/common/StatsCard';
import RecentOrders from '@/components/common/RecentOrders';
import ChartLoadingPlaceholder from '@/components/common/ChartLoadingPlaceholder';
import dynamic from 'next/dynamic';
import { useChartOptions, chartColorPalettes } from '@/utilities/chartOptions';
import { ingredientItemCategories } from '@/data/CommonData';
import { formatCurrency } from '@/utilities/';
import { PageHeading } from '@/components/common/PageHeading';
import CardHeading from '@/components/common/CardHeading';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useOrganization } from '@/contexts/OrganizationContext';

// Dynamically import ApexCharts with SSR disabled
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function HQDashboard() {
  usePageTitle('Headquarters Dashboard');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const { currentOrganization, currentBranch: _currentBranch, branches } = useOrganization();
  const metrics = useDashboardData(timeRange);
  
  const [isClient, setIsClient] = useState(false);
  const [isRefreshingInventory, setIsRefreshingInventory] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(true);
  const chartOptions = useChartOptions();
  
  useEffect(() => {
    setIsClient(true);
    // Add a small delay to simulate chart loading
    const timer = setTimeout(() => {
      setChartsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRefreshInventory = () => {
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

  // Mock data for charts (will be replaced in future tasks)
  const mockSalesData = [
    { month: 'Jan', downtown: 38000, westside: 28000, eastside: 42000, north: 32000 },
    { month: 'Feb', downtown: 42000, westside: 32000, eastside: 48000, north: 35000 },
    { month: 'Mar', downtown: 45000, westside: 34000, eastside: 52000, north: 37000 },
    { month: 'Apr', downtown: 39000, westside: 29000, eastside: 44000, north: 33000 },
    { month: 'May', downtown: 41000, westside: 31000, eastside: 46000, north: 36000 },
    { month: 'Jun', downtown: 47000, westside: 36000, eastside: 54000, north: 39000 },
  ];

  const mockHourlyTrends = [
    { hour: '8 AM', orders: 12 },
    { hour: '9 AM', orders: 15 },
    { hour: '10 AM', orders: 18 },
    { hour: '11 AM', orders: 25 },
    { hour: '12 PM', orders: 45 },
    { hour: '1 PM', orders: 52 },
    { hour: '2 PM', orders: 38 },
    { hour: '3 PM', orders: 27 },
    { hour: '4 PM', orders: 22 },
    { hour: '5 PM', orders: 32 },
    { hour: '6 PM', orders: 48 },
    { hour: '7 PM', orders: 53 },
    { hour: '8 PM', orders: 41 },
    { hour: '9 PM', orders: 35 },
  ];

  const mockInventoryCategories = [
    { id: 'cat-1', name: 'Proteins', totalItems: 24, lowStockItems: 5, criticalItems: 2 },
    { id: 'cat-2', name: 'Produce', totalItems: 32, lowStockItems: 8, criticalItems: 3 },
    { id: 'cat-3', name: 'Dairy', totalItems: 18, lowStockItems: 2, criticalItems: 0 },
    { id: 'cat-4', name: 'Dry Goods', totalItems: 45, lowStockItems: 3, criticalItems: 1 },
    { id: 'cat-5', name: 'Beverages', totalItems: 29, lowStockItems: 4, criticalItems: 0 },
  ];

  const mockBranchInventoryHealth = [
    { branch: 'Downtown Main', healthScore: 78, lowItems: 5, criticalItems: 2, lastUpdated: '2023-06-15 08:45 AM' },
    { branch: 'Westside Corner', healthScore: 85, lowItems: 3, criticalItems: 0, lastUpdated: '2023-06-15 09:20 AM' },
    { branch: 'Eastside Mall', healthScore: 72, lowItems: 7, criticalItems: 3, lastUpdated: '2023-06-15 07:50 AM' },
    { branch: 'North Station', healthScore: 90, lowItems: 2, criticalItems: 0, lastUpdated: '2023-06-14 06:20 PM' },
  ];

  const totalInventoryItems = mockInventoryCategories.reduce((sum, cat) => sum + cat.totalItems, 0);
  const totalLowStockItems = mockInventoryCategories.reduce((sum, cat) => sum + cat.lowStockItems, 0);
  const totalCriticalItems = mockInventoryCategories.reduce((sum, cat) => sum + cat.criticalItems, 0);
  const inventoryHealthPercentage = Math.round(((totalInventoryItems - totalLowStockItems) / totalInventoryItems) * 100);
  
  return (
    <Box className="space-y-6">
      {/* Header with Time Range Selector */}
      <Flex justify="between" align="center">
        <PageHeading 
          title={`${currentOrganization.name} - HQ Dashboard`} 
          description={`${branches.length} branches`}
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

      {/* Sales Overview Section - Using existing charts */}
      <Box>
        <Card mt="4" size="3">
          <CardHeading title="Monthly Sales by Branch" />
          <div className="h-[350px]">
            {isClient ? (
              chartsLoading ? (
                <ChartLoadingPlaceholder height={350} />
              ) : (
                <ReactApexChart
                  type="bar"
                  height={350}
                  options={chartOptions.getBarOptions({
                    xaxis: {
                      ...chartOptions.getBaseXAxisOptions(),
                      categories: mockSalesData.map(item => item.month),
                    },
                    yaxis: {
                      labels: {
                        ...chartOptions.getBaseYAxisLabels(),
                        formatter: function(val) {
                          return formatCurrency(val);
                        }
                      }
                    },
                    colors: chartColorPalettes.warm,
                    tooltip: {
                      ...chartOptions.getBaseTooltipOptions(),
                      y: {
                        formatter: function (val) {
                          return formatCurrency(val);
                        }
                      }
                    },
                  })}
                  series={[
                    {
                      name: 'Downtown Main',
                      data: mockSalesData.map(item => item.downtown),
                    },
                    {
                      name: 'Westside Corner',
                      data: mockSalesData.map(item => item.westside),
                    },
                    {
                      name: 'Eastside Mall',
                      data: mockSalesData.map(item => item.eastside),
                    },
                    {
                      name: 'North Station',
                      data: mockSalesData.map(item => item.north),
                    }
                  ]}
                />
              )
            ) : (
              <ChartLoadingPlaceholder height={350} />
            )}
          </div>
        </Card>
      </Box>

      {/* Branch Monitoring Section */}
      <Box>        
        <Grid columns={{ initial: "1", md: "2" }} gap="4">
          <Card size="3">
            <CardHeading title="Branch Status" mb="8" />
            <Inset>
              {branches.length > 0 ? (
                branches.map((branch, index) => (
                  <React.Fragment key={branch.id}>
                    <Flex align="center" justify="between" px="5" py="3" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800">
                      <Flex align="center" gap="3">
                        <Store className="h-5 w-5 text-gray-400 dark:text-neutral-600" />
                        <Box>
                          <Text as="p" size="2" weight="medium" mb="1">{branch.name}</Text>
                          <Flex align="center" gap="1">
                            <Badge color={branch.status === 'active' ? 'green' : 'gray'} radius="full">
                              {branch.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </Flex>
                        </Box>
                      </Flex>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Flex>
                    {index < branches.length - 1 && (
                      <Separator size="4" style={{ backgroundColor: 'var(--gray-4)' }} />
                    )}
                  </React.Fragment>
                ))
              ) : (
                <Box className="text-center py-8">
                  <Text color="gray">No branches found</Text>
                </Box>
              )}
            </Inset>
          </Card>
          
          <Card size="3">
            <CardHeading title="Hourly Order Trends" />
            <div className="h-[220px]">
              {isClient ? (
                chartsLoading ? (
                  <ChartLoadingPlaceholder height={220} />
                ) : (
                  <ReactApexChart
                    type="line"
                    height={220}
                    options={chartOptions.getLineOptions({
                      colors: [chartColorPalettes.cool[3]],
                      xaxis: {
                        ...chartOptions.getBaseXAxisOptions(),
                        categories: mockHourlyTrends.map(item => item.hour),
                      },
                      tooltip: {
                        ...chartOptions.getBaseTooltipOptions(),
                      },
                    })}
                    series={[
                      {
                        name: 'Orders',
                        data: mockHourlyTrends.map(item => item.orders),
                      }
                    ]}
                  />
                )
              ) : (
                <ChartLoadingPlaceholder height={300} />
              )}
            </div>
          </Card>
        </Grid>
      </Box>

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

      {/* Inventory Section */}
      <Box>
        <Grid columns={{ initial: "1", md: "2" }} gap="4">
          <Card size="3" className="p-0 overflow-hidden">
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
          
          <Box>
            <Card size="3">
              <Flex justify="between" align="center" gap="4">
                <Flex align="center" gap="2">
                  <Box className="p-3 bg-green-50 dark:bg-green-900/30 rounded-full">
                    <Package className="h-6 w-6 text-green-500" />
                  </Box>
                  <Flex gap="1" direction="column">
                    <Heading as="h3" size="2">Inventory Health</Heading>
                    <Box>
                      <Text size="2" color="red">{totalLowStockItems} items low</Text>, <Text size="2" color="amber">{totalCriticalItems} critical</Text>
                    </Box>
                  </Flex>
                </Flex>
                <Text size="8" weight="bold" color={inventoryHealthPercentage >= 85 ? 'green' : inventoryHealthPercentage >= 75 ? 'yellow' : 'red'}>{inventoryHealthPercentage}%</Text>  
              </Flex>
            </Card>
            
            <Grid columns="2" gap="4" mt="4">
              <MetricCard
                title="Low Stock Items"
                value={metrics.lowStockItems}
                description="Items needing restock"
                trend="down"
                trendValue="Real-time"
              />
              <MetricCard
                title="Active Orders"
                value={metrics.activeOrders}
                description="Orders in progress"
              />
            </Grid>
          </Box>
        </Grid>
        
        <Grid columns={{ initial: "1", md: "2" }} gap="4" mt="4">
          <Card size="3">
            <CardHeading title="Inventory by Category" />
            <div className="h-[450px]">
              {isClient ? (
                chartsLoading ? (
                  <ChartLoadingPlaceholder height={450} />
                ) : (
                  <ReactApexChart
                    type="bar"
                    height={450}
                    options={chartOptions.getHorizontalBarOptions({
                      chart: {
                        stacked: true,
                        toolbar: {
                          show: false,
                        },
                      },
                      tooltip: {
                        ...chartOptions.getBaseTooltipOptions(),
                      },
                      xaxis: {
                        ...chartOptions.getBaseXAxisOptions(),
                        categories: ingredientItemCategories,
                      },
                      dataLabels: {
                        enabled: false,
                      },
                      colors: [chartColorPalettes.positive[4], chartColorPalettes.warm[4], chartColorPalettes.negative[2]],
                    })}
                    series={[
                      {
                        name: 'Normal',
                        data: ingredientItemCategories.map(() => Math.floor(Math.random() * 100) + 20),
                      },
                      {
                        name: 'Low Stock',
                        data: ingredientItemCategories.map(() => Math.floor(Math.random() * 20) + 5),
                      },
                      {
                        name: 'Critical',
                        data: ingredientItemCategories.map(() => Math.floor(Math.random() * 5)),
                      },
                    ]}
                  />
                )
              ) : (
                <ChartLoadingPlaceholder height={450} />
              )}
            </div>
          </Card>
          
          <Card size="3">
            <Flex justify="between" align="center" mb="6">
              <CardHeading title="Branch Inventory Health" mb="0" />
              <Button variant="soft" color="gray" size="1" onClick={handleRefreshInventory} disabled={isRefreshingInventory}>
                <RefreshCw size={13} className={isRefreshingInventory ? 'animate-spin' : ''} />
                {isRefreshingInventory ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Flex>
            <Box className="space-y-3">
              {mockBranchInventoryHealth.map((branch) => (
                <Box key={branch.branch} p="3" className="bg-slate-50 dark:bg-neutral-800 rounded-md">
                  <Flex justify="between" mb="2">
                    <Text weight="medium">{branch.branch}</Text>
                    <Badge color={
                      branch.healthScore >= 85 ? 'green' : 
                      branch.healthScore >= 75 ? 'yellow' : 
                      'red'
                    }>
                      {branch.healthScore}%
                    </Badge>
                  </Flex>
                  <Box className="w-full bg-slate-200 dark:bg-neutral-700 rounded-full h-2">
                    <Box 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${branch.healthScore}%`,
                        backgroundColor: branch.healthScore >= 85 ? 'var(--green-9)' : 
                                      branch.healthScore >= 75 ? 'var(--amber-9)' : 
                                      'var(--red-9)'
                      }}
                    />
                  </Box>
                  <Flex justify="between" mt="2">
                    <Text size="1" color="gray">{branch.lowItems} items low</Text>
                    <Text size="1" color="gray">Updated {branch.lastUpdated}</Text>
                  </Flex>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Box>
    </Box>
  );
}
