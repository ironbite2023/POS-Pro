# Task 1: Frontend Foundation - Delivery Platform Integration Hub

**Task ID**: TASK-001  
**Phase**: Foundation (Weeks 1-3)  
**Priority**: Critical  
**Dependencies**: None  
**Estimated Duration**: 3 weeks  
**Assigned To**: Frontend Development Team  

---

## Overview

This task covers the foundational development of the Delivery Platform Integration Hub frontend. The primary goal is to eliminate "Tablet Hell" by creating a unified interface that consolidates orders from multiple delivery platforms (Uber Eats, Deliveroo, Just Eat, etc.) into a single, elegant management system.

**Core Objective**: Build the essential infrastructure and Order Center MVP that serves as the heart of the solution.

---

## Week 1: Setup & Core Architecture

### 1.1 Project Initialization & Configuration

#### Technology Stack Setup
```bash
# Initialize Next.js 15 project
npx create-next-app@latest delivery-hub --typescript --app --tailwind --eslint

# Install core dependencies
npm install @radix-ui/themes zustand @tanstack/react-query
npm install socket.io-client react-hook-form zod
npm install clsx tailwind-merge lucide-react
npm install recharts date-fns

# Install dev dependencies
npm install --save-dev @types/node vitest @testing-library/react
npm install --save-dev @playwright/test storybook
```

#### Configuration Files
- **Next.js Config** (`next.config.mjs`):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@radix-ui/themes', 'lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.delivery-platforms.com',
      },
    ],
  },
};

export default nextConfig;
```

- **TailwindCSS Config** (`tailwind.config.js`):
```javascript
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Platform brand colors
        'uber-eats': '#000000',
        'deliveroo': '#00CCBC',
        'just-eat': '#FF8000',
        'doordash': '#FF3008',
        
        // Status colors
        'status-new': '#3B82F6',
        'status-preparing': '#F59E0B',
        'status-ready': '#10B981',
        'status-urgent': '#EF4444',
      },
      animation: {
        'pulse-urgent': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      fontSize: {
        'order-id': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'platform-badge': ['0.75rem', { lineHeight: '1rem', fontWeight: '600' }],
        'metric-value': ['2.5rem', { lineHeight: '1', fontWeight: '700' }],
      }
    },
  },
  plugins: [],
}
```

#### **Deliverable 1.1**: ✅ Fully configured Next.js project with TypeScript and styling

### 1.2 Design System Foundation

#### Design Tokens Setup
```typescript
// src/lib/design-tokens.ts
export const platformColors = {
  uber_eats: {
    primary: '#000000',
    light: '#F5F5F5',
    accent: '#06C167'
  },
  deliveroo: {
    primary: '#00CCBC',
    light: '#E6FAF8',
    accent: '#00B8A9'
  },
  just_eat: {
    primary: '#FF8000',
    light: '#FFF4E6',
    accent: '#FF6600'
  },
  doordash: {
    primary: '#FF3008',
    light: '#FFE8E3',
    accent: '#E11900'
  }
} as const;

