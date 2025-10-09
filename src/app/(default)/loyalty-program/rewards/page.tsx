"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Flex,
  TextField,
  Button,
  Select,
  Table,
  Avatar,
  Text,
  Badge,
  IconButton,
  Callout,
} from "@radix-ui/themes";
import { Search, Plus, ImageIcon, RefreshCcw, Edit, Trash2, Info } from "lucide-react";
// Removed hardcoded imports - using real data from database services
import { loyaltyService } from '@/lib/services';

// Placeholder types - will be replaced with proper database types
type LoyaltyReward = any;
type LoyaltyTier = any;
import format from 'date-fns/format';
import Pagination from '@/components/common/Pagination';
import { useRouter } from 'next/navigation';
import { PageHeading } from '@/components/common/PageHeading';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SortableHeader } from '@/components/common/SortableHeader';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEffect } from 'react';

const formatDateRange = (start?: Date, end?: Date): string => {
  if (!start && !end) return "Always Active";
  const startDate = start ? format(start, "MMM dd, yyyy") : "From start";
  const endDate = end ? format(end, "MMM dd, yyyy") : "Ongoing";
  if (start && end && format(start, 'yyyyMMdd') === format(end, 'yyyyMMdd')) {
    return format(start, "MMM dd, yyyy");
  }
  return `${startDate} - ${endDate}`;
};

const formatBranchScope = (scope: 'All' | string[], branches: any[]): string => {
  if (scope === 'All') return "All Branches";
  if (Array.isArray(scope)) {
    if (scope.length === 0) return "No Branches";
    if (scope.length === 1) {
       const branch = branches.find(b => b.id === scope[0]);
       return branch ? branch.name : scope[0];
    }
    return `${scope.length} Branches`;
  }
  return "Unknown";
};

const getStatusColor = (isActive: boolean, validUntil?: string | null): React.ComponentProps<typeof Badge>['color'] => {
  if (!isActive) return 'gray';
  if (validUntil && new Date(validUntil) < new Date()) return 'orange'; // Expired
  return 'green'; // Active
};

const _getStatusText = (isActive: boolean, validUntil?: string | null): string => {
  if (!isActive) return 'Inactive';
  if (validUntil && new Date(validUntil) < new Date()) return 'Expired';
  return 'Active';
};

