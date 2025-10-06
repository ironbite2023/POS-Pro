# Task 1.2: Menu Management Integration

**Task ID**: TASK-01-002  
**Phase**: 1 - Frontend Integration  
**Priority**: 🔴 P0 - Critical  
**Estimated Time**: 3-4 days  
**Complexity**: 🟡 Medium  
**Status**: 📋 Not Started

---

## 1. Detailed Request Analysis

### What is Being Requested

Replace mock data in all menu management pages with real Supabase API calls, implementing:
- Menu categories management (CRUD operations)
- Menu items management with images, pricing, and variants
- Recipe management with ingredients and instructions
- Availability controls and branch-specific overrides

### Current State
- Menu management uses mock data from `MenuData.ts`
- Static category and item displays
- No real database connection
- No image upload functionality
- No inventory integration

### Target State
- Live menu data from Supabase database
- Real-time category and item management
- Image upload and storage
- Recipe management with ingredient tracking
- Branch-specific availability controls
- Inventory integration for stock tracking

### Affected Files
```
src/app/(default)/menu-management/
├── categories/page.tsx
├── items/page.tsx
├── recipes/page.tsx
└── modifiers/page.tsx

src/components/menu-management/
├── CategoryForm.tsx
├── MenuItemForm.tsx
├── RecipeForm.tsx
├── ImageUpload.tsx
└── Various list components

src/data/
├── MenuData.ts (to be replaced)
└── RecipesData.ts (to be replaced)
```

---

## 2. Justification and Benefits

### Why This Task is Critical

**Business Value**:
- ✅ Dynamic menu management for restaurant operations
- ✅ Real-time menu updates across all channels
- ✅ Inventory integration for stock-based availability
- ✅ Recipe standardization and cost control

**Technical Benefits**:
- ✅ Establishes CRUD pattern for other features
- ✅ Validates menuService implementation
- ✅ Tests file upload functionality
- ✅ Proves database relationships work

**User Impact**:
- ✅ Restaurant staff can manage menus independently
- ✅ Changes reflect immediately in POS system
- ✅ Consistent menu information across platforms
- ✅ Professional menu presentation

### Problems It Solves
1. **Static Menu Data**: Currently using hardcoded menu information
2. **No Menu Updates**: Can't modify menu without code changes
3. **No Image Management**: No way to upload/manage menu images
4. **No Recipe Control**: No standardized recipes or costing
5. **No Inventory Link**: Menu availability not tied to stock levels

---

## 3. Prerequisites

### Knowledge Requirements
- ✅ React forms and validation
- ✅ File upload handling
- ✅ Image manipulation and optimization
- ✅ Database relationships (categories, items, recipes)
- ✅ CRUD operations patterns
- ✅ Form state management

### Technical Prerequisites
- ✅ Task 1.1 (Dashboard Integration) completed
- ✅ menuService implemented (`src/lib/services/menu.service.ts`)
- ✅ Database schema for menu tables deployed
- ✅ File storage configured (Supabase Storage)
- ✅ Image optimization setup