export const statusColors = {
  new: '#3B82F6',
  preparing: '#F59E0B',
  ready: '#10B981',
  completed: '#6B7280',
  urgent: '#EF4444',
  late: '#DC2626'
} as const;
```

#### Base Layout Components
```typescript
// src/components/layout/AppShell.tsx
interface AppShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export default function AppShell({ children, sidebar, header }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {header && (
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b">
          {header}
        </header>
      )}
      <div className="flex">
        {sidebar && (
          <aside className="w-64 bg-white dark:bg-gray-800 border-r min-h-screen">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### **Deliverable 1.2**: ✅ Design system with platform colors and base layouts

### 1.3 State Management Architecture

#### Zustand Store Setup
```typescript
// src/stores/orderStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Order {
  id: string;
  platform: 'uber_eats' | 'deliveroo' | 'just_eat' | 'doordash';
  orderNumber: string;
  customer: {
    name: string;
    phone?: string;
    address?: string;
  };
  items: OrderItem[];
  total: number;
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  receivedAt: Date;
  estimatedPickup: Date;
  priority: 'urgent' | 'normal' | 'low';
  isLate: boolean;
  unread: boolean;
}

interface OrderStore {
  // State
  orders: Record<string, Order>;
  selectedOrderId: string | null;
  filters: {
    platforms: string[];
    statuses: string[];
    priority: string[];
  };
  sortBy: 'time' | 'platform' | 'priority' | 'customer';
  
  // Selectors (computed state)
  getOrdersByStatus: (status: Order['status']) => Order[];
  getUrgentOrders: () => Order[];
  getUnreadCount: () => number;
  
  // Actions
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  removeOrder: (orderId: string) => void;
  selectOrder: (orderId: string | null) => void;
  markAsRead: (orderId: string) => void;
  markAllAsRead: () => void;
  setFilters: (filters: Partial<OrderStore['filters']>) => void;
  setSortBy: (sortBy: OrderStore['sortBy']) => void;
  
  // Bulk actions
  bulkUpdateStatus: (orderIds: string[], status: Order['status']) => void;
  clearCompleted: () => void;
}

export const useOrderStore = create<OrderStore>()(
  devtools(
    persist(
      (set, get) => ({
        orders: {},
        selectedOrderId: null,
        filters: { platforms: [], statuses: [], priority: [] },
        sortBy: 'time',
        
        // Selectors
        getOrdersByStatus: (status) => {
          const state = get();
          return Object.values(state.orders)
            .filter(order => order.status === status)
            .sort((a, b) => {
              if (state.sortBy === 'time') return b.receivedAt.getTime() - a.receivedAt.getTime();
              if (state.sortBy === 'priority') return a.priority.localeCompare(b.priority);
              if (state.sortBy === 'platform') return a.platform.localeCompare(b.platform);
              return a.customer.name.localeCompare(b.customer.name);
            });
        },
        
        getUrgentOrders: () => {
          return Object.values(get().orders).filter(order => 
            order.priority === 'urgent' || order.isLate
          );
        },
        
        getUnreadCount: () => {
          return Object.values(get().orders).filter(order => order.unread).length;
        },
        
        // Actions
        addOrder: (order) => set((state) => ({
          orders: { ...state.orders, [order.id]: { ...order, unread: true } }
        })),
        
        updateOrder: (orderId, updates) => set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: { ...state.orders[orderId], ...updates }
          }
        })),
        
        removeOrder: (orderId) => set((state) => {
          const { [orderId]: removed, ...rest } = state.orders;
          return { orders: rest };
        }),
        
        selectOrder: (orderId) => set({ selectedOrderId: orderId }),
        
        markAsRead: (orderId) => set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: { ...state.orders[orderId], unread: false }
          }
        })),
        
        markAllAsRead: () => set((state) => ({
          orders: Object.fromEntries(
            Object.entries(state.orders).map(([id, order]) => 
              [id, { ...order, unread: false }]
            )
          )
        })),
        
        setFilters: (filters) => set((state) => ({
          filters: { ...state.filters, ...filters }
        })),
        
        setSortBy: (sortBy) => set({ sortBy }),
        
        bulkUpdateStatus: (orderIds, status) => set((state) => ({
          orders: Object.fromEntries(
            Object.entries(state.orders).map(([id, order]) =>
              orderIds.includes(id) 
                ? [id, { ...order, status }]
                : [id, order]
            )
          )
        })),
        
        clearCompleted: () => set((state) => ({
          orders: Object.fromEntries(
            Object.entries(state.orders).filter(([_, order]) => 
              order.status !== 'completed'
            )
          )
        }))
      }),
      {
        name: 'order-store',
        partialize: (state) => ({ 
          filters: state.filters, 
          sortBy: state.sortBy 
        })
      }
    )
  )
);
```

#### React Query Setup
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Custom hooks for data fetching
export const useActiveOrders = () => {
  return useQuery({
    queryKey: ['orders', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/orders/active');
      return response.json();
    },
    refetchInterval: 30000, // Fallback polling every 30s
  });
};
```

#### **Deliverable 1.3**: ✅ Complete state management setup with Zustand and React Query

---

## Week 2: Order Center MVP

### 2.1 Core Order Components

#### OrderCard Component
```typescript
// src/components/orders/OrderCard.tsx
import { Order } from '@/stores/orderStore';
import { platformColors, statusColors } from '@/lib/design-tokens';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: Order;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, status: Order['status']) => void;
  onSelectOrder?: (orderId: string) => void;
  isSelected?: boolean;
  className?: string;
}

export default function OrderCard({ 
  order, 
  onAccept, 
  onReject, 
  onUpdateStatus, 
  onSelectOrder,
  isSelected = false,
  className = ''
}: OrderCardProps) {
  const platformStyle = platformColors[order.platform];
  const isUrgent = order.priority === 'urgent' || order.isLate;
  
  const handleAccept = () => onAccept?.(order.id);
  const handleReject = () => onReject?.(order.id);
  const handleClick = () => onSelectOrder?.(order.id);
  
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg border-2 p-4 cursor-pointer transition-all
        ${isUrgent ? 'border-red-500 animate-pulse-urgent' : 'border-gray-200 dark:border-gray-700'}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${order.unread ? 'shadow-lg' : 'shadow-sm'}
        hover:shadow-md ${className}
      `}
      onClick={handleClick}
      data-testid="order-card"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Badge 
            className={`${platformStyle.primary} text-white`}
            size="sm"
          >
            {order.platform.replace('_', ' ').toUpperCase()}
          </Badge>
          {order.unread && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            #{order.orderNumber}
          </div>
          <div className="text-sm text-gray-500">
            {formatDistanceToNow(order.receivedAt)} ago
          </div>
        </div>
      </div>

      {/* Customer & Order Details */}
      <div className="mb-3">
        <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
          {order.customer.name}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {order.items.length} items • ${order.total.toFixed(2)}
        </div>
        <div className="text-sm text-gray-500">
          Pickup: {formatDistanceToNow(order.estimatedPickup)}
        </div>
      </div>

      {/* Status & Priority */}
      <div className="flex justify-between items-center mb-3">
        <Badge 
          variant={order.status === 'new' ? 'default' : 'secondary'}
          className={`bg-${statusColors[order.status]}`}
        >
          {order.status.toUpperCase()}
        </Badge>
        {isUrgent && (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">URGENT</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {order.status === 'new' && (
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReject}
            className="flex-1"
          >
            Reject
          </Button>
          <Button 
            size="sm" 
            onClick={handleAccept}
            className="flex-1"
          >
            Accept
          </Button>
        </div>
      )}

      {order.status === 'preparing' && (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            onUpdateStatus?.(order.id, 'ready');
          }}
          className="w-full"
        >
          Mark Ready
        </Button>
      )}
    </div>
  );
}
```

#### OrderColumn Component (Kanban Style)
```typescript
// src/components/orders/OrderColumn.tsx
import { Order } from '@/stores/orderStore';
import OrderCard from './OrderCard';
import { statusColors } from '@/lib/design-tokens';

interface OrderColumnProps {
  title: string;
  status: Order['status'];
  orders: Order[];
  onAcceptOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, status: Order['status']) => void;
  onSelectOrder?: (orderId: string) => void;
  selectedOrderId?: string | null;
}

export default function OrderColumn({
  title,
  status,
  orders,
  onAcceptOrder,
  onRejectOrder,
  onUpdateStatus,
  onSelectOrder,
  selectedOrderId
}: OrderColumnProps) {
  const statusColor = statusColors[status];
  
  return (
    <div className="flex-1 min-h-0">
      {/* Column Header */}
      <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: statusColor }}
          >
            {orders.length}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-4 overflow-y-auto" data-testid={`${status}-column`}>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No {status} orders
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAccept={onAcceptOrder}
              onReject={onRejectOrder}
              onUpdateStatus={onUpdateStatus}
              onSelectOrder={onSelectOrder}
              isSelected={selectedOrderId === order.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

#### **Deliverable 2.1**: ✅ Core order components (OrderCard, OrderColumn)

### 2.2 Order Center Layout

#### Main Order Center Component
```typescript
// src/components/orders/OrderCenter.tsx
'use client';

import { useOrderStore } from '@/stores/orderStore';
import OrderColumn from './OrderColumn';
import OrderHeader from './OrderHeader';
import OrderDetailsPanel from './OrderDetailsPanel';

export default function OrderCenter() {
  const {
    getOrdersByStatus,
    selectedOrderId,
    selectOrder,
    updateOrder,
    markAsRead
  } = useOrderStore();

  const newOrders = getOrdersByStatus('new');
  const preparingOrders = getOrdersByStatus('preparing');
  const readyOrders = getOrdersByStatus('ready');
  const completedOrders = getOrdersByStatus('completed');

  const handleAcceptOrder = (orderId: string) => {
    updateOrder(orderId, { status: 'preparing' });
    markAsRead(orderId);
    // Play success sound
    playOrderSound('accept');
  };

  const handleRejectOrder = (orderId: string) => {
    updateOrder(orderId, { status: 'cancelled' });
    // Show confirmation toast
    toast.success('Order rejected');
  };

  const handleUpdateStatus = (orderId: string, status: Order['status']) => {
    updateOrder(orderId, { status });
    if (status === 'ready') {
      playOrderSound('ready');
    }
  };

  const handleSelectOrder = (orderId: string) => {
    selectOrder(orderId);
    markAsRead(orderId);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <OrderHeader />

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Kanban Columns */}
        <div className="flex-1 flex gap-4 p-4">
          <OrderColumn
            title="New Orders"
            status="new"
            orders={newOrders}
            onAcceptOrder={handleAcceptOrder}
            onRejectOrder={handleRejectOrder}
            onSelectOrder={handleSelectOrder}
            selectedOrderId={selectedOrderId}
          />
          
          <OrderColumn
            title="Preparing"
            status="preparing"
            orders={preparingOrders}
            onUpdateStatus={handleUpdateStatus}
            onSelectOrder={handleSelectOrder}
            selectedOrderId={selectedOrderId}
          />
          
          <OrderColumn
            title="Ready"
            status="ready"
            orders={readyOrders}
            onUpdateStatus={handleUpdateStatus}
            onSelectOrder={handleSelectOrder}
            selectedOrderId={selectedOrderId}
          />
          
          <OrderColumn
            title="Completed"
            status="completed"
            orders={completedOrders}
            onSelectOrder={handleSelectOrder}
            selectedOrderId={selectedOrderId}
          />
        </div>

        {/* Order Details Panel */}
        {selectedOrderId && (
          <OrderDetailsPanel 
            orderId={selectedOrderId}
            onClose={() => selectOrder(null)}
          />
        )}
      </div>
    </div>
  );
}
```

#### **Deliverable 2.2**: ✅ Complete Order Center layout with Kanban columns

### 2.3 Basic WebSocket Integration

#### WebSocket Connection Manager
```typescript
// src/lib/websocket.ts
import { io, Socket } from 'socket.io-client';
import { useOrderStore } from '@/stores/orderStore';
import { queryClient } from '@/lib/queryClient';

let socket: Socket | null = null;

export const initializeWebSocket = (authToken: string) => {
  socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
    auth: { token: authToken },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
    toast.success('Connected to order stream');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
    toast.error('Disconnected from order stream');
  });

  // Order events
  socket.on('order:new', (order: Order) => {
    useOrderStore.getState().addOrder(order);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    playNewOrderSound(order.platform);
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New ${order.platform} order`, {
        body: `${order.customer.name} - $${order.total}`,
        icon: `/icons/${order.platform}.png`,
        tag: order.id
      });
    }
  });

  socket.on('order:update', ({ orderId, updates }: OrderUpdate) => {
    useOrderStore.getState().updateOrder(orderId, updates);
  });

  socket.on('order:cancel', ({ orderId }: { orderId: string }) => {
    useOrderStore.getState().removeOrder(orderId);
    toast.info('Order cancelled by customer');
  });

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Custom hook for WebSocket
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = getAuthToken(); // Implement based on auth strategy
    const socket = initializeWebSocket(token);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      disconnectWebSocket();
    };
  }, []);

  return { isConnected };
};
```

#### **Deliverable 2.3**: ✅ Basic WebSocket integration for real-time updates

---

## Week 3: Order Center Enhancements

### 3.1 Order Details Panel

#### OrderDetailsPanel Component
```typescript
// src/components/orders/OrderDetailsPanel.tsx
import { useOrderStore } from '@/stores/orderStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, Phone, MapPin, Clock } from 'lucide-react';

interface OrderDetailsPanelProps {
  orderId: string;
  onClose: () => void;
}

export default function OrderDetailsPanel({ orderId, onClose }: OrderDetailsPanelProps) {
  const order = useOrderStore(state => state.orders[orderId]);

  if (!order) {
    return null;
  }

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l shadow-lg flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Order Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Order Info */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xl font-bold">#{order.orderNumber}</div>
              <Badge className={`bg-${platformColors[order.platform].primary}`}>
                {order.platform.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${order.total.toFixed(2)}</div>
              <Badge variant={order.status === 'new' ? 'default' : 'secondary'}>
                {order.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>Received {formatDistanceToNow(order.receivedAt)} ago</span>
          </div>
        </div>

        {/* Customer Info */}
        <div>
          <h4 className="font-medium mb-2">Customer</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>{order.customer.name}</span>
            </div>
            {order.customer.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>{order.customer.phone}</span>
              </div>
            )}
            {order.customer.address && (
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span className="text-sm">{order.customer.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h4 className="font-medium mb-3">Items ({order.items.length})</h4>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      {item.modifiers.map(mod => mod.name).join(', ')}
                    </div>
                  )}
                  {item.specialInstructions && (
                    <div className="text-sm text-blue-600 mt-1 italic">
                      Note: {item.specialInstructions}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="font-medium">${item.price.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">x{item.quantity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timing Info */}
        <div>
          <h4 className="font-medium mb-2">Timing</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Estimated Pickup:</span>
              <span>{format(order.estimatedPickup, 'HH:mm')}</span>
            </div>
            <div className="flex justify-between">
              <span>Time Remaining:</span>
              <span className={order.isLate ? 'text-red-600 font-medium' : ''}>
                {formatDistanceToNow(order.estimatedPickup)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t">
        {order.status === 'new' && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => handleRejectOrder(order.id)}>
              Reject
            </Button>
            <Button onClick={() => handleAcceptOrder(order.id)}>
              Accept
            </Button>
          </div>
        )}

        {order.status === 'preparing' && (
          <Button className="w-full" onClick={() => handleMarkReady(order.id)}>
            Mark Ready
          </Button>
        )}

        {order.status === 'ready' && (
          <Button className="w-full" onClick={() => handleComplete(order.id)}>
            Mark Completed
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### **Deliverable 3.1**: ✅ Complete order details slide-out panel

### 3.2 Enhanced Features

#### Timer Component
```typescript
// src/components/orders/OrderTimer.tsx
import { useEffect, useState } from 'react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';

interface OrderTimerProps {
  receivedAt: Date;
  estimatedPickup: Date;
  isCompleted?: boolean;
}

export default function OrderTimer({ receivedAt, estimatedPickup, isCompleted }: OrderTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted]);

  const minutesElapsed = differenceInMinutes(currentTime, receivedAt);
  const minutesUntilPickup = differenceInMinutes(estimatedPickup, currentTime);
  
  const isUrgent = minutesElapsed > 10 || minutesUntilPickup < 5;
  const isLate = minutesUntilPickup < 0;

  if (isCompleted) {
    return (
      <span className="text-sm text-green-600">
        Completed
      </span>
    );
  }

  return (
    <div className="text-sm">
      <div className={`font-medium ${isLate ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-600'}`}>
        {formatDistanceToNow(receivedAt)} ago
      </div>
      {minutesUntilPickup > 0 ? (
        <div className="text-gray-500">
          {minutesUntilPickup}m until pickup
        </div>
      ) : (
        <div className="text-red-600 font-medium">
          {Math.abs(minutesUntilPickup)}m overdue
        </div>
      )}
    </div>
  );
}
```

#### Audio Alert System
```typescript
// src/lib/audioAlerts.ts
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

