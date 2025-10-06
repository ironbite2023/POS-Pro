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
  Text,
  Switch
} from '@radix-ui/themes';
import { useOrganization } from '@/contexts/OrganizationContext';
import { menuService } from '@/lib/services';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  sort_order: z.number().min(0),
  is_active: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: MenuCategory;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryForm({ 
  category, 
  open, 
  onClose, 
  onSuccess 
}: CategoryFormProps) {
  const { currentOrganization } = useOrganization();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ? {
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order || 0,
      is_active: category.is_active,
    } : {
      sort_order: 0,
      is_active: true,
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected');
      return;
    }

    try {
      if (category?.id) {
        await menuService.updateCategory(category.id, data);
        toast.success('Category updated successfully');
      } else {
        await menuService.createCategory({
          ...data,
          organization_id: currentOrganization.id,
        });
        toast.success('Category created successfully');
      }
      
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>
          {category ? 'Edit Category' : 'Create Category'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4" mt="4">
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Category Name *
              </Text>
              <TextField.Root
                {...register('name')}
                placeholder="Enter category name"
              />
              {errors.name && (
                <Text size="1" color="red" mt="1">
                  {errors.name.message}
                </Text>
              )}
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Description
              </Text>
              <TextArea
                {...register('description')}
                placeholder="Enter category description"
                rows={3}
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Display Order
              </Text>
              <TextField.Root
                {...register('sort_order', { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="0"
              />
              {errors.sort_order && (
                <Text size="1" color="red" mt="1">
                  {errors.sort_order.message}
                </Text>
              )}
            </Box>

            <Flex align="center" gap="2">
              <Switch
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <Text as="label" size="2">
                Active
              </Text>
            </Flex>

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
                {isSubmitting ? 'Saving...' : category ? 'Update' : 'Create'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
