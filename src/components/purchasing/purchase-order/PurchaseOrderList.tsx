'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Button, 
  Flex,
  Table, 
  Text, 
  TextField, 
  Select, 
  Badge,
  Callout
} from '@radix-ui/themes';
import { Search, Filter, X, RefreshCcw } from 'lucide-react';
// Removed hardcoded imports - using real data from database services
import { suppliersService, type PurchaseOrderWithItems } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/lib/supabase/database.types';

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];
import Pagination from '@/components/common/Pagination';
import PurchaseOrderAdvancedSearchDialog from './PurchaseOrderAdvancedSearchDialog';
import { formatDate } from '@/utilities';
import { useFilterBranch } from '@/contexts/FilterBranchContext';
// Removed hardcoded organization import - using real organization from context
import { SortableHeader } from '@/components/common/SortableHeader';

export default function PurchaseOrderList() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const { activeBranchFilter } = useFilterBranch();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredPOs, setFilteredPOs] = useState<PurchaseOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any>(null);
  const [filters, setFilters] = useState({
    orderStatus: 'all',
    paymentStatus: 'all',
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Load purchase orders from database
  useEffect(() => {
    const loadPurchaseOrders = async () => {
      if (!currentOrganization) return;
      
      try {
        // TODO: Implement suppliersService.getPurchaseOrders method
        // const orders = await suppliersService.getPurchaseOrders(currentOrganization.id);
        // setPurchaseOrders(orders);
        // setFilteredPOs(orders);
        
        // Temporary: Set empty array until service is implemented
        setPurchaseOrders([]);
        setFilteredPOs([]);
      } catch (error) {
        console.error('Error loading purchase orders:', error);
        setPurchaseOrders([]);
        setFilteredPOs([]);
      }
    };

    loadPurchaseOrders();
    setCurrentPage(1);
  }, [currentOrganization, activeBranchFilter]);
  
  // Handle search and filters
  useEffect(() => {
    let result = purchaseOrders;
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(po => 
        po.po_number?.toLowerCase().includes(query) ||
        po.notes?.toLowerCase().includes(query) ||
        po.status?.toLowerCase().includes(query)
      );
    }
    
    // Apply simple filters
    if (filters.orderStatus !== 'all') {
      result = result.filter(po => po.status === filters.orderStatus);
    }
    
    // TODO: Implement payment status filtering when payment schema is added
    if (filters.paymentStatus !== 'all') {
      // result = result.filter(po => po.payment_status === filters.paymentStatus);
    }
    
    // Apply advanced filters if they exist
    if (advancedFilters) {
      if (advancedFilters.poNumber) {
        result = result.filter(po => po.po_number?.toLowerCase().includes(advancedFilters.poNumber.toLowerCase()));
      }
      
      if (advancedFilters.orderedBy && advancedFilters.orderedBy !== 'all') {
        result = result.filter(po => po.created_by?.toLowerCase().includes(advancedFilters.orderedBy.toLowerCase()));
      }
      
      // TODO: Implement supplier name filtering when supplier relationship is properly implemented
      if (advancedFilters.supplierName) {
        // result = result.filter(po => po.supplier_name.toLowerCase().includes(advancedFilters.supplierName.toLowerCase()));
      }
      
      // TODO: Implement contact name filtering when supplier details schema is implemented
      if (advancedFilters.contactName) {
        // result = result.filter(po => po.supplier_contact_name?.toLowerCase().includes(advancedFilters.contactName.toLowerCase()));
      }
      
      if (advancedFilters.orderDateFrom) {
        const fromDate = new Date(advancedFilters.orderDateFrom);
        result = result.filter(po => new Date(po.order_date || po.created_at || '') >= fromDate);
      }
      
      if (advancedFilters.orderDateTo) {
        const toDate = new Date(advancedFilters.orderDateTo);
        toDate.setHours(23, 59, 59, 999); // End of the day
        result = result.filter(po => new Date(po.order_date || po.created_at || '') <= toDate);
      }
      
      if (advancedFilters.orderStatus && advancedFilters.orderStatus !== 'all') {
        result = result.filter(po => po.status === advancedFilters.orderStatus);
      }
      
      // TODO: Implement tracking number filtering when shipping schema is added
      if (advancedFilters.trackingNumber) {
        // result = result.filter(po => po.tracking_number?.toLowerCase().includes(advancedFilters.trackingNumber.toLowerCase()));
      }
      
      // TODO: Implement payment status filtering when payment schema is added
      if (advancedFilters.paymentStatus && advancedFilters.paymentStatus !== 'all') {
        // result = result.filter(po => po.payment_status === advancedFilters.paymentStatus);
      }
      
      // TODO: Implement invoice number filtering when payment schema is added
      if (advancedFilters.invoiceNumber) {
        // result = result.filter(po => po.invoice_number?.toLowerCase().includes(advancedFilters.invoiceNumber.toLowerCase()));
      }
      
      // TODO: Implement date paid filtering when payment schema is added
      if (advancedFilters.datePaidFrom) {
        // const fromDate = new Date(advancedFilters.datePaidFrom);
        // result = result.filter(po => po.date_paid ? new Date(po.date_paid) >= fromDate : false);
      }
      
      if (advancedFilters.datePaidTo) {
        // const toDate = new Date(advancedFilters.datePaidTo);
        // toDate.setHours(23, 59, 59, 999); // End of the day
        // result = result.filter(po => po.date_paid ? new Date(po.date_paid) <= toDate : false);
      }
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'poNumber':
            aValue = (a.po_number || '').toLowerCase();
            bValue = (b.po_number || '').toLowerCase();
            break;
          case 'branch':
            aValue = a.organization_id || '';
            bValue = b.organization_id || '';
            break;
          case 'dateCreated':
            aValue = new Date(a.order_date || a.created_at || '').getTime();
            bValue = new Date(b.order_date || b.created_at || '').getTime();
            break;
          case 'supplier':
            aValue = a.supplier_id || '';
            bValue = b.supplier_id || '';
            break;
          case 'orderStatus':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'totalValue':
            aValue = a.total_amount;
            bValue = b.total_amount;
            break;
          case 'expectedDelivery':
            aValue = new Date(a.expected_delivery_date || '').getTime();
            bValue = new Date(b.expected_delivery_date || '').getTime();
            break;
          case 'paymentStatus':
            // TODO: Use actual payment status when payment schema is implemented
            aValue = 'pending';
            bValue = 'pending';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredPOs(result);
    setCurrentPage(1); // Reset to first page when filters change

  }, [searchQuery, filters, advancedFilters, purchaseOrders, sortConfig]);
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredPOs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPOs = filteredPOs.slice(startIndex, endIndex);
  
  const handleRowClick = (poId: string) => {
    router.push(`/purchasing/purchase-orders/${poId}`);
  };
  
  const handleAdvancedSearch = (filters: any) => {
    setAdvancedFilters(filters);
  };
  
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({
      orderStatus: 'all',
      paymentStatus: 'all',
    });
    setAdvancedFilters(null);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'gray';
      case 'Pending': return 'amber';
      case 'In Progress': return 'blue';
      case 'Delivered': return 'green';
      case 'Partially Received': return 'purple';
      case 'Canceled': return 'red';
      default: return 'gray';
    }
  };
  
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'green';
      case 'Partially Paid': return 'amber';
      case 'Unpaid': return 'red';
      default: return 'gray';
    }
  };
  
  // Format date strings to more readable format
  const formatDateString = (dateString: string) => {
    return formatDate(new Date(dateString));
  };
  
  return (
    <Box>
      {/* Branch filter indicator */}
      {activeBranchFilter ? (
        <Callout.Root color="blue" size="1" mb="4">
          <Callout.Text>
            Viewing purchase orders for <Badge variant="solid" color="blue">{activeBranchFilter.name}</Badge>
          </Callout.Text>
        </Callout.Root>
      ) : (
        <Callout.Root color="gray" size="1" mb="4">
          <Callout.Text>
            Viewing purchase orders from all branches. Use the branch filter in the header to filter by branch.
          </Callout.Text>
        </Callout.Root>
      )}
      
      {/* Search and Filter Bar */}
      <Flex gap="3" mb="4" wrap="wrap">
        <Box style={{ minWidth: '200px', flexGrow: 1 }}>
          <TextField.Root 
            placeholder="Search by PO number, supplier, status..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          >
            <TextField.Slot>
              <Search className="h-4 w-4" />
            </TextField.Slot>
            {searchQuery && (
              <TextField.Slot>
                <Button variant="ghost" size="1" onClick={() => setSearchQuery('')}>
                  <X className="h-4 w-4" />
                </Button>
              </TextField.Slot>
            )}
          </TextField.Root>
        </Box>
        
        <Select.Root 
          value={filters.orderStatus} 
          onValueChange={(value) => setFilters({...filters, orderStatus: value})}
        >
          <Select.Trigger placeholder="Order Status" />
          <Select.Content>
            <Select.Item value="all">All Statuses</Select.Item>
            <Select.Item value="Draft">Draft</Select.Item>
            <Select.Item value="Pending">Pending</Select.Item>
            <Select.Item value="In Progress">In Progress</Select.Item>
            <Select.Item value="Delivered">Delivered</Select.Item>
            <Select.Item value="Partially Received">Partially Received</Select.Item>
            <Select.Item value="Canceled">Canceled</Select.Item>
          </Select.Content>
        </Select.Root>
        
        <Select.Root 
          value={filters.paymentStatus} 
          onValueChange={(value) => setFilters({...filters, paymentStatus: value})}
        >
          <Select.Trigger placeholder="Payment Status" />
          <Select.Content>
            <Select.Item value="all">All Payment Statuses</Select.Item>
            <Select.Item value="Paid">Paid</Select.Item>
            <Select.Item value="Partially Paid">Partially Paid</Select.Item>
            <Select.Item value="Unpaid">Unpaid</Select.Item>
          </Select.Content>
        </Select.Root>

        <Button 
          variant="soft" 
          color={(filters.orderStatus !== 'all' || filters.paymentStatus !== 'all' || searchQuery !== '' || advancedFilters !== null) ? 'red' : 'gray'} 
          onClick={handleResetFilters}
          disabled={(filters.orderStatus === 'all' && filters.paymentStatus === 'all' && searchQuery === '' && advancedFilters === null)}
        >
          <RefreshCcw size={16} />
          Reset Filters
        </Button>
        
        <Button 
          variant='outline' 
          onClick={() => setIsAdvancedSearchOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Advanced Filters {advancedFilters ? '(Active)' : ''}
        </Button>
      </Flex>
      
      {/* Show indicator when advanced filters are active */}
      {advancedFilters && (
        <Callout.Root color="orange" size="1" mb="2">
          <Callout.Text className="flex gap-2 align-center leading-[1.6]">
            Advanced filters are active
            <Button 
              size="1"
              onClick={() => setAdvancedFilters(null)}
            >
              Clear Filters
            </Button>
          </Callout.Text>            
        </Callout.Root>
      )}
      
      {/* Purchase Orders Table */}
      <Box>
        <Table.Root variant='surface'>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>
                <SortableHeader
                  label="PO Number"
                  sortKey="poNumber"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>
                <SortableHeader
                  label="Branch"
                  sortKey="branch"
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
                  label="Supplier"
                  sortKey="supplier"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>
                <SortableHeader
                  label="Order Status"
                  sortKey="orderStatus"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>
                <SortableHeader
                  label="Total Value"
                  sortKey="totalValue"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  align="right"
                />
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>
                <SortableHeader
                  label="Expected Delivery"
                  sortKey="expectedDelivery"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>
                <SortableHeader
                  label="Payment Status"
                  sortKey="paymentStatus"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {paginatedPOs.length > 0 ? (
              paginatedPOs.map((po) => (
                <Table.Row 
                  key={po.id} 
                  onClick={() => handleRowClick(po.id)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800"
                >
                  <Table.Cell>
                    <Text weight="bold">{po.po_number}</Text>
                  </Table.Cell>
                  <Table.Cell>{po.organization_id?.slice(0, 8) || 'N/A'}...</Table.Cell>
                  <Table.Cell>{formatDateString(po.order_date || po.created_at || '')}</Table.Cell>
                  <Table.Cell>{po.supplier_id || 'N/A'}</Table.Cell>
                  <Table.Cell>
                    <Badge color={getStatusColor(po.status)}>
                      {po.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell align="right">${po.total_amount.toFixed(2)}</Table.Cell>
                  <Table.Cell>{formatDateString(po.expected_delivery_date || '')}</Table.Cell>
                  <Table.Cell>
                    <Badge color={getPaymentStatusColor('pending')}>
                      Pending {/* TODO: Show actual payment status when schema is implemented */}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={8}>
                  <Text align="center" className="mt-4 mb-4">No purchase orders found</Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>
      
      {/* Pagination */}
      {filteredPOs.length > 0 && (
        <Box className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredPOs.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newSize) => {
              setItemsPerPage(newSize);
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          />
        </Box>
      )}
      
      {/* Advanced Search Dialog */}
      <PurchaseOrderAdvancedSearchDialog
        open={isAdvancedSearchOpen}
        onOpenChange={setIsAdvancedSearchOpen}
        onSearch={handleAdvancedSearch}
      />
    </Box>
  );
} 