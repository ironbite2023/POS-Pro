import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// Uber Eats webhook payload interface
interface UberEatsWebhookPayload {
  id: string;
  display_id: string;
  status: string;
  placed_at: string;
  eater: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
  cart: {
    items: Array<{
      id: string;
      instance_id: string;
      title: string;
      quantity: number;
      price: {
        total: number;
        unit_price: number;
      };
      special_instructions?: string;
      selected_modifier_groups?: Array<{
        id: string;
        title: string;
        selected_items: Array<{
          id: string;
          title: string;
          price: number;
        }>;
      }>;
    }>;
    special_instructions?: string;
  };
  payment: {
    charges: {
      total: {
        amount: number;
        currency_code: string;
      };
      sub_total?: number;
      tax?: number;
      tip?: number;
    };
  };
  store: {
    id: string;
    name?: string;
  };
}

serve(async (req: Request) => {
  console.log('[Uber Eats Webhook] Request received');

  try {
    // 1. Extract organization ID from URL parameter (MULTI-TENANT)
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('org');
    
    if (!organizationId) {
      console.error('[Uber Eats Webhook] Missing organization ID parameter');
      return new Response('Missing organization ID', { status: 400 });
    }

    // 2. Get raw body for signature verification
    const signature = req.headers.get('X-Uber-Signature');
    const rawBody = await req.text();
    
    if (!signature) {
      console.error('[Uber Eats Webhook] Missing X-Uber-Signature header');
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
      .eq('platform', 'uber_eats')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      console.error('[Uber Eats Webhook] Integration not found for organization:', organizationId);
      await addToRetryQueue(supabaseClient, 'uber_eats', rawBody, req.headers);
      return new Response(
        JSON.stringify({ error: 'Integration not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Get organization-specific credentials for signature verification
    const credentials = integration.credentials as any;
    const clientSecret = credentials?.client_secret || credentials?.webhook_secret;
    
    if (!clientSecret) {
      console.error('[Uber Eats Webhook] No client secret found for organization');
      return new Response('Missing credentials', { status: 401 });
    }

    // 6. Verify webhook signature using organization-specific secret
    const computedSignature = createHmac('sha256', clientSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== computedSignature) {
      console.error('[Uber Eats Webhook] Invalid signature for organization:', organizationId);
      return new Response('Invalid signature', { status: 401 });
    }

    console.log('[Uber Eats Webhook] Signature verified for organization:', organizationId);

    // 8. Parse the payload after verification
    const payload: UberEatsWebhookPayload = JSON.parse(rawBody);
    console.log('[Uber Eats Webhook] Processing order:', payload.id, 'for organization:', organizationId);

    // 9. Validate that payload store ID matches integration
    if (payload.store.id !== integration.platform_restaurant_id) {
      console.error('[Uber Eats Webhook] Store ID mismatch. Expected:', integration.platform_restaurant_id, 'Got:', payload.store.id);
      return new Response('Store ID mismatch', { status: 400 });
    }

    // 10. Get the organization's first branch (or default branch)
    const { data: branches, error: branchError } = await supabaseClient
      .from('branches')
      .select('id')
      .eq('organization_id', integration.organization_id)
      .limit(1);

    if (branchError || !branches || branches.length === 0) {
      console.error('[Uber Eats Webhook] No branch found for organization');
      return new Response(
        JSON.stringify({ error: 'No branch found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const branchId = branches[0].id;

    // 11. Map Uber Eats status to internal status
    const internalStatus = mapUberEatsStatusToInternal(payload.status);

    // 12. Transform to unified order format
    const unifiedOrder = {
      organization_id: integration.organization_id,
      branch_id: branchId,
      platform_integration_id: integration.id,
      platform_order_id: payload.id,
      delivery_platform: 'uber_eats',
      order_number: payload.display_id,
      order_type: 'delivery',
      status: internalStatus,
      customer_name: `${payload.eater.first_name} ${payload.eater.last_name}`,
      customer_phone: payload.eater.phone || null,
      total_amount: payload.payment.charges.total.amount / 100,
      subtotal: (payload.payment.charges.sub_total || payload.payment.charges.total.amount) / 100,
      tax_amount: (payload.payment.charges.tax || 0) / 100,
      tip_amount: (payload.payment.charges.tip || 0) / 100,
      payment_status: 'paid',
      payment_method: 'uber_eats',
      raw_payload: payload,
      platform_customer_info: {
        name: `${payload.eater.first_name} ${payload.eater.last_name}`,
        phone: payload.eater.phone,
        platform: 'uber_eats',
      },
      special_instructions: payload.cart.special_instructions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 13. Insert or update order
    const { data: insertedOrder, error: orderError } = await supabaseClient
      .from('orders')
      .upsert(unifiedOrder, {
        onConflict: 'platform_integration_id,platform_order_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (orderError) {
      console.error('[Uber Eats Webhook] Order upsert failed:', orderError);
      
      // Add to retry queue
      await addToRetryQueue(supabaseClient, 'uber_eats', rawBody, req.headers);
      
      return new Response(
        JSON.stringify({ error: 'Order creation failed', details: orderError.message }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Uber Eats Webhook] Order created/updated:', insertedOrder.id);

    // 14. Insert order items
    const orderItems = payload.cart.items.map((item) => {
      // Build modifiers array
      const modifiers = item.selected_modifier_groups?.flatMap(group =>
        group.selected_items.map(mod => ({
          group: group.title,
          name: mod.title,
          price: mod.price / 100,
        }))
      ) || [];

      return {
        order_id: insertedOrder.id,
        organization_id: integration.organization_id,
        menu_item_id: null, // We'll need to map this via platform_mappings later
        item_name: item.title,
        quantity: item.quantity,
        unit_price: item.price.unit_price / 100,
        line_total: item.price.total / 100,
        special_instructions: item.special_instructions || null,
        modifiers: modifiers.length > 0 ? modifiers : null,
      };
    });

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[Uber Eats Webhook] Order items insert failed:', itemsError);
      // Don't fail the entire operation, order is already created
    }

    console.log('[Uber Eats Webhook] Successfully processed order:', insertedOrder.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: insertedOrder.id,
        message: 'Webhook processed successfully' 
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Uber Eats Webhook] Processing failed:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

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
      next_attempt_at: new Date(Date.now() + 5000).toISOString(), // Retry in 5 seconds
    });
    console.log('[Retry Queue] Added webhook to retry queue');
  } catch (error) {
    console.error('[Retry Queue] Failed to add to queue:', error);
  }
}

// Helper function: Map Uber Eats status to internal status
function mapUberEatsStatusToInternal(uberStatus: string): string {
  const statusMap: Record<string, string> = {
    'created': 'pending',
    'accepted': 'confirmed',
    'denied': 'cancelled',
    'finished': 'preparing',
    'ready_for_pickup': 'ready',
    'delivered': 'completed',
    'cancelled': 'cancelled',
  };
  
  return statusMap[uberStatus] || 'pending';
}
