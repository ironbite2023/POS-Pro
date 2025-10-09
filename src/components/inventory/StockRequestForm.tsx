'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  TextField, 
  Button, 
  Flex, 
  Text, 
  Box, 
  TextArea, 
  Select, 
  IconButton,
  Table,
  Card
} from '@radix-ui/themes';
import { 
  X, 
  Save, 
  Plus, 
  Trash2,
  Inbox
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { inventoryService, staffService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';
import { formatDate } from '@/utilities';
import DateInput from '@/components/common/DateInput';
import { 
  StockRequestFormData, 
  StockRequestItemData, 
  StockRequestStatus, 
  StockRequestFormErrors 
} from '@/types/inventory';
import { loggingService, InventoryServiceError } from '@/lib/services/logging.service';

type Branch = Database['public']['Tables']['branches']['Row'];
type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type StaffMember = Database['public']['Tables']['user_profiles']['Row'];

interface StockRequestFormProps {
  request?: StockRequestFormData | Omit<StockRequestFormData, 'id'>;
  onSave?: (request: Omit<StockRequestFormData, 'id'>) => void;
  readOnly: boolean;
  onCancel: () => void;
}

const StockRequestForm: React.FC<StockRequestFormProps> = ({
  request,
  onSave,
  readOnly,
  onCancel
}) => {
  const { branches, currentOrganization } = useOrganization();
  const [stockItems, setStockItems] = useState<InventoryItem[]>([]);
  const [requestNumber, setRequestNumber] = useState<string>('');
  const [date, setDate] = useState<Date | undefined | null>(new Date());
  const [originId, setOriginId] = useState<string>('');
  const [destinationId, setDestinationId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<StockRequestStatus>('New');
  const [items, setItems] = useState<StockRequestItemData[]>([]);
  const [errors, setErrors] = useState<StockRequestFormErrors>({});
  const [loading, setLoading] = useState(false);
  
  // Load stock items from database (replacing TODO implementation)
  useEffect(() => {
    const loadStockItems = async () => {
      if (!currentOrganization) {
        setStockItems([]);
        return;
      }
      
      try {
        setLoading(true);
        
        loggingService.debug('Loading stock items for request form', {
          organizationId: currentOrganization.id,
          component: 'StockRequestForm'
        });

        const itemsData = await inventoryService.getItems(currentOrganization.id);
        setStockItems(itemsData);

        loggingService.info('Stock items loaded successfully for request form', {
          organizationId: currentOrganization.id,
          itemCount: itemsData.length,
          component: 'StockRequestForm'
        });
      } catch (error) {
        loggingService.error('Failed to load stock items for request form', error as Error, {
          organizationId: currentOrganization.id,
          component: 'StockRequestForm',
          operation: 'loadStockItems'
        });
        
        // Still set empty array to prevent UI issues
        setStockItems([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadStockItems();
  }, [currentOrganization]);

  useEffect(() => {
    if (request) {
      setRequestNumber(request.requestNumber || '');
      setDate(request.date);
      setOriginId(request.originId);
      setDestinationId(request.destinationId);
      setNotes(request.notes || '');
      setStatus(request.status);
      setItems(request.items);
      setErrors({});

      loggingService.debug('Form populated with existing request data', {
        requestNumber: request.requestNumber,
        itemCount: request.items.length,
        status: request.status,
        component: 'StockRequestForm'
      });
    } else {
      setDate(new Date());
      setOriginId('');
      setDestinationId('');
      setNotes('');
      setStatus('New');
      setItems([]);
      setErrors({});

      loggingService.debug('Form initialized for new request', {
        component: 'StockRequestForm'
      });
    }
  }, [request]);

  const validateForm = useCallback((): boolean => {
    const newErrors: StockRequestFormErrors = {};

    if (!date) {
      newErrors.date = 'Request date is required';
    }

    if (!originId) {
      newErrors.originId = 'Origin branch is required';
    }

    if (!destinationId) {
      newErrors.destinationId = 'Destination branch is required';
    }

    if (originId === destinationId && originId) {
      newErrors.destinationId = 'Destination must be different from origin';
    }

    if (items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    items.forEach((item, index) => {
      if (!item.inventoryItemId) {
        newErrors[`item-${index}` as keyof StockRequestFormErrors] = 'Item selection is required';
      }
      if (item.quantityRequested <= 0) {
        newErrors[`quantity-${index}` as keyof StockRequestFormErrors] = 'Quantity must be greater than 0';
      }
    });

    setErrors(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    
    if (!isValid) {
      loggingService.warn('Stock request form validation failed', {
        errorCount: Object.keys(newErrors).length,
        errors: Object.keys(newErrors),
        component: 'StockRequestForm'
      });
    }

    return isValid;
  }, [date, originId, destinationId, items]);

  const updateItem = useCallback((index: number, field: keyof StockRequestItemData, value: string | number) => {
    if (readOnly) return;
    
    const updatedItems = [...items];
    const currentItem = updatedItems[index];

    if (field === 'inventoryItemId') {
      // Find the selected inventory item to get additional details
      const selectedInventoryItem = stockItems.find(item => item.id === value);
      if (selectedInventoryItem) {
        updatedItems[index] = {
          ...currentItem,
          inventoryItemId: selectedInventoryItem.id,
          inventoryItemName: selectedInventoryItem.name,
          unit: 'kg', // Default unit - could be enhanced with actual unit lookup
        };

        loggingService.debug('Item selected for stock request', {
          itemId: selectedInventoryItem.id,
          itemName: selectedInventoryItem.name,
          requestIndex: index,
          component: 'StockRequestForm'
        });
      }
    } else {
      updatedItems[index] = {
        ...currentItem,
        [field]: value
      };
    }

    setItems(updatedItems);

    // Clear related error when field is updated
    if (errors[`item-${index}` as keyof StockRequestFormErrors] && field === 'inventoryItemId') {
      const newErrors = { ...errors };
      delete newErrors[`item-${index}` as keyof StockRequestFormErrors];
      setErrors(newErrors);
    }
    
    if (errors[`quantity-${index}` as keyof StockRequestFormErrors] && field === 'quantityRequested') {
      const newErrors = { ...errors };
      delete newErrors[`quantity-${index}` as keyof StockRequestFormErrors];
      setErrors(newErrors);
    }
  }, [items, stockItems, readOnly, errors]);

  const addItem = () => {
    if (readOnly) return;
    
    const newItem: StockRequestItemData = {
      id: `temp-${Date.now()}`,
      inventoryItemId: '',
      inventoryItemName: '',
      quantityRequested: 0,
      unit: '',
      priority: 'medium',
      notes: ''
    };
    
    setItems([...items, newItem]);

    loggingService.debug('New item added to stock request', {
      itemIndex: items.length,
      totalItems: items.length + 1,
      component: 'StockRequestForm'
    });
  };

  const removeItem = (index: number) => {
    if (readOnly) return;
    
    const itemToRemove = items[index];
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    
    // Clear related errors
    const newErrors = { ...errors };
    delete newErrors[`item-${index}` as keyof StockRequestFormErrors];
    delete newErrors[`quantity-${index}` as keyof StockRequestFormErrors];
    setErrors(newErrors);

    loggingService.debug('Item removed from stock request', {
      removedItem: {
        name: itemToRemove.inventoryItemName,
        quantity: itemToRemove.quantityRequested
      },
      remainingItems: updatedItems.length,
      component: 'StockRequestForm'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnly || !validateForm()) {
      return;
    }

    try {
      const requestData: Omit<StockRequestFormData, 'id'> = {
        requestNumber: requestNumber || `REQ-${Date.now()}`,
        originId,
        destinationId,
        date: date!,
        status,
        notes,
        items
      };

      loggingService.userAction('Stock Request Form Submitted', undefined, {
        requestNumber: requestData.requestNumber,
        originBranchId: requestData.originId,
        destinationBranchId: requestData.destinationId,
        itemCount: requestData.items.length,
        totalQuantity: requestData.items.reduce((sum, item) => sum + item.quantityRequested, 0),
        organizationId: currentOrganization?.id,
        component: 'StockRequestForm'
      });

      onSave?.(requestData);
    } catch (error) {
      loggingService.error('Stock request form submission failed', error as Error, {
        component: 'StockRequestForm',
        operation: 'handleSubmit',
        formData: {
          itemCount: items.length,
          hasOrigin: !!originId,
          hasDestination: !!destinationId
        }
      });
    }
  };

  return (
    <Card size="3" className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Request Details */}
          <div className="space-y-4">
            <Box>
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Request Number</Text>
                <TextField.Root 
                  placeholder="Auto-generated" 
                  value={requestNumber}
                  disabled
                />
              </Flex>
            </Box>

            <Box>
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Request Date</Text>
                <DateInput 
                  value={date}
                  onChange={(newDate) => !readOnly && setDate(newDate)}
                  disabled={readOnly}
                  placeholder="Select request date"
                />
                {errors.date && <Text size="1" color="red">{errors.date}</Text>}
              </Flex>
            </Box>

            <Box>
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">From (Origin)</Text>
                <Select.Root
                  value={originId}
                  onValueChange={(value) => !readOnly && setOriginId(value)}
                  disabled={readOnly}
                >
                  <Select.Trigger 
                    placeholder="Select origin" 
                    className={errors.originId ? "border-red-500" : ""} 
                    disabled={readOnly}
                  />
                  <Select.Content>
                    {branches?.map((branch: Branch) => (
                      <Select.Item key={branch.id} value={branch.id}>
                        {branch.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                {errors.originId && <Text size="1" color="red">{errors.originId}</Text>}
              </Flex>
            </Box>

            <Box>
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">To (Destination)</Text>
                <Select.Root
                  value={destinationId}
                  onValueChange={(value) => !readOnly && setDestinationId(value)}
                  disabled={readOnly}
                >
                  <Select.Trigger 
                    placeholder="Select destination" 
                    className={errors.destinationId ? "border-red-500" : ""} 
                    disabled={readOnly}
                  />
                  <Select.Content>
                    {branches?.filter((branch: Branch) => branch.id !== originId).map((branch: Branch) => (
                      <Select.Item key={branch.id} value={branch.id}>
                        {branch.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                {errors.destinationId && <Text size="1" color="red">{errors.destinationId}</Text>}
              </Flex>
            </Box>
          </div>

          {/* Right Column - Items */}
          <div className="space-y-4">
            <Flex justify="between" align="center">
              <Text size="3" weight="bold">Requested Items</Text>
              {!readOnly && (
                <Button 
                  type="button" 
                  variant="soft" 
                  onClick={addItem}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              )}
            </Flex>
            
            {errors.items && <Text size="1" color="red">{errors.items}</Text>}

            <Card>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Item</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Quantity</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Priority</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Notes</Table.ColumnHeaderCell>
                    {!readOnly && <Table.ColumnHeaderCell></Table.ColumnHeaderCell>}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {items.map((item, index) => (
                    <Table.Row key={item.id || index}>
                      <Table.Cell>
                        <Select.Root
                          value={item.inventoryItemId}
                          onValueChange={(value) => updateItem(index, 'inventoryItemId', value)}
                          disabled={readOnly || loading}
                        >
                          <Select.Trigger 
                            placeholder="Select item" 
                            className={errors[`item-${index}` as keyof StockRequestFormErrors] ? "border-red-500" : ""} 
                            disabled={readOnly || loading}
                          />
                          <Select.Content>
                            {stockItems.map((stockItem) => (
                              <Select.Item key={stockItem.id} value={stockItem.id}>
                                {stockItem.name} ({stockItem.sku})
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                        {errors[`item-${index}` as keyof StockRequestFormErrors] && 
                          <Text size="1" color="red">{errors[`item-${index}` as keyof StockRequestFormErrors]}</Text>}
                      </Table.Cell>
                      
                      <Table.Cell>
                        <TextField.Root 
                          type="number"
                          value={item.quantityRequested.toString()}
                          onChange={(e) => updateItem(index, 'quantityRequested', parseFloat(e.target.value) || 0)}
                          disabled={readOnly}
                          min="0.01"
                          step="0.01"
                          className={errors[`quantity-${index}` as keyof StockRequestFormErrors] ? "border-red-500" : ""}
                        />
                        {errors[`quantity-${index}` as keyof StockRequestFormErrors] && 
                          <Text size="1" color="red">{errors[`quantity-${index}` as keyof StockRequestFormErrors]}</Text>}
                      </Table.Cell>

                      <Table.Cell>
                        <Select.Root
                          value={item.priority}
                          onValueChange={(value) => updateItem(index, 'priority', value)}
                          disabled={readOnly}
                        >
                          <Select.Trigger disabled={readOnly} />
                          <Select.Content>
                            <Select.Item value="low">Low</Select.Item>
                            <Select.Item value="medium">Medium</Select.Item>
                            <Select.Item value="high">High</Select.Item>
                          </Select.Content>
                        </Select.Root>
                      </Table.Cell>

                      <Table.Cell>
                        <TextField.Root 
                          placeholder="Optional notes"
                          value={item.notes || ''}
                          onChange={(e) => updateItem(index, 'notes', e.target.value)}
                          disabled={readOnly}
                        />
                      </Table.Cell>

                      {!readOnly && (
                        <Table.Cell>
                          <IconButton 
                            variant="soft" 
                            color="red" 
                            onClick={() => removeItem(index)}
                            disabled={readOnly}
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </Table.Cell>
                      )}
                    </Table.Row>
                  ))}

                  {items.length === 0 && (
                    <Table.Row>
                      <Table.Cell colSpan={readOnly ? 4 : 5} className="text-center">
                        <Flex align="center" justify="center" gap="2" className="py-8 text-gray-500">
                          <Inbox className="h-5 w-5" />
                          <Text>No items added yet</Text>
                          {!readOnly && stockItems.length === 0 && (
                            <Text size="1" color="orange">Loading available items...</Text>
                          )}
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Root>
            </Card>
          </div>
        </div>

        {/* Notes Section */}
        <Box mt="4">
          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="medium">Notes</Text>
            <TextArea 
              placeholder={readOnly ? "-" : "Enter any additional notes..."} 
              value={notes}
              onChange={(e) => !readOnly && setNotes(e.target.value)}
              disabled={readOnly}
              rows={3}
            />
          </Flex>
        </Box>

        {/* Action Buttons */}
        <Flex 
          direction={{ initial: "column", sm: "row" }} 
          justify="end" 
          gap="3" 
          mt="6"
        >
          {!readOnly && (
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Request'}
            </Button>
          )}
          <Button variant="soft" color="gray" onClick={onCancel}>
            <X className="h-4 w-4" />
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
        </Flex>
      </form>
    </Card>
  );
};

export default StockRequestForm; 