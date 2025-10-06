'use client';

import { Card, Flex, Text, Box, Skeleton } from '@radix-ui/themes';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  loading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  loading = false,
  trend = 'neutral',
  trendValue,
  description
}) => {
  if (loading) {
    return (
      <Card>
        <Flex direction="column" gap="2">
          <Skeleton height="20px" />
          <Skeleton height="32px" />
          <Skeleton height="16px" />
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Text size="2" color="gray">{title}</Text>
          <Box className="text-gray-500">{icon}</Box>
        </Flex>
        
        <Text size="7" weight="bold">{value}</Text>
        
        {trendValue && (
          <Text 
            size="1" 
            color={trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'gray'}
          >
            {trendValue}
          </Text>
        )}
        
        {description && (
          <Text size="1" color="gray">
            {description}
          </Text>
        )}
      </Flex>
    </Card>
  );
};

export default StatsCard;
