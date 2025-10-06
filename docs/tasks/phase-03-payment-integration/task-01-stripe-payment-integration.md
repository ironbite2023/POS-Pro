# Task 3.1: Stripe Payment Integration

**Task ID**: TASK-03-001  
**Phase**: 3 - Payment Integration  
**Priority**: 🔴 P1 - High  
**Estimated Time**: 1-2 weeks  
**Complexity**: 🔴 High  
**Status**: 📋 Not Started

---

## 1. Detailed Request Analysis

### What is Being Requested

Implement complete Stripe payment processing integration for the POS system:
- Credit card payment processing with Stripe Elements
- Payment intent creation and confirmation
- Webhook handling for payment status updates
- Refund processing and management
- Receipt generation with payment details
- Payment analytics and reporting

### Current State
- Checkout page has basic payment method selection (cash/card)
- No actual payment processing implemented
- No integration with payment providers
- Manual payment status updates
- No refund capabilities

### Target State
- Complete Stripe payment processing
- Secure card payment handling with PCI compliance
- Automated payment status updates via webhooks
- Comprehensive refund management
- Payment analytics and reconciliation
- Integration with order management system

### Affected Files
```
src/app/(pos)/checkout/page.tsx (major updates)
src/app/api/payments/
├── intent/route.ts
├── confirm/route.ts
├── refund/route.ts
└── webhook/route.ts

src/components/payment/
├── StripePaymentForm.tsx
├── PaymentMethodSelector.tsx
├── PaymentStatus.tsx
├── RefundDialog.tsx
└── PaymentReceipt.tsx

src/lib/services/
└── payment.service.ts

src/lib/stripe/
├── client.ts
└── server.ts

.env.local (payment keys)
```

---

## 2. Justification and Benefits

### Why This Task is Critical

**Business Value**:
- ✅ Enable card payment acceptance (primary revenue source)
- ✅ PCI compliance for secure payment processing
- ✅ Professional customer checkout experience
- ✅ Automated payment reconciliation
- ✅ Reduced cash handling and theft risk

**Technical Benefits**:
- ✅ Establishes secure payment architecture
- ✅ Validates webhook handling patterns
- ✅ Tests PCI compliance requirements
- ✅ Proves integration with external APIs

**User Impact**:
- ✅ Customers can pay with cards
- ✅ Staff process payments efficiently
- ✅ Managers track payment performance
- ✅ Automated receipt generation

### Problems It Solves
1. **Cash-Only Operations**: Limited payment options for customers
2. **Manual Processing**: No automated payment handling
3. **Security Risks**: Cash-only operations increase theft risk
4. **No Payment Records**: Limited payment audit trail
5. **Customer Experience**: Modern customers expect card payment options

---

## 3. Prerequisites

### Knowledge Requirements
- ✅ Stripe API and payment flow concepts
- ✅ PCI DSS compliance requirements
- ✅ Webhook handling and security
- ✅ Payment state management
- ✅ Refund and dispute processes

### Technical Prerequisites
- ✅ Task 1.4 (POS Operations) completed
- ✅ Order management system working
- ✅ Supabase database for payment records
- ✅ HTTPS enabled for production (required by Stripe)
- ✅ Environment variables securely configured

### Business Prerequisites
- ✅ Stripe account created and verified
- ✅ Business information verified with Stripe
- ✅ Bank account connected for payouts
- ✅ Test mode keys for development
- ✅ Production keys for deployment

### Dependencies
```json
{
  "@stripe/stripe-js": "^2.x",
  "@stripe/react-stripe-js": "^2.x",
  "stripe": "^14.x",
  "micro": "^10.x"
}
```

---

## 4. Implementation Methodology

### Step 1: Setup Stripe Configuration (2-3 hours)

#### 1.1 Install Stripe Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```

#### 1.2 Create Stripe Client Configuration

```typescript
// src/lib/stripe/client.ts
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('Missing Stripe publishable key');
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export default getStripe;
```

