# Task 1.4: POS Operations Integration

**Task ID**: TASK-01-004  
**Phase**: 1 - Frontend Integration  
**Priority**: 🔴 P0 - Critical  
**Estimated Time**: 4-5 days  
**Complexity**: 🔴 High  
**Status**: 📋 Not Started

---

## 1. Detailed Request Analysis

### What is Being Requested

Replace mock data in POS operations with real Supabase API calls, implementing:
- Order entry system with menu browsing and cart management
- Checkout process with order totals and customer information
- Kitchen display system with real-time order tracking
- Order status management and completion workflow
- Receipt generation and printing

### Current State
- POS pages use mock data from `LiveOrdersData.ts`
- Static order displays with no real functionality
- No connection to actual database
- No real-time updates between order entry and kitchen
- Mock checkout with no payment processing

### Target State
- Live order system connected to Supabase database
- Real-time order synchronization between POS and kitchen
- Dynamic menu loading with availability status
- Order cart with automatic total calculations
- Kitchen display with order status updates
- Receipt generation with order details

### Affected Files
```
src/app/(pos)/
├── order/page.tsx (Order Entry)
├── checkout/page.tsx (Checkout)
├── kitchen/page.tsx (Kitchen Display)
└── order-mobile/page.tsx (Mobile Order Entry)

src/components/pos/
├── MenuBrowser.tsx
├── OrderCart.tsx
├── CheckoutForm.tsx
├── KitchenOrderCard.tsx
├── OrderStatusButtons.tsx
└── ReceiptGenerator.tsx

src/data/
├── LiveOrdersData.ts (to be replaced)
└── MenuData.ts (already replaced in Task 1.2)
```

---

## 2. Justification and Benefits

### Why This Task is Critical

**Business Value**:
- ✅ Core revenue-generating functionality
- ✅ Real-time kitchen operations
- ✅ Accurate order tracking and fulfillment
- ✅ Professional customer-facing interface
- ✅ Foundation for payment processing

**Technical Benefits**:
- ✅ Validates orderService implementation
- ✅ Tests real-time data synchronization
- ✅ Proves cart state management
- ✅ Establishes pattern for complex workflows

**User Impact**:
- ✅ Staff can process orders efficiently
- ✅ Kitchen receives orders immediately
- ✅ Customers get accurate order status
- ✅ Reduces order errors and delays

### Problems It Solves
1. **No Order Processing**: Currently can't create real orders
2. **No Kitchen Communication**: No way to notify kitchen of new orders
3. **Static Menu**: Menu doesn't reflect real availability
4. **No Order Tracking**: Can't monitor order status
5. **Manual Processes**: Everything requires manual coordination

---

## 3. Prerequisites

### Knowledge Requirements
- ✅ Complex React state management
- ✅ Real-time subscriptions (Supabase Realtime)
- ✅ Shopping cart logic and calculations
- ✅ Form handling for checkout
- ✅ Print functionality for receipts
- ✅ Order workflow and status management

### Technical Prerequisites
- ✅ Task 1.1 (Dashboard Integration) completed
- ✅ Task 1.2 (Menu Management) completed
- ✅ orderService implemented (`src/lib/services/orders.service.ts`)
- ✅ menuService integrated and working
- ✅ Database schema for orders and order items deployed
- ✅ Real-time subscriptions enabled in Supabase

### Environment Prerequisites
- ✅ Test menu items with correct pricing
- ✅ Organization and branch context working
- ✅ User authentication with proper permissions
- ✅ Kitchen display screen/device available for testing

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "zustand": "^4.x",
  "react-to-print": "^2.x"
}
```

---

## 4. Implementation Methodology

### Step 1: Create Order Cart Store (2-3 hours)

#### 1.1 Create `src/stores/orderCartStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Database } from '@/lib/supabase/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  modifiers: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  unitPrice: number;
  totalPrice: number;
}

interface OrderCartState {
  items: CartItem[];
  customerInfo: {
    name?: string;
    phone?: string;
    email?: string;
    table?: string;
  };
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  branchId?: string;
  
