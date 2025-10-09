import { Box, Button, Flex, Table, Text, Badge, TextField, Select, IconButton } from '@radix-ui/themes';
import { Search, AlertCircle, RefreshCcw, Utensils, Edit, Trash2 } from 'lucide-react';
// Removed hardcoded imports - using real data from database services
import { useOrganization } from '@/contexts/OrganizationContext';
import { menuService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { SortableHeader } from '@/components/common/SortableHeader';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];

// Temporary workaround: Since availableBranchesIds doesn't exist in the database schema,
// we'll create an extended type that includes this property for frontend functionality
type MenuItemWithAvailability = MenuItem & {
  availableBranchesIds?: string[];
};

interface MenuListProps {
  items: MenuItem[];
  categories: MenuCategory[];
  availableBranches: { id: string; name: string }[];
  searchTerm?: string;
  categoryFilter?: string;
  statusFilter?: string;
  availabilityFilter?: string;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (item: MenuItem) => void;
  onSearchChange?: (searchTerm: string) => void;
  onCategoryFilterChange?: (category: string) => void;
  onStatusFilterChange?: (status: string) => void;
  onAvailabilityFilterChange?: (availability: string) => void;
  onResetFilters?: () => void;
}

export function MenuList({
  items = [],
  categories = [],
  availableBranches = [],
  searchTerm = '',
  categoryFilter = 'all',
  statusFilter = 'all',
  availabilityFilter = 'all',
  onEdit = () => {},
  onDelete = () => {},
  onSearchChange = () => {},
  onCategoryFilterChange = () => {},
  onStatusFilterChange = () => {},
  onAvailabilityFilterChange = () => {},
  onResetFilters = () => {},
}: MenuListProps) {
  const { currentOrganization } = useOrganization();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [loadedCategories, setLoadedCategories] = useState<MenuCategory[]>([]);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      if (!currentOrganization) return;
      
      try {
        const dbCategories = await menuService.getCategories(currentOrganization.id);
        setLoadedCategories(dbCategories);
      } catch (error) {
        console.error('Error loading menu categories:', error);
      }
    };

    loadCategories();
  }, [currentOrganization]);
  // Note: Branch filtering will be handled by parent component with real branch data

  // Helper function to add availability data to menu items
  const addAvailabilityData = (item: MenuItem): MenuItemWithAvailability => {
    // Temporary: Assume all active items are available to all branches
    // TODO: Implement proper branch-menu item relationship in database
    return {
      ...item,
      availableBranchesIds: item.is_active ? availableBranches.map(b => b.id) : []
    };
  };

  // Convert items to include availability data
  const itemsWithAvailability = items.map(addAvailabilityData);

  const filteredItems = useMemo(() => {
    return itemsWithAvailability.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || 
        item.category_id === categoryFilter;

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && item.is_active) ||
        (statusFilter === 'inactive' && !item.is_active);

      const matchesAvailability = availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && (item.availableBranchesIds?.length || 0) > 0) ||
        (availabilityFilter === 'unavailable' && (item.availableBranchesIds?.length || 0) === 0);

      return matchesSearch && matchesCategory && matchesStatus && matchesAvailability;
    });
  }, [itemsWithAvailability, searchTerm, categoryFilter, statusFilter, availabilityFilter]);

  const sortedItems = useMemo(() => {
    if (!sortConfig) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'name') {
        aValue = a.name;
        bValue = b.name;
      } else if (sortConfig.key === 'category') {
        const categoryA = (categories.length > 0 ? categories : loadedCategories).find(cat => cat.id === a.category_id)?.name || '';
        const categoryB = (categories.length > 0 ? categories : loadedCategories).find(cat => cat.id === b.category_id)?.name || '';
        aValue = categoryA;
        bValue = categoryB;
      } else if (sortConfig.key === 'price') {
        aValue = a.base_price;
        bValue = b.base_price;
      } else if (sortConfig.key === 'availableBranchesIds') {
        aValue = a.availableBranchesIds?.length || 0;
        bValue = b.availableBranchesIds?.length || 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredItems, sortConfig, categories, loadedCategories]);

  // Calculate pagination values
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDeleteClick = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
      setItemToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  return (
    <Box className="mt-6 space-y-4">
      <Flex gap="4" align="center" wrap="wrap">
        <Box className="flex-grow min-w-[250px]">
          <TextField.Root
            type="text"
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        <Flex align="center" gap="2" className="flex-shrink-0">
          <Select.Root value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <Select.Trigger placeholder="All Categories" />
            <Select.Content>
              <Select.Item value="all">All Categories</Select.Item>
              {categories.map(category => (
                <Select.Item key={category.id} value={category.id}>{category.name}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        <Flex align="center" gap="2" className="flex-shrink-0">
          <Select.Root value={statusFilter} onValueChange={onStatusFilterChange}>
            <Select.Trigger placeholder="All Statuses" />
            <Select.Content>
              <Select.Item value="all">All Statuses</Select.Item>
              <Select.Item value="active">Active</Select.Item>
              <Select.Item value="inactive">Inactive</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>

        <Flex align="center" gap="2" className="flex-shrink-0">
          <Select.Root value={availabilityFilter} onValueChange={onAvailabilityFilterChange}>
            <Select.Trigger placeholder="All Availability" />
            <Select.Content>
              <Select.Item value="all">All Availability</Select.Item>
              <Select.Item value="all_branches">All Branches</Select.Item>
              <Select.Item value="some_branches">Some Branches</Select.Item>
              <Select.Item value="not_available">Not Available</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>

        <Button 
          variant="soft" 
          color={(categoryFilter !== 'all' || statusFilter !== 'all' || availabilityFilter !== 'all' || searchTerm !== '') ? 'red' : 'gray'} 
          onClick={onResetFilters}
          className="flex-shrink-0"
          disabled={(categoryFilter === 'all' && statusFilter === 'all' && availabilityFilter === 'all' && searchTerm === '')}
        >
          <RefreshCcw size={16} />
          Reset Filters
        </Button>
      </Flex>
      
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Menu Name"
                sortKey="name"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Category"
                sortKey="category"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="right">
              <SortableHeader
                label="Base Price"
                sortKey="price"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Status"
                sortKey="isActive"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Availability"
                sortKey="availableBranchesIds"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Seasonal?"
                sortKey="isSeasonal"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="right">Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {currentItems.map((item) => (
            <Table.Row key={item.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800" onClick={() => onEdit(item)}>
              <Table.Cell>
                <Flex align="center" gap="2">
                  {item.image_url ? (
                    <Image
                      src={item.image_url} 
                      alt={item.name} 
                      width={32} 
                      height={32}
                      className="rounded object-cover w-5 h-5"
                    />
                  ) : (
                    <Flex align="center" justify="center" className="w-5 h-5 rounded bg-slate-200 dark:bg-neutral-600">
                      <Utensils size={12} className="text-gray-500 dark:text-gray-300" />
                    </Flex>
                  )}
                  {(item as any).stockWarning && <AlertCircle size={16} className="text-amber-500" />}
                  {item.name}
                </Flex>
              </Table.Cell>
              <Table.Cell>
                {categories.find(cat => cat.id === item.category_id)?.name || 'No Category'}
              </Table.Cell>
              <Table.Cell align="right">${item.base_price?.toFixed(2) || '0.00'}</Table.Cell>
              <Table.Cell>
                                  <Badge color={item.is_active ? 'green' : 'gray'} variant="soft">
                    {item.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                {/* Temporary: Show availability based on active status until proper branch relationship is implemented */}
                {!item.availableBranchesIds || item.availableBranchesIds.length === 0 ? (
                  <Badge color="red" variant="soft">Not Available</Badge>
                ) : item.availableBranchesIds.length === availableBranches.length ? (
                  <Badge color="green" variant="soft">All Branches</Badge>
                ) : (
                  <Badge color="amber" variant="soft">
                    {item.availableBranchesIds.length} of {availableBranches.length} Branches
                  </Badge>
                )}
              </Table.Cell>
              <Table.Cell>
                {item.is_seasonal ? (
                  <Text>Yes</Text>
                ) : (
                  <Text>No</Text>
                )}
              </Table.Cell>
              <Table.Cell align="right">
                <Flex gap="3" justify="end">
                  <Link href={`/menu-management/menu/${item.id}`}>
                    <IconButton 
                      variant="ghost" 
                      size="1"
                      color="gray"
                    >
                      <Edit size={14} />
                    </IconButton>
                  </Link>
                  <IconButton 
                    variant="ghost" 
                    color="red" 
                    size="1" 
                    onClick={(e) => handleDeleteClick(e, item)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      
      {filteredItems.length === 0 ? (
        <Box className="py-8 text-center">
          <Text size="3" color="gray">No menu items found matching your search criteria.</Text>
        </Box>
      ) : (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        color="red"
      />
    </Box>
  );
} 