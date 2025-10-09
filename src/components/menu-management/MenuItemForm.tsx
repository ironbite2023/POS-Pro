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
  Switch
} from '@radix-ui/themes';
import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { menuService } from '@/lib/services';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';
import type { Database } from '@/lib/supabase/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];

const menuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  category_id: z.string().uuid('Please select a category'),
  base_price: z.number().min(0, 'Price must be positive'),
  image_url: z.string().optional(),
  is_active: z.boolean(),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItemFormProps {
  menuItem?: MenuItem;
  categories: MenuCategory[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MenuItemForm({ 
  menuItem, 
  categories,
  open, 
  onClose, 
  onSuccess 
}: MenuItemFormProps) {
  const { currentOrganization } = useOrganization();
  const { uploadImage, uploading } = useImageUpload();
  const [imageUrl, setImageUrl] = useState(menuItem?.image_url || '');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: menuItem ? {
      name: menuItem.name,
      description: menuItem.description || '',
      category_id: menuItem.category_id || '',
      base_price: menuItem.base_price || 0,
      image_url: menuItem.image_url || '',
      is_active: menuItem.is_active ?? true,
    } : {
      base_price: 0,
      is_active: true,
    },
  });

  const handleImageUpload = async (file: File): Promise<void> => {
    try {
      const url = await uploadImage(file, 'menu-items');
      setImageUrl(url);
      setValue('image_url', url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const handleImageRemove = () => {
    setImageUrl('');
    setValue('image_url', '');
  };

  const onSubmit = async (data: MenuItemFormData): Promise<void> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected');
      return;
    }

    try {
      const itemData = {
        name: data.name,
        description: data.description || null,
        category_id: data.category_id,
        base_price: data.base_price,
        image_url: imageUrl || null,
        is_active: data.is_active,
        organization_id: currentOrganization.id,
      };

      if (menuItem?.id) {
        await menuService.updateMenuItem(menuItem.id, itemData);
        toast.success('Menu item updated successfully');
      } else {
        const { organization_id, ...itemWithoutOrgId } = itemData;
        await menuService.createMenuItem(organization_id, itemWithoutOrgId);
        toast.success('Menu item created successfully');
      }
      
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item');
    }
  };

  const handleClose = () => {
    reset();
    setImageUrl('');
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
        <Dialog.Title>
          {menuItem ? 'Edit Menu Item' : 'Create Menu Item'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4" mt="4">
            {/* Image Upload */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="2">
                Item Image
              </Text>
              <ImageUpload
                currentImage={imageUrl}
                onUpload={handleImageUpload}
                uploading={uploading}
                onRemove={handleImageRemove}
              />
            </Box>

            {/* Basic Info */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium" mb="1">
                  Item Name *
                </Text>
                <TextField.Root
                  {...register('name')}
                  placeholder="Enter item name"
                />
                {errors.name && (
                  <Text size="1" color="red" mt="1">
                    {errors.name.message}
                  </Text>
                )}
              </Box>

              <Box style={{ width: '150px' }}>
                <Text as="label" size="2" weight="medium" mb="1">
                  Price ($) *
                </Text>
                <TextField.Root
                  {...register('base_price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
                {errors.base_price && (
                  <Text size="1" color="red" mt="1">
                    {errors.base_price.message}
                  </Text>
                )}
              </Box>
            </Flex>

            {/* Category */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Category *
              </Text>
              <Select.Root
                value={watch('category_id')}
                onValueChange={(value) => setValue('category_id', value)}
              >
                <Select.Trigger placeholder="Select a category" />
                <Select.Content>
                  {categories.map((category) => (
                    <Select.Item key={category.id} value={category.id}>
                      {category.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              {errors.category_id && (
                <Text size="1" color="red" mt="1">
                  {errors.category_id.message}
                </Text>
              )}
            </Box>

            {/* Description */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Description
              </Text>
              <TextArea
                {...register('description')}
                placeholder="Enter item description"
                rows={3}
              />
            </Box>

            {/* Switches */}
            <Flex gap="4">
              <Flex align="center" gap="2">
                <Switch
                  checked={watch('is_active')}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
                <Text as="label" size="2">
                  Active
                </Text>
              </Flex>
            </Flex>

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
                disabled={isSubmitting || uploading}
              >
                {isSubmitting ? 'Saving...' : menuItem ? 'Update' : 'Create'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
