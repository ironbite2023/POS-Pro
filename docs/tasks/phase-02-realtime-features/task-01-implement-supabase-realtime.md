# Task 2.1: Implement Supabase Realtime

**Task ID**: TASK-02-001  
**Phase**: 2 - Real-Time Features  
**Priority**: 🔴 P1 - High  
**Estimated Time**: 1-2 weeks  
**Complexity**: 🔴 High  
**Status**: 📋 Not Started

---

## 1. Detailed Request Analysis

### What is Being Requested

Implement comprehensive real-time functionality using Supabase Realtime across all system components:
- Live order updates between POS, kitchen, and management
- Real-time inventory tracking and stock alerts
- Live sales metrics and dashboard updates
- Real-time notifications for critical events
- Multi-user collaboration with live data synchronization

### Current State
- Basic real-time subscriptions implemented only in some components
- Manual refresh required for most data updates
- No live notifications or alerts
- Limited multi-user real-time collaboration
- Static dashboard metrics

### Target State
- Comprehensive real-time data synchronization
- Live notifications for all critical events
- Real-time collaboration across multiple users
- Instant updates for orders, inventory, and sales
- Live dashboard metrics with auto-refresh
- Push notifications for mobile devices

### Affected Files
```
All previously integrated components plus:

src/hooks/
├── useRealtimeInventory.ts
├── useRealtimeNotifications.ts
├── useRealtimeDashboard.ts
├── useRealtimeLoyalty.ts
└── useRealtimePurchasing.ts

src/components/common/
├── NotificationCenter.tsx
├── LiveIndicator.tsx
├── ConnectionStatus.tsx
└── RealtimeProvider.tsx

src/lib/services/
├── notification.service.ts
└── realtime.service.ts

src/contexts/
└── NotificationContext.tsx
```

---

## 2. Justification and Benefits

### Why This Task is Critical

**Business Value**:
- ✅ Real-time operational visibility across all locations
- ✅ Instant response to critical events (stockouts, large orders)
- ✅ Enhanced customer service through live order tracking
- ✅ Improved staff coordination and communication
- ✅ Competitive advantage through modern technology

**Technical Benefits**:
- ✅ Validates Supabase Realtime capabilities
- ✅ Establishes real-time architecture patterns
- ✅ Tests system performance under live load
- ✅ Proves multi-user scalability

**User Impact**:
- ✅ Staff see updates immediately without refresh
- ✅ Kitchen gets orders instantly
- ✅ Managers receive alerts for critical events
- ✅ Multiple users can work simultaneously
- ✅ Better coordination reduces errors

### Problems It Solves
1. **Delayed Information**: Data updates require manual refresh
2. **Missed Critical Events**: No alerts for important incidents
3. **Poor Coordination**: Staff don't see each other's actions
4. **Manual Monitoring**: Constant checking required for status
5. **Customer Service**: Can't provide real-time order updates

---

## 3. Prerequisites

### Knowledge Requirements
- ✅ Supabase Realtime API and channels
- ✅ WebSocket connection management
- ✅ React state management for real-time data
- ✅ Event-driven architecture patterns
- ✅ Performance optimization for real-time apps

### Technical Prerequisites
- ✅ Phase 1 tasks completed (Task 1.1 - 1.8)
- ✅ Supabase Realtime enabled in project
- ✅ Database schema optimized for real-time queries
- ✅ Network connectivity stable for WebSocket connections
- ✅ Performance monitoring tools in place

### Environment Prerequisites
- ✅ Supabase project with Realtime enabled
- ✅ Multiple test users for collaboration testing
- ✅ Test data across orders, inventory, and other entities
- ✅ Multiple devices/browsers for testing

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "react": "^18.x",
  "zustand": "^4.x",
  "react-hot-toast": "^2.x"
}
```

---

## 4. Implementation Methodology

### Step 1: Create Realtime Service Layer (3-4 hours)

#### 1.1 Create `src/lib/services/realtime.service.ts`

```typescript
import { supabase } from '../supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimeTable = 'orders' | 'inventory_items' | 'branch_stock' | 'menu_items' | 'loyalty_members';