#### 1.3 Create Stripe Server Configuration

```typescript
// src/lib/stripe/server.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export default stripe;
```

#### 1.4 Update Environment Variables

```bash
# Add to .env.local
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

**Success Criteria**:
- ✅ Stripe packages installed correctly
- ✅ Configuration files created
- ✅ Environment variables set up
- ✅ No TypeScript errors

---

### Step 2: Create Payment Service Layer (3-4 hours)

#### 2.1 Create `src/lib/services/payment.service.ts`

```typescript
import stripe from '@/lib/stripe/server';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

type PaymentIntent = Database['public']['Tables']['payment_intents']['Row'];
type PaymentIntentInsert = Database['public']['Tables']['payment_intents']['Insert'];

export interface CreatePaymentIntentParams {
  orderId: string;
  amount: number; // in cents
  currency: string;
  customerId?: string;
  automaticPaymentMethods?: boolean;
}

export interface RefundPaymentParams {
  paymentIntentId: string;
  amount?: number; // in cents, if partial refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

export const paymentService = {
  /**
   * Create a payment intent with Stripe
   */
  createPaymentIntent: async (params: CreatePaymentIntentParams) => {
    try {
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        customer: params.customerId,
        automatic_payment_methods: {
          enabled: params.automaticPaymentMethods ?? true,
        },
        metadata: {
          orderId: params.orderId,
        },
      });

      // Store payment intent in database
      const { data: dbPaymentIntent, error } = await supabase
        .from('payment_intents')
        .insert({
          stripe_payment_intent_id: paymentIntent.id,
          order_id: params.orderId,
          amount: params.amount,
          currency: params.currency,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        dbRecord: dbPaymentIntent,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  /**
   * Confirm a payment intent (called after customer confirms payment)
   */
  confirmPaymentIntent: async (paymentIntentId: string) => {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Update database with confirmed status
      const { error } = await supabase
        .from('payment_intents')
        .update({
          status: paymentIntent.status,
          confirmed_at: paymentIntent.status === 'succeeded' ? new Date().toISOString() : null,
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (error) throw error;

      // If payment succeeded, update order payment status
      if (paymentIntent.status === 'succeeded') {
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            payment_method: 'card',
            status: 'preparing',
          })
          .eq('id', paymentIntent.metadata.orderId);

        if (orderError) throw orderError;
      }

      return paymentIntent;
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      throw error;
    }
  },

  /**
   * Process a refund
   */
  refundPayment: async (params: RefundPaymentParams) => {
    try {
      // Create refund with Stripe
      const refund = await stripe.refunds.create({
        payment_intent: params.paymentIntentId,
        amount: params.amount, // If undefined, refunds full amount
        reason: params.reason,
      });

      // Update payment intent status in database
      const { error } = await supabase
        .from('payment_intents')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_amount: refund.amount,
        })
        .eq('stripe_payment_intent_id', params.paymentIntentId);

      if (error) throw error;

      // Update order status if fully refunded
      if (!params.amount || refund.amount === refund.charge) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'refunded',
            status: 'cancelled',
          })
          .eq('payment_intent_id', params.paymentIntentId);

