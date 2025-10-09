'use client';

import { useState, useEffect } from 'react';
import { Dialog, TextField, Table, Text, Flex, Button, ScrollArea, Box } from '@radix-ui/themes';
import { Search, X } from 'lucide-react';
// Removed hardcoded import - using real suppliers from database
import { suppliersService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/lib/supabase/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];

interface SelectSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSupplier: (supplierId: string) => void;
}

export default function SelectSupplierDialog({
  open,
  onOpenChange,
  onSelectSupplier
}: SelectSupplierDialogProps) {
  const { currentOrganization } = useOrganization();
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Load suppliers from database
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
  }, [currentOrganization, open]);
  
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    (supplier.contact_name || '').toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    (supplier.email || '').toLowerCase().includes(supplierSearchTerm.toLowerCase())
  );
  
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 700 }}>
        <Flex justify="between">
          <Dialog.Title>Select Supplier</Dialog.Title>
          <Dialog.Close>
            <Button color="gray" variant="ghost">
              <X size={16} />
            </Button>
          </Dialog.Close>
        </Flex>
        <Dialog.Description size="2" mb="4">
          Choose a supplier for this purchase order.
        </Dialog.Description>
        
        <TextField.Root 
          placeholder="Search suppliers..." 
          value={supplierSearchTerm}
          onChange={(e) => setSupplierSearchTerm(e.target.value)}
          mb="4"
        >
          <TextField.Slot>
            <Search className="h-4 w-4" />
          </TextField.Slot>
        </TextField.Root>
        
        <ScrollArea type="auto">
          <Box className="h-[550px]" pr="4">
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Supplier</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Category</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <Table.Row key={supplier.id} className="align-middle cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800" onClick={() => onSelectSupplier(supplier.id)}>
                    <Table.Cell>
                      <Text weight="bold">{supplier.name}</Text>
                    </Table.Cell>
                    <Table.Cell>General</Table.Cell> {/* TODO: Add category field to suppliers table if needed */}
                    <Table.Cell>
                      <Text as="p">{supplier.contact_name || 'No contact'}</Text>
                      <Text size="1" color="gray">{supplier.email || 'No email'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Button size="1" onClick={() => onSelectSupplier(supplier.id)}>
                        Select
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={4}>
                    <Text align="center" className="py-3">No suppliers found</Text>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
          </Box>
        </ScrollArea>
        
        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" color="gray" onClick={() => onOpenChange(false)}>
            <X size={16} />
            Cancel
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