  // Actions
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateNotes: (cartItemId: string, notes: string) => void;
  setCustomerInfo: (info: Partial<OrderCartState['customerInfo']>) => void;
  setOrderType: (type: OrderCartState['orderType']) => void;
  setBranch: (branchId: string) => void;
  clearCart: () => void;
  
  // Computed
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useOrderCartStore = create<OrderCartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerInfo: {},
      orderType: 'dine_in',
      branchId: undefined,

      addItem: (menuItem, quantity = 1) => {
        const existingItemIndex = get().items.findIndex(
          item => item.menuItem.id === menuItem.id
        );

        if (existingItemIndex >= 0) {
          // Update existing item quantity
          set(state => ({
            items: state.items.map((item, index) => 
              index === existingItemIndex 
                ? { 
                    ...item, 
                    quantity: item.quantity + quantity,
                    totalPrice: (item.quantity + quantity) * item.unitPrice
                  }
                : item
            )
          }));
        } else {
          // Add new item
          const cartItem: CartItem = {
            id: `cart-${Date.now()}-${Math.random()}`,
            menuItem,
            quantity,
            notes: '',
            modifiers: [],
            unitPrice: menuItem.base_price,
            totalPrice: menuItem.base_price * quantity,
          };
          
          set(state => ({
            items: [...state.items, cartItem]
          }));
        }
      },

      removeItem: (cartItemId) => {
        set(state => ({
          items: state.items.filter(item => item.id !== cartItemId)
        }));
      },

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }

        set(state => ({
          items: state.items.map(item => 
            item.id === cartItemId 
              ? { 
                  ...item, 
                  quantity,
                  totalPrice: quantity * item.unitPrice
                }
              : item
          )
        }));
      },

      updateNotes: (cartItemId, notes) => {
        set(state => ({
          items: state.items.map(item => 
            item.id === cartItemId ? { ...item, notes } : item
          )
        }));
      },

      setCustomerInfo: (info) => {
        set(state => ({
          customerInfo: { ...state.customerInfo, ...info }
        }));
      },

      setOrderType: (orderType) => set({ orderType }),
      setBranch: (branchId) => set({ branchId }),

      clearCart: () => set({
        items: [],
        customerInfo: {},
        orderType: 'dine_in',
      }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.totalPrice, 0);
      },

      getTax: () => {
        const subtotal = get().getSubtotal();
        return subtotal * 0.1; // 10% tax rate (configurable)
      },

      getTotal: () => {
        return get().getSubtotal() + get().getTax();
      },
    }),
    {
      name: 'order-cart-storage',
      partialize: (state) => ({ 
        items: state.items,
        customerInfo: state.customerInfo,
        orderType: state.orderType,
        branchId: state.branchId,
      }),
    }
  )
);
```

#### 1.2 Create `src/hooks/useRealtimeOrders.ts`

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/lib/supabase/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

interface UseRealtimeOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: Error | null;
}

export const useRealtimeOrders = (statuses?: string[]): UseRealtimeOrdersReturn => {
  const { currentOrganization, currentBranch } = useOrganization();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentOrganization || !currentBranch) return;

    const fetchOrders = async () => {
      try {
        setError(null);
        
        let query = supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              menu_items (*)
            )
          `)
          .eq('organization_id', currentOrganization.id)
          .eq('branch_id', currentBranch.id)
          .order('created_at', { ascending: false });

        if (statuses && statuses.length > 0) {
          query = query.in('status', statuses);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `branch_id=eq.${currentBranch.id}`,
        },
        (payload) => {
          console.log('Order update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            fetchOrders(); // Refresh to get full order details
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => 
              prev.map(order => 
                order.id === payload.new.id 
                  ? { ...order, ...payload.new }
                  : order
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => 
              prev.filter(order => order.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization, currentBranch, statuses]);

  return { orders, loading, error };
};
```

**Success Criteria**:
- ✅ Cart store manages state correctly
- ✅ Real-time subscriptions work
- ✅ Orders sync between POS and kitchen
- ✅ Cart persists in localStorage

---

### Step 2: Create Order Entry Components (3-4 hours)

#### 2.1 Update `src/app/(pos)/order/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Flex, 
  Grid, 
  Card, 
  Button, 
  Text,
  Badge,
  Box,
  TextField,
  Tabs
} from '@radix-ui/themes';
import { Search, ShoppingCart, Plus } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMenuData } from '@/hooks/useMenuData';
import { useOrderCartStore } from '@/stores/orderCartStore';
import { useOrganization } from '@/contexts/OrganizationContext';
import MenuBrowser from '@/components/pos/MenuBrowser';
import OrderCart from '@/components/pos/OrderCart';
import Image from 'next/image';

