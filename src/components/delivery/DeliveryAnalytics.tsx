'use client';

import { Card, Flex, Text, Box, Grid, Badge } from '@radix-ui/themes';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Clock, Star } from 'lucide-react';
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

interface DeliveryAnalyticsProps {
  analytics: PlatformAnalytics[];
  totalOrders: number;
  totalRevenue: number;
  dateRange: { start: Date; end: Date };
  loading?: boolean;
}

const PLATFORM_NAMES: Record<PlatformEnum, string> = {
  uber_eats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  just_eat: 'Just Eat',
};

const PLATFORM_COLORS: Record<PlatformEnum, string> = {
  uber_eats: '#06C167',
  deliveroo: '#00CCBC',
  just_eat: '#FF8000',
};

const DeliveryAnalytics: React.FC<DeliveryAnalyticsProps> = ({
  analytics,
  totalOrders,
  totalRevenue,
  dateRange,
  loading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <Card>
        <Box className="text-center py-12">
          <Text>Loading analytics...</Text>
        </Box>
      </Card>
    );
  }

  return (
    <Flex direction="column" gap="4">
      {/* Summary Cards */}
      <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
        <Card>
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <Box className="p-2 bg-blue-100 rounded-md">
                <ShoppingBag size={20} className="text-blue-600" />
              </Box>
              <Text size="2" color="gray">Total Orders</Text>
            </Flex>
            <Text size="6" weight="bold">{totalOrders}</Text>
            <Text size="1" color="gray">
              {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
            </Text>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <Box className="p-2 bg-green-100 rounded-md">
                <DollarSign size={20} className="text-green-600" />
              </Box>
              <Text size="2" color="gray">Total Revenue</Text>
            </Flex>
            <Text size="6" weight="bold">{formatCurrency(totalRevenue)}</Text>
            <Text size="1" color="gray">
              Avg: {formatCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0)}/order
            </Text>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <Box className="p-2 bg-purple-100 rounded-md">
                <Clock size={20} className="text-purple-600" />
              </Box>
              <Text size="2" color="gray">Avg Prep Time</Text>
            </Flex>
            <Text size="6" weight="bold">
              {formatDuration(
                analytics.reduce((sum, p) => sum + p.averagePreparationTime, 0) / analytics.length || 0
              )}
            </Text>
            <Text size="1" color="gray">
              Across all platforms
            </Text>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <Box className="p-2 bg-yellow-100 rounded-md">
                <Star size={20} className="text-yellow-600" />
              </Box>
              <Text size="2" color="gray">Avg Rating</Text>
            </Flex>
            <Text size="6" weight="bold">
              {(
                analytics.reduce((sum, p) => sum + (p.rating || 0), 0) / 
                analytics.filter(p => p.rating).length || 0
              ).toFixed(1)}
            </Text>
            <Text size="1" color="gray">
              Based on customer feedback
            </Text>
          </Flex>
        </Card>
      </Grid>

      {/* Platform Breakdown */}
      <Card>
        <Flex direction="column" gap="4">
          <Text size="4" weight="bold">Platform Breakdown</Text>
          
          <Grid columns={{ initial: '1', md: '3' }} gap="4">
            {analytics.length === 0 ? (
              <Box className="col-span-full text-center py-8">
                <Text size="2" color="gray">
                  No platform analytics available
                </Text>
              </Box>
            ) : (
              analytics.map(platform => (
                <Card key={platform.platform} variant="surface">
                  <Flex direction="column" gap="3">
                    {/* Platform Header */}
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="2">
                        <Box
                          style={{
                            width: '4px',
                            height: '40px',
                            backgroundColor: PLATFORM_COLORS[platform.platform],
                            borderRadius: '2px',
                          }}
                        />
                        <Box>
                          <Text size="3" weight="bold">
                            {PLATFORM_NAMES[platform.platform]}
                          </Text>
                          <Flex align="center" gap="1" className="mt-1">
                            {platform.growthRate >= 0 ? (
                              <TrendingUp size={14} className="text-green-500" />
                            ) : (
                              <TrendingDown size={14} className="text-red-500" />
                            )}
                            <Text 
                              size="1" 
                              color={platform.growthRate >= 0 ? 'green' : 'red'}
                            >
                              {platform.growthRate >= 0 ? '+' : ''}{platform.growthRate.toFixed(1)}%
                            </Text>
                          </Flex>
                        </Box>
                      </Flex>
                    </Flex>

                    {/* Metrics */}
                    <Flex direction="column" gap="2">
                      <Flex justify="between">
                        <Text size="2" color="gray">Orders</Text>
                        <Text size="2" weight="medium">{platform.orderCount}</Text>
                      </Flex>
                      
                      <Flex justify="between">
                        <Text size="2" color="gray">Revenue</Text>
                        <Text size="2" weight="medium">
                          {formatCurrency(platform.totalRevenue)}
                        </Text>
                      </Flex>
                      
                      <Flex justify="between">
                        <Text size="2" color="gray">Avg Order</Text>
                        <Text size="2" weight="medium">
                          {formatCurrency(platform.averageOrderValue)}
                        </Text>
                      </Flex>
                      
                      <Flex justify="between">
                        <Text size="2" color="gray">Prep Time</Text>
                        <Text size="2" weight="medium">
                          {formatDuration(platform.averagePreparationTime)}
                        </Text>
                      </Flex>
                      
                      {platform.rating && (
                        <Flex justify="between">
                          <Text size="2" color="gray">Rating</Text>
                          <Flex align="center" gap="1">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <Text size="2" weight="medium">
                              {platform.rating.toFixed(1)}
                            </Text>
                          </Flex>
                        </Flex>
                      )}
                    </Flex>

                    {/* Revenue Share */}
                    <Box>
                      <Flex justify="between" className="mb-1">
                        <Text size="1" color="gray">Revenue Share</Text>
                        <Text size="1" weight="medium">
                          {((platform.totalRevenue / totalRevenue) * 100).toFixed(1)}%
                        </Text>
                      </Flex>
                      <Box
                        style={{
                          width: '100%',
                          height: '4px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          style={{
                            width: `${(platform.totalRevenue / totalRevenue) * 100}%`,
                            height: '100%',
                            backgroundColor: PLATFORM_COLORS[platform.platform],
                          }}
                        />
                      </Box>
                    </Box>
                  </Flex>
                </Card>
              ))
            )}
          </Grid>
        </Flex>
      </Card>
    </Flex>
  );
};

export default DeliveryAnalytics;
