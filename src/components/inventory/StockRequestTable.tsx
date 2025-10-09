'use client';

import React, { useState, useMemo } from 'react';
import { Table, Flex, Text, Badge, IconButton } from '@radix-ui/themes';
import { Trash2, FileText, Edit } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/lib/supabase/database.types';
import { formatDate } from '@/utilities';
import { SortableHeader } from '@/components/common/SortableHeader';
import { 
  StockRequestFormData, 
  StockRequestStatus,
  SortConfig,
  SortableStockRequestField
} from '@/types/inventory';

type Branch = Database['public']['Tables']['branches']['Row'];

interface StockRequestTableProps {
  stockRequests: StockRequestFormData[];
  onEdit?: (request: StockRequestFormData) => void;
  onDelete?: (id: string) => void;
  onView?: (request: StockRequestFormData) => void;
  readOnly?: boolean;
}

const StockRequestTable: React.FC<StockRequestTableProps> = ({
  stockRequests = [],
  onEdit,
  onDelete, 
  onView,
  readOnly = false
}) => {
  const { branches } = useOrganization();
  const [sortConfig, setSortConfig] = useState<SortConfig<StockRequestFormData> | null>(null);

  const handleSort = (key: SortableStockRequestField) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRequests = useMemo(() => {
    if (!sortConfig) return stockRequests;

    return [...stockRequests].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle string comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Handle date comparisons 
      if (sortConfig.key === 'date' || sortConfig.key === 'requiredDate' || sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
        if (!aValue && !bValue) return 0;
        if (!aValue) return sortConfig.direction === 'asc' ? 1 : -1;
        if (!bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        
        const aDate = new Date(aValue as Date).getTime();
        const bDate = new Date(bValue as Date).getTime();
        const comparison = aDate - bDate;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Handle number comparisons
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  }, [stockRequests, sortConfig]);

  const getBranchName = (branchId: string): string => {
    return branches?.find((branch: Branch) => branch.id === branchId)?.name || 'Unknown Branch';
  };

  const getStatusBadge = (status: StockRequestStatus) => {
    const statusConfig = {
      'New': { color: 'blue' as const, label: 'New' },
      'Pending': { color: 'orange' as const, label: 'Pending' },
      'Approved': { color: 'green' as const, label: 'Approved' },
      'Rejected': { color: 'red' as const, label: 'Rejected' },
      'Completed': { color: 'gray' as const, label: 'Completed' },
      'Cancelled': { color: 'gray' as const, label: 'Cancelled' }
    };

    const config = statusConfig[status] || { color: 'gray' as const, label: status };
    
    return (
      <Badge color={config.color} variant="soft">
        {config.label}
      </Badge>
    );
  };

  if (stockRequests.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" gap="3" className="py-8">
        <FileText className="h-8 w-8 text-gray-400" />
        <Text size="3" color="gray">No stock requests found</Text>
        <Text size="2" color="gray">Stock requests will appear here once created.</Text>
      </Flex>
    );
  }

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>
            <SortableHeader
              label="Request Number"
              sortKey="requestNumber"
              currentSort={sortConfig}
              onSort={handleSort}
            />
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>
            <SortableHeader
              label="Date"
              sortKey="date"
              currentSort={sortConfig}
              onSort={handleSort}
            />
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>
            <SortableHeader
              label="Origin"
              sortKey="originId"
              currentSort={sortConfig}
              onSort={handleSort}
            />
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>
            <SortableHeader
              label="Destination"
              sortKey="destinationId"
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
          <Table.ColumnHeaderCell>Items</Table.ColumnHeaderCell>
          {!readOnly && <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sortedRequests.map((request) => (
          <Table.Row key={request.id} className="cursor-pointer hover:bg-gray-50">
            <Table.Cell>
              <Text weight="medium">{request.requestNumber}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>{formatDate(request.date)}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>{getBranchName(request.originId)}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>{getBranchName(request.destinationId)}</Text>
            </Table.Cell>
            <Table.Cell>
              {getStatusBadge(request.status)}
            </Table.Cell>
            <Table.Cell>
              <Text>{request.items.length} items</Text>
            </Table.Cell>
            {!readOnly && (
              <Table.Cell>
                <Flex gap="1">
                  <IconButton 
                    variant="soft" 
                    color="blue" 
                    size="1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView?.(request);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                  </IconButton>
                  <IconButton 
                    variant="soft" 
                    color="green" 
                    size="1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(request);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </IconButton>
                  {request.id && (
                    <IconButton 
                      variant="soft" 
                      color="red" 
                      size="1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(request.id!);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  )}
                </Flex>
              </Table.Cell>
            )}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default StockRequestTable; 