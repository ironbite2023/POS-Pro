'use client';

import { useState, useEffect, Suspense } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Button, 
  Card, 
  Text,
  Box,
  Separator,
  Spinner
} from '@radix-ui/themes';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ordersService } from '@/lib/services';
import { toast } from 'sonner';
import ReceiptGenerator from '@/components/pos/ReceiptGenerator';
import type { Database } from '@/lib/supabase/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface OrderItemWithMenu extends OrderItem {
  menu_items?: MenuItem | null;
}

interface OrderWithItems extends Order {
  order_items?: OrderItemWithMenu[];
}

function CheckoutContent() {
  usePageTitle('Checkout');
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push('/order');
      return;
    }

    const fetchOrder = async () => {
      try {
        const orderData = await ordersService.getOrderById(orderId);
        setOrder(orderData as OrderWithItems);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Order not found');
        router.push('/order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const handlePayment = async (paymentMethod: 'cash' | 'card') => {
    if (!order) return;

    try {
      setProcessing(true);

      // Update payment status
      await ordersService.updatePaymentStatus(
        order.id,
        'paid',
        paymentMethod
      );

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
    return (
      <Container size="3">
        <Flex justify="center" align="center" className="h-screen">
          <Spinner size="3" />
        </Flex>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container size="3">
        <Flex justify="center" align="center" className="h-screen">
          <Text>Order not found</Text>
        </Flex>
      </Container>
    );
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

            {/* Customer Info */}
            {order.customer_name && (
              <Box>
                <Text size="2" color="gray">Customer: {order.customer_name}</Text>
                {order.customer_phone && (
                  <Text size="2" color="gray" className="block">Phone: {order.customer_phone}</Text>
                )}
                {order.table_number && (
                  <Text size="2" color="gray" className="block">Table: {order.table_number}</Text>
                )}
              </Box>
            )}

            <Separator />

            {/* Order Items */}
            <Box>
              {order.order_items?.map((item, index) => (
                <Flex key={index} justify="between" className="py-2">
                  <Box>
                    <Text weight="medium">
                      {item.quantity}x {item.menu_items?.name || item.item_name}
                    </Text>
                    {item.special_instructions && (
                      <Text size="1" color="blue" className="block">Note: {item.special_instructions}</Text>
                    )}
                  </Box>
                  <Text>${item.line_total.toFixed(2)}</Text>
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
              {order.discount_amount > 0 && (
                <Flex justify="between">
                  <Text>Discount:</Text>
                  <Text color="red">-${order.discount_amount.toFixed(2)}</Text>
                </Flex>
              )}
              {order.tip_amount > 0 && (
                <Flex justify="between">
                  <Text>Tip:</Text>
                  <Text>${order.tip_amount.toFixed(2)}</Text>
                </Flex>
              )}
              <Separator />
              <Flex justify="between">
                <Text size="4" weight="bold">Total:</Text>
                <Text size="4" weight="bold">${order.total_amount.toFixed(2)}</Text>
              </Flex>
            </Flex>
          </Flex>
        </Card>

        {/* Payment Options */}
        {order.payment_status !== 'paid' && (
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

              {processing && (
                <Flex justify="center">
                  <Spinner size="2" />
                </Flex>
              )}
            </Flex>
          </Card>
        )}

        {/* Receipt */}
        {order.payment_status === 'paid' && (
          <ReceiptGenerator order={order} />
        )}
      </Flex>
    </Container>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <Container size="3">
          <Flex justify="center" align="center" className="h-screen">
            <Spinner size="3" />
          </Flex>
        </Container>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}