        if (orderError) throw orderError;
      }

      return refund;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  },

  /**
   * Get payment intent by ID
   */
  getPaymentIntent: async (paymentIntentId: string): Promise<PaymentIntent | null> => {
    const { data, error } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (error) {
      console.error('Error fetching payment intent:', error);
      return null;
    }

    return data;
  },

  /**
   * Get payment analytics
   */
  getPaymentAnalytics: async (organizationId: string, branchId?: string) => {
    try {
      let query = supabase
        .from('payment_intents')
        .select(`
          *,
          orders!inner (
            organization_id,
            branch_id,
            created_at
          )
        `)
        .eq('orders.organization_id', organizationId)
        .eq('status', 'succeeded');

      if (branchId) {
        query = query.eq('orders.branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate metrics
      const totalProcessed = data?.length || 0;
      const totalAmount = data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const averagePayment = totalProcessed > 0 ? totalAmount / totalProcessed : 0;

      // Group by date for trends
      const paymentsByDate = data?.reduce((acc, payment) => {
        const date = payment.orders.created_at.split('T')[0];
        acc[date] = (acc[date] || 0) + payment.amount;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalProcessed,
        totalAmount,
        averagePayment,
        paymentsByDate,
        rawData: data,
      };
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      throw error;
    }
  },
};
```

**Success Criteria**:
- ✅ Payment service methods work correctly
- ✅ Stripe integration functional
- ✅ Database operations succeed
- ✅ Error handling comprehensive

---

### Step 3: Create Payment API Routes (3-4 hours)

#### 3.1 Create `src/app/api/payments/intent/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment.service';
import { orderService } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, customerId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Create payment intent
    const paymentData = await paymentService.createPaymentIntent({
      orderId: order.id,
      amount: Math.round(order.total_amount * 100), // Convert to cents
      currency: 'usd',
      customerId,
    });

    return NextResponse.json({
      clientSecret: paymentData.clientSecret,
      paymentIntentId: paymentData.paymentIntentId,
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
```

#### 3.2 Create `src/app/api/payments/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe from '@/lib/stripe/server';
import { paymentService } from '@/lib/services/payment.service';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        await paymentService.confirmPaymentIntent(paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
        
        // Update payment status in database
        await supabase
          .from('payment_intents')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object;
        console.log('Dispute created:', dispute.id);
        
        // Handle dispute (implementation needed)
        // Could send notification to admin
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
```

#### 3.3 Create `src/app/api/payments/refund/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, amount, reason } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const refund = await paymentService.refundPayment({
      paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
      reason: reason || 'requested_by_customer',
    });

    return NextResponse.json({
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
    });
  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}
```

**Success Criteria**:
- ✅ API routes handle Stripe operations correctly
- ✅ Webhook validation works
- ✅ Payment intents create successfully
- ✅ Refund processing functional

---

### Step 4: Create Payment Components (4-5 hours)

#### 4.1 Create `src/components/payment/StripePaymentForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { 
  Box, 
  Button, 
  Text, 
  Flex,
  Card,
  Spinner 
} from '@radix-ui/themes';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { toast } from 'sonner';

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
}

function PaymentForm({ clientSecret, amount, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed');
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
        toast.success('Payment successful!');
      }
    } catch (err: any) {
      onError(err.message || 'Payment processing failed');
      toast.error('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <Card>
          <Box className="p-4">
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
              }}
            />
          </Box>
        </Card>

        <Flex justify="between" align="center">
          <Text size="4" weight="bold">
            Total: ${(amount / 100).toFixed(2)}
          </Text>
          
          <Button 
            type="submit" 
            size="3"
            disabled={!stripe || !elements || isProcessing}
            className="min-w-32"
          >
            {isProcessing ? (
              <Flex align="center" gap="2">
                <Spinner size="1" />
                Processing...
              </Flex>
            ) : (
              `Pay $${(amount / 100).toFixed(2)}`
            )}
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0066cc',
          },
        },
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  );
}
```

#### 4.2 Create `src/components/payment/PaymentMethodSelector.tsx`

```typescript
'use client';

import { useState } from 'react';
import { 
  Card, 
  Button, 
  Text, 
  Flex, 
  Box,
  RadioGroup,
  Radio
} from '@radix-ui/themes';
import { CreditCard, DollarSign, Smartphone } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
}

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: string) => void;
  selectedMethod?: string;
}

