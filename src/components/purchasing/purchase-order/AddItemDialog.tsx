'use client';

import { useState, useEffect } from 'react';
import { Dialog, TextField, Button, Flex, Grid, Text, Box, IconButton } from '@radix-ui/themes';
// Removed hardcoded import - using real data from database services
import type { Database } from '@/lib/supabase/database.types';

type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row'];
import { v4 as uuidv4 } from 'uuid';
import SearchableSelect from '@/components/common/SearchableSelect';
// Removed hardcoded import - using real inventory items from database
import { inventoryService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { X, Plus, Save } from 'lucide-react';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: PurchaseOrderItem) => void;
  initialItem?: PurchaseOrderItem | null;
}

export default function AddItemDialog({
  open,
  onOpenChange,
  onAddItem,
  initialItem = null
}: AddItemDialogProps) {
  const [item, setItem] = useState<Partial<PurchaseOrderItem>>({
    inventory_item_id: '',
    quantity_ordered: 1,
    unit_cost: 0,
    quantity_received: 0,
    line_total: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemOptions, setItemOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const { currentOrganization } = useOrganization();
  
  // Load inventory items
  useEffect(() => {
    const loadInventoryItems = async () => {
      if (!currentOrganization) return;
      
      try {
        const items = await inventoryService.getItems(currentOrganization.id);
        setInventoryItems(items);
      } catch (error) {
        console.error('Error loading inventory items:', error);
        setInventoryItems([]);
      }
    };

    loadInventoryItems();
  }, [currentOrganization]);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (initialItem) {
        // If we're editing an existing item, pre-populate the form
        setItem(initialItem);
      } else {
        // Otherwise reset to default values
        setItem({
          inventory_item_id: '',
          quantity_ordered: 1,
          unit_cost: 0,
          quantity_received: 0,
          line_total: 0
        });
      }
      setErrors({});
    }
  }, [open, initialItem]);

  useEffect(() => {
    // Convert inventory items to options for searchable select
    const options = inventoryItems.map(item => ({
      value: item.id,
      label: `${item.name} (${item.sku || 'No SKU'})`
    }));
    setItemOptions(options);
  }, [inventoryItems]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!item.inventory_item_id?.trim()) {
      newErrors.inventory_item_id = 'Item is required';
    }
    
    if (!item.quantity_ordered || item.quantity_ordered <= 0) {
      newErrors.quantity_ordered = 'Quantity must be greater than 0';
    }
    
    if (!item.unit_cost || item.unit_cost <= 0) {
      newErrors.unit_cost = 'Unit cost must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const itemToSubmit: PurchaseOrderItem = {
        id: initialItem ? initialItem.id : uuidv4(),
        inventory_item_id: item.inventory_item_id || '',
        quantity_ordered: item.quantity_ordered || 0,
        unit_cost: item.unit_cost || 0,
        quantity_received: item.quantity_received || 0,
        line_total: (item.quantity_ordered || 0) * (item.unit_cost || 0),
        organization_id: '', // TODO: Set from context
        purchase_order_id: '', // TODO: Set from parent
        created_at: new Date().toISOString()
      } as any; // Type assertion needed due to missing required fields
      
      onAddItem(itemToSubmit);
      
      // Reset form happens in useEffect when dialog closes
      onOpenChange(false);
    }
  };

  // Handle item selection and auto-populate fields when an item is selected
  const handleItemSelect = (itemId: string | null) => {
    if (itemId) {
      const selectedItem = inventoryItems.find(i => i.id === itemId);
      if (selectedItem) {
        setItem({
          ...item,
          inventory_item_id: selectedItem.id,
          // Auto-populate the unit cost if available
          unit_cost: selectedItem.cost_per_unit || 0
        });
      }
    } else {
      setItem({
        ...item,
        inventory_item_id: ''
      });
    }
  };

  // Find the current item ID to display in the SearchableSelect
  const getCurrentItemId = () => {
    return item.inventory_item_id || null;
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 500 }} className="!overflow-visible">
        <Flex justify="between" mb="3">
          <Dialog.Title>{initialItem ? 'Edit Order Item' : 'Add Order Item'}</Dialog.Title>
          <IconButton variant="ghost" color="gray" onClick={() => onOpenChange(false)}>
            <X size={16} />
          </IconButton>
        </Flex>
        <Dialog.Description size="2" mb="4">
          {initialItem ? 'Update item details.' : 'Add new item to this purchase order.'}
        </Dialog.Description>
        
        <Grid columns="1" gap="3" width="auto">
          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="medium">Item Name *</Text>
            <div style={{ position: 'relative' }}>
              <SearchableSelect 
                options={itemOptions}
                onChange={handleItemSelect}
                placeholder="Search for an item..."
                value={getCurrentItemId()}
              />
            </div>
            {errors.inventory_item_id && (
              <Text size="1" color="red">{errors.inventory_item_id}</Text>
            )}
          </Flex>
          
          <Grid columns="2" gap="3">
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Quantity *</Text>
              <TextField.Root 
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={item.quantity_ordered?.toString()}
                onChange={(e) => setItem({ ...item, quantity_ordered: parseInt(e.target.value) || 0 })}
                color={errors.quantity_ordered ? 'red' : undefined}
              />
              {errors.quantity_ordered && (
                <Text size="1" color="red">{errors.quantity_ordered}</Text>
              )}
            </Flex>
            
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Unit Price ($) *</Text>
              <TextField.Root 
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={item.unit_cost?.toString()}
                onChange={(e) => setItem({ ...item, unit_cost: parseFloat(e.target.value) || 0 })}
                color={errors.unit_cost ? 'red' : undefined}
              >
                <TextField.Slot>
                  $
                </TextField.Slot>
              </TextField.Root>
              {errors.unit_cost && (
                <Text size="1" color="red">{errors.unit_cost}</Text>
              )}
            </Flex>
          </Grid>
        </Grid>
        
        <Flex gap="3" mt="6" justify="end">
          <Button variant="soft" color="gray" onClick={() => onOpenChange(false)}>
            <X size={16} />
            Cancel
          </Button>
          <Button color="green" onClick={handleSubmit}>
            <Save size={16} />
            {initialItem ? 'Update Item' : 'Add Item'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
} 