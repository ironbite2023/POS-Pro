# Branch Dashboard Features

**Last Updated**: October 6, 2025  
**Target Users**: Branch Managers, Shift Supervisors  
**Route**: `/dashboard/branch-dashboard`

## Overview

The Branch Dashboard is designed for day-to-day operations at individual restaurant locations. It provides real-time visibility into orders, inventory, staff, and daily performance metrics specific to the branch.

## Key Features

### 1. Branch KPI Overview

Quick-glance metrics for current branch performance:

**Orders in Queue**
- Active orders vs. total served today (e.g., 15/87)
- Real-time order count updates
- Visual indicator for queue depth

**Average Order Value**
- Per-transaction average for current day
- Trend compared to previous day
- Currency formatted display

**Inventory Status**
- Percentage of remaining stock
- Count of low-stock items
- Alert indicator for critical items

**Staff On Shift**
- Total staff currently clocked in
- Count of active (not on break) staff
- Quick view of shift coverage

**Sales Today**
- Total revenue for current day
- Transaction count
- Growth percentage vs. yesterday

### 2. Peak Hours Analysis

**Purpose**: Visualize order volume throughout the day to optimize staffing and inventory

**Chart Type**: Line graph showing hourly order trends

**Time Range**: 8 AM - 10 PM (restaurant operating hours)

**Features**:
- Smooth curve visualization
- Peak hour highlighting
- Hover for exact order counts
- Helps identify:
  - Lunch rush (typically 12-2 PM)
  - Dinner rush (typically 6-8 PM)
  - Slow periods for maintenance/prep

**Business Value**:
- Staff scheduling optimization
- Inventory prep planning
- Break schedule coordination

### 3. Live Orders Management

**Purpose**: Monitor and manage all active orders in real-time

