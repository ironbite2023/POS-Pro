'use client';

import React, { useState, useMemo } from 'react';
import { Badge, Box, Button, Flex, Select, Table, Text, TextField, IconButton } from '@radix-ui/themes';
import { Edit, Search, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/common/Pagination';
import { formatDistanceToNow } from 'date-fns';
import { SortableHeader } from '@/components/common/SortableHeader';
import { useAdminData } from '@/hooks/useAdminData';

export default function UserList() {
  const { staff, branches, roles, loading } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const router = useRouter();

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Check if any filter is active
  const isFilterActive = searchTerm !== '' || 
    roleFilter !== 'all' || 
    branchFilter !== 'all' || 
    statusFilter !== 'all' ||
    sortConfig !== null;

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setBranchFilter('all');
    setStatusFilter('all');
    setSortConfig(null);
    setCurrentPage(1);
  };

  // Format last active time
  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return 'Never';
    try {
      return formatDistanceToNow(new Date(lastActive), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Filter users based on search term and filters
  const filteredUsers = useMemo(() => {
    return staff
      .filter(user => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        
        // Search term filter (name or email)
        const matchesSearch = 
          fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Role filter
        const matchesRole = roleFilter === 'all' || user.role_id === roleFilter;
        
        // Branch filter
        const matchesBranch = branchFilter === 'all' || 
          (user.branch_access && user.branch_access.includes(branchFilter));
        
        // Status filter
        const matchesStatus = 
          statusFilter === 'all' || 
          (statusFilter === 'active' && user.status === 'active') ||
          (statusFilter === 'inactive' && user.status === 'inactive');
        
        return matchesSearch && matchesRole && matchesBranch && matchesStatus;
      })
      .sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue: string | number;
        let bValue: string | number;

        switch (sortConfig.key) {
          case 'name':
            aValue = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
            bValue = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
            break;
          case 'email':
            aValue = a.email.toLowerCase();
            bValue = b.email.toLowerCase();
            break;
          case 'role':
            aValue = a.role_id || '';
            bValue = b.role_id || '';
            break;
          case 'status':
            aValue = (a.status || '').toLowerCase();
            bValue = (b.status || '').toLowerCase();
            break;
          case 'lastActive':
            aValue = a.last_login ? new Date(a.last_login).getTime() : 0;
            bValue = b.last_login ? new Date(b.last_login).getTime() : 0;
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
  }, [staff, searchTerm, roleFilter, branchFilter, statusFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Handle edit user button click
  const handleEditUser = (userId: string) => {
    router.push(`/admin-settings/users/${userId}`);
  };

  // Get branch names for a user
  const getBranchNames = (branchIds: string[] | null) => {
    if (!branchIds || !branchIds.length) return 'None';
    
    const branchNames = branchIds.map(id => {
      const branch = branches.find(b => b.id === id);
      return branch ? branch.name : 'Unknown';
    });
    
    if (branchNames.length > 2) {
      return `${branchNames[0]}, ${branchNames[1]} +${branchNames.length - 2}`;
    }
    
    return branchNames.join(', ');
  };

  // Get role name by role ID
  const getRoleName = (roleId: string | null) => {
    if (!roleId) return 'No Role';
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown';
  };

  return (
    <Box>
      <Flex direction="column" gap="4">
        {/* Search and filters */}
        <Flex 
          direction={{ initial: "column", sm: "row" }}
          gap={{ initial: "3", sm: "4" }}
          align={{ initial: "stretch", sm: "center" }}
        >
          <Box className="w-full sm:w-auto sm:flex-grow">
            <TextField.Root placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            >
              <TextField.Slot>
                <Search size={16} className="text-gray-400" />
              </TextField.Slot>
            </TextField.Root>
          </Box>
          
          <Flex 
            direction={{ initial: "row", sm: "row" }}
            gap={{ initial: "2", sm: "4" }}
            align="center"
            wrap="wrap"
          >
            <Box>
              <Select.Root 
                value={roleFilter} 
                onValueChange={setRoleFilter}
              >
                <Select.Trigger placeholder="Role" />
                <Select.Content>
                  <Select.Item value="all">All Roles</Select.Item>
                  {roles.map(role => (
                    <Select.Item key={role.id} value={role.id}>{role.name}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
            
            <Box>
              <Select.Root 
                value={branchFilter} 
                onValueChange={setBranchFilter}
              >
                <Select.Trigger placeholder="Branch" />
                <Select.Content>
                  <Select.Item value="all">All Branches</Select.Item>
                  {branches.map(branch => (
                    <Select.Item key={branch.id} value={branch.id}>{branch.name}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
            
            <Box>
              <Select.Root 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <Select.Trigger placeholder="Status" />
                <Select.Content>
                  <Select.Item value="all">All Status</Select.Item>
                  <Select.Item value="active">Active</Select.Item>
                  <Select.Item value="inactive">Inactive</Select.Item>
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
          </Flex>
        </Flex>
        
        {/* Users list table */}
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
                  label="Email"
                  sortKey="email"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>
                <SortableHeader
                  label="Role"
                  sortKey="role"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Assigned Branch(es)</Table.ColumnHeaderCell>
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
                  label="Last Active"
                  sortKey="lastActive"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={7}>
                  <Text align="center" color="gray">Loading users...</Text>
                </Table.Cell>
              </Table.Row>
            ) : paginatedUsers.length > 0 ? (
              paginatedUsers.map(user => (
                <Table.Row key={user.id} className="cursor-pointer align-middle hover:bg-gray-50 dark:hover:bg-neutral-800" onClick={() => handleEditUser(user.id)}>
                  <Table.Cell>
                    <Text weight="medium" as="div">{user.first_name} {user.last_name}</Text>
                  </Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                  <Table.Cell>{getRoleName(user.role_id)}</Table.Cell>
                  <Table.Cell>{getBranchNames(user.branch_access)}</Table.Cell>
                  <Table.Cell>
                    <Badge color={user.status === 'active' ? 'green' : 'red'} size="1" className="capitalize">{user.status || 'inactive'}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2" color="gray">{formatLastActive(user.last_login)}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="3" justify="center">
                      <IconButton 
                        variant="ghost" 
                        size="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditUser(user.id);
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
                <Table.Cell colSpan={7}>
                  <Text align="center" color="gray">No users found matching your filters</Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
        
        {/* Pagination */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredUsers.length}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
        />
      </Flex>
    </Box>
  );
} 