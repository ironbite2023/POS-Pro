'use client';

import React, { useState, useMemo } from 'react';
import { Table, Button, Badge, Flex, Text, IconButton } from '@radix-ui/themes';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/lib/supabase/database.types';
import { formatDate } from '@/utilities';
import Pagination from '@/components/common/Pagination';
import { SortableHeader } from '@/components/common/SortableHeader';
import { IngredientItem, SortConfig } from '@/types/inventory';

type Branch = Database['public']['Tables']['branches']['Row'];
type InventoryItemRow = Database['public']['Tables']['inventory_items']['Row'];

// Define sortable fields for ingredient items
type SortableIngredientField = keyof IngredientItem;

interface IngredientItemsTableProps {
  items: IngredientItem[];
  onEdit?: (item: IngredientItem) => void;
  onDelete?: (id: string) => void;
  onManageBranches?: (item: IngredientItem) => void;
  readOnly?: boolean;
}

const IngredientItemsTable: React.FC<IngredientItemsTableProps> = ({
  items = [],
  onEdit,
  onDelete,
  onManageBranches,
  readOnly = false
}) => {
  const { branches } = useOrganization();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig<IngredientItem> | null>(null);

  const handleSort = (key: SortableIngredientField) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle string comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Handle number comparisons
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Handle undefined/null values
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      return 0;
    });
  }, [items, sortConfig]);

  // Calculate pagination values (moved after sortedItems definition)
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (items.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" gap="3" className="py-8">
        <Text size="3" color="gray">No ingredient items found</Text>
        <Text size="2" color="gray">Ingredient items will appear here once created.</Text>
      </Flex>
    );
  }

  return (
    <div className="space-y-4">
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Name"
                sortKey="name"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="SKU"
                sortKey="sku"
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
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Storage Unit"
                sortKey="storageUnit"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Recipe Unit"
                sortKey="ingredientUnit"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Unit Price"
                sortKey="unitPrice"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Branches</Table.ColumnHeaderCell>
            {!readOnly && <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {paginatedItems.map((item) => (
            <Table.Row key={item.id} className="hover:bg-gray-50">
              <Table.Cell>
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.nameLocalized}</div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <Text>{item.sku}</Text>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="soft">{item.category}</Badge>
              </Table.Cell>
              <Table.Cell>
                <Text>{item.storageUnit}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text>{item.ingredientUnit}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text>${(item.unitPrice || 0).toFixed(2)}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text>{branches?.length || 0} branches</Text>
              </Table.Cell>
              {!readOnly && (
                <Table.Cell>
                  <Flex gap="1">
                    <IconButton 
                      variant="soft" 
                      color="blue" 
                      size="1"
                      onClick={() => onManageBranches?.(item)}
                      title="Manage branch settings"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </IconButton>
                    <IconButton 
                      variant="soft" 
                      color="green" 
                      size="1"
                      onClick={() => onEdit?.(item)}
                      title="Edit ingredient item"
                    >
                      <Edit className="h-4 w-4" />
                    </IconButton>
                    <IconButton 
                      variant="soft" 
                      color="red" 
                      size="1"
                      onClick={() => onDelete?.(item.id)}
                      title="Delete ingredient item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </Flex>
                </Table.Cell>
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={sortedItems.length}
          startIndex={startIndex}
          endIndex={Math.min(startIndex + itemsPerPage, sortedItems.length)}
          onPageChange={handlePageChange}
          onItemsPerPageChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
};

export default IngredientItemsTable;