'use client';

import { useState } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Table, 
  Badge,
  IconButton,
  Text,
  Box,
  Grid,
  Select,
  TextField,
  Skeleton
} from '@radix-ui/themes';
import { Edit2, AlertTriangle, Search, Filter, Package } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useOrganization } from '@/contexts/OrganizationContext';
import StatsCard from '@/components/common/StatsCard';
import StockAdjustmentForm from '@/components/inventory/StockAdjustmentForm';
import LowStockAlerts from '@/components/inventory/LowStockAlerts';
import type { Database } from '@/lib/supabase/database.types';

type BranchInventory = Database['public']['Tables']['branch_inventory']['Row'] & {
  inventory_item?: Database['public']['Tables']['inventory_items']['Row'];
};

export default function StockOverviewPage() {
  usePageTitle('Stock Overview');
  const { currentBranch } = useOrganization();
  const { branchInventory, metrics, loading, error, refetchInventory } = useInventoryData();
  const [selectedStock, setSelectedStock] = useState<BranchInventory | null>(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStock = branchInventory.filter((stock) => {
    // Filter by stock level
    if (filter === 'low_stock' && (stock.current_quantity || 0) > (stock.reorder_point || 0)) {
      return false;
    }
    if (filter === 'out_of_stock' && (stock.current_quantity || 0) > 0) {
      return false;
    }

    // Filter by search term
    const itemName = stock.inventory_item?.name || '';
    if (searchTerm && !itemName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  const handleAdjustStock = (stockItem: BranchInventory) => {
    setSelectedStock(stockItem);
    setShowAdjustment(true);
  };

  const getStockStatus = (stock: BranchInventory) => {
    const currentQty = stock.current_quantity || 0;
    const reorderPoint = stock.reorder_point || 0;
    
    if (currentQty === 0) return { label: 'Out of Stock', color: 'red' as const };
    if (currentQty <= reorderPoint) return { label: 'Low Stock', color: 'orange' as const };
    return { label: 'In Stock', color: 'green' as const };
  };

  if (error) {
    return (
      <Container size="4">
        <Box className="p-8 text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
          <Heading size="5" className="mb-2">Error Loading Inventory</Heading>
          <Text color="gray">{error.message}</Text>
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
            <Heading size="7">Stock Overview</Heading>
            {currentBranch && (
              <Text size="2" color="gray">{currentBranch.name}</Text>
            )}
          </Box>
        </Flex>

        {/* Metrics */}
        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
          <StatsCard
            title="Total Items"
            value={loading ? '...' : metrics.totalItems.toString()}
            icon={<Package />}
            loading={loading}
          />
          <StatsCard
            title="Low Stock Items"
            value={loading ? '...' : metrics.lowStockItems.toString()}
            icon={<AlertTriangle />}
            loading={loading}
            trend={metrics.lowStockItems > 0 ? 'down' : 'neutral'}
          />
          <StatsCard
            title="Total Value"
            value={loading ? '...' : `$${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Box />}
            loading={loading}
          />
          <StatsCard
            title="Recent Movements"
            value={loading ? '...' : metrics.recentMovements.toString()}
            icon={<Box />}
            loading={loading}
          />
        </Grid>

        {/* Low Stock Alerts */}
        <LowStockAlerts />

        {/* Filters */}
        <Flex gap="4" align="center">
          <Box className="flex-1">
            <TextField.Root
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            >
              <TextField.Slot>
                <Search size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>
          
          <Select.Root value={filter} onValueChange={setFilter}>
            <Select.Trigger>
              <Flex gap="2" align="center">
                <Filter size={16} />
                <Text>Filter</Text>
              </Flex>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All Items</Select.Item>
              <Select.Item value="low_stock">Low Stock</Select.Item>
              <Select.Item value="out_of_stock">Out of Stock</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>

        {/* Stock Table */}
        {loading ? (
          <Box>
            <Skeleton height="400px" />
          </Box>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Item</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>SKU</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Current Stock</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Reorder Point</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Unit Cost</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Total Value</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredStock.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8}>
                    <Box className="p-8 text-center">
                      <Package size={48} className="mx-auto mb-4 text-gray-400" />
                      <Text color="gray">No inventory items found</Text>
                    </Box>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredStock.map((stock) => {
                  const status = getStockStatus(stock);
                  const totalValue = (stock.current_quantity || 0) * (stock.inventory_item?.cost_per_unit || 0);
                  
                  return (
                    <Table.Row key={stock.id}>
                      <Table.Cell>
                        <Box>
                          <Text weight="medium">{stock.inventory_item?.name || 'Unknown Item'}</Text>
                          {stock.inventory_item?.description && (
                            <Text size="1" color="gray" className="block">
                              {stock.inventory_item.description}
                            </Text>
                          )}
                        </Box>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2">{stock.inventory_item?.sku || '-'}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text weight="medium">
                          {stock.current_quantity || 0} units
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {stock.reorder_point || 0} units
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2">
                          ${(stock.inventory_item?.cost_per_unit || 0).toFixed(2)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text weight="medium">
                          ${totalValue.toFixed(2)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={status.color}>{status.label}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <IconButton
                          size="1"
                          variant="ghost"
                          onClick={() => handleAdjustStock(stock)}
                          title="Adjust stock"
                        >
                          <Edit2 size={14} />
                        </IconButton>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table.Root>
        )}

        {/* Stock Adjustment Form */}
        {selectedStock && (
          <StockAdjustmentForm
            inventoryItem={selectedStock}
            open={showAdjustment}
            onClose={() => {
              setShowAdjustment(false);
              setSelectedStock(null);
            }}
            onSuccess={() => {
              refetchInventory();
              setSelectedStock(null);
            }}
          />
        )}
      </Flex>
    </Container>
  );
}
