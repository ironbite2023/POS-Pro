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
import { ordersService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Json } from '@/lib/supabase/database.types';

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
      const order = await ordersService.createOrder({
        organizationId: currentOrganization.id,
        branchId: currentBranch.id,
        orderType: cartStore.orderType,
        customerName: cartStore.customerInfo.name || 'Guest',
        customerPhone: cartStore.customerInfo.phone || undefined,
        customerEmail: cartStore.customerInfo.email || undefined,
        tableNumber: cartStore.customerInfo.table || undefined,
        items: cartStore.items.map(item => ({
          menuItemId: item.menuItem.id,
          itemName: item.menuItem.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          specialInstructions: item.notes || undefined,
          modifiers: item.modifiers.length > 0 ? (item.modifiers as unknown as Json) : undefined,
        })),
      });
      
      toast.success(`Order #${order.order_number} created successfully!`);
      cartStore.clearCart();
      
      // Navigate to checkout
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
        <Text size="2" weight="medium" className="mb-2 block">Order Type</Text>
        <Select.Root
          value={cartStore.orderType}
          onValueChange={(value) => cartStore.setOrderType(value as 'dine_in' | 'takeout' | 'delivery')}
        >
          <Select.Trigger className="w-full" />
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
          <Text size="2" weight="medium" className="mb-2 block">Table Number</Text>
          <TextField.Root
            placeholder="Table number"
            value={cartStore.customerInfo.table || ''}
            onChange={(e) => cartStore.setCustomerInfo({ table: e.target.value })}
          />
        </Box>
      )}

      {(cartStore.orderType === 'takeout' || cartStore.orderType === 'delivery') && (
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
                  <Text size="1" color="blue" className="block">Note: {item.notes}</Text>
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
