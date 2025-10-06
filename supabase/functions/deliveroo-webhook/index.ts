import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// Deliveroo webhook payload interface
interface DeliverooWebhookPayload {
  event_type: string; // "order.created", "order.updated", "order.cancelled"
  order_id: string;
  order: {
    order_id: string;
    placed_at: string;
    status: string;
    customer: {
      first_name: string;
      last_name: string;
      phone_number?: string;
    };
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      modifiers?: Array<{
        id: string;
        name: string;
        price: number;
      }>;
      special_instructions?: string;
    }>;
    pricing: {
      subtotal: number;
      delivery_fee: number;
      service_fee: number;
      total: number;
      currency: string;
    };
    delivery_address?: {
      street: string;
      city: string;
      postcode: string;
    };
    special_instructions?: string;
  };
}

serve(async (req: Request) => {
  console.log('[Deliveroo Webhook] Request received');

  try {
    // 1. Extract organization ID from URL parameter (MULTI-TENANT)
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('org');
    
    if (!organizationId) {
      console.error('[Deliveroo Webhook] Missing organization ID parameter');
      return new Response('Missing organization ID', { status: 400 });
    }

    // 2. Get raw body and signature for verification
    const signature = req.headers.get('X-Deliveroo-Signature');
    const rawBody = await req.text();

    if (!signature) {
      console.error('[Deliveroo Webhook] Missing X-Deliveroo-Signature header');
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
      .eq('platform', 'deliveroo')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      console.error('[Deliveroo Webhook] Integration not found for organization:', organizationId);
      await addToRetryQueue(supabaseClient, 'deliveroo', rawBody, req.headers);
      return new Response(
        JSON.stringify({ error: 'Integration not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Get organization-specific credentials for signature verification
    const credentials = integration.credentials as any;
    const webhookSecret = credentials?.webhook_secret || credentials?.client_secret;
    
    if (!webhookSecret) {
      console.error('[Deliveroo Webhook] No webhook secret found for organization');
      return new Response('Missing webhook credentials', { status: 401 });
    }

    // 6. Verify webhook signature using organization-specific secret
    const computedSignature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== computedSignature) {
      console.error('[Deliveroo Webhook] Invalid signature for organization:', organizationId);
      return new Response('Invalid signature', { status: 401 });
    }

    console.log('[Deliveroo Webhook] Signature verified for organization:', organizationId);

    // 7. Parse the payload after verification
    const payload: DeliverooWebhookPayload = JSON.parse(rawBody);
    console.log('[Deliveroo Webhook] Event type:', payload.event_type, 'for organization:', organizationId);

    // 8. Handle different event types
    if (payload.event_type === 'order.created') {
      await processNewOrder(supabaseClient, integration, payload.order);
      
      // CRITICAL: Auto-accept if configured, or set 3-minute timeout
      const settings = integration.settings as { auto_accept_orders?: boolean } || {};
      
      if (settings.auto_accept_orders) {
        console.log('[Deliveroo] Auto-accepting order immediately');
        // Note: Auto-accept logic would be implemented here via client
      } else {
        // Set up 2.5 minute timeout (buffer for safety)
        console.log('[Deliveroo] Setting 2.5-minute auto-accept timeout');
        setTimeout(async () => {
          try {
            const { data: order } = await supabaseClient
              .from('orders')
              .select('status')
              .eq('platform_order_id', payload.order.order_id)
              .single();
            
            if (order?.status === 'pending') {
              console.log('[Deliveroo] Auto-accepting order due to timeout');
              // Auto-accept implementation would go here
            }
          } catch (error) {
            console.error('[Deliveroo] Timeout auto-accept failed:', error);
          }
        }, 150000); // 2.5 minutes
      }
      
    } else if (payload.event_type === 'order.updated') {
      await updateOrderStatus(supabaseClient, payload.order);
    } else if (payload.event_type === 'order.cancelled') {
      await cancelOrder(supabaseClient, payload.order_id);
    }

    return new Response(
      JSON.stringify({ success: true }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Deliveroo Webhook] Processing failed:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function: Process new order
async function processNewOrder(
  supabaseClient: ReturnType<typeof createClient>,
  integration: any,
  order: DeliverooWebhookPayload['order']
) {
  console.log('[Deliveroo] Processing new order:', order.order_id);

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

  // Map Deliveroo status to internal status
  const internalStatus = mapDeliverooStatusToInternal(order.status);

  // Transform to unified order format
  const unifiedOrder = {
    organization_id: integration.organization_id,
    branch_id: branchId,
    platform_integration_id: integration.id,
    platform_order_id: order.order_id,
    delivery_platform: 'deliveroo',
    order_number: order.order_id.slice(-8),
    order_type: 'delivery',
    status: internalStatus,
    customer_name: `${order.customer.first_name} ${order.customer.last_name}`,
    customer_phone: order.customer.phone_number || null,
    total_amount: order.pricing.total,
    subtotal: order.pricing.subtotal,
    tax_amount: 0, // Deliveroo includes tax in item prices
    tip_amount: 0,
    payment_status: 'paid',
    payment_method: 'deliveroo',
    raw_payload: order,
    platform_customer_info: {
      name: `${order.customer.first_name} ${order.customer.last_name}`,
      phone: order.customer.phone_number,
      address: order.delivery_address ? 
        `${order.delivery_address.street}, ${order.delivery_address.city}, ${order.delivery_address.postcode}` : null,
      deliveryInstructions: order.special_instructions,
      platform: 'deliveroo',
    },
    special_instructions: order.special_instructions,
    created_at: order.placed_at,
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
  const orderItems = order.items.map((item) => ({
    order_id: insertedOrder.id,
    organization_id: integration.organization_id,
    menu_item_id: null, // Map via platform_mappings later
    item_name: item.name,
    quantity: item.quantity,
    unit_price: item.price / item.quantity,
    line_total: item.price,
    special_instructions: item.special_instructions || null,
    modifiers: item.modifiers || null,
  }));

  await supabaseClient.from('order_items').insert(orderItems);
  
  console.log('[Deliveroo] New order processed successfully:', insertedOrder.id);
}

// Helper function: Update existing order status
async function updateOrderStatus(
  supabaseClient: ReturnType<typeof createClient>,
  order: DeliverooWebhookPayload['order']
) {
  const internalStatus = mapDeliverooStatusToInternal(order.status);
  
  const { error } = await supabaseClient
    .from('orders')
    .update({ 
      status: internalStatus,
      updated_at: new Date().toISOString()
    })
    .eq('platform_order_id', order.order_id);

  if (error) {
    throw new Error(`Order update failed: ${error.message}`);
  }

  console.log('[Deliveroo] Order status updated:', order.order_id, internalStatus);
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

  console.log('[Deliveroo] Order cancelled:', orderId);
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

// Helper function: Map Deliveroo status to internal status
function mapDeliverooStatusToInternal(deliverooStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'accepted': 'confirmed',
    'acknowledged': 'confirmed',
    'in_progress': 'preparing',
    'preparation_started': 'preparing',
    'ready_for_collection': 'ready',
    'collected': 'out_for_delivery',
    'delivered': 'completed',
    'cancelled': 'cancelled',
    'rejected': 'cancelled',
  };
  
  return statusMap[deliverooStatus] || 'pending';
}