interface RealtimeSubscriptionConfig {
  table: RealtimeTable;
  filter?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

interface RealtimeConnection {
  id: string;
  channel: RealtimeChannel;
  config: RealtimeSubscriptionConfig;
  connected: boolean;
}

class RealtimeService {
  private connections: Map<string, RealtimeConnection> = new Map();
  private connectionListeners: Array<(status: 'connected' | 'disconnected') => void> = [];

  /**
   * Subscribe to real-time changes for a specific table
   */
  subscribe(config: RealtimeSubscriptionConfig): string {
    const subscriptionId = `${config.table}-${Date.now()}-${Math.random().toString(36)}`;
    
    console.log(`[Realtime] Subscribing to ${config.table}`, config.filter || 'all records');

    // Create channel with unique name
    const channel = supabase.channel(`realtime-${subscriptionId}`, {
      config: {
        presence: { key: subscriptionId },
      },
    });

    // Subscribe to table changes
    const subscription = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: config.table,
        filter: config.filter,
      },
      (payload) => {
        console.log(`[Realtime] ${config.table} change:`, payload);

        switch (payload.eventType) {
          case 'INSERT':
            config.onInsert?.(payload);
            break;
          case 'UPDATE':
            config.onUpdate?.(payload);
            break;
          case 'DELETE':
            config.onDelete?.(payload);
            break;
        }
      }
    );

    // Handle connection status
    channel.on('system', {}, (payload) => {
      if (payload.extension === 'postgres_changes') {
        const connection = this.connections.get(subscriptionId);
        if (connection) {
          connection.connected = payload.status === 'ok';
          this.notifyConnectionListeners(payload.status === 'ok' ? 'connected' : 'disconnected');
        }
      }
    });

    // Subscribe to channel
    channel.subscribe((status, err) => {
      if (err) {
        console.error(`[Realtime] Subscription error for ${config.table}:`, err);
        return;
      }

      console.log(`[Realtime] ${config.table} subscription status:`, status);
      
      const connection = this.connections.get(subscriptionId);
      if (connection) {
        connection.connected = status === 'SUBSCRIBED';
        this.notifyConnectionListeners(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      }
    });

    // Store connection
    this.connections.set(subscriptionId, {
      id: subscriptionId,
      channel,
      config,
      connected: false,
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const connection = this.connections.get(subscriptionId);
    if (connection) {
      console.log(`[Realtime] Unsubscribing from ${connection.config.table}`);
      supabase.removeChannel(connection.channel);
      this.connections.delete(subscriptionId);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    console.log('[Realtime] Unsubscribing from all channels');
    this.connections.forEach((connection) => {
      supabase.removeChannel(connection.channel);
    });
    this.connections.clear();
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (this.connections.size === 0) return 'disconnected';
    
    const allConnected = Array.from(this.connections.values()).every(conn => conn.connected);
    const someConnected = Array.from(this.connections.values()).some(conn => conn.connected);
    
    if (allConnected) return 'connected';
    if (someConnected) return 'connecting';
    return 'disconnected';
  }

  /**
   * Listen for connection status changes
   */
  onConnectionChange(listener: (status: 'connected' | 'disconnected') => void): () => void {
    this.connectionListeners.push(listener);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    };
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptions(): number {
    return this.connections.size;
  }

  /**
   * Get subscription details for debugging
   */
  getSubscriptionDetails(): Array<{
    id: string;
    table: string;
    filter?: string;
    connected: boolean;
  }> {
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      table: conn.config.table,
      filter: conn.config.filter,
      connected: conn.connected,
    }));
  }

  private notifyConnectionListeners(status: 'connected' | 'disconnected'): void {
    this.connectionListeners.forEach(listener => listener(status));
  }
}

