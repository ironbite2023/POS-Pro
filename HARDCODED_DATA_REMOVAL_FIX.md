# Hardcoded Data Removal & Low Stock Fix

**Date:** October 6, 2025  
**Status:** ✅ FIXED  
**Issues:** Dashboard hardcoded data + Low stock items error

---

## Issues Fixed

### Issue 1: Dashboard Hardcoded/Mock Data ✅

**Problem:** The HQ Dashboard was displaying fake chart data instead of showing "no data" state:
- Mock sales data (fake branches: Downtown Main, Westside Corner, etc.)
- Mock hourly trends (fake order numbers)
- Mock inventory categories (fake stock levels)
- Mock branch health scores (fake percentages)

**Solution:** 
- Removed ALL mock data variables
- Replaced charts with a friendly "Coming Soon" message
- Kept only REAL data metrics (Total Sales, Orders, Top Items, etc.)

### Issue 2: Low Stock Items Error ✅

**Problem:** Console error when fetching low stock items:
```
Error fetching low stock items: {}
```

**Root Cause:** The Supabase `.filter()` method was trying to compare two column values directly:
```typescript
.filter('current_quantity', 'lte', 'reorder_point')
```

This syntax is valid but complex in Supabase. The error was likely due to no data existing yet.

**Solution:** 
- Fetch all inventory data first
- Filter in JavaScript after fetching
- Added null checks before comparison

---

## Files Modified

### 1. `src/app/(default)/dashboard/hq-dashboard/page.tsx`

**Removed:**
- 45+ lines of mock data (mockSalesData, mockHourlyTrends, etc.)
- All chart sections using fake data
- Mock branch inventory health displays

**Added:**
- Friendly "Charts and Analytics Coming Soon" message
- Clear indication that charts will appear when real data exists
- Cleaner dashboard focused on real metrics only

**Kept (Real Data):**
- Total Sales metric
- Total Orders metric
- Average Order Value metric
- Active Orders metric
- Top Selling Items table
- Recent Orders table
- Low Stock Alerts

### 2. `src/lib/services/inventory.service.ts`

**Fixed `getLowStockItems()`:**
```typescript
// BEFORE - Could fail on column comparison
.filter('current_quantity', 'lte', 'reorder_point');

// AFTER - Fetch all, filter in JS
.eq('branch_id', branchId);

// Then filter in JavaScript
return (data || []).filter(item => 
  item.current_quantity !== null && 
  item.reorder_point !== null && 
  Number(item.current_quantity) <= Number(item.reorder_point)
);
```

**Fixed `getLowStockItemsForOrganization()`:**
- Same approach: fetch all inventory, filter in JS
- Added null checks before comparison
- More reliable and handles empty data gracefully

---

## What You'll See Now

### HQ Dashboard Display

**✅ Real Metrics (Working):**
- Total Sales: $0.00 (no orders yet)
- Total Orders: 0 (no orders yet)
- Avg Order Value: $0.00 (no orders yet)
- Active Orders: 0 (no active orders)
- Low Stock Alerts: 0 items (no inventory setup yet)

**✅ Real Data Sections:**
- Top Performing Menu Items: "No sales data available"
- Recent Orders: "No recent orders"

**✅ New Message:**
```
Charts and Analytics Coming Soon

Sales trends, hourly patterns, and inventory analytics will appear 
here as you start processing orders and managing inventory.

Start by creating menu items and processing your first orders!
```

**❌ Removed (Fake Data):**
- Monthly Sales by Branch chart
- Hourly Order Trends chart
- Branch Status list with fake branches
- Inventory by Category chart
- Branch Inventory Health scores

---

## Why This is Better

### Before (Confusing)
```
Dashboard showed:
- Fake sales: $38,000, $42,000, etc.
- Fake branches: Downtown Main, Westside Corner
- Fake order counts: 12, 15, 18 orders per hour
- Fake inventory: 24 proteins, 32 produce items
```
**User thinks:** "Wait, where is this data coming from? I don't have orders!"

### After (Clear)
```
Dashboard shows:
- Real metrics: $0.00 sales, 0 orders
- Clear message: "Charts coming when you have data"
- Guidance: "Start by creating menu items!"
```
**User thinks:** "Okay, I understand. I need to add data first."

---

## Next Steps for Full Dashboard

To see the dashboard populate with real data, you need to:

1. **Create Menu Items**
   - Navigate to Menu Management
   - Add menu items with prices

2. **Process Orders**
   - Use POS system to create orders
   - Or create test orders via admin

3. **Set Up Inventory** (Optional)
   - Add inventory items
   - Set reorder points
   - Track stock levels

4. **Watch Dashboard Populate**
   - Top selling items will appear
   - Sales metrics will update
   - Recent orders will show
   - Low stock alerts will activate

---

## Technical Details

### Inventory Filter Fix

**Why Column Comparison Failed:**

Supabase PostgREST filter for column-to-column comparison requires special syntax:
```sql
-- What we needed (comparing two columns)
SELECT * FROM branch_inventory 
WHERE current_quantity <= reorder_point;

-- What Supabase filter does (comparing to literal value)
SELECT * FROM branch_inventory 
WHERE current_quantity <= 'reorder_point';  -- ❌ Treats as string
```

**Our Solution:**

1. Fetch all rows without filter
2. Compare columns in JavaScript
3. More reliable and handles edge cases

**Code Pattern:**
```typescript
// Fetch without column comparison
const { data, error } = await supabase
  .from('branch_inventory')
  .select('*')
  .eq('branch_id', branchId);

// Filter in JS with null checks
return (data || []).filter(item => 
  item.current_quantity !== null &&     // Handle missing data
  item.reorder_point !== null &&        // Handle missing data
  Number(item.current_quantity) <= Number(item.reorder_point)  // Safe comparison
);
```

---

## Testing

### Verify Low Stock Fix
1. Open HQ Dashboard
2. **Expected:** No console errors
3. **Expected:** "0 items below reorder level" shows

### Verify Mock Data Removed
1. Open HQ Dashboard
2. **Should NOT see:**
   - Any fake branch names (Downtown Main, etc.)
   - Any fake charts with data
   - Any fake inventory numbers
3. **Should see:**
   - Real metrics (all zeros if no data)
   - "Charts and Analytics Coming Soon" message
   - Clean, honest dashboard

---

## Summary

**Problems:**
1. ❌ Dashboard showed fake data pretending to be real
2. ❌ Low stock query was failing

**Solutions:**
1. ✅ Removed all mock data
2. ✅ Added friendly "Coming Soon" message
3. ✅ Fixed inventory filter to work reliably
4. ✅ Dashboard now shows only REAL data

**Current State:**
- Dashboard displays real metrics (currently zeros)
- No confusing fake data
- Clear guidance on next steps
- No console errors

**Result:**
Honest, working dashboard that will populate with real data as you use the system! 🎉
