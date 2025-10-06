# WEBHOOK REGISTRATION GUIDE

**Complete Setup Instructions for Delivery Platform Webhooks**  
**Date**: October 6, 2025  
**Project**: POS Pro Delivery Platform Integration

---

## 🎯 **OVERVIEW**

This guide provides step-by-step instructions for registering webhook URLs in each delivery platform's developer portal. This is **required** for receiving orders from the platforms.

**Our Webhook Endpoints:**
```
🟢 Uber Eats:  https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/uber-eats-webhook
🟠 Deliveroo:  https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/deliveroo-webhook
🔵 Just Eat:   https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/just-eat-webhook
```

---

## 🟢 **UBER EATS WEBHOOK REGISTRATION**

### **Prerequisites:**
- [ ] Uber Eats developer account created
- [ ] Restaurant app created in developer portal
- [ ] Client ID and Client Secret obtained
- [ ] Store ID from Uber Eats restaurant dashboard

### **Step-by-Step Registration:**

#### **Step 1: Access Uber Developer Portal**
1. Go to: https://developer.uber.com/dashboard/
2. Sign in with your developer account
3. Select your restaurant integration app

#### **Step 2: Navigate to Webhooks Section**
1. In your app dashboard, find **"Webhooks"** or **"Integration"** section
2. Look for **"Webhook Configuration"** or **"Webhook URLs"**

#### **Step 3: Add Webhook Endpoint**
1. Click **"Add Webhook"** or **"Configure Webhooks"**
2. Enter webhook URL:
   ```
   https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/uber-eats-webhook
   ```
3. **Webhook Method**: POST
4. **Content-Type**: application/json

#### **Step 4: Subscribe to Events**
Select these event types:
- ✅ **`order.created`** - New order placed
- ✅ **`order.updated`** - Order status changed  
- ✅ **`order.cancelled`** - Order cancelled
- ✅ **`order.fulfilled`** - Order completed (optional)

#### **Step 5: Configure Security**
1. **Signature Verification**: Enabled
2. **Signature Header**: `X-Uber-Signature`
3. **Signing Secret**: Use your app's **Client Secret**
4. **Signature Algorithm**: HMAC SHA256

#### **Step 6: Test Webhook**
1. Use Uber's webhook testing tool (if available)
2. Send test event to verify connectivity
3. Check logs in Supabase Edge Functions

#### **Step 7: Activate Webhook**
1. Save webhook configuration
2. Activate/enable the webhook
3. Verify status shows as "Active"

---

## 🟠 **DELIVEROO WEBHOOK REGISTRATION**

### **Prerequisites:**
- [ ] Deliveroo developer account with API access approved
- [ ] Restaurant integration app created
- [ ] Client ID and Client Secret obtained
- [ ] Restaurant ID from Deliveroo partner portal
- [ ] Separate webhook secret generated

### **Step-by-Step Registration:**

#### **Step 1: Access Deliveroo Developer Portal**
1. Go to: https://developer.deliveroo.com/
2. Sign in with your approved developer account
3. Navigate to your integration project

#### **Step 2: Navigate to Webhook Configuration**
1. Find **"Webhooks"** section in your project
2. Look for **"Webhook Endpoints"** or **"Event Subscriptions"**

#### **Step 3: Add Webhook Endpoint**
1. Click **"Add Webhook Endpoint"**
2. Enter webhook URL:
   ```
   https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/deliveroo-webhook
   ```
3. **HTTP Method**: POST
4. **Content-Type**: application/json

#### **Step 4: Subscribe to Events**
Select these event types:
- ✅ **`order.created`** - New order received
- ✅ **`order.updated`** - Order status changed
- ✅ **`order.cancelled`** - Order cancelled
- ✅ **`order.acknowledged`** - Order acknowledged by restaurant
- ✅ **`rider.assigned`** - Rider assigned to order
- ✅ **`rider.arrived`** - Rider arrived at restaurant

#### **Step 5: Configure Security**
1. **Generate webhook secret** in Deliveroo portal
2. **Signature Header**: `X-Deliveroo-Signature`  
3. **Signing Method**: HMAC SHA256
4. **Copy the webhook secret** - you'll need this for Supabase environment variables

#### **Step 6: Test Webhook**
1. Use Deliveroo's webhook testing feature
2. Send test order.created event
3. Verify webhook receives and processes correctly

#### **Step 7: Activate Webhook** 
1. Enable the webhook endpoint
2. Confirm event subscriptions are active
3. Monitor webhook delivery status

---

## 🔵 **JUST EAT WEBHOOK REGISTRATION**

### **Prerequisites:**
- [ ] Just Eat Partner Centre account
- [ ] API access enabled for your restaurant
- [ ] Bearer API token generated
- [ ] Restaurant ID from Just Eat system
- [ ] Webhook secret generated

### **Step-by-Step Registration:**

#### **Step 1: Access Just Eat Partner Centre**
1. Go to: https://developers.just-eat.com/
2. Or: https://partnercentre.just-eat.co.uk/ (UK)
3. Sign in with your partner account

