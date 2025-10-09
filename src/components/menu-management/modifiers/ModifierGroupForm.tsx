'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  Button, 
  TextField, 
  TextArea, 
  Select,
  Flex, 
  Box,
  Text,
  Heading,
  Switch,
  Grid,
  Separator
} from '@radix-ui/themes';
import { useOrganization } from '@/contexts/OrganizationContext';
import { modifierService } from '@/lib/services';
import { toast } from 'sonner';
import type { ModifierGroup, ModifierGroupInput } from '@/lib/services/modifier.service';
import { Info } from 'lucide-react';

const modifierGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  display_order: z.number().int().min(0, 'Display order must be non-negative'),
  is_required: z.boolean(),
  min_selections: z.number().int().min(0, 'Minimum selections must be non-negative'),
  max_selections: z.number().int().min(1, 'Maximum selections must be at least 1'),
  selection_type: z.enum(['single', 'multiple'])
}).refine((data) => {
  return data.max_selections >= data.min_selections;
}, {
  message: "Maximum selections must be greater than or equal to minimum selections",
  path: ["max_selections"]
}).refine((data) => {
  // If required, min_selections should be at least 1
  if (data.is_required && data.min_selections === 0) {
    return false;
  }
  return true;
}, {
  message: "Required groups must have at least 1 minimum selection",
  path: ["min_selections"]
}).refine((data) => {
  // Single selection type should have max_selections = 1
  if (data.selection_type === 'single' && data.max_selections > 1) {
    return false;
  }
  return true;
}, {
  message: "Single selection groups can only have maximum of 1 selection",
  path: ["max_selections"]
});

type ModifierGroupFormData = z.infer<typeof modifierGroupSchema>;

interface ModifierGroupFormProps {
  modifierGroup?: ModifierGroup;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModifierGroupForm({ 
  modifierGroup, 
  open, 
  onClose, 
  onSuccess 
}: ModifierGroupFormProps) {
  const { currentOrganization } = useOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ModifierGroupFormData>({
    resolver: zodResolver(modifierGroupSchema),
    defaultValues: modifierGroup ? {
      name: modifierGroup.name,
      description: modifierGroup.description || '',
      display_order: modifierGroup.display_order,
      is_required: modifierGroup.is_required,
      min_selections: modifierGroup.min_selections,
      max_selections: modifierGroup.max_selections,
      selection_type: modifierGroup.selection_type,
    } : {
      display_order: 0,
      is_required: false,
      min_selections: 0,
      max_selections: 1,
      selection_type: 'single' as const,
    },
  });

  const watchedFields = watch();

  const onSubmit = async (data: ModifierGroupFormData): Promise<void> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected');
      return;
    }

    try {
      if (modifierGroup?.id) {
        await modifierService.updateModifierGroup(modifierGroup.id, data);
        toast.success('Modifier group updated successfully');
      } else {
        await modifierService.createModifierGroup(currentOrganization.id, data);
        toast.success('Modifier group created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving modifier group:', error);
      toast.error('Failed to save modifier group');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Auto-adjust settings when selection type changes
  const handleSelectionTypeChange = (value: 'single' | 'multiple') => {
    setValue('selection_type', value);
    if (value === 'single') {
      setValue('max_selections', 1);
      if (watchedFields.min_selections > 1) {
        setValue('min_selections', 1);
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
        <Dialog.Title>
          {modifierGroup ? 'Edit Modifier Group' : 'Create Modifier Group'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4" mt="4">
            
            {/* Basic Information */}
            <Box>
              <Heading as="h3" size="3" mb="3">Basic Information</Heading>
              <Grid columns="2" gap="4">
                <Box className="col-span-2">
                  <Text as="label" size="2" weight="medium" mb="1">
                    Group Name *
                  </Text>
                  <TextField.Root
                    {...register('name')}
                    placeholder="e.g., Size, Toppings, Temperature"
                  />
                  {errors.name && (
                    <Text size="1" color="red" mt="1">
                      {errors.name.message}
                    </Text>
                  )}
                </Box>
                
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Display Order
                  </Text>
                  <TextField.Root
                    {...register('display_order', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="0"
                  />
                  {errors.display_order && (
                    <Text size="1" color="red" mt="1">
                      {errors.display_order.message}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Selection Type
                  </Text>
                  <Select.Root
                    value={watchedFields.selection_type}
                    onValueChange={handleSelectionTypeChange}
                  >
                    <Select.Trigger placeholder="Select type" />
                    <Select.Content>
                      <Select.Item value="single">Single Selection</Select.Item>
                      <Select.Item value="multiple">Multiple Selection</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
                
                <Box className="col-span-2">
                  <Text as="label" size="2" weight="medium" mb="1">
                    Description
                  </Text>
                  <TextArea
                    {...register('description')}
                    placeholder="Brief description of this modifier group..."
                    rows={3}
                  />
                </Box>
              </Grid>
            </Box>

            <Separator />

            {/* Selection Rules */}
            <Box>
              <Heading as="h3" size="3" mb="3">Selection Rules</Heading>
              
              <Flex align="center" gap="2" mb="4">
                <Switch
                  checked={watchedFields.is_required}
                  onCheckedChange={(checked) => {
                    setValue('is_required', checked);
                    if (checked && watchedFields.min_selections === 0) {
                      setValue('min_selections', 1);
                    }
                  }}
                />
                <Text as="label" size="2" weight="medium">
                  Required Group
                </Text>
                <Box ml="2">
                  <Text size="1" color="gray">
                    <Info size={12} className="inline mr-1" />
                    Customers must make a selection from this group
                  </Text>
                </Box>
              </Flex>

              <Grid columns="2" gap="4">
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Minimum Selections
                  </Text>
                  <TextField.Root
                    {...register('min_selections', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max={watchedFields.max_selections}
                    placeholder="0"
                  />
                  {errors.min_selections && (
                    <Text size="1" color="red" mt="1">
                      {errors.min_selections.message}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Maximum Selections
                  </Text>
                  <TextField.Root
                    {...register('max_selections', { valueAsNumber: true })}
                    type="number"
                    min={Math.max(1, watchedFields.min_selections)}
                    max={watchedFields.selection_type === 'single' ? 1 : 99}
                    placeholder="1"
                    disabled={watchedFields.selection_type === 'single'}
                  />
                  {errors.max_selections && (
                    <Text size="1" color="red" mt="1">
                      {errors.max_selections.message}
                    </Text>
                  )}
                  {watchedFields.selection_type === 'single' && (
                    <Text size="1" color="gray" mt="1">
                      Single selection groups are limited to 1 choice
                    </Text>
                  )}
                </Box>
              </Grid>
              
              {/* Rules Summary */}
              <Box mt="3" p="3" className="bg-gray-50 dark:bg-gray-900 rounded">
                <Text size="2" weight="medium" mb="2">Rules Summary:</Text>
                <Text size="1" color="gray">
                  {watchedFields.is_required ? 'Required group' : 'Optional group'} • 
                  {watchedFields.selection_type === 'single' ? ' Single choice' : ' Multiple choices'} • 
                  {watchedFields.min_selections === 0 ? ' No minimum' : ` Min: ${watchedFields.min_selections}`} • 
                  Max: {watchedFields.max_selections}
                </Text>
              </Box>
            </Box>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button
                type="button"
                variant="soft"
                color="gray"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : modifierGroup ? 'Update Group' : 'Create Group'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
