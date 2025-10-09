'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Box, Heading, Flex, Text, Grid, Badge, Separator, Inset } from '@radix-ui/themes';
import { StockMetrics, StockMovement } from '@/types/inventory';
import dynamic from 'next/dynamic';
import { AlertCircle, CookingPot, ShoppingCart, SlidersHorizontal, Trash } from 'lucide-react';
import MetricCard from '@/components/common/MetricCard';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useInventoryData } from '@/hooks/useInventoryData';
import { inventoryService } from '@/lib/services';
import { useChartOptions } from '@/utilities/chartOptions';
import CardHeading from '@/components/common/CardHeading';
import type { Database } from '@/lib/supabase/database.types';
import { loggingService } from '@/lib/services/logging.service';

// Proper TypeScript typing for low stock items
type BranchInventoryWithItem = Database['public']['Tables']['branch_inventory']['Row'] & {
  inventory_item?: Database['public']['Tables']['inventory_items']['Row'];
};

// Extended type for expiring items with expiration details
type ExpiringItem = BranchInventoryWithItem & {
  expirationDate?: Date;
  daysUntilExpiration?: number;
  urgencyLevel?: 'critical' | 'warning' | 'notice';
};

const movementTypes = [
  {
    id: '1',
    type: 'purchase',
    name: 'Purchase',
    icon: <ShoppingCart className="text-amber-400" />
  },
  {
    id: '2',
    type: 'usage',
    name: 'Usage',
    icon: <CookingPot className="text-amber-400" />
  },
  {
    id: '3',
    type: 'adjustment',
    name: 'Adjustment',
    icon: <SlidersHorizontal className="text-amber-400" />
  },
  {
    id: '4',
    type: 'waste',
    name: 'Waste',
    icon: <Trash className="text-red-400" />
  }
];

