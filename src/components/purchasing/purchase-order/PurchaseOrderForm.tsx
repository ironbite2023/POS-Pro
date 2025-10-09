'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  Flex, 
  Grid, 
  Heading, 
  Table, 
  Text, 
  Tabs, 
  Badge, 
  TextField, 
  TextArea, 
  Select,
  Separator,
  AlertDialog
} from '@radix-ui/themes';
import { CheckSquare, Save, FileText, Truck, DollarSign, X, Plus, Trash2 } from 'lucide-react';
// Removed hardcoded imports - using real data from database services
import { suppliersService, type PurchaseOrderWithItems } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/lib/supabase/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];
type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row'];

// Receiving Log type for purchase order receiving tracking
interface ReceivingLog {
  id: string;
  date: string;
  quantityReceived: number;
  receivedBy: string;
  notes?: string;
  itemName: string;
  itemSku: string;
  expiryDate?: string;
  storageLocation?: string;
}

import { formatDate } from '@/utilities';
import SelectSupplierDialog from './SelectSupplierDialog';
import DateInput from '@/components/common/DateInput';
import AddItemDialog from './AddItemDialog';
import AddReceivingLog from './AddReceivingLog';
import SearchableSelect from '@/components/common/SearchableSelect';
// Removed hardcoded organization import - using real organization from context
import { PageHeading } from '@/components/common/PageHeading';
import CardHeading from '@/components/common/CardHeading';

