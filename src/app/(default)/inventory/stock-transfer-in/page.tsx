'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Box,
  Text,
  Button,
  Flex,
  Select,
  TextField,
  Badge,
} from '@radix-ui/themes';
import { Search, RefreshCcw } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { StockRequestFormData } from '@/types/inventory';
import StockTransferInTable from '@/components/inventory/StockTransferInTable';
import Pagination from '@/components/common/Pagination';
import { useRouter } from 'next/navigation';
import { PageHeading } from '@/components/common/PageHeading';
import { usePageTitle } from '@/hooks/usePageTitle';

const ITEMS_PER_PAGE = 10;
const RELEVANT_STATUS = 'Approved'; // Updated to match StockRequestStatus types
const ASSUMED_DESTINATION = 'br-1'; // assumed destination branch

function StockTransferInContent() {
  const { branches } = useOrganization();
  // Initialize with empty array - in real implementation would load from service
  const [allStockRequests] = useState<StockRequestFormData[]>([]);
  // Filtered requests based on search/filters
  const [filteredRequests, setFilteredRequests] = useState<StockRequestFormData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  
  const router = useRouter();

  // Filter requests that are en route to this branch
  useEffect(() => {
    // Start with requests that are being delivered to this branch
    let result = allStockRequests.filter(req => 
      req.status === RELEVANT_STATUS && 
      req.destinationId === ASSUMED_DESTINATION
    );

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        request =>
          request.requestNumber.toLowerCase().includes(term) ||
          (branches?.find(b => b.id === request.originId)?.name.toLowerCase() || '').includes(term)
      );
    }

    // Apply origin filter
    if (originFilter !== 'all') {
      result = result.filter(request => request.originId === originFilter);
    }

    setFilteredRequests(result);
    setCurrentPage(1);
  }, [allStockRequests, searchTerm, originFilter, branches]);

  // Handle receive button click - updated to match component interface
  const handleReceiveClick = (requestId: string) => {
    router.push(`/inventory/stock-transfer-in/${requestId}`);
  };

  // Handle view button click - updated to match component interface
  const handleViewClick = (request: StockRequestFormData) => {
    router.push(`/inventory/stock-transfer-in/${request.id}`);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setOriginFilter('all');
    setCurrentPage(1);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredRequests.length);
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  return (
    <Box className="space-y-4">
      <Flex justify="between" align="start" mb="5">
        <PageHeading 
          title="Stock Transfer In" 
          description="Process and receive incoming stock transfers."
          badge={<Badge>Destination: {branches?.find(b => b.id === ASSUMED_DESTINATION)?.name || 'Current Branch'}</Badge>}
          noMarginBottom
        />
      </Flex>

      <Box>
        <Flex gap="4" align="center" wrap="wrap">
          <Box className="flex-grow min-w-[250px]">
            <TextField.Root
              placeholder="Search by request # or origin branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            >
              <TextField.Slot>
                <Search size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          <Flex align="center" gap="1" className="flex-shrink-0">
            <Text size="2">From:</Text>
            <Select.Root value={originFilter} onValueChange={setOriginFilter}>
              <Select.Trigger placeholder="All Origins" />
              <Select.Content>
                <Select.Item value="all">All Origins</Select.Item>
                {branches.filter(b => b.id !== ASSUMED_DESTINATION).map(branch => (
                  <Select.Item key={branch.id} value={branch.id}>
                    {branch.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Button 
            variant="soft" 
            color={(originFilter !== 'all' || searchTerm !== '') ? 'red' : 'gray'} 
            onClick={handleResetFilters} 
            disabled={(originFilter === 'all' && searchTerm === '')}
          >
            <RefreshCcw size={16} />
            Reset Filters
          </Button>
        </Flex>
      </Box>

      <StockTransferInTable
        stockRequests={paginatedRequests}
        onReceive={handleReceiveClick}
        onView={handleViewClick}
      />

      {filteredRequests.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredRequests.length}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
        />
      )}
    </Box>
  );
}

export default function StockTransferInPage() {
  usePageTitle('Stock Transfer In');
  return (
    <Suspense fallback={<div>Loading stock requests...</div>}>
      <StockTransferInContent />
    </Suspense>
  );
}
