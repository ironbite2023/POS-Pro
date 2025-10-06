'use client';

import { Flex, Text, Box } from '@radix-ui/themes';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface TimelineStep {
  status: string;
  label: string;
  timestamp?: string;
  completed: boolean;
  active: boolean;
}

interface OrderStatusTimelineProps {
  currentStatus: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
  }>;
  compact?: boolean;
}

const STATUS_ORDER = [
  { status: 'new', label: 'Order Received' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready for Pickup' },
  { status: 'completed', label: 'Completed' },
];

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  currentStatus,
  statusHistory = [],
  compact = false,
}) => {
  const getCurrentStatusIndex = () => {
    return STATUS_ORDER.findIndex(step => step.status === currentStatus);
  };

  const getTimestampForStatus = (status: string): string | undefined => {
    const historyItem = statusHistory.find(h => h.status === status);
    return historyItem?.timestamp;
  };

  const currentIndex = getCurrentStatusIndex();

  const steps: TimelineStep[] = STATUS_ORDER.map((step, index) => ({
    status: step.status,
    label: step.label,
    timestamp: getTimestampForStatus(step.status),
    completed: index < currentIndex,
    active: index === currentIndex,
  }));

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (compact) {
    return (
      <Flex gap="2" align="center" wrap="wrap">
        {steps.map((step, index) => (
          <Flex key={step.status} align="center" gap="1">
            {step.completed ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : step.active ? (
              <Clock size={16} className="text-blue-500 animate-pulse" />
            ) : (
              <Circle size={16} className="text-gray-300" />
            )}
            <Text
              size="1"
              weight={step.active ? 'medium' : 'regular'}
              color={step.completed || step.active ? undefined : 'gray'}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <Text size="1" color="gray">→</Text>
            )}
          </Flex>
        ))}
      </Flex>
    );
  }

  return (
    <Box>
      <Flex direction="column" gap="4">
        {steps.map((step, index) => (
          <Flex key={step.status} gap="3" align="start">
            {/* Icon and Line */}
            <Flex direction="column" align="center" style={{ minWidth: '24px' }}>
              {step.completed ? (
                <CheckCircle size={24} className="text-green-500" />
              ) : step.active ? (
                <Clock size={24} className="text-blue-500 animate-pulse" />
              ) : (
                <Circle size={24} className="text-gray-300" />
              )}
              
              {index < steps.length - 1 && (
                <Box
                  style={{
                    width: '2px',
                    height: '40px',
                    marginTop: '4px',
                    backgroundColor: step.completed || step.active
                      ? 'var(--blue-9)'
                      : 'var(--gray-4)',
                  }}
                />
              )}
            </Flex>

            {/* Content */}
            <Flex direction="column" gap="1" className="flex-1">
              <Text
                size="3"
                weight={step.active ? 'bold' : 'medium'}
                color={step.completed || step.active ? undefined : 'gray'}
              >
                {step.label}
              </Text>
              
              {step.timestamp && (
                <Text size="2" color="gray">
                  {formatTimestamp(step.timestamp)}
                </Text>
              )}
              
              {step.active && !step.timestamp && (
                <Text size="2" color="blue">
                  In progress...
                </Text>
              )}
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default OrderStatusTimeline;
