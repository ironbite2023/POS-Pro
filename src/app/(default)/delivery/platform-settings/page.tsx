'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Flex, Heading, Text, Box, Button, Card, Grid, Dialog } from '@radix-ui/themes';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useOrganization } from '@/contexts/OrganizationContext';
import PlatformSetupWizard from '@/components/delivery/PlatformSetupWizard';
import PlatformStatusIndicator from '@/components/delivery/PlatformStatusIndicator';
import { deliveryPlatformService } from '@/lib/services/delivery-platform.service';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type PlatformEnum = Database['public']['Enums']['platform_enum'];
type PlatformIntegration = Database['public']['Tables']['platform_integrations']['Row'];

const AVAILABLE_PLATFORMS: PlatformEnum[] = ['uber_eats', 'deliveroo', 'just_eat'];
const PLATFORM_NAMES: Record<PlatformEnum, string> = {
  uber_eats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  just_eat: 'Just Eat',
};

export default function PlatformSettingsPage() {
  usePageTitle('Platform Settings - Delivery Integration');
  const { currentOrganization } = useOrganization();
  const [platforms, setPlatforms] = useState<PlatformIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformEnum | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<PlatformIntegration | null>(null);

  const loadPlatforms = useCallback(async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const result = await deliveryPlatformService.getAllPlatforms(currentOrganization.id);
      if (result.success && result.data) {
        setPlatforms(result.data);
      }
    } catch (error) {
      console.error('Failed to load platforms:', error);
      toast.error('Failed to load platform integrations');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  const handleAddPlatform = (platform: PlatformEnum) => {
    setSelectedPlatform(platform);
    setEditingIntegration(null);
    setSetupDialogOpen(true);
  };

  const handleEditPlatform = (integration: PlatformIntegration) => {
    setSelectedPlatform(integration.platform);
    setEditingIntegration(integration);
    setSetupDialogOpen(true);
  };

  const handleToggleActive = useCallback(async (integrationId: string, isActive: boolean) => {
    try {
      const result = await deliveryPlatformService.togglePlatformActive(integrationId, !isActive);

      if (result.success) {
        toast.success(`Platform ${!isActive ? 'activated' : 'deactivated'}`);
        loadPlatforms();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to toggle platform:', error);
      toast.error('Failed to update platform status');
    }
  }, [loadPlatforms]);

  const handleDeletePlatform = useCallback(async (platformId: string, platformName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${platformName} integration?`)) {
      return;
    }

    try {
      const result = await deliveryPlatformService.deletePlatformIntegration(platformId);
      if (result.success) {
        toast.success('Platform integration deleted');
        loadPlatforms();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to delete platform:', error);
      toast.error('Failed to delete platform integration');
    }
  }, [loadPlatforms]);

  const getConfiguredPlatforms = () => {
    return platforms.map(p => p.platform);
  };

  const getAvailablePlatforms = () => {
    const configured = getConfiguredPlatforms();
    return AVAILABLE_PLATFORMS.filter(p => !configured.includes(p));
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Box>
            <Heading size="7">Platform Settings</Heading>
            <Text size="2" color="gray">
              Manage your delivery platform integrations
            </Text>
          </Box>
        </Flex>

        {/* Configured Platforms */}
        {loading ? (
          <Box className="text-center py-12">
            <Text>Loading platform integrations...</Text>
          </Box>
        ) : platforms.length === 0 ? (
          <Card>
            <Box className="text-center py-12">
              <Text size="3" color="gray" className="mb-4 block">
                No delivery platforms configured yet
              </Text>
              <Text size="2" color="gray">
                Add your first platform integration to start receiving orders
              </Text>
            </Box>
          </Card>
        ) : (
          <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
            {platforms.map(platform => (
              <Card key={platform.id}>
                <Flex direction="column" gap="3">
                  <Flex justify="between" align="start">
                    <PlatformStatusIndicator
                      platform={platform.platform}
                      isActive={platform.is_active}
                      lastSyncAt={platform.last_sync_at}
                      size="3"
                    />
                  </Flex>

                  <Text size="2" color="gray">
                    Restaurant ID: {platform.platform_restaurant_id}
                  </Text>

                  <Flex gap="2">
                    <Button
                      size="2"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEditPlatform(platform)}
                    >
                      <Settings size={14} />
                      Configure
                    </Button>
                    
                    <Button
                      size="2"
                      color={platform.is_active ? 'red' : 'green'}
                      variant="soft"
                      onClick={() => handleToggleActive(platform.id, platform.is_active)}
                    >
                      {platform.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    
                    <Button
                      size="2"
                      color="red"
                      variant="outline"
                      onClick={() => handleDeletePlatform(platform.id, PLATFORM_NAMES[platform.platform])}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Grid>
        )}

        {/* Available Platforms to Add */}
        {getAvailablePlatforms().length > 0 && (
          <>
            <Box>
              <Heading size="5">Add New Platform</Heading>
              <Text size="2" color="gray">
                Connect additional delivery platforms
              </Text>
            </Box>

            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
              {getAvailablePlatforms().map(platform => (
                <Card key={platform} variant="surface">
                  <Flex direction="column" gap="3">
                    <Text size="3" weight="medium">
                      {PLATFORM_NAMES[platform]}
                    </Text>
                    <Button
                      size="2"
                      onClick={() => handleAddPlatform(platform)}
                    >
                      <Plus size={14} />
                      Add Integration
                    </Button>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </>
        )}

        {/* Setup Wizard Dialog */}
        <Dialog.Root open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
          <Dialog.Content style={{ maxWidth: 800 }}>
            {selectedPlatform && (
              <PlatformSetupWizard
                platform={selectedPlatform}
                existingIntegration={
                  editingIntegration
                    ? {
                        id: editingIntegration.id,
                        platform_restaurant_id: editingIntegration.platform_restaurant_id,
                        credentials: editingIntegration.credentials as Record<string, unknown>,
                        settings: editingIntegration.settings as Record<string, unknown>,
                      }
                    : undefined
                }
                onComplete={() => {
                  setSetupDialogOpen(false);
                  loadPlatforms();
                }}
                onCancel={() => setSetupDialogOpen(false)}
              />
            )}
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    </Container>
  );
}
