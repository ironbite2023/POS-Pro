'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Flex, Heading, Text, Box, Tabs } from '@radix-ui/themes';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useOrganization } from '@/contexts/OrganizationContext';
import MenuSyncManager from '@/components/delivery/MenuSyncManager';
import MenuMappingTable from '@/components/delivery/MenuMappingTable';
import { deliveryPlatformService } from '@/lib/services/delivery-platform.service';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

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

export default function MenuSyncPage() {
  usePageTitle('Menu Sync - Delivery Integration');
  const { currentOrganization } = useOrganization();
  const [menuItems, setMenuItems] = useState<MenuItemWithMappings[]>([]);
  const [activePlatforms, setActivePlatforms] = useState<PlatformEnum[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivePlatforms = useCallback(async () => {
    if (!currentOrganization?.id) return;

    const result = await deliveryPlatformService.getActivePlatforms(currentOrganization.id);
    if (result.success && result.data) {
      setActivePlatforms(result.data.map(p => p.platform));
    }
  }, [currentOrganization?.id]);

  const loadMenuItems = useCallback(async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (error) throw error;
      
      setMenuItems((data || []) as MenuItemWithMappings[]);
    } catch (error) {
      console.error('Failed to load menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    loadActivePlatforms();
    loadMenuItems();
  }, [loadActivePlatforms, loadMenuItems]);

  const handleSyncItem = useCallback(async (itemId: string, platform: PlatformEnum) => {
    if (!currentOrganization?.id) return;

    try {
      const result = await deliveryPlatformService.syncMenuToPlatform(
        currentOrganization.id,
        platform
      );

      if (result.success) {
        toast.success(`Menu item synced to ${platform}`);
        loadMenuItems();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to sync item:', error);
      toast.error('Failed to sync menu item');
    }
  }, [currentOrganization?.id, loadMenuItems]);

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Box>
          <Heading size="7">Menu Synchronization</Heading>
          <Text size="2" color="gray">
            Manage your menu across all delivery platforms
          </Text>
        </Box>

        {/* Tabs */}
        <Tabs.Root defaultValue="sync">
          <Tabs.List>
            <Tabs.Trigger value="sync">Sync Manager</Tabs.Trigger>
            <Tabs.Trigger value="mappings">Menu Mappings</Tabs.Trigger>
          </Tabs.List>

          <Box pt="4">
            <Tabs.Content value="sync">
              <MenuSyncManager
                activePlatforms={activePlatforms}
                onSyncComplete={() => loadMenuItems()}
              />
            </Tabs.Content>

            <Tabs.Content value="mappings">
              {loading ? (
                <Box className="text-center py-12">
                  <Text>Loading menu items...</Text>
                </Box>
              ) : (
                <MenuMappingTable
                  menuItems={menuItems}
                  activePlatforms={activePlatforms}
                  onSync={handleSyncItem}
                />
              )}
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Flex>
    </Container>
  );
}
