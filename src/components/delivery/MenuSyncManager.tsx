'use client';

import { useState, useCallback } from 'react';
import { Card, Flex, Text, Button, Box, Badge, Separator, Select } from '@radix-ui/themes';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { deliveryPlatformService } from '@/lib/services/delivery-platform.service';
import type { Database } from '@/lib/supabase/database.types';

type PlatformEnum = Database['public']['Enums']['platform_enum'];

interface SyncStatus {
  platform: PlatformEnum;
  status: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
  lastSyncAt?: string;
  itemsSynced?: number;
  totalItems?: number;
}

const PLATFORM_NAMES: Record<PlatformEnum, string> = {
  uber_eats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  just_eat: 'Just Eat',
};

interface MenuSyncManagerProps {
  activePlatforms: PlatformEnum[];
  onSyncComplete?: () => void;
}

const MenuSyncManager: React.FC<MenuSyncManagerProps> = ({
  activePlatforms,
  onSyncComplete,
}) => {
  const { currentOrganization } = useOrganization();
  const [syncStatuses, setSyncStatuses] = useState<Record<PlatformEnum, SyncStatus>>(
    activePlatforms.reduce((acc, platform) => ({
      ...acc,
      [platform]: {
        platform,
        status: 'idle',
      },
    }), {} as Record<PlatformEnum, SyncStatus>)
  );
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformEnum | 'all'>('all');
  const [syncing, setSyncing] = useState(false);

  const updateSyncStatus = useCallback((platform: PlatformEnum, updates: Partial<SyncStatus>) => {
    setSyncStatuses(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        ...updates,
      },
    }));
  }, []);

  const syncToPlatform = useCallback(async (platform: PlatformEnum) => {
    if (!currentOrganization?.id) return;

    updateSyncStatus(platform, { status: 'syncing', message: 'Starting sync...' });

    try {
      const result = await deliveryPlatformService.syncMenuToPlatform(
        currentOrganization.id,
        platform
      );

      if (result.success && result.data) {
        updateSyncStatus(platform, {
          status: 'success',
          message: result.data.message,
          itemsSynced: (result.data as any).itemsSynced || 0,
          totalItems: (result.data as any).totalItems || 0,
          lastSyncAt: new Date().toISOString(),
        });
        toast.success(`Menu synced to ${PLATFORM_NAMES[platform]}`);
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      updateSyncStatus(platform, {
        status: 'error',
        message: errorMessage,
      });
      toast.error(`Failed to sync to ${PLATFORM_NAMES[platform]}: ${errorMessage}`);
    }
  }, [currentOrganization?.id, updateSyncStatus]);

  const handleSync = useCallback(async () => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected');
      return;
    }

    setSyncing(true);

    try {
      if (selectedPlatform === 'all') {
        // Sync to all platforms
        await Promise.all(
          activePlatforms.map(platform => syncToPlatform(platform))
        );
      } else {
        // Sync to specific platform
        await syncToPlatform(selectedPlatform);
      }

      onSyncComplete?.();
    } finally {
      setSyncing(false);
    }
  }, [currentOrganization?.id, selectedPlatform, activePlatforms, syncToPlatform, onSyncComplete]);

  const getStatusColor = (status: SyncStatus['status']): 'gray' | 'blue' | 'green' | 'red' => {
    switch (status) {
      case 'idle': return 'gray';
      case 'syncing': return 'blue';
      case 'success': return 'green';
      case 'error': return 'red';
    }
  };

  const getStatusIcon = (status: SyncStatus['status']) => {
    switch (status) {
      case 'syncing':
        return <RefreshCw size={16} className="animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* Header */}
        <Box>
          <Text size="4" weight="bold">Menu Synchronization</Text>
          <Text size="2" color="gray">
            Sync your menu items to delivery platforms
          </Text>
        </Box>

        <Separator size="4" />

        {/* Controls */}
        <Flex gap="3" align="end">
          <Box className="flex-1">
            <Text size="2" weight="medium" className="mb-2 block">
              Select Platform
            </Text>
            <Select.Root
              value={selectedPlatform}
              onValueChange={(value: string) => setSelectedPlatform(value as PlatformEnum | 'all')}
              disabled={syncing}
            >
              <Select.Trigger className="w-full" />
              <Select.Content>
                <Select.Item value="all">All Platforms</Select.Item>
                {activePlatforms.map(platform => (
                  <Select.Item key={platform} value={platform}>
                    {PLATFORM_NAMES[platform]}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          <Button
            size="3"
            onClick={handleSync}
            disabled={syncing || activePlatforms.length === 0}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </Flex>

        <Separator size="4" />

        {/* Platform Status Cards */}
        <Flex direction="column" gap="3">
          {activePlatforms.length === 0 ? (
            <Box className="text-center py-8">
              <Text size="2" color="gray">
                No active platforms. Configure platforms in settings to enable menu sync.
              </Text>
            </Box>
          ) : (
            activePlatforms.map(platform => {
              const status = syncStatuses[platform];
              
              return (
                <Card key={platform} variant="surface">
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="2">
                        <Text size="3" weight="medium">
                          {PLATFORM_NAMES[platform]}
                        </Text>
                        <Badge color={getStatusColor(status.status)}>
                          {status.status}
                        </Badge>
                      </Flex>
                      
                      {getStatusIcon(status.status)}
                    </Flex>

                    {status.message && (
                      <Text size="2" color={status.status === 'error' ? 'red' : 'gray'}>
                        {status.message}
                      </Text>
                    )}

                    {status.status === 'success' && status.itemsSynced !== undefined && (
                      <Flex gap="4">
                        <Text size="2" color="gray">
                          Items Synced: {status.itemsSynced}/{status.totalItems || 0}
                        </Text>
                        {status.lastSyncAt && (
                          <Text size="2" color="gray">
                            Last Sync: {new Date(status.lastSyncAt).toLocaleTimeString()}
                          </Text>
                        )}
                      </Flex>
                    )}
                  </Flex>
                </Card>
              );
            })
          )}
        </Flex>

        {/* Info Box */}
        <Box className="bg-blue-50 p-3 rounded-md">
          <Text size="2" className="text-blue-900">
            <strong>Note:</strong> Menu sync will update all active menu items on the selected platforms.
            Items marked as unavailable will be disabled on the platforms.
          </Text>
        </Box>
      </Flex>
    </Card>
  );
};

export default MenuSyncManager;