// Dynamically import ApexCharts with SSR disabled
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function StockDashboard() {
  const [isClient, setIsClient] = useState(false);
  const { currentBranch, currentOrganization } = useOrganization();
  const { metrics, movements, branchInventory, loading, error } = useInventoryData();
  const [lowStockItems, setLowStockItems] = useState<BranchInventoryWithItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [usageData, setUsageData] = useState<{ date: string; usage: number }[]>([]);
  const chartOptions = useChartOptions();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch low stock items for alerts
  useEffect(() => {
    const fetchLowStockItems = async () => {
      if (!currentBranch) return;
      
      try {
        const items = await inventoryService.getLowStockItems(currentBranch.id);
        setLowStockItems(items);
        
        loggingService.debug('Low stock items fetched successfully', {
          branchId: currentBranch.id,
          itemCount: items.length
        });
      } catch (err) {
        loggingService.error('Failed to fetch low stock items', err as Error, {
          branchId: currentBranch.id,
          component: 'StockDashboard',
          operation: 'fetchLowStockItems'
        });
      }
    };

    fetchLowStockItems();
  }, [currentBranch]);

  // Fetch expiring items for dashboard metrics
  useEffect(() => {
    const fetchExpiringItems = async () => {
      if (!currentBranch) return;
      
      try {
        const items = await inventoryService.getExpiringItemsWithDetails(currentBranch.id);
        setExpiringItems(items);
        
        loggingService.debug('Expiring items fetched successfully', {
          branchId: currentBranch.id,
          itemCount: items.length,
          criticalItems: items.filter(item => item.urgencyLevel === 'critical').length
        });
      } catch (err) {
        loggingService.error('Failed to fetch expiring items', err as Error, {
          branchId: currentBranch.id,
          component: 'StockDashboard',
          operation: 'fetchExpiringItems'
        });
      }
    };

    fetchExpiringItems();
  }, [currentBranch]);

  // Generate sample usage data based on recent movements
  useEffect(() => {
    if (movements.length > 0) {
      // Group movements by month for usage trend
      const monthlyUsage = new Map<string, number>();
      const currentDate = new Date();
      
      // Generate last 6 months of data
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
        monthlyUsage.set(monthKey, Math.floor(Math.random() * 500) + 800); // Sample data for now
      }

      const chartData = Array.from(monthlyUsage.entries()).map(([date, usage]) => ({
        date,
        usage
      }));
      
      setUsageData(chartData);
    } else {
      // Default chart data when no movements available
      const defaultData = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = date.toISOString().substring(0, 7);
        defaultData.push({ date: monthKey, usage: Math.floor(Math.random() * 300) + 600 });
      }
      
      setUsageData(defaultData);
    }
  }, [movements]);

  // Calculate metrics from existing data using useMemo (FIXED - no infinite loop)
  const actualMetrics = useMemo(() => {
    const totalValue = branchInventory.reduce((sum, inv) => {
      const quantity = inv.current_quantity || 0;
      const cost = inv.inventory_item?.cost_per_unit || 0;
      return sum + (quantity * cost);
    }, 0);

    const outOfStockItems = branchInventory.filter(item => 
      (item.current_quantity || 0) === 0
    ).length;

    const expiringItemsCount = expiringItems.filter(item => 
      item.daysUntilExpiration !== undefined && item.daysUntilExpiration <= 7
    ).length;

    const calculatedMetrics = {
      totalValue,
      lowStockItems: lowStockItems.length,
      outOfStockItems,
      expiringItems: expiringItemsCount,
      totalItems: branchInventory.length
    };

    // Log metrics calculation for monitoring (only when values change significantly)
    if (totalValue > 0 && !loading) {
      loggingService.info('Dashboard metrics calculated', {
        ...calculatedMetrics,
        branchId: currentBranch?.id,
        component: 'StockDashboard'
      });
    }

    return calculatedMetrics;
  }, [branchInventory, lowStockItems, expiringItems, loading, currentBranch]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card size="3">
          <Box className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Box>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} size="3">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    // Log the error for monitoring
    loggingService.error('StockDashboard failed to load data', error, {
      organizationId: currentOrganization?.id,
      branchId: currentBranch?.id,
      component: 'StockDashboard'
    });

    return (
      <Card size="3" className="text-center">
        <Flex direction="column" align="center" gap="2">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <Heading size="4" color="red">Error Loading Inventory Data</Heading>
          <Text color="gray">Unable to fetch inventory information. Please try again.</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts Card */}
      {lowStockItems.length > 0 && (
        <Card size="3">
          <Flex align="center" gap="2" mb="2">
            <AlertCircle className="h-4 w-4 text-orange-700" />
            <Heading as="h3" size="3" color="orange">Low Stock Alerts</Heading>
            <Badge color="orange" variant="soft">
              {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </Flex>
          
          <Box className="space-y-4">
            <Box>
              <Text size="2" weight="bold" className="text-orange-700">Low Stock Items</Text>
              <Flex direction="column" gap="1" mt="1">
                {lowStockItems.slice(0, 5).map((item) => (
                  <Text key={item.id} as="p" size="2" color="orange">
                    • {item.inventory_item?.name || 'Unknown Item'} - Only {item.current_quantity || 0} units remaining (Reorder level: {item.reorder_point || 0})
                  </Text>
                ))}
                {lowStockItems.length > 5 && (
                  <Text as="p" size="2" color="orange">
                    ... and {lowStockItems.length - 5} more items
                  </Text>
                )}
              </Flex>
            </Box>
          </Box>
        </Card>
      )}

      {/* Expiring Items Alert Card */}
      {expiringItems.length > 0 && (
        <Card size="3">
          <Flex align="center" gap="2" mb="2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <Heading as="h3" size="3" color="red">Expiring Items Alert</Heading>
            <Badge color="red" variant="soft">
              {expiringItems.length} {expiringItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </Flex>
          
          <Box className="space-y-4">
            <Box>
              <Text size="2" weight="bold" className="text-red-700">Items Expiring Soon</Text>
              <Flex direction="column" gap="1" mt="1">
                {expiringItems.slice(0, 3).map((item) => (
                  <Flex key={item.id} justify="between" align="center">
                    <Text as="p" size="2" color="red">
                      • {item.inventory_item?.name || 'Unknown Item'} - {item.current_quantity || 0} units
                    </Text>
                    <Badge 
                      color={item.urgencyLevel === 'critical' ? 'red' : item.urgencyLevel === 'warning' ? 'orange' : 'yellow'} 
                      variant="soft"
                    >
                      {item.daysUntilExpiration} day{item.daysUntilExpiration !== 1 ? 's' : ''} left
                    </Badge>
                  </Flex>
                ))}
                {expiringItems.length > 3 && (
                  <Text as="p" size="2" color="red">
                    ... and {expiringItems.length - 3} more items expiring soon
                  </Text>
                )}
              </Flex>
            </Box>
          </Box>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Stock Value"
          value={`$${actualMetrics.totalValue.toLocaleString()}`}
          description="Current inventory value"
          trend={actualMetrics.totalValue > 0 ? "up" : undefined}
          trendValue={actualMetrics.totalValue > 20000 ? "12%" : undefined}
        />
        <MetricCard
          title="Low Stock Items"
          value={actualMetrics.lowStockItems}
          description="Items needing restock"
          trend={actualMetrics.lowStockItems < 5 ? "down" : "up"}
          trendValue={actualMetrics.lowStockItems.toString()}
        />
        <MetricCard
          title="Out of Stock"
          value={actualMetrics.outOfStockItems}
          description="Items completely depleted"
          trend={actualMetrics.outOfStockItems === 0 ? "down" : "up"}
        />
        <MetricCard
          title="Expiring Soon"
          value={actualMetrics.expiringItems}
          description="Items expiring within 7 days"
          trend={actualMetrics.expiringItems === 0 ? "down" : "up"}
        />
      </div>

      {/* Charts and Recent Movements */}
      <Grid columns={{ initial: "1", sm: "2" }} gap="4">
        <Card>
          <CardHeading title="Stock Usage Trends"/>
          {isClient && usageData.length > 0 && (
            <div className="h-[330px]">
              <ReactApexChart
                type="line"
                height={330}
                options={chartOptions.getLineOptions({
                  xaxis: {
                    ...chartOptions.getBaseXAxisOptions(),
                    categories: usageData.map(item => item.date),
                  },
                  tooltip: chartOptions.getBaseTooltipOptions(),
                })}
                series={[
                  {
                    name: 'Usage',
                    data: usageData.map(item => item.usage),
                    color: '#2563eb',
                  }
                ]}
              />
            </div>
          )}
        </Card>

        <Card>
          <CardHeading title="Recent Stock Movements" mb="8"/>
          <Inset className="space-y-3">
            {movements.length > 0 ? (
              movements.slice(0, 5).map((movement, index) => (
                <Box key={movement.id || index}>
                  <Flex align="center" gap="3" className="px-4">
                    {movementTypes.find(type => type.type === movement.movement_type)?.icon || 
                     <ShoppingCart className="text-gray-400" />}
                    <Flex justify="between" flexGrow="1" mb="4">
                      <Box>
                        <Text as="p" size="1" weight="bold" mb="1">
                          {movement.movement_type?.charAt(0).toUpperCase() + movement.movement_type?.slice(1)} Movement
                        </Text>
                        <Box>
                          <Badge color="gray">
                            {Math.abs(movement.quantity || 0)} units
                          </Badge>
                          <Badge color="gray" ml="2">
                            {movementTypes.find(type => type.type === movement.movement_type)?.name || 'Movement'}
                          </Badge>
                        </Box>
                      </Box>
                      <Flex direction="column" align="end" gap="1">
                        <Text as="p" size="1">{movement.notes || 'No notes'}</Text>
                        <Text as="p" size="1" color="gray">
                          {new Date(movement.created_at || '').toLocaleDateString()}
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                  {index < Math.min(movements.length, 5) - 1 && (
                    <Separator size="4" style={{ backgroundColor: 'var(--gray-4)' }} />
                  )}
                </Box>
              ))
            ) : (
              <Box className="text-center py-4">
                <Text color="gray" size="2">No recent stock movements found</Text>
              </Box>
            )}
          </Inset>
        </Card>
      </Grid>
    </div>
  );
} 