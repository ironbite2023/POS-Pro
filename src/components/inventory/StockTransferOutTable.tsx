'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  Flex,
  Text,
  Badge,
  Button,
} from '@radix-ui/themes';
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

interface StockTransferOutTableProps {
  stockRequests: StockRequestFormData[];
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onView?: (request: StockRequestFormData) => void;
  readOnly?: boolean;
}

const StockTransferOutTable: React.FC<StockTransferOutTableProps> = ({
  stockRequests = [],
  onApprove,
  onReject,
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
        <Text size="3" color="gray">No outgoing transfer requests found</Text>
        <Text size="2" color="gray">Outgoing transfer requests will appear here when created.</Text>
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
              label="Requesting Branch"
              sortKey="originId"
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
          <Table.Row 
            key={request.id} 
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => onView?.(request)}
          >
            <Table.Cell>
              <Text weight="medium">{request.requestNumber}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>{getBranchName(request.originId)}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>{formatDate(request.date)}</Text>
            </Table.Cell>
            <Table.Cell>
              {getStatusBadge(request.status)}
            </Table.Cell>
            <Table.Cell>
              <Text>{request.items.length} items</Text>
            </Table.Cell>
            {!readOnly && (
              <Table.Cell>
                <Flex gap="2">
                  {request.status === 'Pending' && (
                    <>
                      <Button 
                        size="1" 
                        color="green" 
                        variant="soft"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove?.(request.id!);
                        }}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="1" 
                        color="red" 
                        variant="soft"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReject?.(request.id!);
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  <Button 
                    size="1" 
                    variant="soft" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onView?.(request);
                    }}
                  >
                    View
                  </Button>
                </Flex>
              </Table.Cell>
            )}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default StockTransferOutTable;