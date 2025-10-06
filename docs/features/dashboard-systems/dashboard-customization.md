# Dashboard Customization

**Last Updated**: October 6, 2025  
**Audience**: System Administrators, Branch Managers  
**Permission Level**: Admin/Manager

## Overview

EatlyPOS dashboards offer customization options to tailor the view to your specific operational needs and preferences.

## Available Customization Options

### 1. Widget Configuration

**What You Can Customize**:
- Widget visibility (show/hide)
- Widget order (drag and drop)
- Widget size (when applicable)
- Data refresh intervals

**How to Customize** (Coming Soon):
1. Click the "Customize Dashboard" button (top-right)
2. Enter customization mode
3. Drag widgets to reorder
4. Click the eye icon to hide/show widgets
5. Click "Save Layout" to persist changes

### 2. Metric Cards

**Customization Options**:
- Choose which KPIs to display
- Set custom alert thresholds
- Configure trend comparison periods

**Default KPIs** (Branch Dashboard):
- Orders in Queue
- Average Order
- Inventory %
- Staff On Shift
- Sales Today

**Available Alternative KPIs**:
- Order Fulfillment Time
- Table Turnover Rate
- Waste Percentage
- Customer Satisfaction Score
- Labor Cost Percentage

### 3. Chart Preferences

**Customizable Elements**:
- Chart type (bar, line, pie, donut)
- Time range (today, week, month, quarter, year)
- Data series visibility
- Color schemes

**Peak Hours Chart**:
- Time range: Select start/end hours
- Granularity: Hourly, 30-minute, or 15-minute intervals
- Metric: Orders, Revenue, or Customers

**Sales Chart**:
- Chart type: Bar, Line, or Area
- Comparison: Day-over-day, Week-over-week, Month-over-month
- Breakdown: By category, by item, or total

### 4. Table Customization

**Column Visibility**:
- Select which columns to display
- Reorder columns via drag-and-drop
- Set default sort column and direction

**Live Orders Table Example**:
```
Default Columns:
☑ Order #
☑ Customer
☑ Type
☑ Items
☑ Total
☑ Status
☑ Time
☑ Actions

Optional Columns:
☐ Server Name
☐ Payment Method
☐ Special Instructions
☐ Order Source
```

### 5. Notification Preferences

**Configurable Alerts**:
- Order notifications (new, ready, delayed)
- Inventory alerts (low stock, out of stock, expiring)
- Staff notifications (late, break overdue, shift end)
- System alerts (connection issues, sync errors)

**Notification Channels**:
- In-dashboard notifications
- Browser push notifications
- Email notifications
- SMS notifications (premium feature)

**Threshold Configuration**:
```javascript
// Example: Low Stock Alert
{
  trigger: "inventory_low",
  threshold: 20, // percentage or quantity
  frequency: "once_per_day",
  channels: ["dashboard", "email"]
}
```

### 6. Color Theme Customization

**Current Themes**:
- Light Mode (default)
- Dark Mode
- High Contrast Mode (accessibility)

**Accent Color Options**:
- Orange (default)
- Blue
- Green
- Purple
- Red
- Teal
- Amber

**How to Change Theme**:
1. Click the sun/moon icon in top bar for light/dark toggle
2. For accent colors: Settings > Appearance > Accent Color (Coming soon)

### 7. Time Zone & Locale Settings

**Configurable Settings**:
- **Time Zone**: Automatically detect or manually set
- **Date Format**: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
- **Time Format**: 12-hour (AM/PM) or 24-hour
- **Currency**: USD, EUR, GBP, etc.
- **Language**: English (more languages coming soon)

**Location**: Settings > Regional Preferences

### 8. Data Refresh Intervals

**Customizable Refresh Rates**:

| Section | Default | Min | Max |
|---------|---------|-----|-----|
| Live Orders | 10s | 5s | 60s |
| KPI Metrics | 30s | 15s | 5m |
| Inventory | 5m | 1m | 30m |
| Charts | 1m | 30s | 15m |