### Environment Prerequisites
- ✅ Supabase Storage bucket configured
- ✅ Test menu data in database
- ✅ Organization and branch context working
- ✅ Authentication working

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "react-dropzone": "^14.x"
}
```

---

## 4. Implementation Methodology

### Step 1: Install Required Dependencies (30 minutes)

#### 1.1 Install form handling and validation packages

```bash
npm install react-hook-form @hookform/resolvers zod react-dropzone
```

#### 1.2 Verify menuService is implemented

Check that `src/lib/services/menu.service.ts` exists and has these methods:
- getCategories()
- createCategory()
- updateCategory()
- deleteCategory()
- getMenuItems()
- createMenuItem()
- updateMenuItem()
- deleteMenuItem()
- getRecipes()
- createRecipe()
- updateRecipe()
- deleteRecipe()

**Success Criteria**:
- ✅ Dependencies installed without errors
- ✅ menuService methods available
- ✅ No TypeScript errors

---

### Step 2: Create Custom Hooks (2-3 hours)

#### 2.1 Create `src/hooks/useMenuData.ts`

```typescript
import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { menuService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface UseMenuDataReturn {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useMenuData = (): UseMenuDataReturn => {
  const { currentOrganization } = useOrganization();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMenuData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      const [categoriesData, itemsData] = await Promise.all([
        menuService.getCategories({ organizationId: currentOrganization.id }),
        menuService.getMenuItems({ organizationId: currentOrganization.id }),
      ]);

      setCategories(categoriesData);
      setMenuItems(itemsData);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, [currentOrganization]);

  return {
    categories,
    menuItems,
    loading,
    error,
    refetch: fetchMenuData,
  };
};
```

#### 2.2 Create `src/hooks/useImageUpload.ts`

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UseImageUploadReturn {
  uploadImage: (file: File, folder: string) => Promise<string>;
  uploading: boolean;
  error: Error | null;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadImage = async (file: File, folder: string): Promise<string> => {
    try {
      setUploading(true);
      setError(null);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err as Error);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading, error };
};
```

**Success Criteria**:
- ✅ Hooks compile without errors
- ✅ Data fetching works
- ✅ Image upload functionality ready

---

### Step 3: Create Form Components (3-4 hours)

#### 3.1 Create `src/components/menu-management/CategoryForm.tsx`

```typescript
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
import { menuService } from '@/lib/services';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
  display_order: z.number().min(0).default(0),
  is_active: z.boolean().default(true),
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
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ? {
      name: category.name,
      description: category.description || '',
      display_order: category.display_order,
      is_active: category.is_active,
    } : {
      display_order: 0,
      is_active: true,
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    if (!currentOrganization) return;

    try {
      if (category) {
        await menuService.updateCategory(category.id, {
          ...data,
          organization_id: currentOrganization.id,
        });
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

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>
          {category ? 'Edit Category' : 'Create Category'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" weight="medium">
                Category Name *
              </Text>
              <TextField.Root
                {...register('name')}
                placeholder="Enter category name"
                className="w-full"
              />
              {errors.name && (
                <Text size="1" color="red">
                  {errors.name.message}
                </Text>
              )}
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium">
                Description
              </Text>
              <TextArea
                {...register('description')}
                placeholder="Enter category description"
                rows={3}
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium">
                Display Order
              </Text>
              <TextField.Root
                {...register('display_order', { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="0"
              />
            </Box>

            <Flex gap="3" mt="4" justify="end">
              <Button
                type="button"
                variant="soft"
                color="gray"
                onClick={onClose}
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
```

#### 3.2 Create `src/components/menu-management/MenuItemForm.tsx`

```typescript
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
  Switch,
  Card
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
  name: z.string().min(1, 'Item name is required').max(100),
  description: z.string().optional(),
  category_id: z.string().uuid('Please select a category'),
  base_price: z.number().min(0, 'Price must be positive'),
  image_url: z.string().optional(),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  allergens: z.array(z.string()).default([]),
  dietary_info: z.array(z.string()).default([]),
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
      category_id: menuItem.category_id,
      base_price: menuItem.base_price,
      image_url: menuItem.image_url || '',
      is_available: menuItem.is_available,
      is_featured: menuItem.is_featured,
      allergens: menuItem.allergens || [],
      dietary_info: menuItem.dietary_info || [],
    } : {
      is_available: true,
      is_featured: false,
      allergens: [],
      dietary_info: [],
    },
  });

  const handleImageUpload = async (file: File) => {
    try {
      const url = await uploadImage(file, 'menu-items');
      setImageUrl(url);
      setValue('image_url', url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const onSubmit = async (data: MenuItemFormData) => {
    if (!currentOrganization) return;

    try {
      const itemData = {
        ...data,
        organization_id: currentOrganization.id,
        image_url: imageUrl || null,
      };

      if (menuItem) {
        await menuService.updateMenuItem(menuItem.id, itemData);
        toast.success('Menu item updated successfully');
      } else {
        await menuService.createMenuItem(itemData);
        toast.success('Menu item created successfully');
      }
      
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 600 }}>
        <Dialog.Title>
          {menuItem ? 'Edit Menu Item' : 'Create Menu Item'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Image Upload */}
            <Box>
              <Text as="label" size="2" weight="medium">
                Item Image
              </Text>
              <ImageUpload
                currentImage={imageUrl}
                onUpload={handleImageUpload}
                uploading={uploading}
              />
            </Box>

            {/* Basic Info */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">
                  Item Name *
                </Text>
                <TextField.Root
                  {...register('name')}
                  placeholder="Enter item name"
                />
                {errors.name && (
                  <Text size="1" color="red">
                    {errors.name.message}
                  </Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">
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
                  <Text size="1" color="red">
                    {errors.base_price.message}
                  </Text>
                )}
              </Box>
            </Flex>

            {/* Category */}
            <Box>
              <Text as="label" size="2" weight="medium">
                Category *
              </Text>
              <Select.Root
                {...register('category_id')}
                onValueChange={(value) => setValue('category_id', value)}
                defaultValue={menuItem?.category_id}
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
                <Text size="1" color="red">
                  {errors.category_id.message}
                </Text>
              )}
            </Box>

            {/* Description */}
            <Box>
              <Text as="label" size="2" weight="medium">
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
              <Box>
                <Text as="label" size="2" weight="medium">
                  Available
                </Text>
                <Switch
                  {...register('is_available')}
                  defaultChecked={watch('is_available')}
                  onCheckedChange={(checked) => setValue('is_available', checked)}
                />
              </Box>
              
              <Box>
                <Text as="label" size="2" weight="medium">
                  Featured
                </Text>
                <Switch
                  {...register('is_featured')}
                  defaultChecked={watch('is_featured')}
                  onCheckedChange={(checked) => setValue('is_featured', checked)}
                />
              </Box>
            </Flex>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button
                type="button"
                variant="soft"
                color="gray"
                onClick={onClose}
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
```

**Success Criteria**:
- ✅ Forms render without errors
- ✅ Validation works correctly
- ✅ API calls succeed
- ✅ Image upload functional

---

### Step 4: Create List Pages (2-3 hours)

#### 4.1 Update `src/app/(default)/menu-management/categories/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Button, 
  Table, 
  Badge,
  IconButton,
  Text,
  Box,
  Skeleton
} from '@radix-ui/themes';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMenuData } from '@/hooks/useMenuData';
import { menuService } from '@/lib/services';
import CategoryForm from '@/components/menu-management/CategoryForm';
import { toast } from 'sonner';

