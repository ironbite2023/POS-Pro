# Task 1.7: Purchasing Integration

**Task ID**: TASK-01-007  
**Phase**: 1 - Frontend Integration  
**Priority**: 🟡 P1 - High  
**Estimated Time**: 3-4 days  
**Complexity**: 🟡 Medium  
**Status**: 📋 Not Started

---

## 1. Detailed Request Analysis

### What is Being Requested

Replace mock purchasing data with real Supabase API calls, implementing:
- Supplier management with contact information and performance tracking
- Purchase order creation, approval, and tracking workflow
- Receiving workflow with quantity verification and invoice matching
- Cost analysis and purchasing analytics
- Integration with inventory for automatic stock updates

### Current State
- Purchasing pages use mock data from `PurchaseOrderData.ts` and `SupplierData.ts`
- Static supplier and PO displays with no real functionality
- No connection to actual database
- No automated stock updates from receiving
- Manual purchasing workflow only

### Target State
- Live purchasing data from Supabase database
- Complete purchase order lifecycle management
- Automated stock updates upon receiving
- Supplier performance tracking and analytics
- Cost analysis and trend monitoring
- Integration with inventory management for seamless operations

### Affected Files
```
src/app/(default)/purchasing/
├── suppliers/page.tsx
├── purchase-orders/page.tsx
├── receiving/page.tsx
├── analytics/page.tsx
└── settings/page.tsx

src/components/purchasing/
├── SupplierForm.tsx
├── PurchaseOrderForm.tsx
├── ReceivingForm.tsx
├── PurchaseOrderCard.tsx
├── SupplierPerformance.tsx
├── CostAnalysis.tsx
└── PurchasingAnalytics.tsx

src/data/
├── PurchaseOrderData.ts (to be replaced)
└── SupplierData.ts (to be replaced)
```

---

## 2. Justification and Benefits

### Why This Task is Important

**Business Value**:
- ✅ Streamlined procurement process
- ✅ Better supplier relationship management
- ✅ Cost control and budget management
- ✅ Inventory replenishment automation
- ✅ Compliance and audit trail for purchases

**Technical Benefits**:
- ✅ Validates purchasingService implementation
- ✅ Tests complex workflow state management
- ✅ Proves integration with inventory system
- ✅ Establishes approval and audit patterns

**User Impact**:
- ✅ Staff can manage suppliers efficiently
- ✅ Automated purchase order workflows
- ✅ Simplified receiving process
- ✅ Better cost visibility and control

### Problems It Solves
1. **Manual Purchasing**: No digital purchase order system
2. **No Supplier Tracking**: No centralized supplier management
3. **Inventory Disconnect**: Purchasing not linked to inventory
4. **No Cost Analysis**: No purchasing performance insights
5. **Manual Workflows**: Paper-based processes prone to errors

---

## 3. Prerequisites

### Knowledge Requirements
- ✅ Procurement and purchasing concepts
- ✅ Purchase order workflows and approval processes
- ✅ Receiving and invoice matching procedures
- ✅ Supplier management best practices
- ✅ Cost analysis and purchasing metrics

### Technical Prerequisites
- ✅ Task 1.1 (Dashboard Integration) completed
- ✅ Task 1.3 (Inventory Management) completed
- ✅ purchasingService implemented (`src/lib/services/purchasing.service.ts`)
- ✅ Database schema for purchasing tables deployed
- ✅ Integration with inventory for stock updates
- ✅ User permissions for purchasing operations

### Environment Prerequisites
- ✅ Test supplier data
- ✅ Sample purchase orders
- ✅ Inventory items for PO creation
- ✅ Organization and branch context working

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

### Step 1: Create Purchasing Data Hooks (2-3 hours)

#### 1.1 Create `src/hooks/usePurchasingData.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { purchasingService, inventoryService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];
type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

interface PurchasingMetrics {
  totalSuppliers: number;
  activePurchaseOrders: number;
  pendingReceiving: number;
  monthlySpend: number;
  averageOrderValue: number;
  topSupplierByVolume: string;
}

interface UsePurchasingDataReturn {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  inventoryItems: InventoryItem[];
  metrics: PurchasingMetrics;
  loading: boolean;
  error: Error | null;
  refetchSuppliers: () => Promise<void>;
  refetchPurchaseOrders: () => Promise<void>;
  refetchInventoryItems: () => Promise<void>;
}

