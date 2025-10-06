# Task 1.3: Inventory Management Integration

**Task ID**: TASK-01-003  
**Phase**: 1 - Frontend Integration  
**Priority**: 🔴 P0 - Critical  
**Estimated Time**: 3-4 days  
**Complexity**: 🟡 Medium  
**Status**: 📋 Not Started

---

## 1. Detailed Request Analysis

### What is Being Requested

Replace mock inventory data with real Supabase API calls, implementing:
- Inventory items management (ingredients, supplies, finished goods)
- Stock level tracking per branch
- Stock adjustments and movements logging
- Low stock alerts and reorder point management
- Automatic stock deduction based on sales

### Current State
- Inventory uses mock data from `IngredientItemsData.ts` and `StockItemData.ts`
- Static stock displays with no real tracking
- No connection to actual database
- No movement history or audit trail
- Manual stock management only

### Target State
- Live inventory data from Supabase database
- Real-time stock level tracking
- Automated stock deduction from sales
- Comprehensive movement logging
- Low stock alerts with configurable thresholds
- Multi-branch stock management
- Integration with menu items for recipe calculations

### Affected Files
```
src/app/(default)/inventory/
├── items/page.tsx
├── stock-overview/page.tsx
├── stock-alerts/page.tsx
├── movements/page.tsx
└── adjustments/page.tsx

src/components/inventory/
├── InventoryItemForm.tsx
├── StockAdjustmentForm.tsx
├── StockMovementLog.tsx
├── LowStockAlerts.tsx
└── BranchStockTable.tsx

src/data/
├── IngredientItemsData.ts (to be replaced)
├── StockItemData.ts (to be replaced)
└── StockTransferLogData.ts (to be replaced)
```

---

## 2. Justification and Benefits

### Why This Task is Critical

**Business Value**:
- ✅ Prevent stockouts and overstock situations
- ✅ Accurate cost of goods sold (COGS) calculations
- ✅ Automatic reorder notifications
- ✅ Multi-location inventory visibility
- ✅ Waste reduction through better tracking

**Technical Benefits**:
- ✅ Validates inventoryService implementation
- ✅ Tests complex database relationships
- ✅ Establishes audit logging patterns
- ✅ Proves multi-branch data filtering

**User Impact**:
- ✅ Restaurant staff can track inventory accurately
- ✅ Automated alerts prevent running out of ingredients
- ✅ Management gets visibility into inventory costs
- ✅ Reduces manual inventory counting

### Problems It Solves
1. **Manual Inventory Tracking**: Currently no digital inventory system
2. **No Stock Visibility**: Can't see current stock levels
3. **No Movement History**: No audit trail for stock changes
4. **No Automation**: Manual stock adjustments only
5. **No Integration**: Inventory not connected to sales or recipes

---

## 3. Prerequisites

### Knowledge Requirements
- ✅ Inventory management concepts (FIFO, reorder points, safety stock)
- ✅ Data aggregation and calculations
- ✅ Real-time data updates
- ✅ Form validation and error handling
- ✅ Table sorting and filtering

### Technical Prerequisites
- ✅ Task 1.1 (Dashboard Integration) completed
- ✅ inventoryService implemented (`src/lib/services/inventory.service.ts`)
- ✅ Database schema for inventory tables deployed
- ✅ Branch context working properly
- ✅ User permissions for inventory management