#### **Step 2: Navigate to API/Webhook Settings**
1. Look for **"API Configuration"** or **"Integration Settings"**
2. Find **"Webhooks"** or **"Notification URLs"** section

#### **Step 3: Add Webhook Endpoint**
1. Click **"Add Webhook"** or **"Configure Notifications"**
2. Enter webhook URL:
   ```
   https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/just-eat-webhook
   ```
3. **Protocol**: HTTPS
4. **Method**: POST

#### **Step 4: Subscribe to Events**
Select these event types:
- ✅ **`OrderPlaced`** - New order received
- ✅ **`OrderAccepted`** - Order accepted by restaurant  
- ✅ **`OrderRejected`** - Order rejected by restaurant
- ✅ **`OrderCancelled`** - Order cancelled by customer/platform
- ✅ **`OrderReady`** - Order marked as ready
- ✅ **`OrderCompleted`** - Order delivered/completed

#### **Step 5: Configure Security**
1. **Generate webhook secret** in Just Eat portal
2. **Signature Header**: `X-JustEat-Signature` (verify exact name)
3. **Signing Method**: HMAC SHA256
4. **Save the webhook secret** for Supabase configuration

#### **Step 6: Test Webhook**
1. Use Just Eat's webhook test tool
2. Send test OrderPlaced event
3. Verify proper reception and processing

#### **Step 7: Activate Webhook**
1. Enable webhook notifications
2. Confirm all event subscriptions are active
3. Test with actual order placement

---

## 🔧 **WEBHOOK URL VERIFICATION**

### **Testing Your Webhooks:**

#### **Manual Testing (Development):**
```bash
# Test Uber Eats webhook
curl -X POST https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/uber-eats-webhook \
  -H "Content-Type: application/json" \
  -H "X-Uber-Signature: test_signature" \
  -d '{"test": "order"}'

# Test Deliveroo webhook  
curl -X POST https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/deliveroo-webhook \
  -H "Content-Type: application/json" \
  -H "X-Deliveroo-Signature: test_signature" \
  -d '{"test": "order"}'

# Test Just Eat webhook
curl -X POST https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/just-eat-webhook \
  -H "Content-Type: application/json" \
  -H "X-JustEat-Signature: test_signature" \
  -d '{"test": "order"}'
```

#### **Expected Responses:**
- **Valid signature**: `HTTP 200` with success response
- **Invalid signature**: `HTTP 401 Unauthorized`
- **Missing signature**: `HTTP 401 Unauthorized`

---

## 🚨 **COMMON REGISTRATION ISSUES**

### **Problem 1: Webhook URL Not Accessible**
**Symptoms**: Platform reports "Cannot reach webhook URL"  
**Solutions**:
- Verify URL is HTTPS (required by all platforms)
- Check Edge Function is deployed and active
- Test URL accessibility from external networks

### **Problem 2: Signature Verification Failures**  
**Symptoms**: Webhooks receive 401 Unauthorized responses  
**Solutions**:
- Verify webhook secrets are configured in Supabase environment
- Check signature header names match platform requirements
- Confirm signing algorithm is HMAC SHA256

### **Problem 3: Event Subscription Not Working**
**Symptoms**: Orders placed but no webhooks received  
**Solutions**:
- Verify event types are correctly subscribed
- Check webhook is enabled/active in platform portal
- Confirm restaurant/store ID mapping is correct

### **Problem 4: Platform-Specific Issues**

#### **Uber Eats:**
- May require app approval before webhook activation
- Store ID must match exactly with webhook registration
- Client Secret used for both OAuth and webhook signing

#### **Deliveroo:**
- Requires separate webhook secret (not OAuth secret)
- 3-minute response requirement for order events
- May have approval process for webhook endpoints

#### **Just Eat:**
- Webhook secret different from API bearer token
- Multiple regional portals (UK, EU, etc.)
- Variable timeout requirements based on order timing

---

## 📋 **REGISTRATION CHECKLIST**

### **Pre-Registration:**
- [ ] **Developer accounts** created for all platforms
- [ ] **API access** approved (especially Deliveroo)
- [ ] **Restaurant/Store IDs** obtained from platforms
- [ ] **Webhook secrets** configured in Supabase environment
- [ ] **Edge Functions** deployed and accessible

### **Per Platform Registration:**

#### **Uber Eats:**
- [ ] Webhook URL registered in developer portal
- [ ] Events subscribed: order.created, order.updated, order.cancelled
- [ ] Signature verification enabled with Client Secret
- [ ] Test webhook sent and received successfully
- [ ] Webhook status shows as "Active"

#### **Deliveroo:**
- [ ] Webhook URL registered in developer portal  
- [ ] Events subscribed: order.*, rider.*
- [ ] Webhook secret generated and configured
- [ ] Signature verification tested
- [ ] Webhook enabled and active

#### **Just Eat:**
- [ ] Webhook URL registered in partner centre
- [ ] Events subscribed: OrderPlaced, OrderAccepted, OrderCancelled, etc.
- [ ] Webhook secret generated and configured
- [ ] Signature verification tested
- [ ] Notifications enabled for restaurant

