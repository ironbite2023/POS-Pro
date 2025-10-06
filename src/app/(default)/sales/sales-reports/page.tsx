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
              disabled={exporting || orders.length === 0}
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
            value={`$${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