### Environment Prerequisites
- ✅ Test inventory data in database
- ✅ Multiple branches configured for testing
- ✅ Organization context working
- ✅ Authentication and authorization working

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "date-fns": "^2.x",
  "recharts": "^2.x"
}
```

---

## 4. Implementation Methodology

### Step 1: Create Inventory Hooks (2-3 hours)

#### 1.1 Create `src/hooks/useInventoryData.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { inventoryService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type BranchStock = Database['public']['Tables']['branch_stock']['Row'];
type StockMovement = Database['public']['Tables']['stock_movements']['Row'];

interface InventoryMetrics {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  recentMovements: number;
}

interface UseInventoryDataReturn {
  items: InventoryItem[];
  branchStock: BranchStock[];
  movements: StockMovement[];
  metrics: InventoryMetrics;
  loading: boolean;
  error: Error | null;
  refetchItems: () => Promise<void>;
  refetchStock: () => Promise<void>;
  refetchMovements: () => Promise<void>;
}

export const useInventoryData = (): UseInventoryDataReturn => {
  const { currentOrganization, currentBranch } = useOrganization();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [branchStock, setBranchStock] = useState<BranchStock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    recentMovements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInventoryItems = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const itemsData = await inventoryService.getItems({
        organizationId: currentOrganization.id,
      });
      setItems(itemsData);
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchBranchStock = useCallback(async () => {
    if (!currentOrganization || !currentBranch) return;

    try {
      const stockData = await inventoryService.getBranchStock({
        organizationId: currentOrganization.id,
        branchId: currentBranch.id,
      });
      setBranchStock(stockData);
    } catch (err) {
      console.error('Error fetching branch stock:', err);
      throw err;
    }
  }, [currentOrganization, currentBranch]);

  const fetchStockMovements = useCallback(async () => {
    if (!currentOrganization || !currentBranch) return;

    try {
      const movementsData = await inventoryService.getMovements({
        branchId: currentBranch.id,
        limit: 50,
      });
      setMovements(movementsData);
    } catch (err) {
      console.error('Error fetching stock movements:', err);
      throw err;
    }
  }, [currentOrganization, currentBranch]);

  const fetchAllData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchInventoryItems(),
        fetchBranchStock(),
        fetchStockMovements(),
      ]);

      // Calculate metrics
      const lowStockItems = await inventoryService.getLowStockItems({
        organizationId: currentOrganization.id,
        branchId: currentBranch?.id,
      });

      const totalValue = branchStock.reduce(
        (sum, stock) => sum + (stock.current_stock * stock.unit_cost || 0),
        0
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const recentMovements = movements.filter(
        movement => new Date(movement.created_at) >= today
      ).length;

      setMetrics({
        totalItems: items.length,
        lowStockItems: lowStockItems.length,
        totalValue,
        recentMovements,
      });
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentOrganization, currentBranch]);

  return {
    items,
    branchStock,
    movements,
    metrics,
    loading,
    error,
    refetchItems: fetchInventoryItems,
    refetchStock: fetchBranchStock,
    refetchMovements: fetchStockMovements,
  };
};
```

#### 1.2 Create `src/hooks/useStockAdjustment.ts`

```typescript
import { useState } from 'react';
import { inventoryService } from '@/lib/services';
import { toast } from 'sonner';

interface UseStockAdjustmentReturn {
  adjustStock: (params: {
    branchId: string;
    inventoryItemId: string;
    adjustment: number;
    reason: string;
    notes?: string;
  }) => Promise<void>;
  isAdjusting: boolean;
  error: Error | null;
}

export const useStockAdjustment = (): UseStockAdjustmentReturn => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const adjustStock = async (params: {
    branchId: string;
    inventoryItemId: string;
    adjustment: number;
    reason: string;
    notes?: string;
  }) => {
    try {
      setIsAdjusting(true);
      setError(null);

      await inventoryService.adjustStock(params);
      
      toast.success(
        `Stock ${params.adjustment > 0 ? 'increased' : 'decreased'} by ${Math.abs(params.adjustment)}`
      );
    } catch (err) {
      console.error('Error adjusting stock:', err);
      setError(err as Error);
      toast.error('Failed to adjust stock');
      throw err;
    } finally {
      setIsAdjusting(false);
    }
  };

  return { adjustStock, isAdjusting, error };
};
```

**Success Criteria**:
- ✅ Hooks compile without errors
- ✅ Data fetching works correctly
- ✅ Stock adjustments function properly
- ✅ Error handling implemented

---

### Step 2: Create Form Components (3-4 hours)

#### 2.1 Create `src/components/inventory/InventoryItemForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  Button, 
  TextField, 
  TextArea, 
  Select,
  Flex, 
  Box,
  Text 
} from '@radix-ui/themes';
import { useOrganization } from '@/contexts/OrganizationContext';
import { inventoryService } from '@/lib/services';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100),
  description: z.string().optional(),
  sku: z.string().optional(),
  unit: z.enum(['kg', 'g', 'l', 'ml', 'piece', 'box', 'pack']),
  category: z.enum(['ingredient', 'supply', 'finished_good']),
  unit_cost: z.number().min(0, 'Cost must be positive').optional(),
  reorder_point: z.number().min(0, 'Reorder point must be positive').default(0),
  max_stock_level: z.number().min(0, 'Max stock must be positive').optional(),
  supplier_info: z.object({
    supplier_name: z.string().optional(),
    supplier_sku: z.string().optional(),
  }).optional(),
});