export const realtimeService = new RealtimeService();
```

#### 1.2 Create `src/lib/services/notification.service.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: boolean;
  duration?: number; // in milliseconds
  timestamp: number;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36)}`,
          timestamp: Date.now(),
          read: false,
          autoClose: notification.autoClose ?? true,
          duration: notification.duration ?? 5000,
        };

        set(state => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep max 50
          unreadCount: state.unreadCount + 1,
        }));

        // Auto-remove if specified
        if (newNotification.autoClose) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, newNotification.duration);
        }
      },

      markAsRead: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(notif => ({ ...notif, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (notificationId) => {
        set(state => {
          const notif = state.notifications.find(n => n.id === notificationId);
          return {
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadCount: notif && !notif.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// Notification helper functions
export const notificationService = {
  success: (title: string, message: string, action?: Notification['action']) => {
    useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      action,
    });
  },

  error: (title: string, message: string, action?: Notification['action']) => {
    useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      action,
      autoClose: false, // Keep error notifications visible
    });
  },

  warning: (title: string, message: string, action?: Notification['action']) => {
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      action,
      autoClose: false,
    });
  },

  info: (title: string, message: string, action?: Notification['action']) => {
    useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      action,
    });
  },

  // Business event notifications
  newOrder: (orderNumber: string, amount: number) => {
    notificationService.info(
      'New Order',
      `Order #${orderNumber} received - $${amount.toFixed(2)}`,
      {
        label: 'View Order',
        onClick: () => {
          // Navigate to order details
          window.location.href = `/sales/live-orders`;
        },
      }
    );
  },

  lowStock: (itemName: string, currentStock: number, unit: string) => {
    notificationService.warning(
      'Low Stock Alert',
      `${itemName} is running low: ${currentStock} ${unit} remaining`,
      {
        label: 'View Inventory',
        onClick: () => {
          window.location.href = `/inventory/stock-overview`;
        },
      }
    );
  },

  orderReady: (orderNumber: string, customerName: string) => {
    notificationService.success(
      'Order Ready',
      `Order #${orderNumber} for ${customerName} is ready for pickup`,
      {
        label: 'Mark Completed',
        onClick: () => {
          // Mark order as completed
        },
      }
    );
  },

  loyaltyMilestone: (memberName: string, milestone: string) => {
    notificationService.success(
      'Loyalty Milestone',
      `${memberName} has reached ${milestone}!`
    );
  },
};
```

**Success Criteria**:
- ✅ Realtime service manages connections properly
- ✅ Notification system works correctly
- ✅ Performance optimized for multiple subscriptions
- ✅ Error handling for connection issues

---

### Step 2: Enhanced Real-time Hooks (4-5 hours)

#### 2.1 Enhance `src/hooks/useRealtimeOrders.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { orderService } from '@/lib/services';
import { realtimeService } from '@/lib/services/realtime.service';
import { notificationService } from '@/lib/services/notification.service';
import type { Database } from '@/lib/supabase/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

interface UseRealtimeOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  refetch: () => Promise<void>;
}

interface UseRealtimeOrdersProps {
  statuses?: string[];
  enableNotifications?: boolean;
  autoRefresh?: boolean;
}

