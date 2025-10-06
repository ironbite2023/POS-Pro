'use client';

import { Button, Flex, Table, Text, IconButton, Badge, Skeleton } from '@radix-ui/themes';
import { Box, Heading } from '@radix-ui/themes';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import CategoryForm from '@/components/menu-management/CategoryForm';
import { useMenuData } from '@/hooks/useMenuData';
import { menuService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];

export function CategoryList() {
  const { categories, menuItems, loading, error, refetch } = useMenuData();
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<MenuCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = () => {
    setSelectedCategory(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (category: MenuCategory) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = (category: MenuCategory) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete?.id) return;

    // Check if category has menu items
    const itemsInCategory = menuItems.filter(
      (item) => item.category_id === categoryToDelete.id
    );

    if (itemsInCategory.length > 0) {
      toast.error(
        `Cannot delete category with ${itemsInCategory.length} menu items. Please move or delete the items first.`
      );
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      return;
    }

    try {
      setDeleting(true);
      // Soft delete by setting is_active to false
      await menuService.updateCategory(categoryToDelete.id, { is_active: false });
      toast.success('Category deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleFormClose = () => {
    setIsDialogOpen(false);
    setSelectedCategory(undefined);
  };

  const handleFormSuccess = () => {
    refetch();
  };

  const getItemCount = (categoryId: string): number => {
    return menuItems.filter((item) => item.category_id === categoryId).length;
  };

  if (error) {
    return (
      <Box className="text-center py-12">
        <AlertCircle className="mx-auto mb-4" size={48} color="red" />
        <Heading size="5" className="mb-2">Error Loading Categories</Heading>
        <Text size="2" color="red">{error.message}</Text>
        <Button onClick={refetch} className="mt-4">
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box className="space-y-4">
      <Flex justify="between" align="center" mb="4">
        <Heading as="h2" size="3">Manage Categories</Heading>
        <Button onClick={handleCreate} disabled={loading}>
          <Plus size={16} />
          Add Category
        </Button>
      </Flex>

      {loading ? (
        <Box>
          {[...Array(5)].map((_item, i) => (
            <Skeleton key={i} height="60px" className="mb-2" />
          ))}
        </Box>
      ) : categories.length === 0 ? (
        <Box className="text-center py-12 bg-gray-50 rounded-lg">
          <Text size="3" color="gray">
            No categories found. Create your first category to get started.
          </Text>
        </Box>
      ) : (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Category Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Menu Items</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Order</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="right">Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {categories.map((category) => (
              <Table.Row key={category.id}>
                <Table.Cell>
                  <Text weight="medium">{category.name}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" color="gray">
                    {category.description || '-'}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge color="blue">{getItemCount(category.id)}</Badge>
                </Table.Cell>
                <Table.Cell>
                  {category.sort_order || 0}
                </Table.Cell>
                <Table.Cell>
                  <Badge color={category.is_active ? 'green' : 'gray'}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Cell>
                <Table.Cell align="right">
                  <Flex gap="2" justify="end">
                    <IconButton 
                      variant="ghost" 
                      size="1"
                      color="gray"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit size={14} />
                    </IconButton>
                    <IconButton 
                      variant="ghost" 
                      color="red" 
                      size="1" 
                      onClick={() => handleDelete(category)}
                      disabled={deleting}
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

      {/* Category Form Dialog */}
      <CategoryForm
        category={selectedCategory}
        open={isDialogOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        color="red"
      />
    </Box>
  );
} 