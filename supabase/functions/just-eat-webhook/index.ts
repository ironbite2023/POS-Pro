import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// Just Eat webhook payload interface
interface JustEatWebhookPayload {
  eventType: string; // "OrderPlaced", "OrderAccepted", "OrderCancelled"
  order: {
    orderId: string;
    friendlyOrderReference: string; // Display ID
    placedDate: string;
    requestedDeliveryDate?: string; // For pre-orders
    status: string;
    restaurant: {
      id: string;
      name: string;
    };
    customer: {
      name: string;
      phoneNumber?: string;
      address: {
        street: string;
        city: string;
        postcode: string;
      };
    };
    basket: {
      items: Array<{
        productId: string;
        name: string;
        quantity: number;
        price: number;
        instructions?: string;
      }>;
      subTotal: number;
      deliveryCharge: number;
      total: number;
    };
    deliveryInstructions?: string;
    paymentMethod: string;
  };
}

serve(async (req: Request) => {
  console.log('[Just Eat Webhook] Request received');

  try {
    // 1. Extract organization ID from URL parameter (MULTI-TENANT)
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('org');
    
    if (!organizationId) {
      console.error('[Just Eat Webhook] Missing organization ID parameter');
      return new Response('Missing organization ID', { status: 400 });
    }

    // 2. Get raw body and signature for verification
    const signature = req.headers.get('X-JustEat-Signature');
    const rawBody = await req.text();

    if (!signature) {
      console.error('[Just Eat Webhook] Missing X-JustEat-Signature header');
      return new Response('Missing signature', { status: 401 });
    }

    // 3. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Find the platform integration by organization ID (MULTI-TENANT)
    const { data: integration, error: integrationError } = await supabaseClient
      .from('platform_integrations')
      .select('*')
      .eq('platform', 'just_eat')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      console.error('[Just Eat Webhook] Integration not found for organization:', organizationId);
      await addToRetryQueue(supabaseClient, 'just_eat', rawBody, req.headers);
      return new Response(
        JSON.stringify({ error: 'Integration not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Get organization-specific credentials for signature verification
    const credentials = integration.credentials as any;
    const webhookSecret = credentials?.webhook_secret || credentials?.api_token;
    
    if (!webhookSecret) {
      console.error('[Just Eat Webhook] No webhook secret found for organization');
      return new Response('Missing webhook credentials', { status: 401 });
    }

    // 6. Verify webhook signature using organization-specific secret
    const computedSignature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== computedSignature) {
      console.error('[Just Eat Webhook] Invalid signature for organization:', organizationId);
      return new Response('Invalid signature', { status: 401 });
    }

    console.log('[Just Eat Webhook] Signature verified for organization:', organizationId);

    // 7. Parse the payload after verification
    const payload: JustEatWebhookPayload = JSON.parse(rawBody);
    console.log('[Just Eat Webhook] Event type:', payload.eventType, 'for organization:', organizationId);

    // 8. Handle different event types
    if (payload.eventType === 'OrderPlaced') {
      await processNewOrder(supabaseClient, integration, payload.order);
      
      // Calculate acceptance timeout based on delivery date
      const timeoutInfo = calculateAcceptanceTimeout(
        payload.order.placedDate,
        payload.order.requestedDeliveryDate
      );
      
      console.log(`[Just Eat] Must accept within ${timeoutInfo.timeout} ${timeoutInfo.unit}`);
      
      // Auto-accept logic based on settings and order type
      const settings = integration.settings as { auto_accept_orders?: boolean, auto_accept_same_day?: boolean } || {};
      
      if (settings.auto_accept_orders || (timeoutInfo.unit === 'minutes' && settings.auto_accept_same_day)) {
        console.log('[Just Eat] Auto-accepting order immediately');
        // Auto-accept implementation would go here
      } else if (timeoutInfo.unit === 'minutes' && timeoutInfo.timeout <= 15) {
        // Set timeout for same-day orders (most critical)
        console.log(`[Just Eat] Setting ${timeoutInfo.timeout - 2}-minute auto-accept timeout`);
        setTimeout(async () => {
          await autoAcceptIfPending(supabaseClient, payload.order.orderId);
        }, (timeoutInfo.timeout - 2) * 60 * 1000); // 2-minute buffer
      }
      
    } else if (payload.eventType === 'OrderAccepted') {
      await updateOrderStatus(supabaseClient, payload.order.orderId, 'accepted');
    } else if (payload.eventType === 'OrderCancelled') {
      await cancelOrder(supabaseClient, payload.order.orderId);
    }

    return new Response(
      JSON.stringify({ success: true }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Just Eat Webhook] Processing failed:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Calculate acceptance timeout based on order timing
function calculateAcceptanceTimeout(
  placedDate: string, 
  deliveryDate?: string
): { timeout: number; unit: string } {
  const placed = new Date(placedDate);
  const delivery = deliveryDate ? new Date(deliveryDate) : placed;
  const hoursUntilDelivery = (delivery.getTime() - placed.getTime()) / (1000 * 60 * 60);

  if (!deliveryDate || hoursUntilDelivery < 24) {
    return { timeout: 15, unit: 'minutes' }; // Same-day: 15 minutes
  } else if (hoursUntilDelivery < 48) {
    return { timeout: 2, unit: 'hours' }; // <24hrs: 2 hours
  } else {
    return { timeout: 24, unit: 'hours' }; // >48hrs: 24 hours
  }
}

// Helper function: Process new order
async function processNewOrder(
  supabaseClient: ReturnType<typeof createClient>,
  integration: any,
  order: JustEatWebhookPayload['order']
) {
  console.log('[Just Eat] Processing new order:', order.orderId);

  // Get the organization's first branch
  const { data: branches } = await supabaseClient
    .from('branches')
    .select('id')
    .eq('organization_id', integration.organization_id)
    .limit(1);

  const branchId = branches?.[0]?.id;
  if (!branchId) {
    throw new Error('No branch found for organization');
  }

  // Map Just Eat status to internal status
  const internalStatus = mapJustEatStatusToInternal(order.status);

  // Transform to unified order format
  const unifiedOrder = {
    organization_id: integration.organization_id,
    branch_id: branchId,
    platform_integration_id: integration.id,
    platform_order_id: order.orderId,
    delivery_platform: 'just_eat',
    order_number: order.friendlyOrderReference,
    order_type: order.requestedDeliveryDate ? 'pre_order' : 'delivery',
    status: internalStatus,
    customer_name: order.customer.name,
    customer_phone: order.customer.phoneNumber || null,
    total_amount: order.basket.total,
    subtotal: order.basket.subTotal,
    tax_amount: 0, // Just Eat includes tax in prices
    tip_amount: 0,
    delivery_fee: order.basket.deliveryCharge,
    payment_status: 'paid',
    payment_method: 'just_eat',
    raw_payload: order,
    platform_customer_info: {
      name: order.customer.name,
      phone: order.customer.phoneNumber,
      address: `${order.customer.address.street}, ${order.customer.address.city}, ${order.customer.address.postcode}`,
      deliveryInstructions: order.deliveryInstructions,
      platform: 'just_eat',
    },
    special_instructions: order.deliveryInstructions,
    created_at: order.placedDate,
    scheduled_for: order.requestedDeliveryDate || null, // For pre-orders
    updated_at: new Date().toISOString(),
  };

  // Insert order
  const { data: insertedOrder, error: orderError } = await supabaseClient
    .from('orders')
    .upsert(unifiedOrder, {
      onConflict: 'platform_integration_id,platform_order_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (orderError) {
    throw new Error(`Order upsert failed: ${orderError.message}`);
  }

  // Insert order items
  const orderItems = order.basket.items.map((item) => ({
    order_id: insertedOrder.id,
    organization_id: integration.organization_id,
    menu_item_id: null, // Map via platform_mappings later
    item_name: item.name,
    quantity: item.quantity,
    unit_price: item.price / item.quantity,
    line_total: item.price,
    special_instructions: item.instructions || null,
    modifiers: null, // Just Eat modifiers handled differently
  }));

  await supabaseClient.from('order_items').insert(orderItems);
  
  console.log('[Just Eat] New order processed successfully:', insertedOrder.id);
}

// Helper function: Update existing order status
async function updateOrderStatus(
  supabaseClient: ReturnType<typeof createClient>,
  orderId: string,
  status: string
) {
  const internalStatus = mapJustEatStatusToInternal(status);
  
  const { error } = await supabaseClient
    .from('orders')
    .update({ 
      status: internalStatus,
      updated_at: new Date().toISOString()
    })
    .eq('platform_order_id', orderId);

  if (error) {
    throw new Error(`Order update failed: ${error.message}`);
  }

  console.log('[Just Eat] Order status updated:', orderId, internalStatus);
}

// Helper function: Cancel order
async function cancelOrder(
  supabaseClient: ReturnType<typeof createClient>,
  orderId: string
) {
  const { error } = await supabaseClient
    .from('orders')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('platform_order_id', orderId);

  if (error) {
    throw new Error(`Order cancellation failed: ${error.message}`);
  }

  console.log('[Just Eat] Order cancelled:', orderId);
}

// Helper function: Auto-accept if order still pending
async function autoAcceptIfPending(
  supabaseClient: ReturnType<typeof createClient>,
  orderId: string
) {
  try {
    const { data: order } = await supabaseClient
      .from('orders')
      .select('status')
      .eq('platform_order_id', orderId)
      .single();
    
    if (order?.status === 'pending') {
      console.log('[Just Eat] Auto-accepting order due to timeout:', orderId);
      // Auto-accept implementation would call the client here
      await supabaseClient
        .from('orders')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('platform_order_id', orderId);
    }
  } catch (error) {
    console.error('[Just Eat] Auto-accept timeout failed:', error);
  }
}

// Helper function: Add failed webhook to retry queue
async function addToRetryQueue(
  supabaseClient: ReturnType<typeof createClient>,
  platform: string,
  payload: string,
  headers: Headers
) {
  try {
    await supabaseClient.from('webhook_processing_queue').insert({
      platform,
      webhook_payload: JSON.parse(payload),
      headers: Object.fromEntries(headers.entries()),
      next_attempt_at: new Date(Date.now() + 5000).toISOString(),
    });
    console.log('[Retry Queue] Added webhook to retry queue');
  } catch (error) {
    console.error('[Retry Queue] Failed to add to queue:', error);
  }
}

// Helper function: Map Just Eat status to internal status
function mapJustEatStatusToInternal(justEatStatus: string): string {
  const statusMap: Record<string, string> = {
    'new': 'pending',
    'acknowledged': 'confirmed',
    'accepted': 'confirmed', 
    'cooking': 'preparing',
    'ready': 'ready',
    'collected': 'out_for_delivery',
    'delivered': 'completed',
    'cancelled': 'cancelled',
    'rejected': 'cancelled',
  };
  
  return statusMap[justEatStatus] || 'pending';
}
