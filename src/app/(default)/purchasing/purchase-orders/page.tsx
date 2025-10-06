'use client';

import { useState, useMemo } from 'react';
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
  Grid,
  Card
} from '@radix-ui/themes';
import { Plus, Eye, Package, DollarSign } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePurchasingData } from '@/hooks/usePurchasingData';
import { usePurchaseOrderActions } from '@/hooks/usePurchaseOrderActions';
import PurchaseOrderForm from '@/components/purchasing/PurchaseOrderForm';
import StatsCard from '@/components/common/StatsCard';
import { inventoryService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';
import { useEffect } from 'react';
import type { Database } from '@/lib/supabase/database.types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

export default function PurchaseOrdersPage() {
  usePageTitle('Purchase Orders');
  const { currentOrganization } = useOrganization();
  const { 
    suppliers, 
    purchaseOrders, 
    metrics, 
    loading, 
    refetchPurchaseOrders 
  } = usePurchasingData();
  const { updatePurchaseOrderStatus } = usePurchaseOrderActions();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  useEffect(() => {
    const loadInventoryItems = async (): Promise<void> => {
      if (!currentOrganization) return;
      
      try {
        setLoadingInventory(true);
        const items = await inventoryService.getItems(currentOrganization.id);
        setInventoryItems(items);
      } catch (error) {
        console.error('Error loading inventory items:', error);
      } finally {
        setLoadingInventory(false);
      }
    };

    loadInventoryItems();
  }, [currentOrganization]);

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      if (statusFilter === 'all') return true;
      return po.status === statusFilter;
    });
  }, [purchaseOrders, statusFilter]);

  const getStatusColor = (status: string | null): 'yellow' | 'blue' | 'purple' | 'green' | 'red' | 'gray' => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'blue';
      case 'sent': return 'purple';
      case 'received': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const handleStatusUpdate = async (poId: string, newStatus: string): Promise<void> => {
    try {
      await updatePurchaseOrderStatus(poId, newStatus);
      refetchPurchaseOrders();
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="7">Purchase Orders</Heading>
          <Button onClick={() => setShowForm(true)} disabled={loadingInventory}>
            <Plus size={16} />
            Create Purchase Order
          </Button>
        </Flex>

        {/* Metrics */}
        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
          <StatsCard
            title="Active POs"
            value={metrics.activePurchaseOrders.toString()}
            icon={<Package size={20} />}
            loading={loading}
          />
          
          <StatsCard
            title="Pending Receiving"
            value={metrics.pendingReceiving.toString()}
            icon={<Package size={20} />}
            loading={loading}
          />
          
          <StatsCard
            title="Monthly Spend"
            value={`$${metrics.monthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<DollarSign size={20} />}
            loading={loading}
          />
          
          <StatsCard
            title="Avg PO Value"
            value={`$${metrics.averageOrderValue.toFixed(2)}`}
            icon={<DollarSign size={20} />}
            loading={loading}
          />
        </Grid>

        {/* Filters */}
        <Box>
          <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
            <Select.Trigger placeholder="Filter by status" style={{ width: '200px' }} />
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
          <Card>
            <Text>Loading purchase orders...</Text>
          </Card>
        ) : filteredPOs.length === 0 ? (
          <Card>
            <Box className="text-center py-12">
              <Text size="3" color="gray">
                {statusFilter !== 'all' ? 'No purchase orders with this status' : 'No purchase orders created yet'}
              </Text>
              {statusFilter === 'all' && (
                <Box className="mt-4">
                  <Button onClick={() => setShowForm(true)} disabled={loadingInventory}>
                    <Plus size={16} />
                    Create Your First Purchase Order
                  </Button>
                </Box>
              )}
            </Box>
          </Card>
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
                      <Text weight="medium">${(po.total_amount || 0).toFixed(2)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={getStatusColor(po.status)}>
                        {po.status || 'pending'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">
                        {po.created_at ? format(new Date(po.created_at), 'MMM dd, yyyy') : '-'}
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