### **Post-Registration Testing:**
- [ ] **End-to-end order test** for each platform
- [ ] **Webhook security test** (invalid signatures rejected)
- [ ] **Event handling test** (all subscribed events processed)
- [ ] **Error handling test** (failed webhooks go to retry queue)
- [ ] **Timeout test** (auto-accept triggers correctly)

---

## 🛠️ **TROUBLESHOOTING GUIDE**

### **Webhook Not Receiving Orders:**
1. **Check Edge Function logs** in Supabase dashboard
2. **Verify webhook URL** is exactly as registered
3. **Test webhook accessibility** from external service
4. **Confirm platform integration** is active in database
5. **Check event subscriptions** in platform portal

### **Signature Verification Failing:**
1. **Verify environment variables** are set in Supabase
2. **Check header name** matches platform requirements
3. **Confirm secret value** matches platform configuration
4. **Test signature generation** with known payload

### **Orders Not Appearing in POS:**
1. **Check database** for orders table entries
2. **Verify organization/branch mapping** in webhook processing
3. **Check RLS policies** for orders table access
4. **Review webhook processing logs** for errors

---

## 📞 **PLATFORM SUPPORT CONTACTS**

### **When to Contact Platform Support:**
- Webhook URL registration issues
- Event subscription problems
- API access approval delays  
- Webhook secret generation problems

### **Support Channels:**

#### **Uber Eats:**
- **Developer Support**: https://developer.uber.com/support
- **Partner Support**: Available through Uber Eats Restaurant Dashboard
- **Documentation**: https://developer.uber.com/docs/eats

#### **Deliveroo:**
- **Developer Support**: Available through developer portal
- **API Support**: May require submitting support ticket
- **Documentation**: https://developer.deliveroo.com/docs

#### **Just Eat:**
- **Partner Support**: Available through Partner Centre
- **Technical Support**: Via partner centre support tickets
- **Documentation**: https://developers.just-eat.com/

---

## ✅ **VERIFICATION COMMANDS**

### **Check Webhook Secrets in Supabase:**
```bash
# List all environment variables (secrets)
supabase secrets list --project axlhezpjvyecntzsqczk

# Should show:
# UBER_EATS_CLIENT_SECRET
# DELIVEROO_WEBHOOK_SECRET  
# JUST_EAT_WEBHOOK_SECRET
```

### **Test Edge Function Accessibility:**
```bash
# Test each webhook endpoint
curl -I https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/uber-eats-webhook
curl -I https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/deliveroo-webhook  
curl -I https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/just-eat-webhook

# Should return: HTTP/2 405 (Method Not Allowed for GET)
# This confirms endpoints are accessible
```

### **Check Edge Function Status:**
```bash
# List deployed functions
supabase functions list --project axlhezpjvyecntzsqczk

# Should show all four functions as ACTIVE:
# - uber-eats-webhook
# - deliveroo-webhook
# - just-eat-webhook
# - process-webhook-queue
```

---

## 🎉 **COMPLETION CONFIRMATION**

### **Webhook Registration Complete When:**
- [x] All webhook URLs registered in platform portals
- [x] All event subscriptions configured
- [x] All webhook secrets set in Supabase environment
- [x] Signature verification working for all platforms
- [x] Test orders successfully received and processed
- [x] Platform integration status shows "Active" in POS Pro UI

### **Ready for Restaurant Onboarding When:**
- [x] System administrator setup complete
- [x] Webhook infrastructure operational
- [x] Platform credentials can be entered via UI
- [x] Connection testing functional
- [x] Order acceptance/rejection working
- [x] Status updates syncing bidirectionally

---

## 📧 **NOTIFICATION SETUP**

### **Optional: Webhook Monitoring**
Set up monitoring to ensure webhook health:

1. **Supabase Edge Function Logs**: Monitor for webhook errors
2. **Database Monitoring**: Track webhook_processing_queue for failures
3. **Platform Portal Monitoring**: Check webhook delivery status in portals
4. **Order Volume Monitoring**: Ensure expected order volume is received

---

## 🔄 **MAINTENANCE**

### **Regular Tasks:**
- **Monthly**: Check webhook delivery statistics in platform portals
- **Quarterly**: Review and rotate webhook secrets if required
- **Annually**: Validate webhook URL accessibility and SSL certificates

### **When Platform Updates:**
- Monitor platform developer announcements for API changes
- Test webhook compatibility when platforms update their APIs
- Update event subscriptions if new event types become available

---

**Setup Duration**: ~2 hours per platform (first time)  
**Complexity**: Medium (requires platform portal navigation)  
**Frequency**: One-time setup per platform  
**Maintenance**: Minimal after initial setup

---

## 🎯 **SUCCESS METRICS**

After completing webhook registration, you should see:
- ✅ **Orders appearing** in POS Pro unified order center
- ✅ **Webhook events** in Supabase Edge Function logs
- ✅ **Platform status indicators** showing "Active" in UI
- ✅ **Order acceptance** working within timeout windows
- ✅ **Status updates** syncing to platforms successfully

**🎊 Webhook registration complete - ready to eliminate "Tablet Hell"!**
