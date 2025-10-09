'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  Flex,
  Text
} from '@radix-ui/themes';
import { useOrganization } from '@/contexts/OrganizationContext';
import { inventoryService } from '@/lib/services';
import { formatDate } from '@/utilities/index';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { getTransferStatusBadge } from '@/utilities/transferStatusBadge';
import { SortableHeader } from '@/components/common/SortableHeader';
import { StockTransferLog, SortConfig, SortableTransferLogField } from '@/types/inventory';

interface StockTransferLogsTableProps {
  transferLogs: StockTransferLog[];
  onRowClick?: (log: StockTransferLog) => void;
  onSort?: (field: SortableTransferLogField, direction: 'asc' | 'desc') => void;
}

const StockTransferLogsTable: React.FC<StockTransferLogsTableProps> = ({
  transferLogs = [],
  onRowClick,
  onSort
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<StockTransferLog> | null>(null);

  const handleSort = (key: SortableTransferLogField) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const sortedTransferLogs = useMemo(() => {
    if (!sortConfig) return transferLogs;

    return [...transferLogs].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle string comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Handle date comparisons
      if (sortConfig.key === 'dateCreated' || sortConfig.key === 'dateReceived') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        const comparison = aDate - bDate;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Handle number comparisons
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Handle boolean comparisons
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        const comparison = Number(aValue) - Number(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  }, [transferLogs, sortConfig]);

  const handleRowClick = (log: StockTransferLog) => {
    onRowClick?.(log);
  };

  if (transferLogs.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" gap="3" className="py-8">
        <AlertTriangle className="h-8 w-8 text-gray-400" />
        <Text size="3" color="gray">No transfer logs found</Text>
        <Text size="2" color="gray">Transfer logs will appear here once stock transfers are created.</Text>
      </Flex>
    );
  }

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>
            <SortableHeader
              label="Transfer Number"
              sortKey="transferNumber"
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
          <Table.ColumnHeaderCell>
            <SortableHeader
              label="Date Created"
              sortKey="dateCreated"
              currentSort={sortConfig}
              onSort={handleSort}
            />
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>
            <SortableHeader
              label="Items"
              sortKey="totalItems"
              currentSort={sortConfig}
              onSort={handleSort}
            />
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Discrepancies</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sortedTransferLogs.map((log) => (
          <Table.Row 
            key={log.id} 
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => handleRowClick(log)}
          >
            <Table.Cell>
              <Text weight="medium">{log.transferNumber}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>{log.originId}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>{log.destinationId}</Text>
            </Table.Cell>
            <Table.Cell>
              {getTransferStatusBadge({ status: log.status })}
            </Table.Cell>
            <Table.Cell>
              <Text>{formatDate(new Date(log.dateCreated))}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>{log.totalItems || 0} items</Text>
            </Table.Cell>
            <Table.Cell>
              {log.hasDiscrepancies && (
                <Flex align="center" gap="1">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <Text size="2" color="orange">Yes</Text>
                </Flex>
              )}
            </Table.Cell>
            <Table.Cell>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default StockTransferLogsTable; 