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

type BranchInventory = Database['public']['Tables']['branch_inventory']['Row'] & {
  inventory_item?: Database['public']['Tables']['inventory_items']['Row'];
};

const stockAdjustmentSchema = z.object({
  quantity: z.number().refine(val => val !== 0, 'Adjustment cannot be zero'),
  movementType: z.enum(['purchase', 'waste', 'theft', 'correction', 'transfer', 'usage', 'sale', 'return']),
  notes: z.string().optional(),
});

type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentFormProps {
  inventoryItem: BranchInventory;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockAdjustmentForm({ 
  inventoryItem, 
  open, 
  onClose, 
  onSuccess 
}: StockAdjustmentFormProps) {
  const { currentBranch, currentOrganization } = useOrganization();
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
      movementType: 'correction',
    },
  });

  const quantity = watch('quantity');

  const onSubmit = async (data: StockAdjustmentFormData) => {
    if (!currentBranch || !currentOrganization) return;

    try {
      await adjustStock({
        branchId: currentBranch.id,
        inventoryItemId: inventoryItem.inventory_item_id,
        organizationId: currentOrganization.id,
        quantity: data.quantity,
        movementType: data.movementType,
        notes: data.notes,
      });
      
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      // Error handling done in hook
    }
  };

  const newQuantity = (inventoryItem.current_quantity || 0) + (quantity || 0);

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Adjust Stock</Dialog.Title>
        
        {/* Current Stock Info */}
        <Card className="mb-4">
          <Box>
            <Text size="3" weight="medium">{inventoryItem.inventory_item?.name || 'Unknown Item'}</Text>
            <Text size="2" color="gray" className="block mt-1">
              Current Stock: {inventoryItem.current_quantity || 0} units
            </Text>
            {quantity && (
              <Text 
                size="2" 
                color={quantity > 0 ? 'green' : 'red'} 
                className="block mt-1"
                weight="medium"
              >
                New Stock: {newQuantity} units ({quantity > 0 ? '+' : ''}{quantity})
              </Text>
            )}
          </Box>
        </Card>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Adjustment Amount */}
            <Box>
              <Text as="label" size="2" weight="medium" className="block mb-1">
                Adjustment Amount *
              </Text>
              <TextField.Root
                {...register('quantity', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="Enter + or - amount"
              />
              {errors.quantity && (
                <Text size="1" color="red" className="block mt-1">
                  {errors.quantity.message}
                </Text>
              )}
              <Text size="1" color="gray" className="block mt-1">
                Use positive numbers to increase stock, negative to decrease
              </Text>
            </Box>

            {/* Reason */}
            <Box>
              <Text as="label" size="2" weight="medium" className="block mb-1">Reason *</Text>
              <Select.Root
                onValueChange={(value) => setValue('movementType', value as StockAdjustmentFormData['movementType'])}
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
                  <Select.Item value="sale">Sale</Select.Item>
                  <Select.Item value="return">Return/Refund</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Notes */}
            <Box>
              <Text as="label" size="2" weight="medium" className="block mb-1">Notes</Text>
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
