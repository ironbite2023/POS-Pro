'use client';

import { useState } from 'react';
import { 
  Box,
  Container, 
  Flex, 
  Heading, 
  Button, 
  Table, 
  Badge,
  IconButton,
  Text,
  TextField,
  Grid,
  Card
} from '@radix-ui/themes';
import { Plus, Edit2, Trash2, Search, Building, Phone, Mail } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePurchasingData } from '@/hooks/usePurchasingData';
import { purchasingService } from '@/lib/services';
import SupplierForm from '@/components/purchasing/SupplierForm';
import StatsCard from '@/components/common/StatsCard';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];

export default function SuppliersPage() {
  usePageTitle('Suppliers');
  const { suppliers, metrics, loading, refetchSuppliers } = usePurchasingData();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filteredSuppliers = suppliers.filter(supplier => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.contact_name?.toLowerCase().includes(searchLower) ||
      supplier.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (supplier: Supplier): void => {
    setSelectedSupplier(supplier);
    setShowForm(true);
  };

  const handleDelete = async (supplierId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      setDeleting(supplierId);
      await purchasingService.updateSupplier(supplierId, { is_active: false });
      toast.success('Supplier deleted successfully');
      refetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier');
    } finally {
      setDeleting(null);
    }
  };

  const handleAddNew = (): void => {
    setSelectedSupplier(null);
    setShowForm(true);
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="7">Suppliers</Heading>
          <Button onClick={handleAddNew}>
            <Plus size={16} />
            Add Supplier
          </Button>
        </Flex>

        {/* Metrics */}
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
          <StatsCard
            title="Total Suppliers"
            value={metrics.totalSuppliers.toString()}
            icon={<Building size={20} />}
            loading={loading}
          />
          
          <StatsCard
            title="Monthly Spend"
            value={`$${metrics.monthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<Building size={20} />}
            loading={loading}
          />
          
          <StatsCard
            title="Top Supplier"
            value={metrics.topSupplierByVolume}
            icon={<Building size={20} />}
            loading={loading}
          />
        </Grid>

        {/* Search */}
        <Box>
          <TextField.Root
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '400px' }}
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        {/* Suppliers Table */}
        {loading ? (
          <Card>
            <Text>Loading suppliers...</Text>
          </Card>
        ) : filteredSuppliers.length === 0 ? (
          <Card>
            <Box className="text-center py-12">
              <Text size="3" color="gray">
                {searchTerm ? 'No suppliers match your search' : 'No suppliers added yet'}
              </Text>
              {!searchTerm && (
                <Box className="mt-4">
                  <Button onClick={handleAddNew}>
                    <Plus size={16} />
                    Add Your First Supplier
                  </Button>
                </Box>
              )}
            </Box>
          </Card>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Supplier</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Payment Terms</Table.ColumnHeaderCell>
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
                      {supplier.contact_name && (
                        <Text size="1" color="gray">Contact: {supplier.contact_name}</Text>
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
                    <Badge color={supplier.is_active ? 'green' : 'gray'}>
                      {supplier.is_active ? 'Active' : 'Inactive'}
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
