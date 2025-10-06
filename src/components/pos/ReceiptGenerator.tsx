'use client';

import { useRef } from 'react';
import { Button, Card, Flex, Box, Text, Separator } from '@radix-ui/themes';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
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

interface ReceiptGeneratorProps {
  order: OrderWithItems;
}

export default function ReceiptGenerator({ order }: ReceiptGeneratorProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Text size="4" weight="bold">Receipt</Text>
          <Button onClick={handlePrint} variant="outline">
            <Printer size={16} />
            Print Receipt
          </Button>
        </Flex>

        {/* Receipt Preview */}
        <Box 
          ref={receiptRef} 
          className="p-6 bg-white text-black"
          style={{ fontFamily: 'monospace' }}
        >
          {/* Header */}
          <Box className="text-center mb-4">
            <Text size="5" weight="bold" className="block">EatlyPOS</Text>
            <Text size="2" className="block">Restaurant POS System</Text>
            <Text size="1" className="block">Thank you for your order!</Text>
          </Box>

          <Separator className="my-4" />

          {/* Order Info */}
          <Box className="mb-4">
            <Flex justify="between" className="mb-1">
              <Text size="2" weight="bold">Order #:</Text>
              <Text size="2">{order.order_number}</Text>
            </Flex>
            <Flex justify="between" className="mb-1">
              <Text size="2" weight="bold">Date:</Text>
              <Text size="2">{format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}</Text>
            </Flex>
            <Flex justify="between" className="mb-1">
              <Text size="2" weight="bold">Type:</Text>
              <Text size="2">{order.order_type}</Text>
            </Flex>
            {order.customer_name && (
              <Flex justify="between" className="mb-1">
                <Text size="2" weight="bold">Customer:</Text>
                <Text size="2">{order.customer_name}</Text>
              </Flex>
            )}
            {order.table_number && (
              <Flex justify="between" className="mb-1">
                <Text size="2" weight="bold">Table:</Text>
                <Text size="2">{order.table_number}</Text>
              </Flex>
            )}
          </Box>

          <Separator className="my-4" />

          {/* Order Items */}
          <Box className="mb-4">
            <Text size="3" weight="bold" className="block mb-2">Items</Text>
            {order.order_items?.map((item, index) => (
              <Flex key={index} justify="between" className="mb-2">
                <Box className="flex-1">
                  <Text size="2">
                    {item.quantity}x {item.menu_items?.name || item.item_name}
                  </Text>
                  {item.special_instructions && (
                    <Text size="1" color="gray" className="block">
                      Note: {item.special_instructions}
                    </Text>
                  )}
                </Box>
                <Text size="2">${item.line_total.toFixed(2)}</Text>
              </Flex>
            ))}
          </Box>

          <Separator className="my-4" />

          {/* Totals */}
          <Box>
            <Flex justify="between" className="mb-1">
              <Text size="2">Subtotal:</Text>
              <Text size="2">${order.subtotal.toFixed(2)}</Text>
            </Flex>
            <Flex justify="between" className="mb-1">
              <Text size="2">Tax:</Text>
              <Text size="2">${order.tax_amount.toFixed(2)}</Text>
            </Flex>
            {order.discount_amount > 0 && (
              <Flex justify="between" className="mb-1">
                <Text size="2">Discount:</Text>
                <Text size="2" color="red">-${order.discount_amount.toFixed(2)}</Text>
              </Flex>
            )}
            {order.tip_amount > 0 && (
              <Flex justify="between" className="mb-1">
                <Text size="2">Tip:</Text>
                <Text size="2">${order.tip_amount.toFixed(2)}</Text>
              </Flex>
            )}
            <Separator className="my-2" />
            <Flex justify="between" className="mb-1">
              <Text size="3" weight="bold">Total:</Text>
              <Text size="3" weight="bold">${order.total_amount.toFixed(2)}</Text>
            </Flex>
          </Box>

          <Separator className="my-4" />

          {/* Payment Info */}
          {order.payment_status === 'paid' && (
            <Box className="mb-4">
              <Flex justify="between" className="mb-1">
                <Text size="2" weight="bold">Payment Status:</Text>
                <Text size="2" color="green">PAID</Text>
              </Flex>
              {order.payment_method && (
                <Flex justify="between" className="mb-1">
                  <Text size="2" weight="bold">Payment Method:</Text>
                  <Text size="2">{order.payment_method}</Text>
                </Flex>
              )}
            </Box>
          )}

          {/* Footer */}
          <Box className="text-center mt-4">
            <Text size="1" className="block">Visit us again!</Text>
            <Text size="1" className="block">www.eatlypos.com</Text>
          </Box>
        </Box>
      </Flex>
    </Card>
  );
}
