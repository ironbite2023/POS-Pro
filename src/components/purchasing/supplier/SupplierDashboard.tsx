'use client';

import { Card, Box, Heading, Flex, Text, Grid } from '@radix-ui/themes';
import { AlertCircle, Clock, Package, Truck, Users } from 'lucide-react';
// Removed hardcoded imports - using real data from database services
import { suppliersService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEffect, useState } from 'react';
import MetricCard from '@/components/common/MetricCard';

// Default metrics structure until proper API integration
const defaultMetrics = {
  totalSuppliers: 0,
  pendingOrders: 0,
  averageDeliveryTime: 0,
  totalMonthlyPurchases: 0
};

export default function SupplierDashboard() {
  const { currentOrganization } = useOrganization();
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [topSuppliers, setTopSuppliers] = useState<Array<{id: string; name: string; monthlyPurchases: number; totalSpent: number}>>([]);
  const [stockShortages, setStockShortages] = useState<Array<{id: string; name: string; supplier: string; daysDelayed: number}>>([]);
  
  // Load supplier metrics
  useEffect(() => {
    const loadMetrics = async () => {
      if (!currentOrganization) return;
      
      try {
        // TODO: Implement suppliersService.getSupplierMetrics method
        // const supplierMetrics = await suppliersService.getSupplierMetrics(currentOrganization.id);
        // setMetrics(supplierMetrics);
        
        // Temporary: Use default metrics until service is implemented
        setMetrics(defaultMetrics);
        
        // TODO: Also load top suppliers when service is implemented
        setTopSuppliers([]);
        
        // TODO: Load stock shortages from inventory service
        setStockShortages([]);
      } catch (error) {
        console.error('Error loading supplier metrics:', error);
        setMetrics(defaultMetrics);
        setTopSuppliers([]);
        setStockShortages([]);
      }
    };

    loadMetrics();
  }, [currentOrganization]);

  return (
    <Box className="space-y-4">
      <Grid columns="4" gap="4">
        <MetricCard
          title="Total Suppliers"
          value={metrics.totalSuppliers.toString()}
          description="Active suppliers in the system"
          icon={<Users className="h-5 w-5 text-blue-500" />}
          trend="up"
          trendValue="2"
        />
        <MetricCard
          title="Pending Orders"
          value={metrics.pendingOrders.toString()}
          description="Orders awaiting delivery"
          icon={<Package className="h-5 w-5 text-amber-500" />}
          trend="down"
          trendValue="1"
        />
        <MetricCard
          title="Avg. Delivery Time"
          value={`${metrics.averageDeliveryTime} days`}
          description="Average supplier lead time"
          icon={<Truck className="h-5 w-5 text-green-500" />}
        />
        <MetricCard
          title="Monthly Purchases"
          value={`$${metrics.totalMonthlyPurchases.toLocaleString()}`}
          description="Total spend this month"
          icon={<Clock className="h-5 w-5 text-purple-500" />}
          trend="up"
          trendValue="8%"
        />
      </Grid>

      <Grid columns="2" gap="4">
        <Card>
          <Heading as="h3" size="2" mb="4">Top Suppliers</Heading>
          <Box className="space-y-4">
            {topSuppliers.length > 0 ? topSuppliers.map(supplier => (
              <Box key={supplier.id} className="p-3 bg-stone-50 rounded-md">
                <Flex justify="between" align="center">
                  <Text as="p" size="3" weight="medium">{supplier.name}</Text>
                  <Box>
                    <Text as="p" size="2" className="text-slate-500">${supplier.monthlyPurchases.toLocaleString()}</Text>
                  </Box>
                </Flex>
                <Flex justify="between" align="center" className="mt-2">
                  <Text as="p" size="2" className="text-slate-500">Total spend</Text>
                  <Text as="p" size="3" weight="medium">${supplier.totalSpent.toLocaleString()}</Text>
                </Flex>
              </Box>
            )) : (
              <Box className="p-3 bg-stone-50 rounded-md">
                <Text as="p" size="2" className="text-slate-500">No supplier data available</Text>
              </Box>
            )}
          </Box>
        </Card>

        <Card>
          <Heading as="h3" size="2" mb="4">Recent Stock Shortages</Heading>
          <Box className="space-y-4">
            {stockShortages.length > 0 ? stockShortages.map(item => (
              <Box key={item.id} className="p-3 bg-stone-50 rounded-md">
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <Box>
                      <Text as="p" size="3" weight="medium">{item.name}</Text>
                      <Text as="p" size="2" className="text-slate-500 mt-2">Supplier: {item.supplier}</Text>    
                    </Box>
                  </Flex>
                  <Text as="p" size="2" className="text-orange-600">{item.daysDelayed} days delayed</Text>
                </Flex>
              </Box>
            )) : (
              <Box className="p-3 bg-stone-50 rounded-md">
                <Text as="p" size="2" className="text-slate-500">No recent stock shortages</Text>
              </Box>
            )}
          </Box>
        </Card>
      </Grid>
    </Box>
  );
} 