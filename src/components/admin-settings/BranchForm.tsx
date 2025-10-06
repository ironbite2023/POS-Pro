'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  Button, 
  TextField, 
  Select,
  Switch,
  Flex, 
  Box,
  Text 
} from '@radix-ui/themes';
import { useAdminActions } from '@/hooks/useAdminActions';
import type { Database } from '@/lib/supabase/database.types';

type Branch = Database['public']['Tables']['branches']['Row'];

const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(100),
  code: z.string().min(1, 'Branch code is required').max(10),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().min(1, 'Country is required'),
  }),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  timezone: z.string().optional(),
  region: z.string().optional(),
  business_hours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
  }),
  services: z.object({
    dine_in: z.boolean(),
    takeaway: z.boolean(),
    delivery: z.boolean(),
  }),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface BranchFormProps {
  branch?: Branch | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultBusinessHours = {
  monday: { open: '09:00', close: '21:00', is_open: true },
  tuesday: { open: '09:00', close: '21:00', is_open: true },
  wednesday: { open: '09:00', close: '21:00', is_open: true },
  thursday: { open: '09:00', close: '21:00', is_open: true },
  friday: { open: '09:00', close: '21:00', is_open: true },
  saturday: { open: '09:00', close: '21:00', is_open: true },
  sunday: { open: '10:00', close: '20:00', is_open: true },
};

const defaultServices = {
  dine_in: true,
  takeaway: true,
  delivery: false,
};

export default function BranchForm({ 
  branch, 
  open, 
  onClose, 
  onSuccess 
}: BranchFormProps) {
  const { createBranch, updateBranch } = useAdminActions();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: branch ? {
      name: branch.name,
      code: branch.code,
      address: (branch.address as Record<string, string>) || {},
      phone: branch.phone || '',
      email: branch.email || '',
      timezone: branch.timezone || 'UTC',
      region: branch.region || '',
      business_hours: (branch.business_hours as typeof defaultBusinessHours) || defaultBusinessHours,
      services: (branch.services as typeof defaultServices) || defaultServices,
    } : {
      timezone: 'UTC',
      region: '',
      business_hours: defaultBusinessHours,
      services: defaultServices,
      address: {
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
      },
    },
  });

  const onSubmit = async (data: BranchFormData) => {
    try {
      const branchData = {
        ...data,
        status: 'active',
      };

      if (branch) {
        await updateBranch(branch.id, branchData);
      } else {
        await createBranch(branchData);
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
      <Dialog.Content style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }}>
        <Dialog.Title>
          {branch ? 'Edit Branch' : 'Create Branch'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="6">
            {/* Basic Info */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="block mb-2">Branch Name *</Text>
                <TextField.Root
                  {...register('name')}
                  placeholder="Enter branch name"
                />
                {errors.name && (
                  <Text size="1" color="red" className="mt-1">{errors.name.message}</Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" className="block mb-2">Branch Code *</Text>
                <TextField.Root
                  {...register('code')}
                  placeholder="e.g., NYC01"
                  className="w-32"
                />
                {errors.code && (
                  <Text size="1" color="red" className="mt-1">{errors.code.message}</Text>
                )}
              </Box>
            </Flex>

            {/* Address */}
            <Box>
              <Text as="label" size="2" weight="medium" className="block mb-2">Address *</Text>
              <Flex direction="column" gap="2">
                <TextField.Root
                  {...register('address.street')}
                  placeholder="Street address"
                />
                {errors.address?.street && (
                  <Text size="1" color="red">{errors.address.street.message}</Text>
                )}
                
                <Flex gap="2">
                  <TextField.Root
                    {...register('address.city')}
                    placeholder="City"
                    className="flex-1"
                  />
                  <TextField.Root
                    {...register('address.state')}
                    placeholder="State"
                  />
                  <TextField.Root
                    {...register('address.postal_code')}
                    placeholder="ZIP"
                  />
                </Flex>
                
                <TextField.Root
                  {...register('address.country')}
                  placeholder="Country"
                />
                {errors.address?.country && (
                  <Text size="1" color="red">{errors.address.country.message}</Text>
                )}
              </Flex>
            </Box>

            {/* Contact */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="block mb-2">Phone</Text>
                <TextField.Root
                  {...register('phone')}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                />
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="block mb-2">Email</Text>
                <TextField.Root
                  {...register('email')}
                  type="email"
                  placeholder="branch@restaurant.com"
                />
              </Box>
            </Flex>

            {/* Settings */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="block mb-2">Timezone</Text>
                <Select.Root
                  onValueChange={(value) => setValue('timezone', value)}
                  defaultValue={watch('timezone') || 'UTC'}
                >
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="UTC">UTC</Select.Item>
                    <Select.Item value="America/New_York">Eastern Time</Select.Item>
                    <Select.Item value="America/Chicago">Central Time</Select.Item>
                    <Select.Item value="America/Denver">Mountain Time</Select.Item>
                    <Select.Item value="America/Los_Angeles">Pacific Time</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" className="block mb-2">Region</Text>
                <TextField.Root
                  {...register('region')}
                  placeholder="e.g., North America"
                />
              </Box>
            </Flex>

            {/* Services */}
            <Box>
              <Text size="3" weight="medium" className="mb-3 block">Services Offered</Text>
              <Flex gap="6">
                <Flex align="center" gap="2">
                  <Switch
                    defaultChecked={watch('services.dine_in')}
                    onCheckedChange={(checked) => setValue('services.dine_in', checked)}
                  />
                  <Text>Dine In</Text>
                </Flex>
                
                <Flex align="center" gap="2">
                  <Switch
                    defaultChecked={watch('services.takeaway')}
                    onCheckedChange={(checked) => setValue('services.takeaway', checked)}
                  />
                  <Text>Takeaway</Text>
                </Flex>
                
                <Flex align="center" gap="2">
                  <Switch
                    defaultChecked={watch('services.delivery')}
                    onCheckedChange={(checked) => setValue('services.delivery', checked)}
                  />
                  <Text>Delivery</Text>
                </Flex>
              </Flex>
            </Box>

            {/* Business Hours */}
            <Box>
              <Text size="3" weight="medium" className="mb-3 block">Business Hours</Text>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <Flex key={day} align="center" gap="4" className="mb-2">
                  <Box className="w-24">
                    <Text size="2" weight="medium" className="capitalize">{day}</Text>
                  </Box>
                  
                  <Switch
                    defaultChecked={watch(`business_hours.${day}.is_open` as 'business_hours.monday.is_open')}
                    onCheckedChange={(checked) => setValue(`business_hours.${day}.is_open` as 'business_hours.monday.is_open', checked)}
                  />
                  
                  <TextField.Root
                    {...register(`business_hours.${day}.open` as 'business_hours.monday.open')}
                    type="time"
                    className="w-32"
                    disabled={!watch(`business_hours.${day}.is_open` as 'business_hours.monday.is_open')}
                  />
                  
                  <Text size="2">to</Text>
                  
                  <TextField.Root
                    {...register(`business_hours.${day}.close` as 'business_hours.monday.close')}
                    type="time"
                    className="w-32"
                    disabled={!watch(`business_hours.${day}.is_open` as 'business_hours.monday.is_open')}
                  />
                </Flex>
              ))}
            </Box>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button type="button" variant="soft" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : branch ? 'Update' : 'Create'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