**How to Adjust**:
1. Navigate to Settings > Dashboard > Refresh Rates
2. Use sliders to adjust intervals
3. Click "Apply" to save changes

## User-Specific Customization

Each user account can save their own dashboard preferences:

**Personal Settings Include**:
- Widget layout
- Column preferences
- Chart configurations
- Notification preferences
- Theme selection

**Profile Management**:
- Settings are saved automatically
- Sync across devices when logged in
- Can be reset to default anytime

## Role-Based Dashboard Defaults

Different roles have optimized default dashboard configurations:

### HQ Administrator
- Focus on multi-branch analytics
- Full inventory visibility
- System-wide alerts
- Performance comparisons

### Branch Manager
- Branch-specific metrics
- Staff management tools
- Local inventory
- Daily operations focus

### Shift Supervisor
- Real-time orders
- Staff on shift
- Immediate alerts
- Quick actions

### Cashier/Server
- Order entry
- Payment processing
- Customer lookup
- Minimal analytics

## Advanced Customization (Coming Soon)

### Dashboard Builder (Beta)
- Create custom widgets
- Combine multiple data sources
- Build custom reports
- Share dashboard templates

### API Integration
- Pull data from external systems
- Display custom metrics
- Integrate with business intelligence tools
- Export dashboard configurations

### Conditional Formatting
- Color-code metrics based on thresholds
- Automatic highlighting of anomalies
- Custom alert rules
- Dynamic status indicators

## Best Practices

### For Branch Managers

1. **Prioritize Actionable Metrics**
   - Keep the most important KPIs visible
   - Hide metrics you don't regularly monitor
   - Focus on operational efficiency

2. **Set Meaningful Thresholds**
   - Low stock: 20-30% remaining
   - Order time warning: 20 minutes
   - Staff shortage: < 3 active during peak

3. **Optimize Refresh Rates**
   - Critical data (orders): Fast refresh (10s)
   - Reference data (inventory): Slower refresh (5m)
   - Balance performance with data freshness

### For HQ Administrators

1. **Standardize Key Metrics**
   - Create consistent KPIs across branches
   - Use the same thresholds for comparison
   - Share best-practice dashboard layouts

2. **Monitor System Performance**
   - Avoid too-frequent refresh rates
   - Disable unused widgets
   - Optimize for slowest connection

## Saving and Sharing Configurations

### Save Current Layout
```
1. Customize your dashboard
2. Click "Save Layout" button
3. Give it a descriptive name
4. Choose scope: Personal / Branch / Organization
5. Click "Save"
```

### Load Saved Layout
```
1. Click "Dashboard Layouts" dropdown
2. Select from your saved layouts
3. Click "Load"
4. Dashboard will update immediately
```

### Share with Team
```
1. Save your layout
2. Set scope to "Branch" or "Organization"
3. Other users with same scope can load it
4. Admins can set as default for new users
```

## Exporting Dashboard Configuration

For backup or migration purposes:

```bash
# Export current dashboard config
Settings > Dashboard > Export Configuration

# Generates JSON file:
dashboard-config-2025-10-06.json

# Import on another device:
Settings > Dashboard > Import Configuration
```

## Troubleshooting

### Customization Not Saving
- Ensure you have permission to save layouts
- Check browser local storage isn't full
- Try clearing cache and re-saving
- Contact admin if issue persists

### Dashboard Looks Different on Mobile
- Mobile uses a simplified layout automatically
- Some widgets are hidden on small screens
- Use landscape orientation for more features
- Full customization available on desktop only

### Widgets Not Loading
- Check internet connection
- Verify data permissions
- Clear browser cache
- Disable browser extensions temporarily

### Settings Reset to Default
- Check if profile sync is enabled
- Verify you're logged into correct account
- May occur after major system updates
- Re-apply your preferences

## Related Documentation

- [HQ Dashboard Features](hq-dashboard-features.md)
- [Branch Dashboard Features](branch-dashboard-features.md)
- [System Preferences](../../administration/system-administration/system-preferences.md)
- [User Management](../../administration/system-administration/user-management.md)

---

**Need Help?** Contact support at support@eatlypos.com