export default function OrderEntryPage() {
  usePageTitle('Order Entry');
  const { categories, menuItems, loading } = useMenuData();
  const { currentBranch } = useOrganization();
  const cartStore = useOrderCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Set current branch in cart store
  useEffect(() => {
    if (currentBranch) {
      cartStore.setBranch(currentBranch.id);
    }
  }, [currentBranch]);

  const filteredMenuItems = menuItems.filter(item => {
    // Filter by category
    if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
      return false;
    }

    // Filter by search
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Only show available items
    return item.is_available;
  });

  return (
    <Box className="h-screen bg-gray-50">
      <Flex className="h-full">
        {/* Left Panel - Menu Browser */}
        <Box className="flex-1 p-4 overflow-y-auto">
          <Flex direction="column" gap="4">
            {/* Header */}
            <Flex justify="between" align="center">
              <Text size="6" weight="bold">Menu</Text>
              <TextField.Root
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              >
                <TextField.Slot>
                  <Search size={16} />
                </TextField.Slot>
              </TextField.Root>
            </Flex>

            {/* Categories */}
            <Tabs.Root 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
            >
              <Tabs.List>
                <Tabs.Trigger value="all">All Items</Tabs.Trigger>
                {categories.map(category => (
                  <Tabs.Trigger key={category.id} value={category.id}>
                    {category.name}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              <Tabs.Content value={selectedCategory} className="mt-4">
                {loading ? (
                  <Text>Loading menu items...</Text>
                ) : filteredMenuItems.length === 0 ? (
                  <Text color="gray">No items found</Text>
                ) : (
                  <Grid columns="4" gap="4">
                    {filteredMenuItems.map(item => (
                      <Card 
                        key={item.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => cartStore.addItem(item)}
                      >
                        <Flex direction="column" gap="2">
                          {item.image_url && (
                            <Box className="relative h-32 w-full">
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                style={{ objectFit: 'cover' }}
                                className="rounded"
                              />
                            </Box>
                          )}
                          
                          <Box>
                            <Text weight="medium" size="3">{item.name}</Text>
                            <Text size="2" color="gray" className="block">
                              {item.description}
                            </Text>
                            <Text weight="bold" size="4" className="block mt-2">
                              ${item.base_price.toFixed(2)}
                            </Text>
                          </Box>

                          <Button size="2">
                            <Plus size={14} />
                            Add to Order
                          </Button>
                        </Flex>
                      </Card>
                    ))}
                  </Grid>
                )}
              </Tabs.Content>
            </Tabs.Root>
          </Flex>
        </Box>

        {/* Right Panel - Order Cart */}
        <Box className="w-96 bg-white border-l p-4">
          <OrderCart />
        </Box>
      </Flex>
    </Box>
  );
}
```

#### 2.2 Create `src/components/pos/OrderCart.tsx`

```typescript
'use client';

import { 
  Flex, 
  Heading, 
  Button, 
  Card, 
  Text,
  IconButton,
  TextField,
  Select,
  Box,
  Separator
} from '@radix-ui/themes';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useOrderCartStore } from '@/stores/orderCartStore';
import { orderService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

export default function OrderCart() {
  const cartStore = useOrderCartStore();
  const { currentOrganization, currentBranch } = useOrganization();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      cartStore.removeItem(itemId);
    } else {
      cartStore.updateQuantity(itemId, newQuantity);
    }
  };

  const handlePlaceOrder = async () => {
    if (!currentOrganization || !currentBranch || cartStore.items.length === 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare order data
      const orderData = {
        organization_id: currentOrganization.id,
        branch_id: currentBranch.id,
        order_type: cartStore.orderType,
        customer_name: cartStore.customerInfo.name || 'Guest',
        customer_phone: cartStore.customerInfo.phone || null,
        customer_email: cartStore.customerInfo.email || null,
        table_number: cartStore.customerInfo.table || null,
        status: 'pending' as const,
        payment_status: 'pending' as const,
        subtotal: cartStore.getSubtotal(),
        tax_amount: cartStore.getTax(),
        total_amount: cartStore.getTotal(),
        items: cartStore.items.map(item => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          notes: item.notes || null,
          modifiers: item.modifiers,
        })),
      };

      const order = await orderService.createOrder(orderData);
      
      toast.success(`Order #${order.order_number} created successfully!`);
      cartStore.clearCart();
      
      // Navigate to checkout or kitchen depending on payment flow
      router.push(`/checkout?orderId=${order.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartStore.items.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" className="h-full">
        <ShoppingCart size={48} color="gray" />
        <Text size="3" color="gray" className="mt-4 text-center">
          Your order is empty
        </Text>
        <Text size="2" color="gray" className="text-center">
          Add items from the menu to get started
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" className="h-full">
      {/* Header */}
      <Flex justify="between" align="center" className="mb-4">
        <Heading size="5">Current Order</Heading>
        <Text size="2" color="gray">
          {cartStore.getTotalItems()} items
        </Text>
      </Flex>

      {/* Order Type Selection */}
      <Box className="mb-4">
        <Text size="2" weight="medium" className="mb-2">Order Type</Text>
        <Select.Root
          value={cartStore.orderType}
          onValueChange={(value) => cartStore.setOrderType(value as any)}
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="dine_in">Dine In</Select.Item>
            <Select.Item value="takeaway">Takeaway</Select.Item>
            <Select.Item value="delivery">Delivery</Select.Item>
          </Select.Content>
        </Select.Root>
      </Box>

      {/* Customer Info (conditional) */}
      {cartStore.orderType === 'dine_in' && (
        <Box className="mb-4">
          <Text size="2" weight="medium" className="mb-2">Table Number</Text>
          <TextField.Root
            placeholder="Table number"
            value={cartStore.customerInfo.table || ''}
            onChange={(e) => cartStore.setCustomerInfo({ table: e.target.value })}
          />
        </Box>
      )}

      {(cartStore.orderType === 'takeaway' || cartStore.orderType === 'delivery') && (
        <Flex direction="column" gap="2" className="mb-4">
          <TextField.Root
            placeholder="Customer name"
            value={cartStore.customerInfo.name || ''}
            onChange={(e) => cartStore.setCustomerInfo({ name: e.target.value })}
          />
          <TextField.Root
            placeholder="Phone number"
            value={cartStore.customerInfo.phone || ''}
            onChange={(e) => cartStore.setCustomerInfo({ phone: e.target.value })}
          />
        </Flex>
      )}

      {/* Cart Items */}
      <Box className="flex-1 overflow-y-auto mb-4">
        {cartStore.items.map(item => (
          <Card key={item.id} className="mb-3">
            <Flex justify="between" align="start">
              <Box className="flex-1">
                <Text weight="medium">{item.menuItem.name}</Text>
                <Text size="2" color="gray">${item.unitPrice.toFixed(2)} each</Text>
                {item.notes && (
                  <Text size="1" color="blue">Note: {item.notes}</Text>
                )}
              </Box>

              <Flex direction="column" align="end" gap="2">
                <Text weight="bold">${item.totalPrice.toFixed(2)}</Text>
                
                <Flex align="center" gap="2">
                  <IconButton
                    size="1"
                    variant="ghost"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  >
                    <Minus size={12} />
                  </IconButton>
                  
                  <Text size="2" weight="medium" className="min-w-8 text-center">
                    {item.quantity}
                  </Text>
                  
                  <IconButton
                    size="1"
                    variant="ghost"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    <Plus size={12} />
                  </IconButton>
                  
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="red"
                    onClick={() => cartStore.removeItem(item.id)}
                  >
                    <Trash2 size={12} />
                  </IconButton>
                </Flex>
              </Flex>
            </Flex>
          </Card>
        ))}
      </Box>

      {/* Order Summary */}
      <Box className="border-t pt-4">
        <Flex justify="between" className="mb-2">
          <Text>Subtotal:</Text>
          <Text>${cartStore.getSubtotal().toFixed(2)}</Text>
        </Flex>
        <Flex justify="between" className="mb-2">
          <Text>Tax:</Text>
          <Text>${cartStore.getTax().toFixed(2)}</Text>
        </Flex>
        <Separator className="my-2" />
        <Flex justify="between" className="mb-4">
          <Text size="4" weight="bold">Total:</Text>
          <Text size="4" weight="bold">${cartStore.getTotal().toFixed(2)}</Text>
        </Flex>

        <Button
          className="w-full"
          size="3"
          onClick={handlePlaceOrder}
          disabled={isSubmitting || cartStore.items.length === 0}
        >
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </Button>
      </Box>
    </Flex>
  );
}
```

**Success Criteria**:
- ✅ Order entry interface functional
- ✅ Cart management works correctly
- ✅ Order placement succeeds
- ✅ UI updates in real-time

---

### Step 3: Create Kitchen Display (2-3 hours)

#### 3.1 Update `src/app/(pos)/kitchen/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Grid,
  Card,
  Button,
  Text,
  Badge,
  Box
} from '@radix-ui/themes';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { orderService } from '@/lib/services';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function KitchenDisplayPage() {
  usePageTitle('Kitchen Display');
  const { orders, loading } = useRealtimeOrders(['pending', 'preparing']);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrder(orderId);
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getOrderPriority = (order) => {
    const createdAt = new Date(order.created_at);
    const now = new Date();
    const minutesAgo = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    
    if (minutesAgo > 20) return 'high';
    if (minutesAgo > 10) return 'medium';
    return 'normal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      default: return 'green';
    }
  };

  return (
    <Box className="min-h-screen bg-gray-100 p-4">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Header */}
          <Flex justify="between" align="center">
            <Heading size="8">Kitchen Display</Heading>
            <Text size="3" color="gray">
              {orders.length} active orders
            </Text>
          </Flex>

          {/* Orders Grid */}
          {loading ? (
            <Text>Loading orders...</Text>
          ) : orders.length === 0 ? (
            <Box className="text-center py-12">
              <CheckCircle size={64} color="green" className="mx-auto mb-4" />
              <Heading size="5" className="mb-2">All Caught Up!</Heading>
              <Text size="3" color="gray">No pending orders</Text>
            </Box>
          ) : (
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
              {orders.map(order => {
                const priority = getOrderPriority(order);
                const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });

                return (
                  <Card 
                    key={order.id}
                    className={`${priority === 'high' ? 'border-red-500 border-2' : ''}`}
                  >
                    <Flex direction="column" gap="3">
                      {/* Order Header */}
                      <Flex justify="between" align="center">
                        <Box>
                          <Text size="4" weight="bold">#{order.order_number}</Text>
                          <Text size="2" color="gray">{order.customer_name}</Text>
                        </Box>
                        
                        <Box className="text-right">
                          <Badge color={getPriorityColor(priority)}>
                            {priority === 'high' ? 'URGENT' : priority.toUpperCase()}
                          </Badge>
                          <Text size="1" color="gray" className="block">
                            {timeAgo}
                          </Text>
                        </Box>
                      </Flex>

                      {/* Order Items */}
                      <Box>
                        {order.order_items?.map((item, index) => (
                          <Flex key={index} justify="between" className="py-1">
                            <Box>
                              <Text weight="medium">{item.quantity}x {item.menu_items?.name}</Text>
                              {item.notes && (
                                <Text size="1" color="blue">Note: {item.notes}</Text>
                              )}
                            </Box>
                          </Flex>
                        ))}
                      </Box>

                      {/* Order Actions */}
                      <Flex gap="2">
                        {order.status === 'pending' && (
                          <Button
                            className="flex-1"
                            onClick={() => handleStatusUpdate(order.id, 'preparing')}
                            disabled={updatingOrder === order.id}
                          >
                            Start Cooking
                          </Button>
                        )}

                        {order.status === 'preparing' && (
                          <Button
                            className="flex-1"
                            color="green"
                            onClick={() => handleStatusUpdate(order.id, 'ready')}
                            disabled={updatingOrder === order.id}
                          >
                            Mark Ready
                          </Button>
                        )}
                      </Flex>

                      {/* Order Info */}
                      <Box className="text-sm text-gray-600">
                        <Flex justify="between">
                          <span>Type: {order.order_type}</span>
                          <span>Total: ${order.total_amount.toFixed(2)}</span>
                        </Flex>
                        {order.table_number && (
                          <Text size="1">Table: {order.table_number}</Text>
                        )}
                      </Box>
                    </Flex>
                  </Card>
                );
              })}
            </Grid>
          )}
        </Flex>
      </Container>
    </Box>
  );
}
```

**Success Criteria**:
- ✅ Kitchen display shows live orders
- ✅ Order status updates work
- ✅ Real-time synchronization between POS and kitchen
- ✅ Priority system based on order age

---

### Step 4: Create Checkout Process (2-3 hours)

#### 4.1 Update `src/app/(pos)/checkout/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Button, 
  Card, 
  Text,
  Box,
  Separator
} from '@radix-ui/themes';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { orderService } from '@/lib/services';
import { toast } from 'sonner';
import ReceiptGenerator from '@/components/pos/ReceiptGenerator';

