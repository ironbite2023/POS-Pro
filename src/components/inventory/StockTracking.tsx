'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  Flex,
  Heading,
  Button,
  Badge,
  TextField,
  Text,
  Table,
  Select,
  Spinner
} from '@radix-ui/themes';
import { StockCategory, StockStatus, StockItem, SortConfig, SortableInventoryField } from '@/types/inventory';
import { useOrganization } from '@/contexts/OrganizationContext';
import { inventoryService } from '@/lib/services';
import { formatDate } from '@/utilities';
import { Import, Search, RefreshCcw } from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import { SortableHeader } from '@/components/common/SortableHeader';

interface StockTrackingProps {
  stockItems?: StockItem[];
  selectedBranch?: string;
}

export default function StockTracking({ stockItems = [] }: StockTrackingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StockCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig<StockItem> | null>(null);

  const handleSort = (key: SortableInventoryField) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  // Update displayed items when filters or props change
  const displayItems = useMemo(() => {
    let filtered = stockItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Apply sorting with proper type safety
    if (sortConfig) {
      filtered.sort((a, b) => {
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

        // Handle date comparisons
        if (sortConfig.key === 'lastRestockedDate' || sortConfig.key === 'expirationDate') {
          if (!aValue && !bValue) return 0;
          if (!aValue) return sortConfig.direction === 'asc' ? 1 : -1;
          if (!bValue) return sortConfig.direction === 'asc' ? -1 : 1;

          const aTime = new Date(aValue as Date).getTime();
          const bTime = new Date(bValue as Date).getTime();
          const comparison = aTime - bTime;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        return 0;
      });
    }

    return filtered;
  }, [stockItems, searchTerm, categoryFilter, statusFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(displayItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = displayItems.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  const getStatusColor = (status: StockStatus): 'green' | 'orange' | 'red' => {
    switch (status) {
      case 'In Stock':
        return 'green';
      case 'Low Stock':
        return 'orange';
      case 'Out of Stock':
        return 'red';
      default:
        return 'green';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <Flex gap="4" align="center" wrap="wrap">
        <Box className="flex-grow min-w-[250px]">
          <TextField.Root
            placeholder="Search items or suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          >
            <TextField.Slot>
              <Search className="h-4 w-4" />
            </TextField.Slot>
          </TextField.Root>
        </Box>
        
        <Select.Root 
          value={categoryFilter} 
          onValueChange={(value: StockCategory | 'all') => setCategoryFilter(value)}
        >
          <Select.Trigger placeholder="Category" />
          <Select.Content>
            <Select.Item value="all">All Categories</Select.Item>
            <Select.Item value="Vegetables">Vegetables</Select.Item>
            <Select.Item value="Meat">Meat</Select.Item>
            <Select.Item value="Dairy">Dairy</Select.Item>
            <Select.Item value="Beverages">Beverages</Select.Item>
            <Select.Item value="Dry Goods">Dry Goods</Select.Item>
            <Select.Item value="Spices">Spices</Select.Item>
            <Select.Item value="Seafood">Seafood</Select.Item>
            <Select.Item value="Other">Other</Select.Item>
          </Select.Content>
        </Select.Root>
        
        <Select.Root 
          value={statusFilter} 
          onValueChange={(value: StockStatus | 'all') => setStatusFilter(value)}
        >
          <Select.Trigger placeholder="Status" />
          <Select.Content>
            <Select.Item value="all">All Status</Select.Item>
            <Select.Item value="In Stock">In Stock</Select.Item>
            <Select.Item value="Low Stock">Low Stock</Select.Item>
            <Select.Item value="Out of Stock">Out of Stock</Select.Item>
          </Select.Content>
        </Select.Root>
        
        <Button variant="soft" onClick={resetFilters}>
          <RefreshCcw className="h-4 w-4" />
          Reset
        </Button>
      </Flex>

      {/* Results Table */}
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
                label="Quantity"
                sortKey="quantity"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Reorder Level"
                sortKey="reorderLevel"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Last Restocked"
                sortKey="lastRestockedDate"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Expires"
                sortKey="expirationDate"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Status"
                sortKey="status"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {paginatedItems.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={8} align="center">
                <div className="py-8">
                  <Text color="gray">No items found matching your criteria</Text>
                </div>
              </Table.Cell>
            </Table.Row>
          ) : (
            paginatedItems.map((item) => (
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
                  <Text>{item.category}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text>{item.quantity} {item.storageUnit}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text>{item.reorderLevel} {item.storageUnit}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text>{formatDate(item.lastRestockedDate)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text>{item.expirationDate ? formatDate(item.expirationDate) : '-'}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Box 
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: getStatusColor(item.status) === 'green' ? 'var(--green-3)' : 
                                     getStatusColor(item.status) === 'orange' ? 'var(--orange-3)' : 'var(--red-3)',
                      color: getStatusColor(item.status) === 'green' ? 'var(--green-11)' : 
                             getStatusColor(item.status) === 'orange' ? 'var(--orange-11)' : 'var(--red-11)'
                    }}
                  >
                    {item.status}
                  </Box>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={displayItems.length}
          startIndex={(currentPage - 1) * itemsPerPage}
          endIndex={Math.min((currentPage - 1) * itemsPerPage + itemsPerPage, displayItems.length)}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
} 