export default function RewardsPage() {
  usePageTitle('Loyalty Rewards');
  const router = useRouter();
  const { currentOrganization, branches } = useOrganization();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Real data from database
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [_loading, setLoading] = useState(true);

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      if (!currentOrganization) return;

      try {
        setLoading(true);
        const [rewardsData, tiersData] = await Promise.all([
          loyaltyService.getRewards(currentOrganization.id),
          loyaltyService.getTiers(currentOrganization.id)
        ]);
        
        setRewards(rewardsData);
        setTiers(tiersData);
      } catch (error) {
        console.error('Error loading loyalty data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentOrganization]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredRewards = useMemo(() => {
    setCurrentPage(1);
    let filtered = rewards.filter(reward => {
      const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (reward.description && reward.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter based on is_active and validity dates
      const isActive = reward.is_active;
      const isExpired = reward.valid_until && new Date(reward.valid_until) < new Date();
      const currentStatus = !isActive ? 'Inactive' : isExpired ? 'Expired' : 'Active';
      const matchesStatus = statusFilter === 'all' || currentStatus.toLowerCase() === statusFilter.toLowerCase();
      
      const matchesType = typeFilter === 'all' || reward.reward_type === typeFilter;
      
      // For now, assume all rewards apply to all branches (can be enhanced later)
      const matchesBranch = branchFilter === 'all';
      
      // For now, assume all rewards apply to all tiers (can be enhanced later)  
      const matchesTier = tierFilter === 'all';

      return matchesSearch && matchesStatus && matchesType && matchesBranch && matchesTier;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'type':
            aValue = a.reward_type;
            bValue = b.reward_type;
            break;
          case 'points':
            aValue = a.points_required || 0;
            bValue = b.points_required || 0;
            break;
          case 'status':
            aValue = a.is_active ? 'Active' : 'Inactive';
            bValue = b.is_active ? 'Active' : 'Inactive';
            break;
          case 'validity':
            aValue = a.valid_from ? new Date(a.valid_from).getTime() : 0;
            bValue = b.valid_from ? new Date(b.valid_from).getTime() : 0;
            break;
          case 'branchScope':
            aValue = 0; // All rewards apply to all branches for now
            bValue = 0;
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

    return filtered;
  }, [rewards, searchTerm, statusFilter, typeFilter, branchFilter, tierFilter, sortConfig]);

  const totalItems = filteredRewards.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRewards = filteredRewards.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleDisable = (rewardId: string) => {
    console.log(`Disabling reward ${rewardId}`);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setBranchFilter('all');
    setTierFilter('all');
  };

  const handleEditReward = (rewardId: string) => {
    router.push(`/loyalty-program/rewards/edit/${rewardId}`);
  };

  return (
    <Box className="space-y-4">
      {/* Info Banner */}
      {currentOrganization && (
        <Callout.Root color="blue">
          <Callout.Icon>
            <Info size={16} />
          </Callout.Icon>
          <Callout.Text>
            Rewards management is currently using sample data. Backend API integration for rewards catalog is coming soon.
          </Callout.Text>
        </Callout.Root>
      )}

      {/* Filters and Search */}
      <Flex direction="column" gap="5" mb="5">
        <Flex 
          direction={{ initial: "column", sm: "row" }} 
          justify="between" 
          align={{ initial: "stretch", sm: "center" }}
          gap={{ initial: "4", sm: "0" }}
        >
          <PageHeading title="Rewards Management" description="Manage and track your loyalty program rewards" noMarginBottom />
          <Box width={{ initial: "full", sm: "auto" }}>
            <Link href="/loyalty-program/rewards/add">
              <Button>
                <Plus size={16}/> Add New Reward
              </Button>
            </Link>
          </Box>
        </Flex>
        <Flex gap="3" align="end" wrap="wrap">
          <Box style={{ flexGrow: '1' }}>
            <TextField.Root
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            >
              <TextField.Slot>
                <Search size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>
          <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
            <Select.Trigger placeholder="Filter by status..." />
            <Select.Content>
              <Select.Item value="all">All Statuses</Select.Item>
              <Select.Item value="Active">Active</Select.Item>
              <Select.Item value="Inactive">Inactive</Select.Item>
              <Select.Item value="Expired">Expired</Select.Item>
              <Select.Item value="Draft">Draft</Select.Item>
            </Select.Content>
          </Select.Root>
          <Select.Root value={typeFilter} onValueChange={setTypeFilter}>
            <Select.Trigger placeholder="Filter by type..." />
            <Select.Content>
              <Select.Item value="all">All Types</Select.Item>
              <Select.Item value="Free Item">Free Item</Select.Item>
              <Select.Item value="% Discount">% Discount</Select.Item>
              <Select.Item value="Cashback">Cashback</Select.Item>
            </Select.Content>
          </Select.Root>
          <Select.Root value={branchFilter} onValueChange={setBranchFilter}>
            <Select.Trigger placeholder="Filter by branch..." />
            <Select.Content>
              <Select.Item value="all">All Branches</Select.Item>
              {branches.map(branch => (
                  <Select.Item key={branch.id} value={branch.id}>{branch.name}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Select.Root value={tierFilter} onValueChange={setTierFilter}>
            <Select.Trigger placeholder="Filter by tier..." />
            <Select.Content>
              <Select.Item value="all">All Tiers</Select.Item>
              {tiers.map(tier => (
                  <Select.Item key={tier.id} value={tier.id}>{tier.name}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Button 
            variant="soft" 
            color={(statusFilter !== 'all' || typeFilter !== 'all' || branchFilter !== 'all' || tierFilter !== 'all' || searchTerm !== '') ? 'red' : 'gray'} 
            onClick={resetFilters} 
            disabled={(statusFilter === 'all' && typeFilter === 'all' && branchFilter === 'all' && tierFilter === 'all' && searchTerm === '')}
          >
            <RefreshCcw size={16} />
            Reset Filters
          </Button>
        </Flex>
      </Flex>

      {/* Rewards Table */}
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Reward"
                sortKey="name"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Type"
                sortKey="type"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Points"
                sortKey="points"
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
                label="Validity"
                sortKey="validity"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <SortableHeader
                label="Branch Scope"
                sortKey="branchScope"
                currentSort={sortConfig}
                onSort={handleSort}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {paginatedRewards.map((reward) => (
            <Table.Row key={reward.id} className="align-middle cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800" onClick={() => handleEditReward(reward.id)}>
              <Table.Cell>
                <Flex gap="3" align="center">
                  {reward.imageUrl ? (
                    <Avatar src={reward.imageUrl} fallback={reward.name.charAt(0)} size="3" radius="small" />
                  ) : (
                    <Flex align="center" justify="center" className="w-10 h-10 rounded bg-gray-100 dark:bg-neutral-800">
                      <ImageIcon size={18} className="text-slate-400 dark:text-neutral-500" />
                    </Flex>
                  )}
                  <Box>
                    <Text as="div" size="2" weight="bold">
                      {reward.name}
                    </Text>
                    <Text as="div" size="1" color="gray" truncate>
                      {reward.description}
                    </Text>
                  </Box>
                </Flex>
              </Table.Cell>
              <Table.Cell>{reward.type}</Table.Cell>
              <Table.Cell>{reward.pointsRequired}</Table.Cell>
              <Table.Cell>
                <Badge color={getStatusColor(reward.status)}>{reward.status}</Badge>
              </Table.Cell>
              <Table.Cell>
                {formatDateRange(reward.validityStartDate, reward.validityEndDate)}
              </Table.Cell>
              <Table.Cell>
                {formatBranchScope(reward.branchScope, branches)}
              </Table.Cell>
              <Table.Cell>
                <Flex gap="3">
                  <IconButton 
                    variant="ghost" 
                    size="1"
                    color="gray"
                    onClick={(e) => {e.stopPropagation(); handleEditReward(reward.id)}}
                  >
                    <Edit size={14} />
                  </IconButton>
                  <IconButton 
                      variant="ghost" 
                      color="red" 
                      size="1" 
                      onClick={(e) => {e.stopPropagation(); handleDisable(reward.id)}}
                      disabled={reward.status === 'Inactive' || reward.status === 'Expired'}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
           {filteredRewards.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={7} align="center">
                <Text className="text-slate-500 dark:text-neutral-600" size="2">No rewards found matching your criteria.</Text>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>

       {/* Pagination Component */}
       { totalPages > 1 && (
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
    </Box>
  );
}