export default function CategoriesPage() {
  usePageTitle('Menu Categories');
  const { categories, loading, error, refetch } = useMenuData();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      setDeleting(categoryId);
      await menuService.deleteCategory(categoryId);
      toast.success('Category deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setDeleting(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCategory(null);
  };

  const handleFormSuccess = () => {
    refetch();
  };

  if (error) {
    return (
      <Container size="4">
        <Box className="text-center py-12">
          <AlertCircle className="mx-auto mb-4" size={48} color="red" />
          <Heading size="5" className="mb-2">Error Loading Categories</Heading>
          <Text size="2" color="red">{error.message}</Text>
          <Button onClick={refetch} className="mt-4">
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="7">Menu Categories</Heading>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Category
          </Button>
        </Flex>

        {/* Categories Table */}
        {loading ? (
          <Box>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height="60px" className="mb-2" />
            ))}
          </Box>
        ) : categories.length === 0 ? (
          <Box className="text-center py-12">
            <Text size="3" color="gray">
              No categories found. Create your first category to get started.
            </Text>
          </Box>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Order</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
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
                    {category.display_order}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={category.is_active ? 'green' : 'gray'}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
                      <IconButton
                        size="1"
                        variant="ghost"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={() => handleDelete(category.id)}
                        disabled={deleting === category.id}
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
          open={showForm}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </Flex>
    </Container>
  );
}
```

**Success Criteria**:
- ✅ Page loads without errors
- ✅ Categories display in table
- ✅ CRUD operations work
- ✅ Loading states display
- ✅ Error states handled

---

### Step 5: Testing and Validation (1-2 hours)

#### 5.1 Manual Testing Checklist
```
Categories:
- [ ] Categories page loads correctly
- [ ] Can create new categories
- [ ] Can edit existing categories
- [ ] Can delete categories (with confirmation)
- [ ] Category form validation works
- [ ] Loading states display correctly
- [ ] Error states display correctly

