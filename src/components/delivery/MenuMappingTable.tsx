'use client';

import { Table, Badge, Flex, Text, Box, Button, TextField } from '@radix-ui/themes';
import { CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';
import { useState } from 'react';
import type { Database } from '@/lib/supabase/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type PlatformEnum = Database['public']['Enums']['platform_enum'];

interface MenuItemWithMappings {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  organization_id: string;
  category_id: string;
  image_url: string | null;
  platform_mappings?: {
    uber_eats?: { id: string; synced: boolean };
    deliveroo?: { id: string; synced: boolean };
    just_eat?: { id: string; synced: boolean };
  };
}

interface MenuMappingTableProps {
  menuItems: MenuItemWithMappings[];
  activePlatforms: PlatformEnum[];
  onSync?: (itemId: string, platform: PlatformEnum) => void;
  loading?: boolean;
}

const PLATFORM_NAMES: Record<PlatformEnum, string> = {
  uber_eats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  just_eat: 'Just Eat',
};

const MenuMappingTable: React.FC<MenuMappingTableProps> = ({
  menuItems,
  activePlatforms,
  onSync,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlatformStatus = (
    item: MenuItemWithMappings,
    platform: PlatformEnum
  ): 'synced' | 'not_synced' | 'error' => {
    const mapping = item.platform_mappings?.[platform];
    if (!mapping) return 'not_synced';
    return mapping.synced ? 'synced' : 'error';
  };

  const renderPlatformStatus = (item: MenuItemWithMappings, platform: PlatformEnum) => {
    const status = getPlatformStatus(item, platform);
    
    switch (status) {
      case 'synced':
        return (
          <Flex align="center" gap="1">
            <CheckCircle size={16} className="text-green-500" />
            <Text size="1" color="green">Synced</Text>
          </Flex>
        );
      case 'error':
        return (
          <Flex align="center" gap="1">
            <AlertCircle size={16} className="text-yellow-500" />
            <Text size="1" color="yellow">Needs Sync</Text>
          </Flex>
        );
      default:
        return (
          <Flex align="center" gap="1">
            <XCircle size={16} className="text-gray-400" />
            <Text size="1" color="gray">Not Synced</Text>
          </Flex>
        );
    }
  };

  return (
    <Box>
      <Flex direction="column" gap="4">
        {/* Search */}
        <Box className="max-w-md">
          <TextField.Root
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        {/* Table */}
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Menu Item</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Price</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              {activePlatforms.map(platform => (
                <Table.ColumnHeaderCell key={platform}>
                  {PLATFORM_NAMES[platform]}
                </Table.ColumnHeaderCell>
              ))}
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          
          <Table.Body>
            {filteredItems.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={4 + activePlatforms.length}>
                  <Text size="2" color="gray" className="text-center py-4 block">
                    {searchQuery ? 'No menu items found matching your search' : 'No menu items available'}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredItems.map(item => (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">{item.name}</Text>
                      {item.description && (
                        <Text size="1" color="gray" className="line-clamp-1">
                          {item.description}
                        </Text>
                      )}
                    </Flex>
                  </Table.Cell>
                  
                  <Table.Cell>
                    <Text size="2">${item.base_price.toFixed(2)}</Text>
                  </Table.Cell>
                  
                  <Table.Cell>
                    <Badge color={item.is_active ? 'green' : 'gray'}>
                      {item.is_active ? 'Available' : 'Unavailable'}
                    </Badge>
                  </Table.Cell>
                  
                  {activePlatforms.map(platform => (
                    <Table.Cell key={platform}>
                      {renderPlatformStatus(item, platform)}
                    </Table.Cell>
                  ))}
                  
                  <Table.Cell>
                    <Flex gap="1">
                      {activePlatforms.map(platform => {
                        const status = getPlatformStatus(item, platform);
                        if (status !== 'synced') {
                          return (
                            <Button
                              key={platform}
                              size="1"
                              variant="soft"
                              onClick={() => onSync?.(item.id, platform)}
                              disabled={loading}
                            >
                              Sync {PLATFORM_NAMES[platform].split(' ')[0]}
                            </Button>
                          );
                        }
                        return null;
                      })}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>

        {/* Summary */}
        <Flex justify="between" align="center" className="text-sm text-gray-500">
          <Text size="2" color="gray">
            Showing {filteredItems.length} of {menuItems.length} items
          </Text>
          
          <Flex gap="4">
            {activePlatforms.map(platform => {
              const syncedCount = menuItems.filter(
                item => getPlatformStatus(item, platform) === 'synced'
              ).length;
              return (
                <Flex key={platform} align="center" gap="1">
                  <Text size="2" color="gray">{PLATFORM_NAMES[platform]}:</Text>
                  <Text size="2" weight="medium">
                    {syncedCount}/{menuItems.length} synced
                  </Text>
                </Flex>
              );
            })}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};

export default MenuMappingTable;
