'use client';

import { Card, Flex, Text, Badge, Button, Box, Separator } from '@radix-ui/themes';
import { Clock, User, MapPin, Phone, Package, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import PlatformStatusIndicator from './PlatformStatusIndicator';
import type { Database } from '@/lib/supabase/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type PlatformEnum = Database['public']['Enums']['platform_enum'];

interface DeliveryOrderCardProps {
  order: Order & {
    items?: Array<{
      id: string;
      menu_item_name: string;
      quantity: number;
      price: number;
      modifiers?: string[];
    }>;
  };
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
  onAcceptOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string, reason: string) => void;
  onViewDetails?: (orderId: string) => void;
  loading?: boolean;
}

const PLATFORM_NAMES: Record<PlatformEnum, string> = {
  uber_eats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  just_eat: 'Just Eat',
};

const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({
  order,
  onStatusUpdate,
  onAcceptOrder,
  onRejectOrder,
  onViewDetails,
  loading = false,
}) => {
  const getStatusColor = (status: string): 'yellow' | 'blue' | 'green' | 'gray' | 'red' => {
    switch (status) {
      case 'new':
      case 'pending': return 'yellow';
      case 'confirmed':
      case 'preparing': return 'blue';
      case 'ready': return 'green';
      case 'completed': return 'gray';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getNextAction = () => {
    switch (order.status) {
      case 'new':
        return { 
          label: 'Accept Order', 
          action: 'accept', 
          color: 'blue' as const,
          isAcceptance: true 
        };
      case 'confirmed':
        return { 
          label: 'Start Preparing', 
          action: 'preparing', 
          color: 'blue' as const,
          isAcceptance: false 
        };
      case 'preparing':
        return { 
          label: 'Mark Ready', 
          action: 'ready', 
          color: 'green' as const,
          isAcceptance: false 
        };
      case 'ready':
        return { 
          label: 'Complete', 
          action: 'completed', 
          color: 'gray' as const,
          isAcceptance: false 
        };
      default:
        return null;
    }
  };

  const platformCustomer = order.platform_customer_info as {
    name?: string;
    phone?: string;
    address?: string;
    deliveryInstructions?: string;
  } | null;

  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });
  const nextAction = getNextAction();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <Flex direction="column" gap="3">
        {/* Header */}
        <Flex justify="between" align="start">
          <Box>
            <Flex align="center" gap="2" className="mb-1">
              <Text size="5" weight="bold">#{order.order_number}</Text>
              <Badge color={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </Flex>
            {order.delivery_platform && (
              <Badge variant="soft" size="1">
                {PLATFORM_NAMES[order.delivery_platform]}
              </Badge>
            )}
          </Box>
          
          <Flex direction="column" align="end" gap="1">
            <Text size="5" weight="bold" className="text-green-600">
              ${order.total_amount.toFixed(2)}
            </Text>
            <Flex align="center" gap="1">
              <Clock size={12} />
              <Text size="1" color="gray">{timeAgo}</Text>
            </Flex>
          </Flex>
        </Flex>

        <Separator size="4" />

        {/* Customer Info */}
        {platformCustomer && (
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <User size={16} className="text-gray-500" />
              <Text size="2" weight="medium">
                {platformCustomer.name || order.customer_name || 'Guest'}
              </Text>
            </Flex>
            
            {platformCustomer.phone && (
              <Flex align="center" gap="2">
                <Phone size={16} className="text-gray-500" />
                <Text size="2">{platformCustomer.phone}</Text>
              </Flex>
            )}
            
            {platformCustomer.address && (
              <Flex align="center" gap="2">
                <MapPin size={16} className="text-gray-500" />
                <Text size="2" className="line-clamp-2">{platformCustomer.address}</Text>
              </Flex>
            )}

            {platformCustomer.deliveryInstructions && (
              <Box className="bg-blue-50 p-2 rounded-md">
                <Text size="1" weight="medium" className="text-blue-700">
                  Delivery Instructions:
                </Text>
                <Text size="2" className="mt-1">{platformCustomer.deliveryInstructions}</Text>
              </Box>
            )}
          </Flex>
        )}

        <Separator size="4" />

        {/* Order Items */}
        <Box>
          <Flex align="center" gap="1" className="mb-2">
            <Package size={16} className="text-gray-500" />
            <Text size="2" weight="medium">{order.items?.length || 0} items</Text>
          </Flex>
          
          <Flex direction="column" gap="1">
            {order.items?.slice(0, 3).map((item, index) => (
              <Flex key={`${item.id}-${index}`} justify="between" align="start">
                <Box className="flex-1">
                  <Text size="2">
                    {item.quantity}x {item.menu_item_name}
                  </Text>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <Text size="1" color="gray" className="block">
                      {item.modifiers.join(', ')}
                    </Text>
                  )}
                </Box>
                <Text size="2" weight="medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </Flex>
            ))}
            {order.items && order.items.length > 3 && (
              <Text size="1" color="gray">
                +{order.items.length - 3} more items
              </Text>
            )}
          </Flex>
        </Box>

        <Separator size="4" />

        {/* Actions */}
        <Flex gap="2" justify="between">
          <Button
            variant="outline"
            size="2"
            onClick={() => onViewDetails?.(order.id)}
            className="flex-1"
          >
            View Details
          </Button>
          
          {nextAction && (
            <Button
              color={nextAction.color}
              size="2"
              onClick={() => {
                if (nextAction.isAcceptance) {
                  onAcceptOrder?.(order.id);
                } else {
                  onStatusUpdate?.(order.id, nextAction.action);
                }
              }}
              disabled={loading}
              className="flex-1"
            >
              {nextAction.label}
            </Button>
          )}
          
          {/* Reject Button for New Orders */}
          {order.status === 'new' && onRejectOrder && (
            <Button
              color="red"
              variant="outline"
              size="2"
              onClick={() => onRejectOrder(order.id, 'TOO_BUSY')}
              disabled={loading}
            >
              Reject
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
};

export default DeliveryOrderCard;
