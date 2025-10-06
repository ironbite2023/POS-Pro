'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  Button, 
  TextField, 
  Select,
  Flex, 
  Box,
  Text 
} from '@radix-ui/themes';
import type { Database } from '@/lib/supabase/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type Branch = Database['public']['Tables']['branches']['Row'];

const staffSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role_id: z.string().min(1, 'Please select a role'),
  primary_branch_id: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface StaffFormProps {
  user?: UserProfile | null;
  roles: Role[];
  branches: Branch[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffForm({ 
  user, 
  roles,
  branches,
  open, 
  onClose, 
  onSuccess 
}: StaffFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: user ? {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email,
      phone: user.phone || '',
      role_id: user.role_id || '',
      primary_branch_id: user.branch_access?.[0] || '',
    } : {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role_id: '',
      primary_branch_id: '',
    },
  });

  const onSubmit = async (data: StaffFormData) => {
    try {
      if (user) {
        // Update existing user (implementation needed)
        console.log('Update user not implemented yet', data);
      } else {
        // Create staff user (implementation needed)
        console.log('Create staff user not implemented yet', data);
      }
      
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      // Error handled in hook
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>
          {user ? 'Edit Staff Member' : 'Add Staff Member'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Name */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="block mb-2">First Name *</Text>
                <TextField.Root
                  {...register('first_name')}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <Text size="1" color="red" className="mt-1">{errors.first_name.message}</Text>
                )}
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="block mb-2">Last Name *</Text>
                <TextField.Root
                  {...register('last_name')}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <Text size="1" color="red" className="mt-1">{errors.last_name.message}</Text>
                )}
              </Box>
            </Flex>

            {/* Contact */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="block mb-2">Email *</Text>
                <TextField.Root
                  {...register('email')}
                  type="email"
                  placeholder="staff@restaurant.com"
                  disabled={!!user}
                />
                {errors.email && (
                  <Text size="1" color="red" className="mt-1">{errors.email.message}</Text>
                )}
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="block mb-2">Phone</Text>
                <TextField.Root
                  {...register('phone')}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                />
              </Box>
            </Flex>

            {/* Role and Branch */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="block mb-2">Role *</Text>
                <Select.Root
                  onValueChange={(value) => setValue('role_id', value)}
                  defaultValue={user?.role_id || ''}
                >
                  <Select.Trigger placeholder="Select role" />
                  <Select.Content>
                    {roles.map(role => (
                      <Select.Item key={role.id} value={role.id}>
                        {role.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                {errors.role_id && (
                  <Text size="1" color="red" className="mt-1">{errors.role_id.message}</Text>
                )}
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="block mb-2">Primary Branch</Text>
                <Select.Root
                  onValueChange={(value) => setValue('primary_branch_id', value)}
                  defaultValue={user?.branch_access?.[0] || ''}
                >
                  <Select.Trigger placeholder="Select branch" />
                  <Select.Content>
                    {branches.map(branch => (
                      <Select.Item key={branch.id} value={branch.id}>
                        {branch.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button type="button" variant="soft" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : user ? 'Update' : 'Create'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
