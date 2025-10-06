import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Database } from '@/lib/supabase/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type OrderType = Database['public']['Enums']['order_type'];

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
  orderType: OrderType;
  branchId?: string;
  
  // Actions
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateNotes: (cartItemId: string, notes: string) => void;
  setCustomerInfo: (info: Partial<OrderCartState['customerInfo']>) => void;
  setOrderType: (type: OrderType) => void;
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

      addItem: (menuItem: MenuItem, quantity = 1) => {
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

      removeItem: (cartItemId: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== cartItemId)
        }));
      },

      updateQuantity: (cartItemId: string, quantity: number) => {
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

      updateNotes: (cartItemId: string, notes: string) => {
        set(state => ({
          items: state.items.map(item => 
            item.id === cartItemId ? { ...item, notes } : item
          )
        }));
      },

      setCustomerInfo: (info: Partial<OrderCartState['customerInfo']>) => {
        set(state => ({
          customerInfo: { ...state.customerInfo, ...info }
        }));
      },

      setOrderType: (orderType: OrderType) => set({ orderType }),
      setBranch: (branchId: string) => set({ branchId }),

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
