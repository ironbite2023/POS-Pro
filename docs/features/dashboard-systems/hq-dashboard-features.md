# HQ Dashboard Features

**Last Updated**: October 6, 2025  
**Target Users**: Headquarters Administrators, Regional Managers  
**Route**: `/dashboard/hq-dashboard`

## Overview

The HQ Dashboard provides a comprehensive overview of all branch operations, enabling headquarters administrators to monitor performance, track inventory, and make data-driven decisions across the entire restaurant network.

## Key Features

### 1. Multi-Branch Sales Analytics

**Purpose**: Monitor sales performance across all locations simultaneously

**Features**:
- **Aggregated Sales Metrics**: Total sales across all branches
- **Individual Branch Performance**: Side-by-side branch comparison
- **Monthly Sales Trends**: Historical performance visualization
- **Real-time Updates**: Current day sales tracking

**Metrics Displayed**:
- Total Sales Today (with trend percentage)
- Active Orders count across all locations
- Customer count for current day
- Monthly Revenue with growth indicator

**Chart Visualizations**:
- **Monthly Sales by Branch**: Multi-series bar chart comparing branch performance over 6 months
- **Hourly Order Trends**: Line chart showing peak hours across all locations
- **Category Distribution**: Donut chart showing revenue by menu category

### 2. Branch Status Monitoring

**Purpose**: Real-time operational status of all branches

**Information Displayed**:
- Branch name and location
- Operating status (Open/Closed)
- Active orders count
- Today's sales revenue
- Quick access to branch details

**Interactivity**:
- Click any branch to drill down into branch-specific details
- Color-coded status indicators (Green: Open, Gray: Closed)
- Sortable by sales performance

### 3. Top Performing Menu Items

**Purpose**: Identify best-selling products across the network

**Data Displayed**:
| Column | Description |
|--------|-------------|
| Item Name | Menu item identifier |
| Category | Item classification (Main Dishes, Appetizers, etc.) |
| Sales (Units) | Quantity sold |
| Revenue | Total revenue generated |
| Growth | Percentage change from previous period |

**Features**:
- Growth indicators with up/down arrows
- Color-coded growth (Green: positive, Red: negative)
- Category filtering capability
- Sortable columns

### 4. Inventory Health Monitoring

**Purpose**: Track inventory levels and alerts across all branches

**Components**:

#### Overall Inventory Health Score
- Percentage-based health indicator
- Color-coded status:
  - **Green (85%+)**: Excellent inventory levels
  - **Yellow (75-84%)**: Attention needed
  - **Red (<75%)**: Critical inventory issues

#### Low Stock Alerts
- Branch-by-branch low stock items
- Current quantity vs. reorder level
- Unit of measure display
- Actionable alert messaging

#### Inventory by Category
- Horizontal stacked bar chart
- Three stock levels:
  - Normal stock (Green)
  - Low stock (Amber)
  - Critical stock (Red)
- 16 ingredient categories tracked

#### Branch Inventory Health Cards
- Individual branch health scores
- Low stock item counts
- Last updated timestamps
- Progress bar visualization
- Refresh functionality

### 5. Menu Optimization Insights

**Purpose**: Provide actionable intelligence on menu performance

**Insight Categories**:

1. **Top Performing Items**
   - Best-selling menu items
   - Revenue contribution

2. **Trending Items**
   - Items with significant growth
   - Percentage increase indicators

3. **Underperforming Items**
   - Items with declining sales
   - Candidates for menu revision

4. **Top Categories**
   - Best-performing menu categories
   - Category-level performance trends

## Dashboard Metrics Reference

### Sales Metrics

| Metric | Calculation | Update Frequency |
|--------|-------------|------------------|
| Total Sales Today | Sum of all branch sales for current day | Real-time |
| Active Orders | Count of non-completed orders | Real-time |
| Today's Customers | Unique customer count | Real-time |
| Monthly Revenue | Sum of current month transactions | Daily |
| Average Order Value | Total revenue / Order count | Real-time |

### Inventory Metrics

| Metric | Calculation | Update Frequency |
|--------|-------------|------------------|
| Total Stock Value | Sum of (quantity × unit cost) for all items | Daily |
| Low Stock Items | Items below reorder level | Real-time |
| Out of Stock | Items with zero quantity | Real-time |
| Expiring Soon | Items within expiration threshold | Daily |
| Inventory Health % | (Normal stock items / Total items) × 100 | Hourly |

## User Actions

### Available Actions

1. **Refresh Inventory**: Manual refresh of inventory data
2. **View Branch Details**: Navigate to specific branch dashboard
3. **Download Reports**: Export dashboard data (Coming soon)
4. **Filter by Date Range**: Adjust time period for analytics (Coming soon)
5. **Export Data**: Export charts and tables to CSV/PDF (Coming soon)

## Data Refresh Intervals

- **Sales Data**: Updates every 30 seconds
- **Order Status**: Real-time WebSocket updates
- **Inventory Levels**: Updates every 5 minutes
- **Charts**: Refresh on data update
- **Alerts**: Immediate notification

## Best Practices

### For HQ Administrators

1. **Morning Routine**:
   - Review overnight sales across all branches
   - Check critical inventory alerts
   - Monitor branch opening status

2. **Throughout the Day**:
   - Track peak hour performance
   - Monitor active order queues
   - Address low stock alerts promptly

3. **End of Day**:
   - Review daily sales performance
   - Analyze underperforming branches
   - Plan inventory transfers if needed

### Key Performance Indicators (KPIs)

- **Sales Growth**: Target 5-10% month-over-month growth
- **Inventory Health**: Maintain above 85% health score
- **Order Fulfillment**: Monitor active order counts during peak hours
- **Menu Performance**: Review underperforming items quarterly

## Troubleshooting

### Dashboard Not Loading
- Check internet connection
- Clear browser cache
- Verify user permissions (HQ Admin role required)

### Data Not Updating
- Click the refresh icon
- Check data sync status in system settings
- Contact support if issue persists

### Charts Not Displaying
- Ensure JavaScript is enabled
- Try a different browser (Chrome, Firefox, Safari recommended)
- Check if ad-blockers are interfering

## Related Documentation

- [Branch Dashboard Features](branch-dashboard-features.md)
- [Inventory Management](../inventory-management/stock-overview.md)
- [Sales Reporting](../sales-operations/sales-reporting.md)
- [Menu Management](../menu-management/menu-items.md)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `R` | Refresh dashboard data |
| `I` | Jump to inventory section |
| `S` | Jump to sales section |
| `M` | Jump to menu insights |
| `/` | Focus search bar |

---

**Need Help?** Contact support at support@eatlypos.com or visit our [Support Portal](http://eatlypos.com/support)
