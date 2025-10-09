'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge, Box, Flex, Select, Table, Text, TextField } from '@radix-ui/themes';
import { Search, RefreshCcw, AlertCircle } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import Pagination from '@/components/common/Pagination';
import { Spinner } from '@radix-ui/themes';

type AuditLog = Database['public']['Tables']['audit_log']['Row'];

interface ActivityLogWithUser extends AuditLog {
  user_name?: string;
  user_email?: string;
}

export default function ActivityLog() {
  const { currentOrganization } = useOrganization();
  const [logs, setLogs] = useState<ActivityLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchActivityLogs = useCallback(async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('audit_log')
        .select(`
          *,
          user_profiles!audit_log_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      // Transform data to include user information
      const logsWithUserInfo: ActivityLogWithUser[] = (data || []).map(log => ({
        ...log,
        user_name: log.user_profiles 
          ? `${log.user_profiles.first_name} ${log.user_profiles.last_name}`.trim()
          : 'System',
        user_email: log.user_profiles?.email || '',
      }));

      setLogs(logsWithUserInfo);
    } catch (err: any) {
      console.error('Error fetching activity logs:', err);
      setError(err.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchActivityLogs();
  }, [currentOrganization, fetchActivityLogs]);

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Action filter
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;

      // Resource type filter
      const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter;

      return matchesSearch && matchesAction && matchesResource;
    });
  }, [logs, searchTerm, actionFilter, resourceFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Get unique actions and resource types for filters
  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).sort();
  const uniqueResourceTypes = Array.from(new Set(logs.map(log => log.resource_type).filter(Boolean))).sort();

  const handleRefresh = () => {
    fetchActivityLogs();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setResourceFilter('all');
    setCurrentPage(1);
  };

  const isFilterActive = searchTerm !== '' || actionFilter !== 'all' || resourceFilter !== 'all';

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return 'green';
      case 'UPDATE': return 'blue';
      case 'DELETE': return 'red';
      case 'LOGIN': return 'purple';
      case 'LOGOUT': return 'gray';
      default: return 'gray';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box>
        <Flex direction="column" align="center" justify="center" gap="4" style={{ minHeight: '200px' }}>
          <Spinner size="3" />
          <Text color="gray">Loading activity logs...</Text>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Flex direction="column" align="center" justify="center" gap="4" style={{ minHeight: '200px' }}>
          <AlertCircle size={48} color="red" />
          <Text color="red" size="4" weight="medium">Failed to load activity logs</Text>
          <Text color="gray" size="2">{error}</Text>
          <Box>
            <button onClick={handleRefresh} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              <RefreshCcw size={16} className="inline mr-2" />
              Retry
            </button>
          </Box>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      <Flex direction="column" gap="4">
        {/* Filters */}
        <Flex gap="4" align="center" justify="between" wrap="wrap">
          <Flex gap="4" align="center" style={{ flex: 1 }}>
            <Box style={{ flexGrow: 1 }}>
              <TextField.Root
                placeholder="Search by action, resource, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              >
                <TextField.Slot>
                  <Search size={16} className="text-gray-400" />
                </TextField.Slot>
              </TextField.Root>
            </Box>

            <Box>
              <Select.Root value={actionFilter} onValueChange={setActionFilter}>
                <Select.Trigger placeholder="Action" />
                <Select.Content>
                  <Select.Item value="all">All Actions</Select.Item>
                  {uniqueActions.map(action => (
                    <Select.Item key={action} value={action}>{action}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            <Box>
              <Select.Root value={resourceFilter} onValueChange={setResourceFilter}>
                <Select.Trigger placeholder="Resource" />
                <Select.Content>
                  <Select.Item value="all">All Resources</Select.Item>
                  {uniqueResourceTypes.map(resource => (
                    <Select.Item key={resource} value={resource}>{resource}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            <button
              onClick={handleResetFilters}
              disabled={!isFilterActive}
              className={`px-3 py-2 rounded text-sm font-medium ${
                isFilterActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <RefreshCcw size={16} className="inline mr-1" />
              Reset
            </button>

            <button
              onClick={handleRefresh}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
            >
              <RefreshCcw size={16} className="inline mr-1" />
              Refresh
            </button>
          </Flex>
        </Flex>

        {/* Activity Log Table */}
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Resource</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Details</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map(log => (
                <Table.Row key={log.id}>
                  <Table.Cell>
                    <Text size="2" color="gray">
                      {formatTimestamp(log.created_at)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">
                        {log.user_name || 'System'}
                      </Text>
                      {log.user_email && (
                        <Text size="1" color="gray">
                          {log.user_email}
                        </Text>
                      )}
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2" weight="medium">
                      {log.resource_type || 'Unknown'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2" color="gray">
                      {log.resource_id ? `ID: ${log.resource_id.substring(0, 8)}...` : 'No details'}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={5}>
                  <Flex direction="column" align="center" justify="center" gap="2" style={{ padding: '2rem' }}>
                    <Text align="center" color="gray">
                      {isFilterActive ? 'No activity logs match your filters' : 'No activity logs found'}
                    </Text>
                    {isFilterActive && (
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Clear filters
                      </button>
                    )}
                  </Flex>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredLogs.length}
            startIndex={startIndex}
            endIndex={Math.min(endIndex, filteredLogs.length)}
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