const soundFiles = {
  newOrder: '/sounds/new-order.mp3',
  urgent: '/sounds/urgent.mp3',
  ready: '/sounds/order-ready.mp3',
  accept: '/sounds/accept.mp3',
  error: '/sounds/error.mp3'
};

class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private volume = 0.7;
  private enabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.preloadSounds();
    }
  }

  private preloadSounds() {
    Object.entries(soundFiles).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = this.volume;
      audio.preload = 'auto';
      this.sounds.set(key, audio);
    });
  }

  play(soundName: string) {
    if (!this.enabled) return;

    const audio = this.sounds.get(soundName);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(err => {
        console.warn('Could not play sound:', err);
      });
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const audioManager = new AudioManager();

export const playNewOrderSound = (platform: string) => {
  audioManager.play('newOrder');
};

export const playUrgentSound = () => {
  audioManager.play('urgent');
};

export const playReadySound = () => {
  audioManager.play('ready');
};

export const playAcceptSound = () => {
  audioManager.play('accept');
};
```

#### **Deliverable 3.2**: ✅ Timer component and audio alert system

### 3.3 Priority & Filtering System

#### Priority Calculation Logic
```typescript
// src/lib/orderPriority.ts
import { differenceInMinutes } from 'date-fns';

export const calculateOrderPriority = (order: Order): 'urgent' | 'normal' | 'low' => {
  const now = new Date();
  const minutesElapsed = differenceInMinutes(now, order.receivedAt);
  const minutesUntilPickup = differenceInMinutes(order.estimatedPickup, now);
  
  // Urgent conditions
  if (minutesElapsed > 10 || minutesUntilPickup < 5 || minutesUntilPickup < 0) {
    return 'urgent';
  }
  
  // Normal processing time
  if (minutesElapsed <= 10 && minutesUntilPickup >= 10) {
    return 'normal';
  }
  
  // Future orders with plenty of time
  return 'low';
};

export const isOrderLate = (order: Order): boolean => {
  return differenceInMinutes(new Date(), order.estimatedPickup) > 0;
};

export const updateOrderPriorities = (orders: Order[]): Order[] => {
  return orders.map(order => ({
    ...order,
    priority: calculateOrderPriority(order),
    isLate: isOrderLate(order)
  }));
};
```

#### Filter Controls Component
```typescript
// src/components/orders/OrderFilters.tsx
import { useOrderStore } from '@/stores/orderStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function OrderFilters() {
  const { filters, setFilters } = useOrderStore();
  
  const platforms = ['uber_eats', 'deliveroo', 'just_eat', 'doordash'];
  const statuses = ['new', 'preparing', 'ready', 'completed'];
  const priorities = ['urgent', 'normal', 'low'];

  const togglePlatform = (platform: string) => {
    const newPlatforms = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform];
    setFilters({ platforms: newPlatforms });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    setFilters({ statuses: newStatuses });
  };

  const clearFilters = () => {
    setFilters({ platforms: [], statuses: [], priority: [] });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Platform Filters */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Platforms:</span>
          {platforms.map(platform => (
            <Badge
              key={platform}
              variant={filters.platforms.includes(platform) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => togglePlatform(platform)}
            >
              {platform.replace('_', ' ').toUpperCase()}
            </Badge>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {statuses.map(status => (
            <Badge
              key={status}
              variant={filters.statuses.includes(status) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleStatus(status)}
            >
              {status.toUpperCase()}
            </Badge>
          ))}
        </div>

        {/* Clear Filters */}
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
```

#### **Deliverable 3.3**: ✅ Complete priority system and filtering controls

---

## Success Criteria

By the end of Task 1 (Week 3), the following must be completed and functional:

### ✅ Technical Deliverables
- [ ] Next.js 15 project with TypeScript fully configured
- [ ] Zustand + React Query state management implemented
- [ ] WebSocket integration for real-time order updates
- [ ] Complete Order Center with Kanban-style columns
- [ ] OrderCard component with platform branding
- [ ] OrderDetailsPanel slide-out component
- [ ] Order timer and priority calculation system
- [ ] Audio alert system for new orders
- [ ] Filter and sort controls
- [ ] Responsive design (desktop + tablet)

### ✅ User Experience Deliverables
- [ ] Orders can be viewed across 4 columns (New, Preparing, Ready, Completed)
- [ ] Orders update in real-time via WebSocket
- [ ] Visual and audio alerts for new/urgent orders
- [ ] Platform-specific branding and colors
- [ ] Click-to-select order details
- [ ] One-click order acceptance/rejection
- [ ] Priority indicators for urgent/late orders
- [ ] Filter by platform, status, and priority

### ✅ Performance Criteria
- [ ] Initial page load < 2 seconds
- [ ] Real-time order updates < 1 second delay
- [ ] Smooth animations and transitions
- [ ] No memory leaks with long-running sessions
- [ ] Handles 50+ concurrent orders without lag

### ✅ Quality Criteria
- [ ] TypeScript strict mode enabled (no any types)
- [ ] All components have proper prop interfaces
- [ ] Accessibility features (keyboard nav, ARIA labels)
- [ ] Mobile-responsive design
- [ ] Error boundaries and loading states
- [ ] Clean, maintainable code structure

---

## Testing Checklist

### Functional Testing
- [ ] Create new order via mock WebSocket
- [ ] Accept order moves it to "Preparing" column
- [ ] Mark order ready moves it to "Ready" column
- [ ] Order details panel opens/closes correctly
- [ ] Timer updates in real-time
- [ ] Priority calculation works (urgent for >10min or <5min pickup)
- [ ] Filters work for platforms, status, priority
- [ ] Audio alerts play for new orders
- [ ] Responsive layout on tablet/mobile

### Performance Testing
- [ ] Load 50+ orders simultaneously
- [ ] Test WebSocket reconnection after network loss
- [ ] Verify no memory leaks after 1 hour operation
- [ ] Test with multiple browser tabs open

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Risk Assessment

### High Risk Items
1. **WebSocket reliability** - Implement robust fallback polling
2. **Real-time performance** - Use React.memo and useMemo for optimization
3. **Audio permissions** - Handle browser autoplay restrictions gracefully

### Medium Risk Items
1. **Mobile responsiveness** - May need simplified mobile layout
2. **Accessibility compliance** - Require additional ARIA testing
3. **State synchronization** - Complex state updates may cause race conditions

### Mitigation Strategies
- Implement comprehensive error boundaries
- Add loading states for all async operations
- Create fallback UI components for degraded functionality
- Use optimistic updates with rollback capabilities

---

## Next Phase Preview

**Task 2** (Week 4-6) will focus on:
- Analytics Dashboard with P&L calculations
- Platform comparison charts
- Revenue visualization
- Export functionality
- Advanced filtering and reporting

The Order Center MVP from Task 1 serves as the foundation for all subsequent features and must be robust, performant, and user-friendly before proceeding.

---

**Task Status**: 🚀 Ready to Begin  
**Dependencies**: None  
**Assigned Team**: Frontend Development  
**Review Required**: Senior Frontend Architect approval before Week 2