export const useRealtimeOrders = ({
  statuses = ['pending', 'preparing', 'ready'],
  enableNotifications = true,
  autoRefresh = true,
}: UseRealtimeOrdersProps = {}): UseRealtimeOrdersReturn => {
  const { currentOrganization, currentBranch } = useOrganization();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Fetch orders from database
  const fetchOrders = useCallback(async () => {
    if (!currentOrganization || !currentBranch) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const ordersData = await orderService.getOrders({
        organizationId: currentOrganization.id,
        branchId: currentBranch.id,
        status: statuses,
        limit: 100,
      });

      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, currentBranch, statuses]);

  // Handle real-time order updates
  const handleOrderInsert = useCallback((payload: any) => {
    const newOrder = payload.new;
    
    // Add to orders if it matches our filters
    if (statuses.includes(newOrder.status)) {
      setOrders(prev => [newOrder, ...prev]);
      
      // Send notification
      if (enableNotifications) {
        notificationService.newOrder(newOrder.order_number, newOrder.total_amount);
      }
    }
  }, [statuses, enableNotifications]);

  const handleOrderUpdate = useCallback((payload: any) => {
    const updatedOrder = payload.new;
    
    setOrders(prev => {
      // Update existing order
      const updated = prev.map(order => 
        order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
      );

      // Filter out orders that no longer match status filter
      return updated.filter(order => statuses.includes(order.status));
    });

    // Send notification for status changes
    if (enableNotifications) {
      if (updatedOrder.status === 'ready') {
        notificationService.orderReady(
          updatedOrder.order_number,
          updatedOrder.customer_name || 'Guest'
        );
      }
    }
  }, [statuses, enableNotifications]);

  const handleOrderDelete = useCallback((payload: any) => {
    const deletedOrder = payload.old;
    setOrders(prev => prev.filter(order => order.id !== deletedOrder.id));
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentBranch) return;

    let subscriptionId: string;

    const setupSubscription = () => {
      subscriptionId = realtimeService.subscribe({
        table: 'orders',
        filter: `branch_id=eq.${currentBranch.id}`,
        onInsert: handleOrderInsert,
        onUpdate: handleOrderUpdate,
        onDelete: handleOrderDelete,
      });
    };

    // Initial fetch
    fetchOrders().then(() => {
      if (autoRefresh) {
        setupSubscription();
      }
    });

    // Connection status monitoring
    const unsubscribeConnectionListener = realtimeService.onConnectionChange(setConnectionStatus);

    return () => {
      if (subscriptionId) {
        realtimeService.unsubscribe(subscriptionId);
      }
      unsubscribeConnectionListener();
    };
  }, [currentBranch, handleOrderInsert, handleOrderUpdate, handleOrderDelete, fetchOrders, autoRefresh]);

  return {
    orders,
    loading,
    error,
    connectionStatus,
    refetch: fetchOrders,
  };
};
```

#### 2.2 Create `src/hooks/useRealtimeInventory.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { inventoryService } from '@/lib/services';
import { realtimeService } from '@/lib/services/realtime.service';
import { notificationService } from '@/lib/services/notification.service';
import type { Database } from '@/lib/supabase/database.types';

type BranchStock = Database['public']['Tables']['branch_stock']['Row'];
type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

interface UseRealtimeInventoryReturn {
  stock: BranchStock[];
  lowStockItems: BranchStock[];
  loading: boolean;
  error: Error | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  refetch: () => Promise<void>;
}

