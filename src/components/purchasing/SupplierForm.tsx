'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  Button, 
  TextField, 
  TextArea,
  Flex, 
  Box,
  Text 
} from '@radix-ui/themes';
import { useOrganization } from '@/contexts/OrganizationContext';
import { purchasingService } from '@/lib/services';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(100),
  contact_name: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
  payment_terms: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier?: Supplier | null;
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
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier ? {
      name: supplier.name,
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      payment_terms: supplier.payment_terms || '',
    } : {
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      payment_terms: '',
    },
  });

  const onSubmit = async (data: SupplierFormData): Promise<void> => {
    if (!currentOrganization) return;

    try {
      const supplierData: SupplierInsert = {
        ...data,
        organization_id: currentOrganization.id,
        is_active: true,
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
                <Text as="label" size="2" weight="medium" className="mb-2 block">
                  Supplier Name *
                </Text>
                <TextField.Root
                  {...register('name')}
                  placeholder="Enter supplier name"
                />
                {errors.name && (
                  <Text size="1" color="red">{errors.name.message}</Text>
                )}
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="mb-2 block">
                  Contact Person
                </Text>
                <TextField.Root
                  {...register('contact_name')}
                  placeholder="Contact person name"
                />
              </Box>
            </Flex>

            {/* Contact Info */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="mb-2 block">
                  Email
                </Text>
                <TextField.Root
                  {...register('email')}
                  type="email"
                  placeholder="supplier@example.com"
                />
                {errors.email && (
                  <Text size="1" color="red">{errors.email.message}</Text>
                )}
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="mb-2 block">
                  Phone
                </Text>
                <TextField.Root
                  {...register('phone')}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                />
              </Box>
            </Flex>

            {/* Business Terms */}
            <Box>
              <Text as="label" size="2" weight="medium" className="mb-2 block">
                Payment Terms
              </Text>
              <TextField.Root
                {...register('payment_terms')}
                placeholder="e.g., Net 30, COD"
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