export default function CheckoutPage() {
  usePageTitle('Checkout');
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push('/order');
      return;
    }

    const fetchOrder = async () => {
      try {
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Order not found');
        router.push('/order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handlePayment = async (paymentMethod: 'cash' | 'card') => {
    if (!order) return;

    try {
      setProcessing(true);

      // Update payment status
      await orderService.updateOrder(order.id, {
        payment_status: 'completed',
        payment_method: paymentMethod,
        status: 'preparing',
      });

      toast.success('Payment completed successfully!');
      
      // Navigate back to order entry
      setTimeout(() => {
        router.push('/order');
      }, 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <Text>Loading order...</Text>;
  }

  if (!order) {
    return <Text>Order not found</Text>;
  }

  return (
    <Container size="3">
      <Flex direction="column" gap="6" className="py-8">
        <Heading size="7" className="text-center">Checkout</Heading>

        {/* Order Summary */}
        <Card>
          <Flex direction="column" gap="4">
            <Flex justify="between" align="center">
              <Text size="5" weight="bold">Order #{order.order_number}</Text>
              <Text size="3">{order.order_type}</Text>
            </Flex>

            {/* Order Items */}
            <Box>
              {order.order_items?.map((item, index) => (
                <Flex key={index} justify="between" className="py-2">
                  <Box>
                    <Text weight="medium">
                      {item.quantity}x {item.menu_items?.name}
                    </Text>
                    {item.notes && (
                      <Text size="1" color="blue">Note: {item.notes}</Text>
                    )}
                  </Box>
                  <Text>${item.total_price.toFixed(2)}</Text>
                </Flex>
              ))}
            </Box>

            <Separator />

            {/* Totals */}
            <Flex direction="column" gap="2">
              <Flex justify="between">
                <Text>Subtotal:</Text>
                <Text>${order.subtotal.toFixed(2)}</Text>
              </Flex>
              <Flex justify="between">
                <Text>Tax:</Text>
                <Text>${order.tax_amount.toFixed(2)}</Text>
              </Flex>
              <Separator />
              <Flex justify="between">
                <Text size="4" weight="bold">Total:</Text>
                <Text size="4" weight="bold">${order.total_amount.toFixed(2)}</Text>
              </Flex>
            </Flex>
          </Flex>
        </Card>

        {/* Payment Options */}
        <Card>
          <Flex direction="column" gap="4">
            <Heading size="4">Payment Method</Heading>
            
            <Flex gap="4">
              <Button
                className="flex-1"
                size="3"
                onClick={() => handlePayment('cash')}
                disabled={processing}
              >
                Cash Payment
              </Button>
              
              <Button
                className="flex-1"
                size="3"
                variant="outline"
                onClick={() => handlePayment('card')}
                disabled={processing}
              >
                Card Payment
              </Button>
            </Flex>
          </Flex>
        </Card>

        {/* Receipt */}
        <ReceiptGenerator order={order} />
      </Flex>
    </Container>
  );
}
```

**Success Criteria**:
- ✅ Checkout page displays order correctly
- ✅ Payment methods work
- ✅ Order status updates properly
- ✅ Receipt generation functional

---

### Step 5: Testing and Integration (1-2 hours)

#### 5.1 Manual Testing Checklist
```
Order Entry:
- [ ] Menu items load from database
- [ ] Can add items to cart
- [ ] Cart calculations correct
- [ ] Customer info fields work
- [ ] Order type selection works
- [ ] Order placement succeeds

Kitchen Display:
- [ ] Orders appear in real-time
- [ ] Status updates work
- [ ] Priority system functional
- [ ] Order details complete
- [ ] Multiple orders display correctly

Checkout:
- [ ] Order summary correct
- [ ] Payment methods work
- [ ] Receipt generation works
- [ ] Status updates properly
- [ ] Navigation works correctly

Real-time Sync:
- [ ] Orders appear on kitchen immediately
- [ ] Status updates sync between screens
- [ ] Multiple users can work simultaneously
- [ ] No data loss or corruption
```

---

## 5. Success Criteria

### Functional Requirements
- ✅ **Order Entry**: Complete POS interface working
- ✅ **Kitchen Display**: Real-time order management
- ✅ **Checkout**: Payment processing and receipts
- ✅ **Real-time Sync**: Live updates between all components
- ✅ **Cart Management**: Persistent cart state
- ✅ **Order Tracking**: Full order lifecycle management

### Technical Requirements
- ✅ **No Mock Data**: All imports from `data/` folder removed
- ✅ **Real-time Updates**: Supabase subscriptions working
- ✅ **Type Safety**: Proper TypeScript types throughout
- ✅ **Error Handling**: Graceful error recovery
- ✅ **Performance**: Pages load and respond quickly

### Business Requirements
- ✅ **Order Accuracy**: Correct items and pricing
- ✅ **Kitchen Workflow**: Efficient order processing
- ✅ **Payment Flow**: Smooth checkout experience
- ✅ **Audit Trail**: All orders logged properly

---

## 6. Deliverables

### Code Files
```
✅ src/stores/orderCartStore.ts (new)
✅ src/hooks/useRealtimeOrders.ts (new)
✅ src/components/pos/MenuBrowser.tsx (new)
✅ src/components/pos/OrderCart.tsx (new)
✅ src/components/pos/KitchenOrderCard.tsx (new)
✅ src/components/pos/ReceiptGenerator.tsx (new)
✅ src/app/(pos)/order/page.tsx (updated)
✅ src/app/(pos)/kitchen/page.tsx (updated)
✅ src/app/(pos)/checkout/page.tsx (updated)
```

---

## 7. Rollback Plan

If integration fails:
1. Restore mock order data temporarily
2. Keep existing POS UI using mock data
3. Debug orderService and real-time subscriptions separately
4. Test cart store in isolation
5. Fix issues incrementally

---

## 8. Next Steps After Completion

1. **Payment Integration**: Integrate with Stripe (Task 3.1)
2. **Receipt Printing**: Add thermal printer support
3. **Order Modifications**: Allow order changes after placement
4. **Move to Next Task**: Sales & Reporting Integration (Task 1.5)

---

**Status**: 📋 Ready to Start  
**Dependencies**: Task 1.1 (Dashboard), Task 1.2 (Menu), orderService, menuService  
**Blocked By**: None  
**Blocks**: Task 2.1 (Realtime), Task 3.1 (Payment Integration)