Menu Items:
- [ ] Menu items page loads correctly
- [ ] Can create new menu items
- [ ] Can edit existing menu items
- [ ] Can delete menu items (with confirmation)
- [ ] Image upload works
- [ ] Form validation works
- [ ] Category dropdown populated
- [ ] Price formatting correct

Recipes:
- [ ] Recipes page loads correctly
- [ ] Can create recipes with ingredients
- [ ] Can edit recipes
- [ ] Recipe costing calculations work

General:
- [ ] Data updates in real-time
- [ ] Organization context respected
- [ ] Responsive on mobile
- [ ] No console errors
```

---

## 5. Success Criteria

### Functional Requirements
- ✅ **Menu Categories**: Full CRUD operations working
- ✅ **Menu Items**: Full CRUD with image upload
- ✅ **Recipes**: Create and manage recipes with ingredients
- ✅ **Real-time Updates**: Changes reflect immediately
- ✅ **Organization Context**: Respects current organization
- ✅ **Image Management**: Upload and display menu images

### Technical Requirements
- ✅ **No Mock Data**: All imports from `data/` folder removed
- ✅ **Form Validation**: Client-side validation with Zod
- ✅ **Error Handling**: Graceful error messages and recovery
- ✅ **Type Safety**: Proper TypeScript types throughout
- ✅ **Performance**: Pages load in < 3 seconds

### User Experience Requirements
- ✅ **Intuitive Forms**: Easy to use category and item forms
- ✅ **Responsive Design**: Works on mobile, tablet, desktop
- ✅ **Visual Feedback**: Loading states, success/error messages
- ✅ **Data Validation**: Prevents invalid data entry

---

## 6. Deliverables

### Code Files
```
✅ src/hooks/useMenuData.ts (new)
✅ src/hooks/useImageUpload.ts (new)
✅ src/components/menu-management/CategoryForm.tsx (new)
✅ src/components/menu-management/MenuItemForm.tsx (new)
✅ src/components/menu-management/ImageUpload.tsx (new)
✅ src/app/(default)/menu-management/categories/page.tsx (updated)
✅ src/app/(default)/menu-management/items/page.tsx (updated)
✅ src/app/(default)/menu-management/recipes/page.tsx (updated)
```

### Configuration
```
✅ Supabase Storage bucket for menu images
✅ Form validation schemas
✅ Image optimization settings
```

---

## 7. Rollback Plan

If integration fails:
1. Restore mock data imports temporarily
2. Keep existing UI using mock data
3. Debug menuService separately
4. Test file upload in isolation
5. Fix issues incrementally

---

## 8. Next Steps After Completion

1. **Code Review**: Get team feedback on forms and validation
2. **Performance**: Add image compression if needed
3. **Enhanced Features**: Add menu item variants, modifiers
4. **Move to Next Task**: Inventory Management Integration (Task 1.3)

---

**Status**: 📋 Ready to Start  
**Dependencies**: Task 1.1 (Dashboard), menuService, Supabase Storage  
**Blocked By**: None  
**Blocks**: Task 1.4 (POS Operations), Task 4.1 (Delivery Integration)