export const usePurchasingData = (): UsePurchasingDataReturn => {
  const { currentOrganization } = useOrganization();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState<PurchasingMetrics>({
    totalSuppliers: 0,
    activePurchaseOrders: 0,
    pendingReceiving: 0,
    monthlySpend: 0,
    averageOrderValue: 0,
    topSupplierByVolume: '-',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuppliers = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const suppliersData = await purchasingService.getSuppliers({
        organizationId: currentOrganization.id,
      });
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchPurchaseOrders = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const purchaseOrdersData = await purchasingService.getPurchaseOrders({
        organizationId: currentOrganization.id,
      });
      setPurchaseOrders(purchaseOrdersData);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchInventoryItems = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const itemsData = await inventoryService.getItems({
        organizationId: currentOrganization.id,
      });
      setInventoryItems(itemsData);
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchAllData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchSuppliers(),
        fetchPurchaseOrders(),
        fetchInventoryItems(),
      ]);

      // Calculate metrics
      const totalSuppliers = suppliers.length;
      const activePurchaseOrders = purchaseOrders.filter(
        po => po.status === 'pending' || po.status === 'approved' || po.status === 'sent'
      ).length;
      const pendingReceiving = purchaseOrders.filter(
        po => po.status === 'sent'
      ).length;

      // Calculate monthly spend (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const monthlyOrders = purchaseOrders.filter(
        po => new Date(po.created_at) >= thirtyDaysAgo && po.status === 'completed'
      );
      const monthlySpend = monthlyOrders.reduce((sum, po) => sum + po.total_amount, 0);
      const averageOrderValue = monthlyOrders.length > 0 
        ? monthlySpend / monthlyOrders.length 
        : 0;

      // Top supplier by volume
      const supplierVolumes = suppliers.map(supplier => ({
        name: supplier.name,
        volume: purchaseOrders
          .filter(po => po.supplier_id === supplier.id && po.status === 'completed')
          .reduce((sum, po) => sum + po.total_amount, 0)
      }));
      const topSupplier = supplierVolumes.sort((a, b) => b.volume - a.volume)[0];

      setMetrics({
        totalSuppliers,
        activePurchaseOrders,
        pendingReceiving,
        monthlySpend,
        averageOrderValue,
        topSupplierByVolume: topSupplier?.name || '-',
      });
    } catch (err) {
      console.error('Error fetching purchasing data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentOrganization]);

  return {
    suppliers,
    purchaseOrders,
    inventoryItems,
    metrics,
    loading,
    error,
    refetchSuppliers: fetchSuppliers,
    refetchPurchaseOrders: fetchPurchaseOrders,
    refetchInventoryItems: fetchInventoryItems,
  };
};
```

#### 1.2 Create `src/hooks/usePurchaseOrderActions.ts`

```typescript
import { useState } from 'react';
import { purchasingService, inventoryService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface UsePurchaseOrderActionsReturn {
  createPurchaseOrder: (poData: any) => Promise<any>;
  updatePurchaseOrderStatus: (poId: string, status: string) => Promise<void>;
  receivePurchaseOrder: (poId: string, receivedItems: any[]) => Promise<void>;
  isProcessing: boolean;
  error: Error | null;
}

export const usePurchaseOrderActions = (): UsePurchaseOrderActionsReturn => {
  const { currentOrganization } = useOrganization();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPurchaseOrder = async (poData: any) => {
    if (!currentOrganization) throw new Error('No organization selected');

    try {
      setIsProcessing(true);
      setError(null);

      const purchaseOrder = await purchasingService.createPurchaseOrder({
        ...poData,
        organization_id: currentOrganization.id,
      });

      toast.success('Purchase order created successfully!');
      return purchaseOrder;
    } catch (err) {
      console.error('Error creating purchase order:', err);
      setError(err as Error);
      toast.error('Failed to create purchase order');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const updatePurchaseOrderStatus = async (poId: string, status: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      await purchasingService.updatePurchaseOrderStatus(poId, status);
      toast.success(`Purchase order ${status}`);
    } catch (err) {
      console.error('Error updating purchase order status:', err);
      setError(err as Error);
      toast.error('Failed to update purchase order');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const receivePurchaseOrder = async (poId: string, receivedItems: any[]) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Update PO status to received
      await purchasingService.updatePurchaseOrderStatus(poId, 'received');

      // Update inventory stock for each received item
      for (const item of receivedItems) {
        await inventoryService.adjustStock({
          branchId: item.branchId,
          inventoryItemId: item.inventoryItemId,
          adjustment: item.receivedQuantity,
          reason: 'purchase',
          notes: `Received from PO #${item.poNumber}`,
        });
      }

      toast.success('Purchase order received and inventory updated!');
    } catch (err) {
      console.error('Error receiving purchase order:', err);
      setError(err as Error);
      toast.error('Failed to receive purchase order');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    receivePurchaseOrder,
    isProcessing,
    error,
  };
};
```

**Success Criteria**:
- ✅ Hooks compile without errors
- ✅ Purchasing data fetching works correctly
- ✅ PO operations function properly
- ✅ Inventory integration works

---

### Step 2: Create Purchasing Forms (3-4 hours)

#### 2.1 Create `src/components/purchasing/SupplierForm.tsx`

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
import { purchasingService } from '@/lib/services';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(100),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  payment_terms: z.string().optional(),
  delivery_days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).default([]),
  minimum_order: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier?: Supplier;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SupplierForm({ 
  supplier, 
  open, 
  onClose, 
  onSuccess 
}: SupplierFormProps) {
  const { currentOrganization } = useOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier ? {
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address as any || {},
      payment_terms: supplier.payment_terms || '',
      delivery_days: supplier.delivery_days || [],
      minimum_order: supplier.minimum_order || 0,
      notes: supplier.notes || '',
    } : {
      delivery_days: [],
      address: {},
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    if (!currentOrganization) return;

    try {
      const supplierData = {
        ...data,
        organization_id: currentOrganization.id,
        status: 'active',
      };

      if (supplier) {
        await purchasingService.updateSupplier(supplier.id, supplierData);
        toast.success('Supplier updated successfully');
      } else {
        await purchasingService.createSupplier(supplierData);
        toast.success('Supplier created successfully');
      }
      
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Failed to save supplier');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 600 }}>
        <Dialog.Title>
          {supplier ? 'Edit Supplier' : 'Create Supplier'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Basic Info */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Supplier Name *</Text>
                <TextField.Root
                  {...register('name')}
                  placeholder="Enter supplier name"
                />
                {errors.name && (
                  <Text size="1" color="red">{errors.name.message}</Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">Contact Person</Text>
                <TextField.Root
                  {...register('contact_person')}
                  placeholder="Contact person name"
                />
              </Box>
            </Flex>

            {/* Contact Info */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Email</Text>
                <TextField.Root
                  {...register('email')}
                  type="email"
                  placeholder="supplier@example.com"
                />
                {errors.email && (
                  <Text size="1" color="red">{errors.email.message}</Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">Phone</Text>
                <TextField.Root
                  {...register('phone')}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                />
              </Box>
            </Flex>

            {/* Address */}
            <Box>
              <Text as="label" size="2" weight="medium">Address</Text>
              <Flex direction="column" gap="2">
                <TextField.Root
                  {...register('address.street')}
                  placeholder="Street address"
                />
                <Flex gap="2">
                  <TextField.Root
                    {...register('address.city')}
                    placeholder="City"
                  />
                  <TextField.Root
                    {...register('address.state')}
                    placeholder="State"
                  />
                  <TextField.Root
                    {...register('address.zip_code')}
                    placeholder="ZIP"
                  />
                </Flex>
              </Flex>
            </Box>

            {/* Business Terms */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Payment Terms</Text>
                <TextField.Root
                  {...register('payment_terms')}
                  placeholder="e.g., Net 30, COD"
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">Minimum Order ($)</Text>
                <TextField.Root
                  {...register('minimum_order', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </Box>
            </Flex>

            {/* Notes */}
            <Box>
              <Text as="label" size="2" weight="medium">Notes</Text>
              <TextArea
                {...register('notes')}
                placeholder="Additional supplier information"
                rows={3}
              />
            </Box>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button type="button" variant="soft" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : supplier ? 'Update' : 'Create'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

#### 2.2 Create `src/components/purchasing/PurchaseOrderForm.tsx`

```typescript
'use client';

import { useState } from 'react';
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
  Table,
  IconButton
} from '@radix-ui/themes';
import { Plus, Trash2 } from 'lucide-react';
import { usePurchaseOrderActions } from '@/hooks/usePurchaseOrderActions';
import type { Database } from '@/lib/supabase/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid('Please select a supplier'),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderItem {
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrderFormProps {
  suppliers: Supplier[];
  inventoryItems: InventoryItem[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseOrderForm({ 
  suppliers,
  inventoryItems,
  open, 
  onClose, 
  onSuccess 
}: PurchaseOrderFormProps) {
  const { createPurchaseOrder } = usePurchaseOrderActions();
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    inventoryItemId: '',
    quantity: 1,
    unitCost: 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
  });

  const addItemToPO = () => {
    if (!newItem.inventoryItemId || newItem.quantity <= 0) return;

    const inventoryItem = inventoryItems.find(item => item.id === newItem.inventoryItemId);
    if (!inventoryItem) return;

    const totalCost = newItem.quantity * newItem.unitCost;
    
    setPoItems(prev => [...prev, {
      inventoryItemId: newItem.inventoryItemId,
      inventoryItem,
      quantity: newItem.quantity,
      unitCost: newItem.unitCost,
      totalCost,
    }]);

    setNewItem({
      inventoryItemId: '',
      quantity: 1,
      unitCost: 0,
    });
  };

  const removeItemFromPO = (index: number) => {
    setPoItems(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return poItems.reduce((sum, item) => sum + item.totalCost, 0);
  };

  const onSubmit = async (data: PurchaseOrderFormData) => {
    if (poItems.length === 0) {
      toast.error('Please add at least one item to the purchase order');
      return;
    }

    try {
      const poData = {
        ...data,
        total_amount: getTotalAmount(),
        status: 'pending',
        items: poItems.map(item => ({
          inventory_item_id: item.inventoryItemId,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          total_cost: item.totalCost,
        })),
      };

      await createPurchaseOrder(poData);
      
      onSuccess();
      onClose();
      reset();
      setPoItems([]);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 800 }}>
        <Dialog.Title>Create Purchase Order</Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="6">
            {/* Basic Info */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Supplier *</Text>
                <Select.Root
                  onValueChange={(value) => setValue('supplier_id', value)}
                >
                  <Select.Trigger placeholder="Select supplier" />
                  <Select.Content>
                    {suppliers.map(supplier => (
                      <Select.Item key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                {errors.supplier_id && (
                  <Text size="1" color="red">{errors.supplier_id.message}</Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">Expected Delivery</Text>
                <TextField.Root
                  {...register('expected_delivery_date')}
                  type="date"
                />
              </Box>
            </Flex>

            {/* Add Items Section */}
            <Box>
              <Text size="3" weight="medium" className="mb-3">Add Items</Text>
              <Flex gap="3" align="end">
                <Box className="flex-1">
                  <Text size="2" weight="medium">Item</Text>
                  <Select.Root
                    value={newItem.inventoryItemId}
                    onValueChange={(value) => setNewItem(prev => ({ ...prev, inventoryItemId: value }))}
                  >
                    <Select.Trigger placeholder="Select item" />
                    <Select.Content>
                      {inventoryItems.map(item => (
                        <Select.Item key={item.id} value={item.id}>
                          {item.name} ({item.unit})
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Box>
                  <Text size="2" weight="medium">Quantity</Text>
                  <TextField.Root
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    placeholder="1"
                  />
                </Box>

                <Box>
                  <Text size="2" weight="medium">Unit Cost ($)</Text>
                  <TextField.Root
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.unitCost}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unitCost: Number(e.target.value) }))}
                    placeholder="0.00"
                  />
                </Box>

                <Button
                  type="button"
                  onClick={addItemToPO}
                  disabled={!newItem.inventoryItemId || newItem.quantity <= 0}
                >
                  <Plus size={16} />
                  Add
                </Button>
              </Flex>
            </Box>

            {/* PO Items Table */}
            {poItems.length > 0 && (
              <Box>
                <Text size="3" weight="medium" className="mb-3">Purchase Order Items</Text>
                <Table.Root variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Item</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Quantity</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Unit Cost</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {poItems.map((item, index) => (
                      <Table.Row key={index}>
                        <Table.Cell>
                          <Text weight="medium">{item.inventoryItem?.name}</Text>
                          <Text size="1" color="gray">({item.inventoryItem?.unit})</Text>
                        </Table.Cell>
                        <Table.Cell>{item.quantity}</Table.Cell>
                        <Table.Cell>${item.unitCost.toFixed(2)}</Table.Cell>
                        <Table.Cell>${item.totalCost.toFixed(2)}</Table.Cell>
                        <Table.Cell>
                          <IconButton
                            size="1"
                            variant="ghost"
                            color="red"
                            onClick={() => removeItemFromPO(index)}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                    <Table.Row>
                      <Table.Cell colSpan={3}>
                        <Text weight="bold">Total:</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="4" weight="bold">${getTotalAmount().toFixed(2)}</Text>
                      </Table.Cell>
                      <Table.Cell></Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              </Box>
            )}

            {/* Notes */}
            <Box>
              <Text as="label" size="2" weight="medium">Notes</Text>
              <TextArea
                {...register('notes')}
                placeholder="Additional purchase order notes"
                rows={3}
              />
            </Box>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button type="button" variant="soft" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || poItems.length === 0}
              >
                {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
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
- ✅ Supplier form renders correctly
- ✅ PO form with dynamic item addition works
- ✅ Validations prevent invalid data
- ✅ Total calculations accurate

---

### Step 3: Create Purchasing Pages (2-3 hours)

#### 3.1 Update `src/app/(default)/purchasing/suppliers/page.tsx`

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
  TextField,
  Grid
} from '@radix-ui/themes';
import { Plus, Edit2, Trash2, Search, Building, Phone, Mail } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePurchasingData } from '@/hooks/usePurchasingData';
import { purchasingService } from '@/lib/services';
import SupplierForm from '@/components/purchasing/SupplierForm';
import StatsCard from '@/components/common/StatsCard';
import { toast } from 'sonner';

export default function SuppliersPage() {
  usePageTitle('Suppliers');
  const { suppliers, metrics, loading, refetchSuppliers } = usePurchasingData();
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filteredSuppliers = suppliers.filter(supplier => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.contact_person?.toLowerCase().includes(searchLower) ||
      supplier.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setShowForm(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      setDeleting(supplierId);
      await purchasingService.deleteSupplier(supplierId);
      toast.success('Supplier deleted successfully');
      refetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="7">Suppliers</Heading>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Supplier
          </Button>
        </Flex>

        {/* Metrics */}
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
          <StatsCard
            title="Total Suppliers"
            value={metrics.totalSuppliers.toString()}
            icon={<Building />}
            loading={loading}
          />
          
          <StatsCard
            title="Monthly Spend"
            value={`$${metrics.monthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<Building />}
            loading={loading}
          />
          
          <StatsCard
            title="Top Supplier"
            value={metrics.topSupplierByVolume}
            icon={<Building />}
            loading={loading}
          />
        </Grid>

        {/* Search */}
        <Box>
          <TextField.Root
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        {/* Suppliers Table */}
        {loading ? (
          <Text>Loading suppliers...</Text>
        ) : filteredSuppliers.length === 0 ? (
          <Box className="text-center py-12">
            <Text size="3" color="gray">
              {searchTerm ? 'No suppliers match your search' : 'No suppliers added yet'}
            </Text>
          </Box>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Supplier</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Payment Terms</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Minimum Order</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredSuppliers.map((supplier) => (
                <Table.Row key={supplier.id}>
                  <Table.Cell>
                    <Box>
                      <Text weight="medium">{supplier.name}</Text>
                      {supplier.contact_person && (
                        <Text size="1" color="gray">Contact: {supplier.contact_person}</Text>
                      )}
                    </Box>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex direction="column" gap="1">
                      {supplier.email && (
                        <Flex align="center" gap="1">
                          <Mail size={12} />
                          <Text size="1">{supplier.email}</Text>
                        </Flex>
                      )}
                      {supplier.phone && (
                        <Flex align="center" gap="1">
                          <Phone size={12} />
                          <Text size="1">{supplier.phone}</Text>
                        </Flex>
                      )}
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{supplier.payment_terms || '-'}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">
                      {supplier.minimum_order ? `$${supplier.minimum_order.toFixed(2)}` : '-'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={supplier.status === 'active' ? 'green' : 'gray'}>
                      {supplier.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
                      <IconButton
                        size="1"
                        variant="ghost"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={() => handleDelete(supplier.id)}
                        disabled={deleting === supplier.id}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}

        {/* Supplier Form */}
        <SupplierForm
          supplier={selectedSupplier}
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedSupplier(null);
          }}
          onSuccess={() => {
            refetchSuppliers();
            setSelectedSupplier(null);
          }}
        />
      </Flex>
    </Container>
  );
}
```

#### 3.2 Update `src/app/(default)/purchasing/purchase-orders/page.tsx`

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
  Select,
  Grid
} from '@radix-ui/themes';
import { Plus, Eye, CheckCircle, Package, DollarSign } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePurchasingData } from '@/hooks/usePurchasingData';
import { usePurchaseOrderActions } from '@/hooks/usePurchaseOrderActions';
import PurchaseOrderForm from '@/components/purchasing/PurchaseOrderForm';
import StatsCard from '@/components/common/StatsCard';
import { format } from 'date-fns';

export default function PurchaseOrdersPage() {
  usePageTitle('Purchase Orders');
  const { 
    suppliers, 
    purchaseOrders, 
    inventoryItems, 
    metrics, 
    loading, 
    refetchPurchaseOrders 
  } = usePurchasingData();
  const { updatePurchaseOrderStatus } = usePurchaseOrderActions();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPOs = purchaseOrders.filter(po => {
    if (statusFilter === 'all') return true;
    return po.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'blue';
      case 'sent': return 'purple';
      case 'received': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const handleStatusUpdate = async (poId: string, newStatus: string) => {
    try {
      await updatePurchaseOrderStatus(poId, newStatus);
      refetchPurchaseOrders();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="7">Purchase Orders</Heading>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Create Purchase Order
          </Button>
        </Flex>

        {/* Metrics */}
        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
          <StatsCard
            title="Active POs"
            value={metrics.activePurchaseOrders.toString()}
            icon={<Package />}
            loading={loading}
          />
          
          <StatsCard
            title="Pending Receiving"
            value={metrics.pendingReceiving.toString()}
            icon={<CheckCircle />}
            loading={loading}
          />
          
          <StatsCard
            title="Monthly Spend"
            value={`$${metrics.monthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<DollarSign />}
            loading={loading}
          />
          
          <StatsCard
            title="Avg PO Value"
            value={`$${metrics.averageOrderValue.toFixed(2)}`}
            icon={<DollarSign />}
            loading={loading}
          />
        </Grid>

        {/* Filters */}
        <Box>
          <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
            <Select.Trigger placeholder="Filter by status" className="w-48" />
            <Select.Content>
              <Select.Item value="all">All Statuses</Select.Item>
              <Select.Item value="pending">Pending</Select.Item>
              <Select.Item value="approved">Approved</Select.Item>
              <Select.Item value="sent">Sent</Select.Item>
              <Select.Item value="received">Received</Select.Item>
              <Select.Item value="cancelled">Cancelled</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        {/* Purchase Orders Table */}
        {loading ? (
          <Text>Loading purchase orders...</Text>
        ) : filteredPOs.length === 0 ? (
          <Box className="text-center py-12">
            <Text size="3" color="gray">No purchase orders found</Text>
          </Box>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>PO Number</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Supplier</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Total Amount</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Expected Delivery</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredPOs.map((po) => {
                const supplier = suppliers.find(s => s.id === po.supplier_id);
                
                return (
                  <Table.Row key={po.id}>
                    <Table.Cell>
                      <Text weight="medium">{po.po_number}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{supplier?.name || 'Unknown Supplier'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text weight="medium">${po.total_amount.toFixed(2)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={getStatusColor(po.status)}>
                        {po.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">
                        {format(new Date(po.created_at), 'MMM dd, yyyy')}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">
                        {po.expected_delivery_date 
                          ? format(new Date(po.expected_delivery_date), 'MMM dd, yyyy')
                          : '-'
                        }
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="1">
                        <IconButton size="1" variant="ghost">
                          <Eye size={14} />
                        </IconButton>
                        
                        {po.status === 'pending' && (
                          <Button
                            size="1"
                            onClick={() => handleStatusUpdate(po.id, 'approved')}
                          >
                            Approve
                          </Button>
                        )}
                        
                        {po.status === 'approved' && (
                          <Button
                            size="1"
                            onClick={() => handleStatusUpdate(po.id, 'sent')}
                          >
                            Send
                          </Button>
                        )}
                        
                        {po.status === 'sent' && (
                          <Button
                            size="1"
                            color="green"
                            onClick={() => handleStatusUpdate(po.id, 'received')}
                          >
                            Receive
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

        {/* Supplier Form */}
        <SupplierForm
          supplier={selectedSupplier}
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedSupplier(null);
          }}
          onSuccess={() => {
            refetchSuppliers();
            setSelectedSupplier(null);
          }}
        />

        {/* Purchase Order Form */}
        <PurchaseOrderForm
          suppliers={suppliers}
          inventoryItems={inventoryItems}
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            refetchPurchaseOrders();
          }}
        />
      </Flex>
    </Container>
  );
}
```

**Success Criteria**:
- ✅ Suppliers page displays correctly
- ✅ Supplier CRUD operations work
- ✅ PO creation and management functional
- ✅ Status workflows operational

---

### Step 4: Create Receiving Workflow (2-3 hours)

#### 4.1 Create `src/components/purchasing/ReceivingForm.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  Button, 
  TextField, 
  Flex, 
  Box,
  Text,
  Table,
  Card
} from '@radix-ui/themes';
import { usePurchaseOrderActions } from '@/hooks/usePurchaseOrderActions';
import { purchasingService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'] & {
  suppliers: { name: string };
  purchase_order_items: Array<{
    id: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    inventory_items: {
      name: string;
      unit: string;
    };
  }>;
};

interface ReceivingFormProps {
  purchaseOrder: PurchaseOrder;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReceivingForm({ 
  purchaseOrder,
  open, 
  onClose, 
  onSuccess 
}: ReceivingFormProps) {
  const { receivePurchaseOrder } = usePurchaseOrderActions();
  const [receivedItems, setReceivedItems] = useState<Array<{
    poItemId: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unitCost: number;
    inventoryItemId: string;
  }>>([]);

  useEffect(() => {
    if (purchaseOrder) {
      setReceivedItems(
        purchaseOrder.purchase_order_items?.map(item => ({
          poItemId: item.id,
          orderedQuantity: item.quantity,
          receivedQuantity: item.quantity, // Default to full quantity
          unitCost: item.unit_cost,
          inventoryItemId: item.inventory_items.id,
        })) || []
      );
    }
  }, [purchaseOrder]);

  const updateReceivedQuantity = (poItemId: string, quantity: number) => {
    setReceivedItems(prev =>
      prev.map(item =>
        item.poItemId === poItemId
          ? { ...item, receivedQuantity: Math.max(0, quantity) }
          : item
      )
    );
  };

  const handleReceive = async () => {
    if (!purchaseOrder) return;

    try {
      const receivingData = receivedItems.map(item => ({
        poItemId: item.poItemId,
        branchId: purchaseOrder.branch_id,
        inventoryItemId: item.inventoryItemId,
        receivedQuantity: item.receivedQuantity,
        poNumber: purchaseOrder.po_number,
      }));

      await receivePurchaseOrder(purchaseOrder.id, receivingData);
      
      onSuccess();
      onClose();
    } catch (error) {
      // Error handled in hook
    }
  };

  const getTotalVariance = () => {
    return receivedItems.reduce((sum, item) => {
      const variance = item.receivedQuantity - item.orderedQuantity;
      return sum + (variance * item.unitCost);
    }, 0);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 700 }}>
        <Dialog.Title>Receive Purchase Order</Dialog.Title>
        
        <Flex direction="column" gap="6">
          {/* PO Header */}
          <Card>
            <Flex justify="between" align="center">
              <Box>
                <Text size="4" weight="bold">PO #{purchaseOrder.po_number}</Text>
                <Text size="2" color="gray">Supplier: {purchaseOrder.suppliers?.name}</Text>
              </Box>
              <Text size="5" weight="bold">
                ${purchaseOrder.total_amount.toFixed(2)}
              </Text>
            </Flex>
          </Card>

          {/* Receiving Table */}
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Item</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Ordered Qty</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Received Qty</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Unit Cost</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Variance</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {receivedItems.map((item, index) => {
                const poItem = purchaseOrder.purchase_order_items?.[index];
                const variance = item.receivedQuantity - item.orderedQuantity;
                const varianceValue = variance * item.unitCost;

                return (
                  <Table.Row key={item.poItemId}>
                    <Table.Cell>
                      <Box>
                        <Text weight="medium">{poItem?.inventory_items.name}</Text>
                        <Text size="1" color="gray">({poItem?.inventory_items.unit})</Text>
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{item.orderedQuantity}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <TextField.Root
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.receivedQuantity}
                        onChange={(e) => updateReceivedQuantity(item.poItemId, Number(e.target.value))}
                        className="w-24"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Text>${item.unitCost.toFixed(2)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text color={variance === 0 ? 'gray' : variance > 0 ? 'green' : 'red'}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                        {varianceValue !== 0 && (
                          <Text size="1" className="block">
                            (${varianceValue > 0 ? '+' : ''}${varianceValue.toFixed(2)})
                          </Text>
                        )}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>

          {/* Summary */}
          <Card>
            <Flex justify="between" align="center">
              <Text size="3" weight="medium">Total Variance:</Text>
              <Text 
                size="4" 
                weight="bold"
                color={getTotalVariance() === 0 ? 'gray' : getTotalVariance() > 0 ? 'green' : 'red'}
              >
                ${getTotalVariance() > 0 ? '+' : ''}${getTotalVariance().toFixed(2)}
              </Text>
            </Flex>
          </Card>

          {/* Actions */}
          <Flex gap="3" justify="end">
            <Button type="button" variant="soft" color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleReceive}
              color="green"
            >
              Receive Items & Update Inventory
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

**Success Criteria**:
- ✅ Purchase orders display correctly
- ✅ Status workflow functional
- ✅ Receiving process works
- ✅ Inventory integration operational

---

### Step 5: Testing and Validation (1-2 hours)

#### 5.1 Manual Testing Checklist
```
Suppliers:
- [ ] Suppliers page loads correctly
- [ ] Can create new suppliers
- [ ] Can edit supplier information
- [ ] Contact information displays properly
- [ ] Supplier search works
- [ ] Supplier deletion with confirmation

Purchase Orders:
- [ ] PO creation form works correctly
- [ ] Can add/remove items dynamically
- [ ] Total calculations accurate
- [ ] PO approval workflow functional
- [ ] Status updates work properly
- [ ] PO number generation works

Receiving:
- [ ] Receiving form displays PO items
- [ ] Can adjust received quantities
- [ ] Variance calculations correct
- [ ] Inventory updates automatically
- [ ] Receiving completes PO workflow

Integration:
- [ ] Inventory stock updates from receiving
- [ ] Low stock items appear in PO suggestions
- [ ] Cost tracking accurate
- [ ] Supplier performance metrics work
```

---

## 5. Success Criteria

### Functional Requirements
- ✅ **Supplier Management**: Full CRUD operations for suppliers
- ✅ **Purchase Orders**: Complete PO lifecycle management
- ✅ **Receiving Workflow**: Quantity verification and inventory updates
- ✅ **Cost Tracking**: Accurate purchasing cost analysis
- ✅ **Integration**: Seamless connection to inventory system
- ✅ **Analytics**: Purchasing performance metrics

### Technical Requirements
- ✅ **No Mock Data**: All imports from `data/` folder removed
- ✅ **Workflow Management**: Status transitions working correctly
- ✅ **Type Safety**: Proper TypeScript types throughout
- ✅ **Error Handling**: Graceful error recovery
- ✅ **Performance**: Pages load quickly with many records

### Business Requirements
- ✅ **Audit Trail**: All purchasing actions logged
- ✅ **Approval Process**: Proper purchase approval workflow
- ✅ **Cost Control**: Budget tracking and variance reporting
- ✅ **Supplier Relations**: Performance tracking and management

---

## 6. Deliverables

### Code Files
```
✅ src/hooks/usePurchasingData.ts (new)
✅ src/hooks/usePurchaseOrderActions.ts (new)
✅ src/components/purchasing/SupplierForm.tsx (new)
✅ src/components/purchasing/PurchaseOrderForm.tsx (new)
✅ src/components/purchasing/ReceivingForm.tsx (new)
✅ src/app/(default)/purchasing/suppliers/page.tsx (updated)
✅ src/app/(default)/purchasing/purchase-orders/page.tsx (updated)
✅ src/app/(default)/purchasing/receiving/page.tsx (updated)
```

---

## 7. Rollback Plan

If integration fails:
1. Restore mock purchasing data temporarily
2. Keep existing UI using mock data
3. Debug purchasingService separately
4. Test inventory integration in isolation
5. Fix issues incrementally

---

## 8. Next Steps After Completion

1. **Advanced Features**: Add purchase order approval workflow
2. **Supplier Integration**: EDI or API integration with suppliers
3. **Cost Analytics**: Advanced purchasing analytics and forecasting
4. **Move to Next Task**: Admin Settings Integration (Task 1.8)

---

**Status**: 📋 Ready to Start  
**Dependencies**: Task 1.1 (Dashboard), Task 1.3 (Inventory), purchasingService  
**Blocked By**: Task 1.3 must be completed first  
**Blocks**: Advanced purchasing analytics