interface PurchaseOrderFormProps {
  editingItem?: PurchaseOrder | null;
  onSubmit: (formData: Partial<PurchaseOrder>) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

export default function PurchaseOrderForm({ editingItem, onSubmit, onCancel, onDelete }: PurchaseOrderFormProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [editForm, setEditForm] = useState<Partial<PurchaseOrder>>({});
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PurchaseOrderItem | null>(null);
  const [isAddReceivingLogOpen, setIsAddReceivingLogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { currentOrganization } = useOrganization();
  
  // Load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      if (!currentOrganization) return;
      
      try {
        const supplierData = await suppliersService.getSuppliers(currentOrganization.id);
        setSuppliers(supplierData);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        setSuppliers([]);
      }
    };

    loadSuppliers();
  }, [currentOrganization]);
  
  // Date states
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | undefined>(undefined);
  const [datePaid, setDatePaid] = useState<Date | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isNewPO = !editingItem;
  const isEditable = isNewPO || editingItem?.status === 'Draft';
  
  useEffect(() => {
    if (isNewPO) {
      const today = new Date();
      const newPO: Partial<PurchaseOrder> = {
        created_at: today.toISOString(),
        order_date: today.toISOString().slice(0, 10),
        status: 'Draft',
        created_by: 'current-user-id', // TODO: Get actual user ID from context
        organization_id: '', // TODO: Get from organization context
        po_number: '', // TODO: Generate PO number
        supplier_id: '',
        total_amount: 0,
        notes: '',
        branch_id: '', // TODO: Get from branch context
        expected_delivery_date: ''
      };
      setEditForm(newPO);
      setOrderDate(today);
    } else if (editingItem) {
      setEditForm(editingItem);
      
      if (editingItem.order_date) {
        setOrderDate(new Date(editingItem.order_date));
      }
      
      if (editingItem.expected_delivery_date) {
        setExpectedDeliveryDate(new Date(editingItem.expected_delivery_date));
      }
      
      // TODO: Handle payment details when payment schema is implemented
      // if (editingItem.paymentDetails?.datePaid) {
      //   setDatePaid(new Date(editingItem.paymentDetails.datePaid));
      // }
    }
  }, [editingItem, isNewPO]);
  
  const handleSave = () => {
    if (isEditable) {
      onSubmit(editForm);
    }
  };
  
  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setEditForm({
        ...editForm,
        supplier_id: supplier.id
        // TODO: Handle supplier details display separately since they're not part of PurchaseOrder schema
      });
      setIsSupplierDialogOpen(false);
    }
  };
  
  const handleAddItem = (item: PurchaseOrderItem) => {
    const currentItems = []; // TODO: Load purchase order items from separate table
    const newItems = [...currentItems, item];
    const newTotalValue = newItems.reduce((total, item) => total + (item.quantity_ordered * item.unit_cost), 0);
    
    setEditForm({
      ...editForm,
      total_amount: newTotalValue
      // TODO: Save purchase order items to separate table
    });
  };

  const handleEditItem = (item: PurchaseOrderItem) => {
    setItemToEdit(item);
    setIsAddItemDialogOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    const currentItems = []; // TODO: Load purchase order items from separate table
    const newItems = currentItems.filter(item => item.id !== itemId);
    const newTotalValue = newItems.reduce((total, item) => total + (item.quantity_ordered * item.unit_cost), 0);
    
    setEditForm({
      ...editForm,
      total_amount: newTotalValue
      // TODO: Save purchase order items to separate table
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'gray';
      case 'Pending': return 'amber';
      case 'In Progress': return 'blue';
      case 'Delivered': return 'green';
      case 'Partially Received': return 'purple';
      case 'Canceled': return 'red';
      default: return 'gray';
    }
  };
  
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'green';
      case 'Partially Paid': return 'amber';
      case 'Unpaid': return 'red';
      default: return 'gray';
    }
  };
  
  const handleAddReceivingLog = (log: ReceivingLog) => {
    // TODO: Implement proper receiving log handling with database schema
    // For now, just close the dialog - full implementation needed when schema is ready
    console.log('Received log:', log);
  };
  
  const isAllItemsReceived = (items: PurchaseOrderItem[]) => {
    return items.every(item => (item.quantity_received || 0) >= item.quantity_ordered);
  };
  
  const poData = editForm;

  const handleDelete = () => {
    if (editingItem?.id && onDelete) {
      onDelete(editingItem.id);
      setShowDeleteDialog(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Flex 
        direction={{ initial: "column", sm: "row" }} 
        justify="between" 
        align={{ initial: "stretch", sm: "center" }}
        gap={{ initial: "4", sm: "0" }}
        mb="4"
      >
        <PageHeading
          title={isNewPO ? 'New Purchase Order' : poData?.po_number} 
          description={isNewPO ? 'Create a new purchase order' : 'View/edit purchase order'}
          showBackButton={true}
          onBackClick={onCancel}
          noMarginBottom
          badge={
            <>
              {poData?.status && (
                <Badge color={getStatusColor(poData.status)}>{poData.status}</Badge>
              )}
              {/* TODO: Add payment status when payment schema is implemented */}
              {poData?.organization_id && (
                <Badge color="blue">
                  Organization: {poData.organization_id.slice(0, 8)}...
                </Badge>
              )}
            </>
          }
        />
        {!isEditable && (
          <Text size="2" color="gray">This purchase order cannot be edited</Text>
        )}
      </Flex>
      
      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="overflow-x-auto">
          <Tabs.Trigger value="general">
            <FileText size={16} className="mr-2" />
            General Information
          </Tabs.Trigger>
          <Tabs.Trigger value="items">
            <CheckSquare size={16} className="mr-2" />
            Order Items
          </Tabs.Trigger>
          {!isEditable && (
            <>
              <Tabs.Trigger value="status">
                <Truck size={16} className="mr-2" />
                Order Status & Tracking
              </Tabs.Trigger>
              <Tabs.Trigger value="payment">
                <DollarSign size={16} className="mr-2" />
                Payment & Invoicing
              </Tabs.Trigger>
            </>
          )}
        </Tabs.List>
        
        <Box mt="4">
          {/* General Information Tab */}
          {activeTab === 'general' && (
            <Card size="3">
              <CardHeading title="Order Information" mb="4"/>
              <Grid columns={{ initial: "1", sm: "2" }} gap="4">
                <Grid columns={{ initial: "1", sm: "2" }} gap="4">
                  <Flex direction="column" gap="1">
                    <Text as="label" size="2" weight="medium">PO Number</Text>
                                          <Text>{isNewPO ? 'Auto-generated' : poData?.po_number}</Text>
                  </Flex>
                  <Flex direction="column" gap="1">
                    <Text as="label" size="2" weight="medium">Ordered By</Text>
                                          <Text>{poData?.created_by || 'Unknown'}</Text>
                  </Flex>
                </Grid>
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Order Date</Text>
                  {isEditable ? (
                    <DateInput
                      value={orderDate}
                      onChange={(date) => {
                        setOrderDate(date);
                        if (date) {
                          setEditForm({
                            ...editForm,
                                                          order_date: date.toISOString().slice(0, 10)
                          });
                        }
                      }}
                      placeholder="Select order date"
                    />
                  ) : (
                    <Text>{orderDate ? formatDate(orderDate) : "Not set"}</Text>
                  )}
                </Flex>
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Ordered For</Text>
                  <TextField.Root 
                    value={editForm.organization_id || ''}
                    onChange={(e) => {
                      if (!isEditable) return;
                      setEditForm({
                        ...editForm,
                        organization_id: e.target.value
                      });
                    }}
                    placeholder="Organization ID"
                    readOnly={!isEditable}
                  />
                </Flex>
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Expected Delivery Date</Text>
                  {isEditable ? (
                    <DateInput
                      value={expectedDeliveryDate}
                      onChange={(date) => {
                        setExpectedDeliveryDate(date);
                        if (date) {
                          setEditForm({
                            ...editForm,
                                                          expected_delivery_date: date.toISOString().slice(0, 10)
                          });
                        }
                      }}
                      placeholder="Select delivery date"
                      minDate={new Date()}
                    />
                  ) : (
                    <Text>{expectedDeliveryDate ? formatDate(expectedDeliveryDate) : "Not set"}</Text>
                  )}
                </Flex>
              </Grid>
              
              <Separator size="4" my="4" />
              
              <CardHeading title="Supplier Information" mb="4"/>
              <Grid columns={{ initial: "1", sm: "2" }} gap="4" width="auto">
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Supplier</Text>
                  <Flex 
                    direction={{ initial: "column", sm: "row" }}
                    gap={{ initial: "2", sm: "2" }}
                  >
                    <TextField.Root 
                      value={editForm.supplier_id || 'No supplier selected'}
                      readOnly
                      placeholder="Select a supplier"
                      className="w-full"
                    />
                    <Button variant="soft" onClick={() => setIsSupplierDialogOpen(true)} disabled={!isEditable}>
                      Select Supplier
                    </Button>
                  </Flex>
                </Flex>
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Contact Name</Text>
                  <TextField.Root 
                    value=""
                    placeholder="Contact name will load when supplier integration is complete"
                    readOnly
                  />
                </Flex>
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Contact Email</Text>
                  <TextField.Root 
                    value=""
                    placeholder="Contact email will load when supplier integration is complete"
                    readOnly
                  />
                </Flex>
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Contact Phone</Text>
                  <TextField.Root 
                    value=""
                    placeholder="Contact phone will load when supplier integration is complete"
                    readOnly
                  />
                </Flex>
                <Flex direction="column" gap="1" gridColumn={{ initial: "1", sm: "1 / 3" }}>
                  <Text as="label" size="2" weight="medium">Address</Text>
                  <TextArea 
                    value=""
                    placeholder="Address will load when supplier integration is complete"
                    readOnly
                  />
                </Flex>
              </Grid>
              
              <Separator size="4" my="4" />
              
              <CardHeading title="Notes" mb="4"/>
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Notes</Text>
                <TextArea 
                  placeholder="Any special instructions or notes for this order"
                  value={editForm.notes || ''}
                  onChange={(e) => {
                    if (!isEditable) return;
                    setEditForm({...editForm, notes: e.target.value});
                  }}
                  readOnly={!isEditable}
                />
              </Flex>
            </Card>
          )}
          
          {/* Order Items Tab */}
          {activeTab === 'items' && (
            <Card size="3">
              <Flex 
                direction={{ initial: "column", sm: "row" }}
                justify="between" 
                align={{ initial: "stretch", sm: "center" }}
                gap={{ initial: "3", sm: "0" }}
                mb="3"
              >
                <CardHeading title="Order Items" mb="0"/>
                <Button 
                  size="2"
                  onClick={() => setIsAddItemDialogOpen(true)}
                  disabled={!isEditable}
                >
                  <Plus size={16} />
                  Add Item
                </Button>
              </Flex>
              <div className="overflow-x-auto">
                <Table.Root variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Item Name</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="right">Quantity</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="right">Unit Price</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="right">Sub Total</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="right">Received</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Stock Location</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {/* TODO: Load and display purchase order items from separate table */}
                    {false ? (
                      [].map((item) => (
                        <Table.Row key={item.id}>
                          <Table.Cell>{item.itemName}</Table.Cell>
                          <Table.Cell align="right">{item.quantityOrdered}</Table.Cell>
                          <Table.Cell align="right">${item.unitPrice.toFixed(2)}</Table.Cell>
                          <Table.Cell align="right">${(item.quantityOrdered * item.unitPrice).toFixed(2)}</Table.Cell>
                          <Table.Cell align="right">{item.receivedQuantity || 0}</Table.Cell>
                          <Table.Cell>{item.stockLocation || 'Not specified'}</Table.Cell>
                          <Table.Cell>
                            {isEditable ? (
                              <Flex gap="1">
                                <Button 
                                  variant="soft" 
                                  size="1"
                                  onClick={() => handleEditItem(item)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="soft" 
                                  size="1" 
                                  color="red"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  Delete
                                </Button>
                              </Flex>
                            ) : (
                              <Text size="1" color="gray">No actions available</Text>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={7}>
                          <Text align="center" className="py-3">No items in this order</Text>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Root>
              </div>
              <Flex justify="end" mt="4">
                <Box p="2" style={{ textAlign: 'right' }}>
                  <Text weight="bold">Total Order Value: ${editForm.total_amount?.toFixed(2) || '0.00'}</Text>
                </Box>
              </Flex>
            </Card>
          )}
          
          {/* Order Status Tab */}
          {activeTab === 'status' && (
            <Box className="space-y-4">
              <Card size="3">
                <CardHeading title="Order Status & Tracking"/>
                
                <Grid columns={{ initial: "1", sm: "2" }} gap="4" width="auto" mb="4">
                  <Flex direction="column" gap="1">
                    <Text as="label" size="2" weight="medium">Current Status</Text>
                    <Select.Root 
                                              value={editForm.status}
                      onValueChange={(value) => {
                        if (!isEditable) return;
                        setEditForm({
                          ...editForm, 
                                                      status: value
                        });
                      }}
                      disabled={!isEditable}
                    >
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="Draft">Draft</Select.Item>
                        <Select.Item value="Pending">Pending</Select.Item>
                        <Select.Item value="In Progress">In Progress</Select.Item>
                        <Select.Item value="Delivered">Delivered</Select.Item>
                        <Select.Item value="Partially Received">Partially Received</Select.Item>
                        <Select.Item value="Canceled">Canceled</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Flex>
                  
                  <Flex direction="column" gap="1">
                    <Text as="label" size="2" weight="medium">Supplier Confirmation</Text>
                    <Select.Root 
                                              value="no" // TODO: Implement supplier confirmation in database schema
                      onValueChange={(value) => {
                        if (!isEditable) return;
                        setEditForm({
                          ...editForm, 
                                                      // TODO: Handle supplier confirmation when schema is implemented
                        });
                      }}
                      disabled={!isEditable}
                    >
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="yes">Confirmed</Select.Item>
                        <Select.Item value="no">Not Confirmed</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Flex>
                </Grid>
                
                <Grid columns={{ initial: "1", sm: "2" }} gap="4" width="auto">
                  <Flex direction="column" gap="1">
                    <Text as="label" size="2" weight="medium">Tracking Number</Text>
                    <TextField.Root 
                                              value="" // TODO: Implement tracking when shipping schema is added
                      onChange={(e) => {
                        if (!isEditable) return;
                        setEditForm({
                          ...editForm, 
                                                      // TODO: Handle shipping details when schema is implemented
                        });
                      }}
                      readOnly={!isEditable}
                    />
                  </Flex>
                  <Flex direction="column" gap="1">
                    <Text as="label" size="2" weight="medium">Estimated Delivery Time (days)</Text>
                    <TextField.Root 
                      type="number"
                      min="1"
                                              value="" // TODO: Implement delivery time estimation when shipping schema is added
                      onChange={(e) => {
                        if (!isEditable) return;
                        setEditForm({
                          ...editForm, 
                                                      // TODO: Handle shipping details when schema is implemented
                        });
                      }}
                      readOnly={!isEditable}
                    />
                  </Flex>
                </Grid>
              </Card>
              <Card size="3">
                {/* Receiving Logs */}
                <CardHeading title="Receiving Logs" mb="4"/>
                
                <div className="overflow-x-auto">
                  <Table.Root variant="surface">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Item Name</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>SKU</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Qty. Received</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Expiry Date</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Storage Location</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Received By</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Notes</Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                                              {false ? ( // TODO: Load receiving logs when schema is implemented
                          [].map((log) => (
                          <Table.Row key={log.id}>
                            <Table.Cell>{log.itemName}</Table.Cell>
                            <Table.Cell>{log.itemSku}</Table.Cell>
                            <Table.Cell>{log.quantityReceived}</Table.Cell>
                            <Table.Cell>{log.expiryDate ? formatDate(new Date(log.expiryDate)) : 'N/A'}</Table.Cell>
                            <Table.Cell>{log.storageLocation || 'N/A'}</Table.Cell>
                            <Table.Cell>{log.receivedBy}</Table.Cell>
                            <Table.Cell>{formatDate(new Date(log.date))}</Table.Cell>
                            <Table.Cell>{log.notes || '-'}</Table.Cell>
                          </Table.Row>
                        ))
                      ) : (
                        <Table.Row>
                          <Table.Cell colSpan={8}>
                            <Text align="center" className="py-3">No receiving logs recorded</Text>
                          </Table.Cell>
                        </Table.Row>
                      )}
                    </Table.Body>
                  </Table.Root>
                </div>
                
                                  {(editForm.status === 'In Progress' || editForm.status === 'Partially Received') && (
                  <Button 
                    mt="3" 
                    variant="soft" 
                    onClick={() => setIsAddReceivingLogOpen(true)}
                    disabled={!isEditable && !(editForm.status === 'In Progress' || editForm.status === 'Partially Received')}
                  >
                    Add Receiving Log
                  </Button>
                )}
              </Card>
            </Box>
          )}
          
          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <Card size="3">
              <CardHeading title="Payment & Invoicing" mb="4"/>
              
              <Grid columns={{ initial: "1", sm: "2" }} gap="4" width="auto">
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Total Order Cost</Text>
                  <Text size="4" weight="bold">${editForm.total_amount?.toFixed(2) || '0.00'}</Text>
                </Flex>
                
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Payment Status</Text>
                  <Select.Root 
                                          value="" // TODO: Implement payment status when payment schema is added
                    onValueChange={(value) => {
                      if (!isEditable) return;
                      setEditForm({
                        ...editForm, 
                                                  // TODO: Handle payment status when schema is implemented
                      });
                    }}
                    disabled={!isEditable}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="Paid">Paid</Select.Item>
                      <Select.Item value="Partially Paid">Partially Paid</Select.Item>
                      <Select.Item value="Unpaid">Unpaid</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Flex>
                
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Payment Terms</Text>
                  <Select.Root 
                                          value="" // TODO: Load payment terms when payment schema is implemented
                    onValueChange={(value) => {
                      if (!isEditable) return;
                      setEditForm({
                        ...editForm, 
                                                  // TODO: Handle payment details when schema is implemented
                      });
                    }}
                    disabled={!isEditable}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="Due on delivery">Due on delivery</Select.Item>
                      <Select.Item value="Net 15">Net 15</Select.Item>
                      <Select.Item value="Net 30">Net 30</Select.Item>
                      <Select.Item value="Net 45">Net 45</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Flex>
                
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Invoice Number</Text>
                  <TextField.Root 
                                          value="" // TODO: Load invoice number when payment schema is implemented
                    onChange={(e) => {
                      if (!isEditable) return;
                      setEditForm({
                        ...editForm, 
                                                  // TODO: Handle payment details when schema is implemented
                      });
                    }}
                    readOnly={!isEditable}
                  />
                </Flex>
                
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Payment Method</Text>
                  <Select.Root 
                                          value="" // TODO: Load payment method when payment schema is implemented
                    onValueChange={(value) => {
                      if (!isEditable) return;
                      setEditForm({
                        ...editForm, 
                                                  // TODO: Handle payment details when schema is implemented
                      });
                    }}
                    disabled={!isEditable}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="Credit Card">Credit Card</Select.Item>
                      <Select.Item value="Bank Transfer">Bank Transfer</Select.Item>
                      <Select.Item value="Cash on Delivery">Cash on Delivery</Select.Item>
                      <Select.Item value="Check">Check</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Flex>
                
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">Date Paid</Text>
                  {isEditable ? (
                    <DateInput
                      value={datePaid}
                      onChange={(date) => {
                        setDatePaid(date);
                        if (date) {
                          setEditForm({
                            ...editForm,
                                                          // TODO: Handle payment details when schema is implemented
                          });
                        }
                      }}
                      placeholder="Select date paid"
                      maxDate={new Date()}
                    />
                  ) : (
                    <Text>{datePaid ? formatDate(datePaid) : "Not set"}</Text>
                  )}
                </Flex>
              </Grid>
            </Card>
          )}
        </Box>
      </Tabs.Root>
      
      <Flex 
        direction={{ initial: "column", sm: "row" }}
        justify="between" 
        gap={{ initial: "3", sm: "4" }}
        mt="4"
      >
        <Flex 
          direction={{ initial: "column", sm: "row" }}
          gap={{ initial: "3", sm: "4" }}
        >
          {isEditable ? (
            <>
              <Button onClick={handleSave} color="green">
                <Save size={16} /> {isNewPO ? 'Create Purchase Order' : 'Save Changes'}
              </Button>
              <Button variant="soft" color="gray" onClick={onCancel}>
                <X size={16} />
                Cancel
              </Button>
            </>
          ) : null}
        </Flex>
                  {isEditable && editingItem?.status === 'Draft' && (
          <Button 
            variant="soft" 
            color="red" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 size={16} />
            Delete
          </Button>
        )}
      </Flex>

      <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete Purchase Order</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete this purchase order? This action cannot be undone.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={handleDelete}>
                Delete
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
      
      <SelectSupplierDialog
        open={isSupplierDialogOpen}
        onOpenChange={setIsSupplierDialogOpen}
        onSelectSupplier={handleSupplierSelect}
      />
      
      <AddItemDialog
        open={isAddItemDialogOpen}
        onOpenChange={(open) => {
          setIsAddItemDialogOpen(open);
          if (!open) setItemToEdit(null);
        }}
        onAddItem={handleAddItem}
        initialItem={itemToEdit}
      />
      
      <AddReceivingLog
        open={isAddReceivingLogOpen}
        onOpenChange={setIsAddReceivingLogOpen}
        onAddLog={handleAddReceivingLog}
        availableItems={[]} // TODO: Load available items from purchase order items table
      />
    </Box>
  );
} 