type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

interface InventoryItemFormProps {
  inventoryItem?: InventoryItem;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InventoryItemForm({ 
  inventoryItem, 
  open, 
  onClose, 
  onSuccess 
}: InventoryItemFormProps) {
  const { currentOrganization } = useOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: inventoryItem ? {
      name: inventoryItem.name,
      description: inventoryItem.description || '',
      sku: inventoryItem.sku || '',
      unit: inventoryItem.unit as any,
      category: inventoryItem.category as any,
      unit_cost: inventoryItem.unit_cost || 0,
      reorder_point: inventoryItem.reorder_point,
      max_stock_level: inventoryItem.max_stock_level || 0,
      supplier_info: inventoryItem.supplier_info || {},
    } : {
      reorder_point: 0,
      category: 'ingredient',
      unit: 'kg',
    },
  });

  const onSubmit = async (data: InventoryItemFormData) => {
    if (!currentOrganization) return;

    try {
      const itemData = {
        ...data,
        organization_id: currentOrganization.id,
      };

      if (inventoryItem) {
        await inventoryService.updateItem(inventoryItem.id, itemData);
        toast.success('Inventory item updated successfully');
      } else {
        await inventoryService.createItem(itemData);
        toast.success('Inventory item created successfully');
      }
      
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      toast.error('Failed to save inventory item');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 550 }}>
        <Dialog.Title>
          {inventoryItem ? 'Edit Inventory Item' : 'Create Inventory Item'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Basic Info */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Item Name *</Text>
                <TextField.Root
                  {...register('name')}
                  placeholder="Enter item name"
                />
                {errors.name && (
                  <Text size="1" color="red">{errors.name.message}</Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">SKU</Text>
                <TextField.Root
                  {...register('sku')}
                  placeholder="Optional SKU"
                />
              </Box>
            </Flex>

            {/* Category and Unit */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Category *</Text>
                <Select.Root
                  onValueChange={(value) => setValue('category', value as any)}
                  defaultValue={inventoryItem?.category || 'ingredient'}
                >
                  <Select.Trigger placeholder="Select category" />
                  <Select.Content>
                    <Select.Item value="ingredient">Ingredient</Select.Item>
                    <Select.Item value="supply">Supply</Select.Item>
                    <Select.Item value="finished_good">Finished Good</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">Unit *</Text>
                <Select.Root
                  onValueChange={(value) => setValue('unit', value as any)}
                  defaultValue={inventoryItem?.unit || 'kg'}
                >
                  <Select.Trigger placeholder="Select unit" />
                  <Select.Content>
                    <Select.Item value="kg">Kilogram (kg)</Select.Item>
                    <Select.Item value="g">Gram (g)</Select.Item>
                    <Select.Item value="l">Liter (l)</Select.Item>
                    <Select.Item value="ml">Milliliter (ml)</Select.Item>
                    <Select.Item value="piece">Piece</Select.Item>
                    <Select.Item value="box">Box</Select.Item>
                    <Select.Item value="pack">Pack</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>

            {/* Description */}
            <Box>
              <Text as="label" size="2" weight="medium">Description</Text>
              <TextArea
                {...register('description')}
                placeholder="Enter item description"
                rows={2}
              />
            </Box>

            {/* Cost and Stock Levels */}
            <Flex gap="4">
              <Box>
                <Text as="label" size="2" weight="medium">Unit Cost ($)</Text>
                <TextField.Root
                  {...register('unit_cost', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">Reorder Point</Text>
                <TextField.Root
                  {...register('reorder_point', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">Max Stock Level</Text>
                <TextField.Root
                  {...register('max_stock_level', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="Optional"
                />
              </Box>
            </Flex>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button type="button" variant="soft" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : inventoryItem ? 'Update' : 'Create'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

#### 2.2 Create `src/components/inventory/StockAdjustmentForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  Button, 
  TextField, 
  TextArea, 
  Select,
  Flex, 
  Box,
  Text,
  Card 
} from '@radix-ui/themes';
import { useStockAdjustment } from '@/hooks/useStockAdjustment';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/lib/supabase/database.types';

type BranchStock = Database['public']['Tables']['branch_stock']['Row'] & {
  inventory_items: { name: string; unit: string };
};

const stockAdjustmentSchema = z.object({
  adjustment: z.number().refine(val => val !== 0, 'Adjustment cannot be zero'),
  reason: z.enum(['purchase', 'waste', 'theft', 'correction', 'transfer', 'usage']),
  notes: z.string().optional(),
});

type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentFormProps {
  stockItem: BranchStock;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockAdjustmentForm({ 
  stockItem, 
  open, 
  onClose, 
  onSuccess 
}: StockAdjustmentFormProps) {
  const { currentBranch } = useOrganization();
  const { adjustStock, isAdjusting } = useStockAdjustment();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      reason: 'correction',
    },
  });

  const adjustment = watch('adjustment');

  const onSubmit = async (data: StockAdjustmentFormData) => {
    if (!currentBranch) return;

    try {
      await adjustStock({
        branchId: currentBranch.id,
        inventoryItemId: stockItem.inventory_item_id,
        adjustment: data.adjustment,
        reason: data.reason,
        notes: data.notes,
      });
      
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      // Error handling done in hook
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Adjust Stock</Dialog.Title>
        
        {/* Current Stock Info */}
        <Card className="mb-4">
          <Box>
            <Text size="3" weight="medium">{stockItem.inventory_items.name}</Text>
            <Text size="2" color="gray" className="block">
              Current Stock: {stockItem.current_stock} {stockItem.inventory_items.unit}
            </Text>
            {adjustment && (
              <Text size="2" color={adjustment > 0 ? 'green' : 'red'} className="block">
                New Stock: {stockItem.current_stock + adjustment} {stockItem.inventory_items.unit}
              </Text>
            )}
          </Box>
        </Card>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Adjustment Amount */}
            <Box>
              <Text as="label" size="2" weight="medium">
                Adjustment Amount *
              </Text>
              <TextField.Root
                {...register('adjustment', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="Enter + or - amount"
              />
              {errors.adjustment && (
                <Text size="1" color="red">
                  {errors.adjustment.message}
                </Text>
              )}
              <Text size="1" color="gray">
                Use positive numbers to increase stock, negative to decrease
              </Text>
            </Box>

            {/* Reason */}
            <Box>
              <Text as="label" size="2" weight="medium">Reason *</Text>
              <Select.Root
                onValueChange={(value) => setValue('reason', value as any)}
                defaultValue="correction"
              >
                <Select.Trigger placeholder="Select reason" />
                <Select.Content>
                  <Select.Item value="purchase">Purchase/Delivery</Select.Item>
                  <Select.Item value="waste">Waste/Spoilage</Select.Item>
                  <Select.Item value="theft">Theft/Loss</Select.Item>
                  <Select.Item value="correction">Inventory Correction</Select.Item>
                  <Select.Item value="transfer">Transfer</Select.Item>
                  <Select.Item value="usage">Usage/Consumption</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Notes */}
            <Box>
              <Text as="label" size="2" weight="medium">Notes</Text>
              <TextArea
                {...register('notes')}
                placeholder="Optional notes about this adjustment"
                rows={3}
              />
            </Box>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button type="button" variant="soft" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAdjusting}>
                {isAdjusting ? 'Adjusting...' : 'Adjust Stock'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

**Success Criteria**:
- ✅ Form renders without errors
- ✅ Stock adjustment calculations work
- ✅ Validation prevents invalid inputs
- ✅ Success/error feedback provided

---

### Step 3: Create List and Overview Pages (2-3 hours)

#### 3.1 Update `src/app/(default)/inventory/stock-overview/page.tsx`

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
  IconButton,
  Text,
  Box,
  Grid,
  Select,
  TextField
} from '@radix-ui/themes';
import { Plus, Edit2, AlertTriangle, Search, Filter } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useOrganization } from '@/contexts/OrganizationContext';
import StatsCard from '@/components/common/StatsCard';
import StockAdjustmentForm from '@/components/inventory/StockAdjustmentForm';

export default function StockOverviewPage() {
  usePageTitle('Stock Overview');
  const { currentBranch } = useOrganization();
  const { branchStock, metrics, loading, error, refetchStock } = useInventoryData();
  const [selectedStock, setSelectedStock] = useState(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStock = branchStock.filter((stock) => {
    // Filter by stock level
    if (filter === 'low_stock' && stock.current_stock > stock.inventory_items.reorder_point) {
      return false;
    }
    if (filter === 'out_of_stock' && stock.current_stock > 0) {
      return false;
    }

    // Filter by search term
    if (searchTerm && !stock.inventory_items.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  const handleAdjustStock = (stockItem) => {
    setSelectedStock(stockItem);
    setShowAdjustment(true);
  };

  const getStockStatus = (stock) => {
    if (stock.current_stock === 0) return { label: 'Out of Stock', color: 'red' };
    if (stock.current_stock <= stock.inventory_items.reorder_point) return { label: 'Low Stock', color: 'orange' };
    return { label: 'In Stock', color: 'green' };
  };

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
            value={metrics.totalItems.toString()}
            icon={<Box />}
            loading={loading}
          />
          <StatsCard
            title="Low Stock Items"
            value={metrics.lowStockItems.toString()}
            icon={<AlertTriangle />}
            loading={loading}
            trend={metrics.lowStockItems > 0 ? 'down' : 'neutral'}
          />
          <StatsCard
            title="Total Value"
            value={`$${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<Box />}
            loading={loading}
          />
          <StatsCard
            title="Recent Movements"
            value={metrics.recentMovements.toString()}
            icon={<Box />}
            loading={loading}
          />
        </Grid>

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
              <Filter size={16} />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All Items</Select.Item>
              <Select.Item value="low_stock">Low Stock</Select.Item>
              <Select.Item value="out_of_stock">Out of Stock</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>

        {/* Stock Table */}
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Item</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>SKU</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Current Stock</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Unit Cost</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Total Value</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredStock.map((stock) => {
              const status = getStockStatus(stock);
              return (
                <Table.Row key={stock.id}>
                  <Table.Cell>
                    <Box>
                      <Text weight="medium">{stock.inventory_items.name}</Text>
                      <Text size="1" color="gray">{stock.inventory_items.category}</Text>
                    </Box>
                  </Table.Cell>
                  <Table.Cell>{stock.inventory_items.sku || '-'}</Table.Cell>
                  <Table.Cell>
                    <Text>
                      {stock.current_stock} {stock.inventory_items.unit}
                    </Text>
                    {stock.current_stock <= stock.inventory_items.reorder_point && (
                      <Text size="1" color="orange" className="block">
                        Below reorder point ({stock.inventory_items.reorder_point})
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    ${stock.unit_cost?.toFixed(2) || '0.00'}
                  </Table.Cell>
                  <Table.Cell>
                    ${((stock.current_stock * (stock.unit_cost || 0)).toFixed(2))}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={status.color}>{status.label}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <IconButton
                      size="1"
                      variant="ghost"
                      onClick={() => handleAdjustStock(stock)}
                    >
                      <Edit2 size={14} />
                    </IconButton>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>

        {/* Stock Adjustment Form */}
        {selectedStock && (
          <StockAdjustmentForm
            stockItem={selectedStock}
            open={showAdjustment}
            onClose={() => setShowAdjustment(false)}
            onSuccess={() => {
              refetchStock();
              setSelectedStock(null);
            }}
          />
        )}
      </Flex>
    </Container>
  );
}
```

**Success Criteria**:
- ✅ Stock overview displays correctly
- ✅ Search and filter functionality works
- ✅ Stock adjustments can be made
- ✅ Real-time stock levels displayed
- ✅ Low stock alerts visible

---

### Step 4: Create Alert System (1-2 hours)

#### 4.1 Create `src/components/inventory/LowStockAlerts.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { 
  Card, 
  Flex, 
  Heading, 
  Text, 
  Badge,
  Button,
  Box 
} from '@radix-ui/themes';
import { AlertTriangle, Package } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { inventoryService } from '@/lib/services';

export default function LowStockAlerts() {
  const { currentOrganization, currentBranch } = useOrganization();
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization || !currentBranch) return;

    const fetchLowStockItems = async () => {
      try {
        const items = await inventoryService.getLowStockItems({
          organizationId: currentOrganization.id,
          branchId: currentBranch.id,
        });
        setLowStockItems(items);
      } catch (error) {
        console.error('Error fetching low stock items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockItems();
  }, [currentOrganization, currentBranch]);

  if (loading || lowStockItems.length === 0) {
    return null;
  }

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Flex align="center" gap="2">
          <AlertTriangle size={20} color="orange" />
          <Heading size="4" color="orange">Low Stock Alerts</Heading>
        </Flex>

        {lowStockItems.map((item) => (
          <Flex key={item.id} justify="between" align="center" className="p-3 border rounded">
            <Flex align="center" gap="3">
              <Package size={16} color="gray" />
              <Box>
                <Text weight="medium">{item.inventory_items.name}</Text>
                <Text size="1" color="gray">
                  Current: {item.current_stock} {item.inventory_items.unit} | 
                  Reorder at: {item.inventory_items.reorder_point}
                </Text>
              </Box>
            </Flex>
            <Badge color="orange">Low Stock</Badge>
          </Flex>
        ))}

        <Button size="1" variant="soft">
          Create Purchase Order
        </Button>
      </Flex>
    </Card>
  );
}
```

**Success Criteria**:
- ✅ Alerts display for low stock items
- ✅ Shows current vs. reorder point
- ✅ Links to purchase order creation
- ✅ Updates when stock changes

---

### Step 5: Testing and Validation (1-2 hours)

#### 5.1 Manual Testing Checklist
```
Inventory Items:
- [ ] Items page loads correctly
- [ ] Can create new inventory items
- [ ] Can edit existing items
- [ ] Form validation works (required fields)
- [ ] Unit and category dropdowns work
- [ ] Cost calculations correct

Stock Overview:
- [ ] Stock overview displays current levels
- [ ] Search and filter functionality works
- [ ] Stock adjustments can be made
- [ ] Adjustment form validation works
- [ ] Stock history tracked correctly
- [ ] Value calculations correct

Alerts:
- [ ] Low stock alerts display correctly
- [ ] Alert thresholds work properly
- [ ] Alerts update when stock changes
- [ ] Can navigate to purchase orders

Integration:
- [ ] Stock deducts when orders placed
- [ ] Recipe ingredients linked to inventory
- [ ] Multi-branch stock separation works
- [ ] Organization context respected
```

---

## 5. Success Criteria

### Functional Requirements
- ✅ **Inventory Items**: Full CRUD operations working
- ✅ **Stock Tracking**: Accurate stock levels per branch
- ✅ **Stock Adjustments**: Manual adjustments with audit trail
- ✅ **Low Stock Alerts**: Automatic notifications when stock low
- ✅ **Search & Filter**: Find items quickly
- ✅ **Multi-Branch**: Separate stock per location

### Technical Requirements
- ✅ **No Mock Data**: All imports from `data/` folder removed
- ✅ **Real-time Updates**: Stock changes reflect immediately
- ✅ **Type Safety**: Proper TypeScript types throughout
- ✅ **Error Handling**: Graceful error recovery
- ✅ **Performance**: Pages load in < 3 seconds

### Business Requirements
- ✅ **Audit Trail**: All stock movements logged
- ✅ **Cost Tracking**: Accurate inventory valuation
- ✅ **Reorder Management**: Prevent stockouts
- ✅ **Waste Tracking**: Monitor inventory losses

---

## 6. Deliverables

### Code Files
```
✅ src/hooks/useInventoryData.ts (new)
✅ src/hooks/useStockAdjustment.ts (new)
✅ src/components/inventory/InventoryItemForm.tsx (new)
✅ src/components/inventory/StockAdjustmentForm.tsx (new)
✅ src/components/inventory/LowStockAlerts.tsx (new)
✅ src/app/(default)/inventory/items/page.tsx (updated)
✅ src/app/(default)/inventory/stock-overview/page.tsx (updated)
✅ src/app/(default)/inventory/stock-alerts/page.tsx (updated)
```

---

## 7. Rollback Plan

If integration fails:
1. Restore mock inventory data temporarily
2. Keep existing UI using mock data
3. Debug inventoryService separately
4. Test stock adjustments in isolation
5. Fix issues incrementally

---

## 8. Next Steps After Completion

1. **Code Review**: Get team feedback on inventory logic
2. **Integration**: Link with purchasing module
3. **Automation**: Add automatic stock deduction from sales
4. **Move to Next Task**: POS Operations Integration (Task 1.4)

---

**Status**: 📋 Ready to Start  
**Dependencies**: Task 1.1 (Dashboard), inventoryService  
**Blocked By**: None  
**Blocks**: Task 1.7 (Purchasing), Task 5.4 (Advanced Inventory)