**Table Columns**:
| Column | Description | Features |
|--------|-------------|----------|
| Order # | Unique order identifier | Bold, clickable |
| Customer | Customer name or "Guest" | Text display |
| Type | Dine-in (with table #), Takeout, or Delivery | Icon display |
| Items | Count of items in order | Numeric |
| Total | Order total amount | Currency formatted |
| Status | New, Preparing, Cooking, Ready | Color-coded badge |
| Time | Elapsed time since order received | Live timer |
| Actions | Quick action buttons | Details button |

**Order Status Colors**:
- **Blue**: New order (just received)
- **Yellow**: Preparing (being assembled)
- **Orange**: Cooking (in kitchen)
- **Green**: Ready (for pickup/delivery)

**Features**:
- Auto-refresh every 10 seconds
- Click row to view full order details
- Sort by any column
- Filter by status or type
- Print order receipts

**Timer Logic**:
- Updates every minute
- Color changes based on elapsed time:
  - Normal: 0-15 minutes
  - Warning: 15-30 minutes
  - Critical: 30+ minutes

### 4. Inventory Management

**Purpose**: Monitor branch-specific inventory levels and request stock

**Display Information**:
- Item name
- Available quantity
- Total capacity
- Unit of measure (kg, g, l, ml, pcs)
- Status indicator (Normal/Low)

**Quick Actions**:
- **Adjust**: Manually adjust inventory quantities
- **Request**: Create stock request to HQ/warehouse

**Low Stock Indicators**:
- Red badge for items below reorder level
- Automatic request button display
- Priority highlighting

**Integration**:
- Links to full inventory management section
- Stock request workflow initiation
- Transfer history viewing

### 5. Staff Management

**Purpose**: Track current shift staff and their status

**Information Displayed**:
- Employee photo/avatar
- Full name
- Position/role (Shift Manager, Chef, Server, Cashier)
- Status (Active/Break)
- Check-in time

**Status Colors**:
- **Green**: Active and working
- **Yellow**: On break
- **Gray**: Off duty

**Features**:
- Quick staff count overview
- Break status monitoring
- Shift timeline visibility
- Click for detailed staff profile (Coming soon)

### 6. Daily Report Summary

**Purpose**: End-of-day performance summary and financial overview

**Sales Summary Section**:
- Total sales amount
- Transaction count
- Average order value
- Refund count and amount
- Voided order count

**Payment Methods Breakdown**:
- Credit Card transactions and amount
- Cash transactions and amount
- Mobile Pay transactions and amount
- Visual pie chart distribution

**Report Actions**:
- Download PDF report
- Export to CSV
- Email report to manager
- Compare with previous day

### 7. Loyalty Program Insights

**Purpose**: Monitor customer loyalty program engagement at branch level

**Metrics Displayed**:
- **Total Members**: Count of registered loyalty members
- **New Members**: Recent sign-ups with growth indicator
- **Active This Month**: Members who made purchases (with percentage)
- **Top Rewards Redeemed**: Most popular rewards with redemption counts

**Visual Elements**:
- Badge indicators for growth metrics
- Sortable rewards list
- Monthly activity percentage

**Business Value**:
- Track program effectiveness
- Identify popular rewards
- Encourage staff to promote sign-ups

### 8. Notifications Center

**Purpose**: Real-time alerts and system notifications

**Notification Types**:

1. **Order Notifications** (Blue icon)
   - New orders
   - Order ready for pickup
   - Table assistance requests

2. **Inventory Notifications** (Red icon)
   - Low stock alerts
   - Out of stock items
   - Expiring items

3. **Staff Notifications** (Green icon)
   - Break start/end
   - Shift changes
   - Employee requests

**Features**:
- Unread count badge
- Click to mark as read
- Timestamp display (relative time)
- Visual distinction for unread items
- Sound alerts (configurable)

## Dashboard Layout

The branch dashboard is organized in a vertical scroll layout:

```
┌────────────────────────────────────┐
│   KPI Cards (5 metrics)            │
├────────────────────────────────────┤
│   Peak Hours Chart                 │
├────────────────────────────────────┤
│   Live Orders Table                │
├────────────────────────────────────┤
│   Inventory Management Table       │
├────────────────────────────────────┤
│   Staff On Shift Table             │
├────────────────────────────────────┤
│   Daily Report Summary             │
├────────────────────────────────────┤
│   Loyalty + Notifications          │
└────────────────────────────────────┘
```

## User Workflows

### Opening Procedures
1. Review overnight orders (if any)
2. Check inventory levels
3. Verify staff check-ins
4. Confirm POS system connectivity

### During Service
1. Monitor live orders queue
2. Track peak hour performance
3. Address low stock alerts
4. Coordinate staff breaks

### Closing Procedures
1. Review daily sales report
2. Process remaining orders
3. Perform inventory count adjustments
4. Download daily report

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `O` | Jump to orders section |
| `I` | Jump to inventory section |
| `S` | Jump to staff section |
| `R` | Refresh all data |
| `N` | View notifications |
| `/` | Focus search |

## Performance Tips

### Best Practices

1. **Keep Dashboard Open**: Refresh automatically updates data
2. **Monitor Queue Depth**: Take action when active orders exceed normal levels
3. **Proactive Inventory**: Request stock before running out
4. **Staff Coordination**: Use break status to manage coverage

### When to Take Action

- **Active Orders > 20**: Consider alerting kitchen staff
- **Low Stock Items > 5**: Create stock request
- **Average Order Time > 25 min**: Check kitchen workflow
- **Staff on Break > 30% of shift**: Coordinate break schedules

## Mobile Responsiveness

The Branch Dashboard is fully responsive and optimized for:
- Desktop (full feature set)
- Tablet (optimized layout)
- Mobile (essential features only)

**Mobile-Specific Features**:
- Swipeable card views
- Touch-optimized buttons
- Simplified table layouts
- Bottom navigation for quick access

## Data Refresh Rates

| Section | Refresh Interval |
|---------|------------------|
| Live Orders | 10 seconds |
| KPI Metrics | 30 seconds |
| Inventory | 5 minutes |
| Staff Status | 1 minute |
| Daily Report | 15 minutes |
| Notifications | Real-time (WebSocket) |

## Troubleshooting

### Orders Not Appearing
1. Check POS device connectivity
2. Verify network connection
3. Refresh browser
4. Check order source (dine-in, online, etc.)

### Incorrect Inventory Counts
1. Verify last sync time
2. Check pending adjustments
3. Perform manual count
4. Contact support if discrepancy persists

### Staff Not Showing
1. Verify employee clock-in
2. Check time & attendance system
3. Refresh staff section
4. Confirm employee is assigned to this branch

## Related Documentation

- [HQ Dashboard Features](hq-dashboard-features.md)
- [Live Orders Management](../sales-operations/order-management.md)
- [Inventory Management](../inventory-management/stock-overview.md)
- [Staff Management](../../user-guides/branch-manager/staff-scheduling.md)

---

**Need Help?** Contact support at support@eatlypos.com or visit our [Support Portal](http://eatlypos.com/support)
