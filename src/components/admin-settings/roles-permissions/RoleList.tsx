'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Badge, Box, Button, Flex, Select, Table, Text, TextField, IconButton } from '@radix-ui/themes';
import { Edit, RefreshCcw, Search, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/hooks/useAdminData';
import type { Database } from '@/lib/supabase/database.types';
import Pagination from '@/components/common/Pagination';
import { Spinner } from '@radix-ui/themes';

type Role = Database['public']['Tables']['roles']['Row'];

export default function RoleList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [accessScopeFilter, setAccessScopeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const router = useRouter();

  // Get real roles data from useAdminData hook
  const { roles, loading, error, refetchRoles } = useAdminData();

  // Check if any filter is active
  const isFilterActive = searchTerm !== '' || accessScopeFilter !== 'all';

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setAccessScopeFilter('all');
    setCurrentPage(1);
  };

  // Filter roles based on search term and filters
  const filteredRoles = useMemo(() => {
    if (!roles || roles.length === 0) return [];
    
    return roles.filter(role => {
      // Search term filter (name or description)
      const matchesSearch = 
        (role.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (role.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      // Access Scope filter - for now, show all roles as we don't have accessScope field
      // This can be enhanced when the database schema is updated to include access scope
      const matchesAccessScope = accessScopeFilter === 'all' || true;
      
      return matchesSearch && matchesAccessScope;
    });
  }, [roles, searchTerm, accessScopeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

  // Handle edit role button click
  const handleEditRole = (roleId: string) => {
    router.push(`/admin-settings/roles-permissions/${roleId}`);
  };

  // Handle refresh data
  const handleRefreshData = async () => {
    try {
      await refetchRoles();
    } catch (err) {
      console.error('Failed to refresh roles:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box>
        <Flex direction="column" align="center" justify="center" gap="4" style={{ minHeight: '200px' }}>
          <Spinner size="3" />
          <Text color="gray">Loading roles...</Text>
        </Flex>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        <Flex direction="column" align="center" justify="center" gap="4" style={{ minHeight: '200px' }}>
          <AlertCircle size={48} color="red" />
          <Text color="red" size="4" weight="medium">Failed to load roles</Text>
          <Text color="gray" size="2">{error.message}</Text>
          <Button onClick={handleRefreshData} variant="soft">
            <RefreshCcw size={16} />
            Retry
          </Button>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      <Flex direction="column" gap="4">
        {/* Search and filters */}
        <Flex gap="4" align="center" justify="between">
          <Flex gap="4" align="center" style={{ flex: 1 }}>
            <Box style={{ flexGrow: 1 }}>
              <TextField.Root placeholder="Search by role name or description..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              >
                <TextField.Slot>
                  <Search size={16} className="text-gray-400" />
                </TextField.Slot>
              </TextField.Root>
            </Box>
            
            <Box>
              <Select.Root 
                value={accessScopeFilter} 
                onValueChange={setAccessScopeFilter}
              >
                <Select.Trigger placeholder="Access Scope" />
                <Select.Content>
                  <Select.Item value="all">All Scopes</Select.Item>
                  <Select.Item value="HQ">HQ</Select.Item>
                  <Select.Item value="Region">Region</Select.Item>
                  <Select.Item value="Branch">Branch</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>
            
            <Button 
              onClick={handleResetFilters} 
              color={isFilterActive ? "red" : "gray"} 
              variant="soft" 
              disabled={!isFilterActive}
            >
              <RefreshCcw size={16} />
              Reset Filters
            </Button>

            <Button onClick={handleRefreshData} variant="ghost">
              <RefreshCcw size={16} />
            </Button>
          </Flex>
        </Flex>
        
        {/* Roles list table */}
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Role Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>System Role</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="center">Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          
          <Table.Body>
            {paginatedRoles.length > 0 ? (
              paginatedRoles.map(role => (
                <Table.Row key={role.id} className="cursor-pointer align-middle hover:bg-gray-50 dark:hover:bg-neutral-800" onClick={() => handleEditRole(role.id)}>
                  <Table.Cell>
                    <Text weight="medium" as="div">{role.name}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text color="gray" size="2">{role.description || 'No description'}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={role.is_system_role ? 'blue' : 'gray'}>
                      {role.is_system_role ? 'System' : 'Custom'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text color="gray" size="2">
                      {role.created_at ? new Date(role.created_at).toLocaleDateString() : 'Unknown'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell align="center">
                    <Flex gap="3" justify="center">
                      <IconButton 
                        variant="ghost" 
                        size="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRole(role.id);
                        }}
                      >
                        <Edit size={14} />
                      </IconButton>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={5}>
                  <Flex direction="column" align="center" justify="center" gap="2" style={{ padding: '2rem' }}>
                    <Text align="center" color="gray">
                      {searchTerm || accessScopeFilter !== 'all' 
                        ? 'No roles found matching your filters' 
                        : 'No roles created yet'
                      }
                    </Text>
                    {!searchTerm && accessScopeFilter === 'all' && (
                      <Button 
                        size="2" 
                        variant="soft" 
                        onClick={() => router.push('/admin-settings/roles-permissions/new')}
                      >
                        Create First Role
                      </Button>
                    )}
                  </Flex>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
        
        {/* Pagination */}
        {filteredRoles.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredRoles.length}
            startIndex={startIndex}
            endIndex={Math.min(endIndex, filteredRoles.length)}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newSize) => {
              setItemsPerPage(newSize);
              setCurrentPage(1);
            }}
          />
        )}
      </Flex>
    </Box>
  );
} 