'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Flex, Heading, Text, Box, Select } from '@radix-ui/themes';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFilterBranch } from '@/contexts/FilterBranchContext';
import DeliveryAnalytics from '@/components/delivery/DeliveryAnalytics';
import { deliveryPlatformService } from '@/lib/services/delivery-platform.service';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type PlatformEnum = Database['public']['Enums']['platform_enum'];

interface PlatformAnalytics {
  platform: PlatformEnum;
  orderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  averagePreparationTime: number;
  rating?: number;
  growthRate: number;
}

export default function AnalyticsPage() {
  usePageTitle('Delivery Analytics');
  const { currentOrganization } = useOrganization();
  const { activeBranchFilter } = useFilterBranch();
  const [analytics, setAnalytics] = useState<PlatformAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
    }

    return { start, end };
  };

  const loadAnalytics = useCallback(async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const result = await deliveryPlatformService.getDeliveryAnalytics(
        currentOrganization.id,
        activeBranchFilter?.id
      );

      if (result.success && result.data) {
        // Transform the data into the expected format
        const platformAnalytics = Object.entries((result.data as any).byPlatform || {}).map(
          ([platform, data]: [string, any]) => ({
            platform: platform as PlatformEnum,
            orderCount: data.orderCount || 0,
            totalRevenue: data.totalRevenue || 0,
            averageOrderValue: data.averageOrderValue || 0,
            averagePreparationTime: data.averagePreparationTime || 0,
            rating: data.rating,
            growthRate: data.growthRate || 0,
          })
        );

        setAnalytics(platformAnalytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load delivery analytics');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, activeBranchFilter?.id]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const totalOrders = analytics.reduce((sum, p) => sum + p.orderCount, 0);
  const totalRevenue = analytics.reduce((sum, p) => sum + p.totalRevenue, 0);

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Box>
            <Heading size="7">Delivery Analytics</Heading>
            <Text size="2" color="gray">
              Performance insights across all delivery platforms
            </Text>
          </Box>

          <Select.Root
            value={dateRange}
            onValueChange={(value: string) => setDateRange(value as '7d' | '30d' | '90d')}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="7d">Last 7 Days</Select.Item>
              <Select.Item value="30d">Last 30 Days</Select.Item>
              <Select.Item value="90d">Last 90 Days</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>

        {/* Analytics Dashboard */}
        <DeliveryAnalytics
          analytics={analytics}
          totalOrders={totalOrders}
          totalRevenue={totalRevenue}
          dateRange={getDateRange()}
          loading={loading}
        />
      </Flex>
    </Container>
  );
}
