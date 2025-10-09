'use client';

import { Card, Box, Flex, Text, Grid, TextField, Avatar, Button, TextArea } from '@radix-ui/themes';
// Removed hardcoded import - using real inventory categories from database
import { inventoryService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/lib/supabase/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
import { Select } from '@radix-ui/themes';

interface SupplierGeneralInfoProps {
  supplier: Supplier;
  onUpdate: (updates: Partial<Supplier>) => void;
}

export default function SupplierGeneralInfo({ supplier, onUpdate }: SupplierGeneralInfoProps) {
  // Supplier categories for business categorization
  const supplierCategories = [
    'Food & Beverage',
    'Equipment',
    'Packaging',
    'Cleaning Supplies',
    'Utilities',
    'Professional Services',
    'Other'
  ];

  const handleChange = (field: keyof Supplier) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ [field]: e.target.value });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // TODO: Add notes field to suppliers table or handle separately
    console.log('Notes update:', e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    // TODO: Add category field to suppliers table if needed for business categorization
    console.log('Category update:', value);
  };

  const handleActiveChange = (value: string) => {
    onUpdate({ is_active: value === 'active' });
  };

  return (
    <Card size="3" className="p-6">
      <Grid columns={{ initial: '1', md: '3' }} gap="6">
        {/* Logo and Name */}
        <Box className="md:col-span-1">
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2" mb="4">
              <Avatar 
                size="6" 
                src="" 
                fallback={supplier.name ? supplier.name.substring(0, 2).toUpperCase() : 'SP'} 
                radius="full"
              />
              <Flex align="center" gap="2">
                <label className="flex-1">
                  <Button size="1" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>                  
                    Upload Image
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      // TODO: Implement logo upload when suppliers table has logo_url field
                      console.log('Logo upload attempt - not yet implemented');
                    }}
                  />
                </label>
                {/* TODO: Show remove button when logo functionality is implemented */}
              </Flex>
            </Flex>
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Supplier Name</Text>
              <TextField.Root 
                value={supplier.name} 
                onChange={handleChange('name')}
                placeholder="Supplier Name"
              />
            </Flex>
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Category</Text>
              <Select.Root 
                value="Other" 
                onValueChange={handleCategoryChange}
              >
                <Select.Trigger className="w-full" />
                <Select.Content>
                  {supplierCategories.map(category => (
                    <Select.Item key={category} value={category}>{category}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Status</Text>
              <Select.Root 
                value={supplier.is_active ? 'active' : 'inactive'} 
                onValueChange={handleActiveChange}
              >
                <Select.Trigger className="w-full" />
                <Select.Content>
                  <Select.Item value="active">Active</Select.Item>
                  <Select.Item value="inactive">Inactive</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>
          </Flex>
        </Box>

        {/* Contact Information */}
        <Box className="md:col-span-2">          
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Contact Person</Text>
              <TextField.Root 
                value={supplier.contact_name || ''} 
                onChange={handleChange('contact_name')}
                placeholder="Contact Person"
              />
            </Flex>
            
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Phone Number</Text>
              <TextField.Root 
                value={supplier.phone} 
                onChange={handleChange('phone')}
                placeholder="Phone Number"
              />
            </Flex>
            
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Email Address</Text>
              <TextField.Root 
                value={supplier.email} 
                onChange={handleChange('email')}
                placeholder="Email Address"
              />
            </Flex>
            
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Address</Text>
              <TextField.Root 
                value={typeof supplier.address === 'string' ? supplier.address : JSON.stringify(supplier.address || '')} 
                onChange={(e) => {
                  onUpdate({ address: e.target.value });
                }}
                placeholder="Address"
              />
            </Flex>
            
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Notes</Text>
              <TextArea
                value="" 
                onChange={handleNotesChange}
                placeholder="Notes feature coming soon - not yet in database schema"
              />
            </Flex>
          </Flex>
        </Box>
      </Grid>
    </Card>
  );
} 