export const useRealtimeInventory = (): UseRealtimeInventoryReturn => {
  const { currentOrganization, currentBranch } = useOrganization();
  const [stock, setStock] = useState<BranchStock[]>([]);
  const [lowStockItems, setLowStockItems] = useState<BranchStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Fetch inventory data
  const fetchInventory = useCallback(async () => {
    if (!currentOrganization || !currentBranch) {
      setStock([]);
      setLowStockItems([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const [stockData, lowStockData] = await Promise.all([
        inventoryService.getBranchStock({
          organizationId: currentOrganization.id,
          branchId: currentBranch.id,
        }),
        inventoryService.getLowStockItems({
          organizationId: currentOrganization.id,
          branchId: currentBranch.id,
        }),
      ]);

      setStock(stockData);
      setLowStockItems(lowStockData);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, currentBranch]);

  // Handle real-time stock updates
  const handleStockUpdate = useCallback((payload: any) => {
    const updatedStock = payload.new;
    
    setStock(prev => 
      prev.map(item => 
        item.id === updatedStock.id ? { ...item, ...updatedStock } : item
      )
    );

    // Check if item is now low stock
    const inventoryItem = updatedStock.inventory_items;
    if (inventoryItem && updatedStock.current_stock <= inventoryItem.reorder_point) {
      // Add to low stock items if not already there
      setLowStockItems(prev => {
        const exists = prev.find(item => item.id === updatedStock.id);
        if (!exists) {
          // Send low stock notification
          notificationService.lowStock(
            inventoryItem.name,
            updatedStock.current_stock,
            inventoryItem.unit
          );
          
          return [...prev, updatedStock];
        }
        return prev.map(item => 
          item.id === updatedStock.id ? { ...item, ...updatedStock } : item
        );
      });
    } else {
      // Remove from low stock if stock is now adequate
      setLowStockItems(prev => prev.filter(item => item.id !== updatedStock.id));
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentBranch) return;

    let subscriptionId: string;

    const setupSubscription = () => {
      subscriptionId = realtimeService.subscribe({
        table: 'branch_stock',
        filter: `branch_id=eq.${currentBranch.id}`,
        onUpdate: handleStockUpdate,
      });
    };

    // Initial fetch
    fetchInventory().then(() => {
      setupSubscription();
    });

    // Connection status monitoring
    const unsubscribeConnectionListener = realtimeService.onConnectionChange(setConnectionStatus);

    return () => {
      if (subscriptionId) {
        realtimeService.unsubscribe(subscriptionId);
      }
      unsubscribeConnectionListener();
    };
  }, [currentBranch, handleStockUpdate, fetchInventory]);

  return {
    stock,
    lowStockItems,
    loading,
    error,
    connectionStatus,
    refetch: fetchInventory,
  };
};
```

**Success Criteria**:
- ✅ Enhanced hooks provide real-time data
- ✅ Notifications triggered for business events
- ✅ Connection status monitoring works
- ✅ Performance optimized

---

### Step 3: Create Real-time Components (3-4 hours)

#### 3.1 Create `src/components/common/NotificationCenter.tsx`

```typescript
'use client';

import { useState } from 'react';
import { 
  Popover, 
  IconButton, 
  Flex, 
  Box, 
  Text, 
  Button,
  Badge,
  Card,
  Separator,
  ScrollArea
} from '@radix-ui/themes';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNotificationStore } from '@/lib/services/notification.service';
import { format } from 'date-fns';

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();
  
  const [open, setOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'orange';
      default: return 'blue';
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <IconButton variant="ghost" className="relative">
          <Bell size={18} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 min-w-5 h-5 text-xs"
              color="red"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </IconButton>
      </Popover.Trigger>

      <Popover.Content 
        style={{ width: 400, maxHeight: 500 }}
        align="end"
        sideOffset={5}
      >
        <Flex direction="column" gap="3">
          {/* Header */}
          <Flex justify="between" align="center">
            <Text size="4" weight="bold">Notifications</Text>
            <Flex gap="2">
              {unreadCount > 0 && (
                <Button
                  size="1"
                  variant="ghost"
                  onClick={markAllAsRead}
                >
                  <CheckCheck size={14} />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  size="1"
                  variant="ghost"
                  color="red"
                  onClick={() => {
                    clearAll();
                    setOpen(false);
                  }}
                >
                  <Trash2 size={14} />
                  Clear all
                </Button>
              )}
            </Flex>
          </Flex>

          <Separator />

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Box className="text-center py-8">
              <Bell size={32} color="gray" className="mx-auto mb-2" />
              <Text size="2" color="gray">No notifications</Text>
            </Box>
          ) : (
            <ScrollArea style={{ maxHeight: 400 }}>
              <Flex direction="column" gap="2">
                {notifications.map(notification => (
                  <Card 
                    key={notification.id}
                    className={`p-3 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                  >
                    <Flex gap="3">
                      <Text size="3" className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </Text>
                      
                      <Box className="flex-1">
                        <Flex justify="between" align="start" className="mb-1">
                          <Text size="3" weight="medium">
                            {notification.title}
                          </Text>
                          <Flex gap="1">
                            {!notification.read && (
                              <IconButton
                                size="1"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check size={12} />
                              </IconButton>
                            )}
                            <IconButton
                              size="1"
                              variant="ghost"
                              onClick={() => removeNotification(notification.id)}
                            >
                              <X size={12} />
                            </IconButton>
                          </Flex>
                        </Flex>
                        
                        <Text size="2" color="gray" className="mb-2">
                          {notification.message}
                        </Text>
                        
                        <Flex justify="between" align="center">
                          <Text size="1" color="gray">
                            {format(notification.timestamp, 'MMM dd, HH:mm')}
                          </Text>
                          
                          {notification.action && (
                            <Button
                              size="1"
                              variant="soft"
                              onClick={() => {
                                notification.action!.onClick();
                                markAsRead(notification.id);
                                setOpen(false);
                              }}
                            >
                              {notification.action.label}
                            </Button>
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            </ScrollArea>
          )}
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}
```

#### 3.2 Create `src/components/common/ConnectionStatus.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Flex, Text, Badge, Box } from '@radix-ui/themes';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { realtimeService } from '@/lib/services/realtime.service';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);

  useEffect(() => {
    // Update status
    setStatus(realtimeService.getConnectionStatus());
    setSubscriptionsCount(realtimeService.getActiveSubscriptions());

    // Listen for connection changes
    const unsubscribe = realtimeService.onConnectionChange((newStatus) => {
      setStatus(newStatus);
    });

    // Update subscriptions count periodically
    const interval = setInterval(() => {
      setSubscriptionsCount(realtimeService.getActiveSubscriptions());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi size={14} color="green" />;
      case 'connecting':
        return <RefreshCw size={14} color="orange" className="animate-spin" />;
      default:
        return <WifiOff size={14} color="red" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'green';
      case 'connecting': return 'orange';
      default: return 'red';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Live';
      case 'connecting': return 'Connecting';
      default: return 'Offline';
    }
  };

  return (
    <Flex align="center" gap="2" className="text-sm">
      {getStatusIcon()}
      <Badge color={getStatusColor()} variant="soft">
        {getStatusText()}
      </Badge>
      {subscriptionsCount > 0 && (
        <Text size="1" color="gray">
          {subscriptionsCount} active
        </Text>
      )}
    </Flex>
  );
}
```

**Success Criteria**:
- ✅ Notification center displays correctly
- ✅ Connection status indicator works
- ✅ Real-time updates visible to users
- ✅ Performance remains smooth

---

### Step 4: Integrate Real-time Across All Pages (3-4 hours)

#### 4.1 Update TopBar with notifications

```typescript
// Add to src/components/common/TopBar.tsx

import NotificationCenter from './NotificationCenter';
import ConnectionStatus from './ConnectionStatus';

// In the TopBar component, add:
<Flex align="center" gap="4">
  <ConnectionStatus />
  <NotificationCenter />
  {/* existing profile menu */}
</Flex>
```

#### 4.2 Update Dashboard with real-time metrics

```typescript
// Enhance src/hooks/useDashboardData.ts to use real-time updates

import { realtimeService } from '@/lib/services/realtime.service';

// Add real-time subscription for orders that affect metrics
useEffect(() => {
  if (!currentOrganization || !currentBranch) return;

  const subscriptionId = realtimeService.subscribe({
    table: 'orders',
    filter: `branch_id=eq.${currentBranch.id}`,
    onInsert: () => fetchDashboardData(), // Refresh metrics
    onUpdate: () => fetchDashboardData(),
  });

  return () => {
    realtimeService.unsubscribe(subscriptionId);
  };
}, [currentOrganization, currentBranch]);
```

#### 4.3 Add real-time indicators to all pages

```typescript
// Create src/components/common/LiveIndicator.tsx

export default function LiveIndicator({ active = true }: { active?: boolean }) {
  return (
    <Flex align="center" gap="2">
      <Box 
        className={`w-2 h-2 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} 
      />
      <Text size="1" color={active ? 'green' : 'gray'}>
        {active ? 'Live' : 'Static'}
      </Text>
    </Flex>
  );
}
```

**Success Criteria**:
- ✅ All pages show live indicators
- ✅ Real-time updates work across system
- ✅ Performance remains optimal
- ✅ User experience enhanced

---

### Step 5: Testing and Performance Optimization (2-3 hours)

#### 5.1 Real-time Testing Checklist

```
Connection Management:
- [ ] WebSocket connections establish properly
- [ ] Reconnection works after network interruption
- [ ] Multiple subscriptions managed efficiently
- [ ] Connection status updates correctly

Order Real-time:
- [ ] New orders appear immediately on kitchen display
- [ ] Order status updates sync across all screens
- [ ] Multiple POS terminals work simultaneously
- [ ] No duplicate or missed updates

Inventory Real-time:
- [ ] Stock adjustments reflect immediately
- [ ] Low stock alerts trigger properly
- [ ] Multiple users can update stock simultaneously
- [ ] Stock deductions from orders happen instantly

Dashboard Real-time:
- [ ] Metrics update without page refresh
- [ ] Charts update with new data
- [ ] Multiple dashboard views stay synchronized
- [ ] Performance remains smooth with live updates

Notifications:
- [ ] Business event notifications trigger properly
- [ ] Notification center displays correctly
- [ ] Mark as read/unread works
- [ ] Notification actions function properly

Performance:
- [ ] No memory leaks from subscriptions
- [ ] Page load times remain fast
- [ ] No excessive re-renders
- [ ] Battery usage acceptable on mobile
```

#### 5.2 Performance Optimization

```typescript
// Add connection pooling and cleanup
// Implement debouncing for high-frequency updates
// Add subscription management for better resource usage
// Optimize re-render cycles with proper memoization
```

---

## 5. Success Criteria

### Functional Requirements
- ✅ **Live Order Updates**: Orders sync in real-time across all screens
- ✅ **Inventory Tracking**: Stock changes reflect immediately
- ✅ **Dashboard Metrics**: Live updates without refresh
- ✅ **Notifications**: Critical events trigger alerts
- ✅ **Multi-user Support**: Multiple users work simultaneously
- ✅ **Connection Management**: Robust WebSocket handling

### Technical Requirements
- ✅ **Performance**: No degradation with real-time features
- ✅ **Reliability**: Connection recovery and error handling
- ✅ **Scalability**: Supports multiple concurrent users
- ✅ **Memory Management**: No leaks from subscriptions
- ✅ **Type Safety**: Proper TypeScript types for real-time data

### User Experience Requirements
- ✅ **Instant Feedback**: Changes visible immediately
- ✅ **Connection Awareness**: Users know when live/offline
- ✅ **Relevant Notifications**: Only important alerts shown
- ✅ **Smooth Performance**: No lag or stuttering

---

## 6. Deliverables

### Code Files
```
✅ src/lib/services/realtime.service.ts (new)
✅ src/lib/services/notification.service.ts (new)
✅ src/hooks/useRealtimeOrders.ts (enhanced)
✅ src/hooks/useRealtimeInventory.ts (new)
✅ src/hooks/useRealtimeDashboard.ts (new)
✅ src/components/common/NotificationCenter.tsx (new)
✅ src/components/common/ConnectionStatus.tsx (new)
✅ src/components/common/LiveIndicator.tsx (new)
```

### Integration Updates
```
✅ TopBar.tsx - Added notification center
✅ All dashboard pages - Real-time metrics
✅ Kitchen display - Enhanced real-time orders
✅ Inventory pages - Live stock updates
✅ POS pages - Instant order synchronization
```

---

## 7. Rollback Plan

If real-time features cause issues:
1. Disable real-time subscriptions temporarily
2. Fall back to manual refresh mechanisms
3. Debug connection and performance issues
4. Test with reduced subscription load
5. Re-enable features incrementally

---

## 8. Next Steps After Completion

1. **Mobile Push Notifications**: Add mobile app notifications
2. **Advanced Analytics**: Real-time business intelligence
3. **Performance Monitoring**: Add real-time performance metrics
4. **Move to Next Task**: Payment Integration (Task 3.1)

---

**Status**: 📋 Ready to Start  
**Dependencies**: Phase 1 completed (Tasks 1.1-1.8)  
**Blocked By**: Frontend integration tasks must be completed first  
**Blocks**: Advanced real-time features, mobile notifications
