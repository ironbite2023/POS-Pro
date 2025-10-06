'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  Button, 
  TextField, 
  Flex, 
  Box,
  Text 
} from '@radix-ui/themes';
import { useLoyaltyActions } from '@/hooks/useLoyaltyActions';
import type { Database } from '@/lib/supabase/database.types';

type LoyaltyMember = Database['public']['Tables']['loyalty_members']['Row'];
type LoyaltyTier = Database['public']['Tables']['loyalty_tiers']['Row'];

const memberSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required'),
  date_of_birth: z.string().optional().or(z.literal('')),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  member?: LoyaltyMember;
  tiers: LoyaltyTier[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MemberForm({ 
  member, 
  tiers,
  open, 
  onClose, 
  onSuccess 
}: MemberFormProps) {
  const { enrollMember, isProcessing } = useLoyaltyActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: member ? {
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      email: member.email || '',
      phone: member.phone || '',
      date_of_birth: member.date_of_birth || '',
    } : {},
  });

  const onSubmit = async (data: MemberFormData) => {
    try {
      // Get base tier (lowest tier)
      const baseTier = tiers.sort((a, b) => a.min_points - b.min_points)[0];
      
      const memberData = {
        member_number: `MEM${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone,
        date_of_birth: data.date_of_birth || null,
        tier_id: baseTier?.id || null,
      };

      if (member) {
        // TODO: Update existing member (implementation needed)
        console.log('Member update not implemented yet');
      } else {
        await enrollMember(memberData);
      }
      
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      // Error handled in hook
      console.error('Error submitting member form:', error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>
          {member ? 'Edit Member' : 'Enroll New Member'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Name Fields */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" mb="1">
                  First Name *
                </Text>
                <TextField.Root
                  {...register('first_name')}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <Text size="1" color="red">{errors.first_name.message}</Text>
                )}
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" mb="1">
                  Last Name *
                </Text>
                <TextField.Root
                  {...register('last_name')}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <Text size="1" color="red">{errors.last_name.message}</Text>
                )}
              </Box>
            </Flex>

            {/* Contact Info */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Email
              </Text>
              <TextField.Root
                {...register('email')}
                type="email"
                placeholder="email@example.com"
              />
              {errors.email && (
                <Text size="1" color="red">{errors.email.message}</Text>
              )}
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Phone *
              </Text>
              <TextField.Root
                {...register('phone')}
                type="tel"
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <Text size="1" color="red">{errors.phone.message}</Text>
              )}
            </Box>

            {/* Optional Info */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Date of Birth
              </Text>
              <TextField.Root
                {...register('date_of_birth')}
                type="date"
              />
            </Box>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button type="button" variant="soft" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? 'Saving...' : member ? 'Update' : 'Enroll Member'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