export default function PaymentMethodSelector({ 
  onMethodSelect,
  selectedMethod = 'card' 
}: PaymentMethodSelectorProps) {
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard size={24} />,
      description: 'Visa, Mastercard, American Express',
      enabled: true,
    },
    {
      id: 'cash',
      name: 'Cash',
      icon: <DollarSign size={24} />,
      description: 'Cash payment',
      enabled: true,
    },
    {
      id: 'digital_wallet',
      name: 'Digital Wallet',
      icon: <Smartphone size={24} />,
      description: 'Apple Pay, Google Pay',
      enabled: false, // Will be enabled when implemented
    },
  ];

  return (
    <Box>
      <Text size="4" weight="medium" className="mb-4">Select Payment Method</Text>
      
      <RadioGroup.Root 
        value={selectedMethod} 
        onValueChange={onMethodSelect}
      >
        <Flex direction="column" gap="3">
          {paymentMethods.map((method) => (
            <Card 
              key={method.id}
              className={`cursor-pointer transition-colors ${
                !method.enabled ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                selectedMethod === method.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <Flex align="center" gap="3" className="p-4">
                <RadioGroup.Item 
                  value={method.id} 
                  disabled={!method.enabled}
                />
                
                <Box className="text-gray-600">
                  {method.icon}
                </Box>
                
                <Box className="flex-1">
                  <Text size="3" weight="medium">
                    {method.name}
                  </Text>
                  <Text size="2" color="gray">
                    {method.description}
                  </Text>
                </Box>

                {!method.enabled && (
                  <Text size="1" color="gray">
                    Coming Soon
                  </Text>
                )}
              </Flex>
            </Card>
          ))}
        </Flex>
      </RadioGroup.Root>
    </Box>
  );
}
```

**Success Criteria**:
- ✅ Payment forms render correctly
- ✅ Stripe Elements integration works
- ✅ Payment method selection functional
- ✅ UI matches design system

---

### Step 5: Update Checkout Process (2-3 hours)

#### 5.1 Major Update to `src/app/(pos)/checkout/page.tsx`

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
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import StripePaymentForm from '@/components/payment/StripePaymentForm';
import { toast } from 'sonner';

export default function CheckoutPage() {
  usePageTitle('Checkout');
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [clientSecret, setClientSecret] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

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
  }, [orderId, router]);

  // Create payment intent when card payment selected
  useEffect(() => {
    if (!order || paymentMethod !== 'card') return;

    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error);
        }

        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast.error('Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [order, paymentMethod]);

  const handleCashPayment = async () => {
    if (!order) return;

    try {
      setProcessingPayment(true);

      await orderService.updateOrder(order.id, {
        payment_status: 'completed',
        payment_method: 'cash',
        status: 'preparing',
      });

      toast.success('Payment completed successfully!');
      
      setTimeout(() => {
        router.push('/order');
      }, 2000);
    } catch (error) {
      console.error('Error processing cash payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      // Payment is already confirmed via webhook
      // Just show success and redirect
      toast.success('Payment completed successfully!');
      
      setTimeout(() => {
        router.push('/order');
      }, 2000);
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  if (loading) {
    return (
      <Container size="3" className="py-8">
        <Text>Loading order...</Text>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container size="3" className="py-8">
        <Text>Order not found</Text>
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

        {/* Payment Method Selection */}
        <PaymentMethodSelector
          selectedMethod={paymentMethod}
          onMethodSelect={setPaymentMethod}
        />

        {/* Payment Processing */}
        {paymentMethod === 'cash' && (
          <Card>
            <Flex direction="column" gap="4" className="p-4">
              <Text size="3" weight="medium">Cash Payment</Text>
              <Text size="2" color="gray">
                Accept cash payment and mark order as paid
              </Text>
              <Button
                size="3"
                onClick={handleCashPayment}
                disabled={processingPayment}
              >
                {processingPayment ? 'Processing...' : 'Confirm Cash Payment'}
              </Button>
            </Flex>
          </Card>
        )}

        {paymentMethod === 'card' && clientSecret && (
          <Card>
            <Box className="p-4">
              <Text size="3" weight="medium" className="mb-4">Card Payment</Text>
              <StripePaymentForm
                clientSecret={clientSecret}
                amount={Math.round(order.total_amount * 100)}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Box>
          </Card>
        )}

        {paymentMethod === 'card' && !clientSecret && (
          <Card>
            <Box className="p-4 text-center">
              <Spinner size="3" />
              <Text size="2" color="gray" className="block mt-2">
                Initializing payment...
              </Text>
            </Box>
          </Card>
        )}
      </Flex>
    </Container>
  );
}
```

**Success Criteria**:
- ✅ Checkout page integrates payment processing
- ✅ Both cash and card payments work
- ✅ Payment UI follows design system
- ✅ Error handling comprehensive

---

### Step 6: Testing and Security (2-3 hours)

#### 6.1 Payment Testing Checklist

```
Stripe Integration:
- [ ] Payment intent creation works
- [ ] Card payment processing successful
- [ ] Webhook events received and processed
- [ ] Payment confirmation updates order status
- [ ] Failed payments handled gracefully

Cash Payments:
- [ ] Cash payment option available
- [ ] Cash payment updates order status correctly
- [ ] Receipt generation works for cash payments

Refunds:
- [ ] Full refunds process correctly
- [ ] Partial refunds work properly
- [ ] Refund status updates in database
- [ ] Order status changes appropriately

Security:
- [ ] Payment data never stored in frontend
- [ ] Webhook signature validation works
- [ ] Environment variables secure
- [ ] PCI compliance maintained

Error Handling:
- [ ] Network failures handled gracefully
- [ ] Invalid payment methods rejected
- [ ] Timeout scenarios managed
- [ ] User feedback clear and helpful
```

---

## 5. Success Criteria

### Functional Requirements
- ✅ **Card Payments**: Secure credit/debit card processing
- ✅ **Cash Payments**: Manual cash payment confirmation
- ✅ **Refunds**: Full and partial refund processing
- ✅ **Receipts**: Payment details on receipts
- ✅ **Analytics**: Payment performance tracking
- ✅ **Order Integration**: Payment status updates orders

### Security Requirements
- ✅ **PCI Compliance**: No sensitive card data stored
- ✅ **Webhook Security**: Signature verification implemented
- ✅ **Environment Security**: Keys properly secured
- ✅ **Data Protection**: Payment data encrypted in transit

### Business Requirements
- ✅ **Revenue Processing**: Payments reach merchant account
- ✅ **Reconciliation**: Payment records match orders
- ✅ **Customer Experience**: Smooth payment flow
- ✅ **Staff Efficiency**: Easy payment processing

---

## 6. Deliverables

### Code Files
```
✅ src/lib/stripe/client.ts (new)
✅ src/lib/stripe/server.ts (new)
✅ src/lib/services/payment.service.ts (new)
✅ src/app/api/payments/intent/route.ts (new)
✅ src/app/api/payments/webhook/route.ts (new)
✅ src/app/api/payments/refund/route.ts (new)
✅ src/components/payment/StripePaymentForm.tsx (new)
✅ src/components/payment/PaymentMethodSelector.tsx (new)
✅ src/app/(pos)/checkout/page.tsx (major update)
```

### Configuration
```
✅ Stripe account setup
✅ Webhook endpoint configured
✅ Environment variables added
✅ Database schema for payment_intents table
```

---

## 7. Rollback Plan

If payment integration fails:
1. Disable card payments temporarily
2. Keep cash payments functional
3. Debug Stripe configuration separately
4. Test webhook handling in isolation
5. Re-enable card payments once stable

---

## 8. Next Steps After Completion

1. **Apple Pay/Google Pay**: Add digital wallet support
2. **Subscription Billing**: For SaaS revenue (future)
3. **Payment Analytics**: Advanced payment reporting
4. **Move to Next Task**: Security Hardening (Task 6.1)

---

**Status**: 📋 Ready to Start  
**Dependencies**: Task 1.4 (POS Operations), orderService  
**Blocked By**: POS Operations must be completed first  
**Blocks**: Advanced payment features, subscription billing
