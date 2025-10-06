'use client';

import { Badge, Flex, Text, Tooltip, Box } from '@radix-ui/themes';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import type { Database } from '@/lib/supabase/database.types';

type PlatformEnum = Database['public']['Enums']['platform_enum'];

interface PlatformStatusIndicatorProps {
  platform: PlatformEnum;
  isActive: boolean;
  lastSyncAt?: string | null;
  error?: string | null;
  size?: '1' | '2' | '3';
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

const PlatformStatusIndicator: React.FC<PlatformStatusIndicatorProps> = ({
  platform,
  isActive,
  lastSyncAt,
  error,
  size = '2',
}) => {
  const getStatusIcon = () => {
    if (error) {
      return <XCircle size={16} className="text-red-500" />;
    }
    if (!isActive) {
      return <AlertCircle size={16} className="text-gray-400" />;
    }
    if (lastSyncAt) {
      const syncTime = new Date(lastSyncAt).getTime();
      const now = Date.now();
      const minutesSinceSync = (now - syncTime) / (1000 * 60);
      
      if (minutesSinceSync > 30) {
        return <Clock size={16} className="text-yellow-500" />;
      }
      return <CheckCircle size={16} className="text-green-500" />;
    }
    return <AlertCircle size={16} className="text-gray-400" />;
  };

  const getStatusColor = (): 'green' | 'red' | 'yellow' | 'gray' => {
    if (error) return 'red';
    if (!isActive) return 'gray';
    if (lastSyncAt) {
      const syncTime = new Date(lastSyncAt).getTime();
      const now = Date.now();
      const minutesSinceSync = (now - syncTime) / (1000 * 60);
      
      if (minutesSinceSync > 30) return 'yellow';
      return 'green';
    }
    return 'gray';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (!isActive) return 'Inactive';
    if (lastSyncAt) {
      const syncTime = new Date(lastSyncAt).getTime();
      const now = Date.now();
      const minutesSinceSync = (now - syncTime) / (1000 * 60);
      
      if (minutesSinceSync > 30) return 'Out of sync';
      return 'Active';
    }
    return 'Not configured';
  };

  const getTooltipContent = () => {
    if (error) return `Error: ${error}`;
    if (!isActive) return 'Platform integration is disabled';
    if (lastSyncAt) {
      const syncDate = new Date(lastSyncAt);
      return `Last synced: ${syncDate.toLocaleString()}`;
    }
    return 'Platform not yet synchronized';
  };

  return (
    <Tooltip content={getTooltipContent()}>
      <Box>
        <Flex align="center" gap="2">
          <Badge 
            color={getStatusColor()} 
            size={size}
            style={{ 
              borderLeft: `3px solid ${PLATFORM_COLORS[platform]}`,
              paddingLeft: '8px'
            }}
          >
            <Flex align="center" gap="1">
              {getStatusIcon()}
              <Text size={size}>{PLATFORM_NAMES[platform]}</Text>
            </Flex>
          </Badge>
          <Text size="1" color="gray">{getStatusText()}</Text>
        </Flex>
      </Box>
    </Tooltip>
  );
};

export default PlatformStatusIndicator;
