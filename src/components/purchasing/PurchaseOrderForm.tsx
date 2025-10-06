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
  supplier_id: z.string().min(1, 'Please select a supplier'),
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
  const { createPurchaseOrder, isProcessing } = usePurchaseOrderActions();
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
    watch,
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
  });

  const addItemToPO = (): void => {
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

  const removeItemFromPO = (index: number): void => {
    setPoItems(prev => prev.filter((_item, i) => i !== index));
  };

  const getTotalAmount = (): number => {
    return poItems.reduce((sum, item) => sum + item.totalCost, 0);
  };

  const onSubmit = async (data: PurchaseOrderFormData): Promise<void> => {
    if (poItems.length === 0) {
      return;
    }

    try {
      await createPurchaseOrder({
        supplierId: data.supplier_id,
        expectedDeliveryDate: data.expected_delivery_date,
        notes: data.notes,
        items: poItems.map(item => ({
          inventoryItemId: item.inventoryItemId,
          quantityOrdered: item.quantity,
          unitCost: item.unitCost,
        })),
      });
      
      onSuccess();
      onClose();
      reset();
      setPoItems([]);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleClose = (): void => {
    onClose();
    reset();
    setPoItems([]);
    setNewItem({
      inventoryItemId: '',
      quantity: 1,
      unitCost: 0,
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 900 }}>
        <Dialog.Title>Create Purchase Order</Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="6">
            {/* Basic Info */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="mb-2 block">
                  Supplier *
                </Text>
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

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="mb-2 block">
                  Expected Delivery
                </Text>
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
                  <Text size="2" weight="medium" className="mb-2 block">Item</Text>
                  <Select.Root
                    value={newItem.inventoryItemId}
                    onValueChange={(value) => setNewItem(prev => ({ ...prev, inventoryItemId: value }))}
                  >
                    <Select.Trigger placeholder="Select item" />
                    <Select.Content>
                      {inventoryItems.map(item => (
                        <Select.Item key={item.id} value={item.id}>
                          {item.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Box style={{ width: '120px' }}>
                  <Text size="2" weight="medium" className="mb-2 block">Quantity</Text>
                  <TextField.Root
                    type="number"
                    min="1"
                    step="0.01"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    placeholder="1"
                  />
                </Box>

                <Box style={{ width: '120px' }}>
                  <Text size="2" weight="medium" className="mb-2 block">Unit Cost ($)</Text>
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
                          <Box>
                            <Text weight="medium">{item.inventoryItem?.name}</Text>
                          </Box>
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
                            type="button"
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
              <Text as="label" size="2" weight="medium" className="mb-2 block">
                Notes
              </Text>
              <TextArea
                {...register('notes')}
                placeholder="Additional purchase order notes"
                rows={3}
              />
            </Box>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button type="button" variant="soft" color="gray" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isProcessing || poItems.length === 0}
              >
                {isSubmitting || isProcessing ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
