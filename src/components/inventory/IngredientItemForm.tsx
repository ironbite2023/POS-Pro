import React, { useState, useEffect, useCallback } from 'react';
import { IngredientItem, StockCategory, UnitOfMeasure } from '@/types/inventory';
import {
  Box,
  Button,
  Card,
  Flex,
  Select,
  Text,
  TextField,
  AlertDialog,
} from '@radix-ui/themes';
import { Save, X, Trash2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { PageHeading } from '@/components/common/PageHeading';
import { loggingService, InventoryValidationError } from '@/lib/services/logging.service';

type InventoryCategory = Database['public']['Tables']['inventory_categories']['Row'];
type UnitOfMeasureRow = Database['public']['Tables']['units_of_measure']['Row'];

// Proper TypeScript interface for form data matching IngredientItem structure
interface IngredientFormData {
  name: string;
  nameLocalized: string;
  sku: string;
  category: string; // Will be converted to StockCategory on submit
  storageUnit: string; // Will be converted to UnitOfMeasure on submit
  ingredientUnit: string; // Will be converted to UnitOfMeasure on submit
  storageIngredientFactor: number;
  unitPrice: number;
  barcode: string;
  minLevel: number;
  maxLevel: number;
  reorderLevel: number;
}

interface IngredientItemFormProps {
  onSubmit: (ingredient: Omit<IngredientItem, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  editingItem?: IngredientItem; // Optional existing item for editing
}

export const IngredientItemForm: React.FC<IngredientItemFormProps> = ({ 
  onSubmit, 
  onCancel,
  onDelete,
  editingItem 
}) => {
  const { currentOrganization } = useOrganization();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [units, setUnits] = useState<UnitOfMeasureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form with existing item data if in edit mode
  const getInitialFormData = useCallback((): IngredientFormData => {
    if (editingItem) {
      const { id, branchData, ...rest } = editingItem;
      return {
        name: rest.name,
        nameLocalized: rest.nameLocalized,
        sku: rest.sku,
        category: rest.category as string,
        storageUnit: rest.storageUnit as string,
        ingredientUnit: rest.ingredientUnit as string,
        storageIngredientFactor: rest.storageIngredientFactor,
        unitPrice: rest.unitPrice || 0,
        barcode: rest.barcode,
        minLevel: rest.minLevel || 0,
        maxLevel: rest.maxLevel || 0,
        reorderLevel: rest.reorderLevel || 0,
      };
    }
    
    return {
      name: '',
      nameLocalized: '',
      sku: '',
      category: '',
      storageUnit: '',
      ingredientUnit: '',
      storageIngredientFactor: 0,
      unitPrice: 0,
      barcode: '',
      minLevel: 0,
      maxLevel: 0,
      reorderLevel: 0,
    };
  }, [editingItem]);

  const [formData, setFormData] = useState<IngredientFormData>(
    getInitialFormData()
  );

  // Fetch categories from database (wrapped with useCallback)
  const fetchCategories = useCallback(async (): Promise<InventoryCategory[]> => {
    if (!currentOrganization) return [];

    try {
      loggingService.debug('Fetching inventory categories', {
        organizationId: currentOrganization.id,
        component: 'IngredientItemForm'
      });

      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (error) throw error;
      
      loggingService.debug('Categories fetched successfully', {
        organizationId: currentOrganization.id,
        categoryCount: data?.length || 0
      });

      return data || [];
    } catch (err) {
      loggingService.error('Failed to fetch inventory categories', err as Error, {
        organizationId: currentOrganization.id,
        component: 'IngredientItemForm',
        operation: 'fetchCategories'
      });
      throw err;
    }
  }, [currentOrganization]);

  // Fetch units of measure from database (wrapped with useCallback)
  const fetchUnitsOfMeasure = useCallback(async (): Promise<UnitOfMeasureRow[]> => {
    if (!currentOrganization) return [];

    try {
      loggingService.debug('Fetching units of measure', {
        organizationId: currentOrganization.id,
        component: 'IngredientItemForm'
      });

      const { data, error } = await supabase
        .from('units_of_measure')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('unit_type', { ascending: true });

      if (error) throw error;
      
      loggingService.debug('Units of measure fetched successfully', {
        organizationId: currentOrganization.id,
        unitCount: data?.length || 0
      });

      return data || [];
    } catch (err) {
      loggingService.error('Failed to fetch units of measure', err as Error, {
        organizationId: currentOrganization.id,
        component: 'IngredientItemForm',
        operation: 'fetchUnitsOfMeasure'
      });
      throw err;
    }
  }, [currentOrganization]);

  // Load categories and units of measure on component mount
  useEffect(() => {
    const loadFormData = async () => {
      if (!currentOrganization) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch categories and units in parallel
        const [categoriesData, unitsData] = await Promise.all([
          fetchCategories(),
          fetchUnitsOfMeasure()
        ]);

        setCategories(categoriesData);
        setUnits(unitsData);

        loggingService.info('Form data loaded successfully', {
          organizationId: currentOrganization.id,
          categoriesCount: categoriesData.length,
          unitsCount: unitsData.length,
          editingMode: !!editingItem
        });
      } catch (err) {
        const errorMessage = 'Failed to load categories and units. Please try again.';
        setError(errorMessage);
        
        loggingService.error('Form data loading failed', err as Error, {
          organizationId: currentOrganization.id,
          component: 'IngredientItemForm',
          operation: 'loadFormData'
        });
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [currentOrganization, fetchCategories, fetchUnitsOfMeasure, editingItem]);

  // Update form data if existingItem changes
  useEffect(() => {
    if (editingItem) {
      setFormData(getInitialFormData());
      
      loggingService.debug('Form data updated for editing', {
        itemId: editingItem.id,
        itemName: editingItem.name,
        component: 'IngredientItemForm'
      });
    }
  }, [editingItem, getInitialFormData]);

  const handleChange = (name: keyof IngredientFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: ['minLevel', 'maxLevel', 'reorderLevel', 'unitPrice', 'storageIngredientFactor'].includes(name)
        ? parseFloat(value as string)
        : value
    }));
  };

  const validateFormData = (data: IngredientFormData): boolean => {
    try {
      if (!data.name.trim()) {
        throw new InventoryValidationError('Name is required', 'name', data.name);
      }
      
      if (!data.sku.trim()) {
        throw new InventoryValidationError('SKU is required', 'sku', data.sku);
      }
      
      if (!data.category) {
        throw new InventoryValidationError('Category is required', 'category', data.category);
      }
      
      if (data.unitPrice < 0) {
        throw new InventoryValidationError('Unit price must be positive', 'unitPrice', data.unitPrice);
      }
      
      if (data.minLevel < 0 || data.maxLevel < 0 || data.reorderLevel < 0) {
        throw new InventoryValidationError('Stock levels must be positive', 'levels', {
          minLevel: data.minLevel,
          maxLevel: data.maxLevel,
          reorderLevel: data.reorderLevel
        });
      }
      
      if (data.maxLevel > 0 && data.minLevel > data.maxLevel) {
        throw new InventoryValidationError('Minimum level cannot be greater than maximum level', 'levels', {
          minLevel: data.minLevel,
          maxLevel: data.maxLevel
        });
      }
      
      return true;
    } catch (err) {
      if (err instanceof InventoryValidationError) {
        loggingService.warn('Form validation failed', {
          field: err.field,
          value: err.value,
          message: err.message,
          component: 'IngredientItemForm'
        });
      }
      throw err;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data before submission
      validateFormData(formData);

      // Convert form data to IngredientItem format with proper types
      const ingredientData: Omit<IngredientItem, 'id'> & { id?: string } = {
        name: formData.name,
        nameLocalized: formData.nameLocalized,
        sku: formData.sku,
        category: formData.category as StockCategory,
        storageUnit: formData.storageUnit as UnitOfMeasure,
        ingredientUnit: formData.ingredientUnit as UnitOfMeasure,
        storageIngredientFactor: formData.storageIngredientFactor,
        unitPrice: formData.unitPrice,
        barcode: formData.barcode,
        minLevel: formData.minLevel,
        maxLevel: formData.maxLevel,
        reorderLevel: formData.reorderLevel,
      };
      
      // If editing, add the id
      if (editingItem) {
        ingredientData.id = editingItem.id;
      }

      loggingService.userAction(
        editingItem ? 'Edit Ingredient Item' : 'Create Ingredient Item',
        undefined, // userId would come from auth context
        {
          itemName: ingredientData.name,
          sku: ingredientData.sku,
          category: ingredientData.category,
          editingMode: !!editingItem,
          organizationId: currentOrganization?.id
        }
      );

      onSubmit(ingredientData);
    } catch (err) {
      if (err instanceof InventoryValidationError) {
        // Validation errors are already logged in validateFormData
        setError(err.message);
      } else {
        const errorMessage = 'Failed to save ingredient item. Please try again.';
        setError(errorMessage);
        
        loggingService.error('Form submission failed', err as Error, {
          component: 'IngredientItemForm',
          operation: 'handleSubmit',
          editingMode: !!editingItem,
          formData: {
            name: formData.name,
            sku: formData.sku,
            category: formData.category
          }
        });
      }
    }
  };

  const handleDelete = () => {
    if (editingItem?.id && onDelete) {
      loggingService.userAction('Delete Ingredient Item', undefined, {
        itemId: editingItem.id,
        itemName: editingItem.name,
        sku: editingItem.sku,
        component: 'IngredientItemForm'
      });

      onDelete(editingItem.id);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Flex justify="between" align="center" mb="5">
          <PageHeading
            title={editingItem ? `Edit ${editingItem.name}` : 'Add Ingredient Item'}
            description="Loading form data..."
            showBackButton
            onBackClick={onCancel}
            noMarginBottom
          />
        </Flex>

        <Flex direction={{ initial: "column", sm: "row" }} gap="4">
          <Card size="3" className="w-full sm:basis-3/4 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </Card>
          <Card size="3" className="w-full sm:basis-1/4 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </Card>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Flex justify="between" align="center" mb="5">
          <PageHeading
            title="Error Loading Form"
            description={error}
            showBackButton
            onBackClick={onCancel}
            noMarginBottom
          />
        </Flex>
        <Card size="3" className="text-center">
          <Text color="red">{error}</Text>
          <Button 
            variant="soft" 
            color="gray" 
            mt="3"
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
          >
            Retry
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="between" align="center" mb="5">
        <PageHeading
          title={editingItem ? `Edit ${editingItem.name}` : 'Add Ingredient Item'}
          description={editingItem ? 'View/edit the details for this ingredient.' : 'Enter the details for the new ingredient.'}
          showBackButton
          onBackClick={onCancel}
          noMarginBottom
        />
      </Flex>

      <form onSubmit={handleSubmit}>      
        <Flex 
          direction={{ initial: "column", sm: "row" }} 
          gap="4"
        >
          <Card size="3" className="w-full sm:basis-3/4 space-y-4">
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Name</Text>
              <TextField.Root
                name="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </Flex>
          
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Localized Name</Text>
              <TextField.Root
                name="nameLocalized"
                value={formData.nameLocalized}
                onChange={(e) => handleChange('nameLocalized', e.target.value)}
                required
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">SKU</Text>
              <TextField.Root
                name="sku"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                required
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Category</Text>
              <Select.Root
                name="category"
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
                required
              >
                <Select.Trigger placeholder="Select category" />
                <Select.Content>
                  {categories.map(category => (
                    <Select.Item key={category.id} value={category.name}>
                      {category.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>
            
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Unit Price</Text>
              <TextField.Root
                type="number"
                name="unitPrice"
                value={formData.unitPrice.toString()}
                onChange={(e) => handleChange('unitPrice', e.target.value)}
                required
                step="0.01"
              >
                <TextField.Slot>$</TextField.Slot>
              </TextField.Root>
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Barcode</Text>
              <TextField.Root
                name="barcode"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
              />
            </Flex>
          </Card>
          
          <Card size="3" className="w-full sm:basis-1/4 space-y-4">
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Storage Unit</Text>
                <Select.Root
                  name="storageUnit"
                  value={formData.storageUnit}
                  onValueChange={(value) => handleChange('storageUnit', value)}
                  required
                >
                  <Select.Trigger placeholder="Select storage unit" />
                  <Select.Content>
                    {units.map(unit => (
                      <Select.Item key={unit.id} value={unit.abbreviation}>
                        {unit.name} ({unit.abbreviation})
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>

              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Ingredient Unit</Text>
                <Select.Root
                  name="ingredientUnit"
                  value={formData.ingredientUnit}
                  onValueChange={(value) => handleChange('ingredientUnit', value)}
                  required
                >
                  <Select.Trigger placeholder="Select ingredient unit" />
                  <Select.Content>
                    {units.map(unit => (
                      <Select.Item key={unit.id} value={unit.abbreviation}>
                        {unit.name} ({unit.abbreviation})
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>

              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Storage/Ingredient Factor</Text>
                <TextField.Root
                  type="number"
                  name="storageIngredientFactor"
                  value={formData.storageIngredientFactor.toString()}
                  onChange={(e) => handleChange('storageIngredientFactor', e.target.value)}
                  required
                  step="0.01"
                />
              </Flex>
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Minimum Level</Text>
              <TextField.Root
                type="number"
                name="minLevel"
                value={formData.minLevel.toString()}
                onChange={(e) => handleChange('minLevel', e.target.value)}
                required
              >
                <TextField.Slot>Min.</TextField.Slot>
              </TextField.Root>
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Maximum Level</Text>
              <TextField.Root
                type="number"
                name="maxLevel"
                value={formData.maxLevel.toString()}
                onChange={(e) => handleChange('maxLevel', e.target.value)}
                required
              >
                <TextField.Slot>Max.</TextField.Slot>
              </TextField.Root>
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Reorder Level</Text>
              <TextField.Root
                type="number"
                name="reorderLevel"
                value={formData.reorderLevel.toString()}
                onChange={(e) => handleChange('reorderLevel', e.target.value)}
                required
              >
                <TextField.Slot>Reorder at</TextField.Slot>
              </TextField.Root>
            </Flex>
          </Card>
        </Flex>

        <Flex 
          direction={{ initial: "column", sm: "row" }}
          justify="between" 
          gap={{ initial: "3", sm: "4" }}
          mt="4"
        >
          <Flex 
            direction={{ initial: "column", sm: "row" }}
            gap={{ initial: "3", sm: "4" }}
          >
            <Button type="submit" color="green" onClick={handleSubmit}>
              <Save className="h-4 w-4" />
              Save Item
            </Button>
            <Button variant="soft" color="gray" onClick={onCancel}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </Flex>
          {editingItem && (
            <Button 
              variant="soft" 
              color="red" 
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </Flex>
      </form>

      <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete Ingredient</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete this ingredient? This action cannot be undone.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={handleDelete}>
                Delete
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
};

export default IngredientItemForm;
