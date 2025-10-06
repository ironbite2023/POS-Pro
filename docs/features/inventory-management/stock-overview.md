# Stock Overview

**Last Updated**: October 6, 2025  
**Target Users**: Inventory Managers, Branch Managers, HQ Administrators  
**Route**: `/inventory/stock-overview`

## Overview

The Stock Overview provides a comprehensive view of inventory levels across all branches or for a specific location. It serves as the central hub for monitoring stock health, identifying issues, and making informed purchasing decisions.

## Key Features

### 1. Inventory Dashboard Metrics

**Main KPI Cards**:

**Total Stock Value**
- Calculated as: Σ(quantity × unit cost) for all items
- Currency formatted
- Trend indicator showing value change
- Includes all branches or filtered branch

**Low Stock Items**
- Count of items below reorder point
- Red alert indicator
- Quick link to low stock view
- Trend showing improvement/decline

**Out of Stock Items**
- Count of items with zero quantity
- Critical alert status
- Immediate action required
- Impact analysis available

**Expiring Soon**
- Items approaching expiration date
- Configurable threshold (default: 7 days)
- Waste prevention focus
- Priority action list

### 2. Stock Status Categories

Items are classified into four status levels:

| Status | Criteria | Color | Action |
|--------|----------|-------|--------|
| **Optimal** | Above reorder point + safety stock | Green | Monitor |
| **Normal** | Between reorder point and optimal | Blue | Normal operations |
| **Low** | Below reorder point but not zero | Yellow | Reorder soon |
| **Critical** | Zero or near-zero quantity | Red | Immediate action |

### 3. Inventory Table View

**Columns Displayed**:

| Column | Description | Sortable |
|--------|-------------|----------|
| Item Name | Ingredient/stock item name | ✓ |
| Category | Classification (Meat, Dairy, Vegetables, etc.) | ✓ |
| Current Qty | Available quantity | ✓ |
| Unit | Unit of measure (kg, g, l, ml, pcs) | ✗ |
| Reorder Point | Minimum threshold | ✓ |
| Max Capacity | Maximum storage capacity | ✓ |
| Unit Cost | Cost per unit | ✓ |
| Total Value | Current quantity × unit cost | ✓ |
| Status | Stock status indicator | ✓ |
| Last Updated | Timestamp of last inventory adjustment | ✓ |
| Actions | Quick action buttons | ✗ |

**Quick Actions**:
- **View Details**: See full item history
- **Adjust Stock**: Manual quantity adjustment
- **Request Stock**: Create transfer/purchase request
- **View Transactions**: See all movements

### 4. Filtering and Search

**Filter Options**:

**By Category**:
- Vegetables
- Meat & Seafood
- Dairy
- Beverages
- Dry Goods
- Spices & Seasonings
- Bakery
- Fruits
- Nuts & Seeds
- Oils & Fats
- Other

**By Status**:
- All Items
- Optimal
- Normal
- Low Stock
- Critical/Out of Stock
- Expiring Soon

**By Branch** (HQ view only):
- All Branches
- Headquarters
- Individual branches (selectable)

**Search Functionality**:
- Real-time search as you type
- Searches: Item name, SKU, category
- Fuzzy matching for typos
- Search history (recent searches)

### 5. Stock Movement Tracking

**Movement Types Recorded**:

1. **Incoming**:
   - Purchase deliveries
   - Stock transfers in
   - Production (for prepared items)
   - Adjustments (positive)

2. **Outgoing**:
   - Sales/consumption
   - Stock transfers out
   - Waste/spoilage
   - Adjustments (negative)

**Transaction History View**:
```
Date        Type              Qty    Unit  User         Notes
2025-10-06  Transfer In       +50    kg    John Doe     From HQ
2025-10-05  Sales            -15    kg    System       Daily consumption
2025-10-05  Adjustment       -2     kg    Jane Smith   Spoiled items
2025-10-04  Purchase         +100   kg    Mike Jones   Supplier delivery
```

### 6. Inventory Valuation

**Valuation Methods Supported**:

**FIFO (First In, First Out)** - Default
- Oldest stock is consumed first
- Most common in food service
- Matches physical inventory flow
- Better for perishable items

**LIFO (Last In, First Out)**
- Newest stock is consumed first
- Less common in restaurants
- Available for specific use cases

**Weighted Average**
- Average cost of all units
- Smooths price fluctuations
- Simpler calculation

**Calculation Example (FIFO)**:
```
Purchase 1: 50 kg @ $5/kg = $250
Purchase 2: 30 kg @ $6/kg = $180
Current Stock: 60 kg
Stock Value: (50 kg × $5) + (10 kg × $6) = $310
```

### 7. Category Analysis

**Visual Breakdown**:
- Pie/donut chart showing value by category
- Bar chart showing quantity by category
- Category health scores
- Trend analysis per category

**Category Metrics**:
- Total items in category
- Total value
- Low stock item count
- Average stock level (%)
- Category movement velocity

### 8. Expiration Management

**Features**:
- Expiration date tracking
- Days-to-expiration countdown
- Color-coded urgency:
  - 🟢 Green: > 14 days
  - 🟡 Yellow: 7-14 days
  - 🟠 Orange: 3-7 days
  - 🔴 Red: < 3 days
- Automated alerts
- First-expiring-first-out recommendations

**Expiration Report View**:
| Item | Quantity | Unit | Expires In | Batch # | Location |
|------|----------|------|------------|---------|----------|
| Chicken Breast | 15 kg | kg | 2 days | B-2025-1001 | Walk-in Cooler |
| Fresh Milk | 8 L | l | 3 days | M-2025-0928 | Refrigerator #2 |

### 9. Reorder Point Management

**Reorder Point Calculation**:
```
Reorder Point = (Average Daily Usage × Lead Time) + Safety Stock

Example:
- Average Daily Usage: 5 kg
- Supplier Lead Time: 3 days
- Safety Stock: 5 kg (1 day buffer)
- Reorder Point: (5 × 3) + 5 = 20 kg
```

**Automatic Reorder Alerts**:
- Triggered when stock falls below reorder point
- Email/SMS notifications (configurable)
- Creates suggested purchase order
- Can be automated (with approval)

**Reorder Point Optimization**:
- System analyzes historical usage
- Adjusts for seasonal variations
- Accounts for lead time changes
- Considers storage constraints

### 10. Stock Level Visualization

**Charts Available**:

1. **Stock Level Timeline**
   - Line chart showing quantity over time
   - Multiple items comparison
   - Reorder point reference line
   - Forecast projection

2. **Turnover Rate**
   - Inventory velocity by item
   - Days-of-supply calculation
   - Slow-moving item identification

3. **ABC Analysis**
   - A items: High value, low quantity (80% of value)
   - B items: Moderate value and quantity (15% of value)
   - C items: Low value, high quantity (5% of value)

## User Workflows

### Daily Inventory Check

**Morning Routine** (Branch Manager):
1. Review low stock alerts
2. Check expiring items list
3. Process overnight deliveries
4. Create stock requests if needed
5. Verify physical count for critical items

### Weekly Inventory Audit

**Weekly Tasks** (Inventory Manager):
1. Full category cycle count
2. Reconcile discrepancies
3. Review turnover rates
4. Adjust reorder points
5. Generate inventory report

### Month-End Inventory

**Month-End Process**:
1. Complete physical inventory count
2. Adjust all discrepancies
3. Calculate inventory value
4. Generate valuation report
5. Analyze variances
6. Update forecasts

## Bulk Operations

**Available Bulk Actions**:
- Mass stock adjustments
- Category-wide reorder point updates
- Bulk export to CSV/Excel
- Multi-item purchase requests
- Batch expiration date updates

**How to Use Bulk Actions**:
1. Select items using checkboxes
2. Click "Bulk Actions" dropdown
3. Choose action
4. Confirm operation
5. Review success/error report

## Integration Points

**Connected Systems**:
- **Menu Management**: Recipe ingredient requirements
- **Sales/POS**: Automatic deduction on sales
- **Purchasing**: Purchase order creation
- **Waste Management**: Waste entry deductions
- **Reporting**: Analytics and insights

## Data Export Options

**Export Formats**:
- CSV (Excel compatible)
- PDF report
- JSON (for integrations)
- XML (for accounting systems)

**Exportable Data**:
- Current stock levels
- Transaction history
- Valuation report
- Low stock report
- Expiration report
- Custom filtered views

## Performance Optimization

**For Large Inventories** (500+ items):
- Use pagination (50 items per page)
- Apply filters before searching
- Export large datasets for offline analysis
- Use category views for focused work

## Mobile Access

**Mobile Features**:
- Quick stock checks
- Barcode scanning (camera)
- Voice-to-text for adjustments
- Offline mode for counts
- Sync when connection restored

## Permissions

**Role-Based Access**:

| Role | View | Adjust | Request | Value | Export |
|------|------|--------|---------|-------|--------|
| HQ Admin | All | All | All | ✓ | ✓ |
| Branch Manager | Branch | Branch | Branch | ✓ | ✓ |
| Inventory Staff | Branch | Branch | Branch | ✗ | ✓ |
| Shift Supervisor | Branch | Limited | Branch | ✗ | ✗ |
| Staff | Branch | ✗ | ✗ | ✗ | ✗ |

## Best Practices

### Inventory Accuracy

1. **Regular Cycle Counts**
   - Count 20% of items weekly
   - Prioritize high-value items
   - Focus on fast-moving items

2. **Immediate Recording**
   - Record receipts immediately
   - Enter adjustments in real-time
   - Don't batch-enter at end of day

3. **Physical Organization**
   - FIFO physical arrangement
   - Clear labeling with dates
   - Dedicated storage areas

### Minimizing Shrinkage

- Conduct surprise spot checks
- Investigate large discrepancies
- Train staff on proper handling
- Monitor waste vs. theft patterns

### Optimizing Stock Levels

- Review reorder points quarterly
- Analyze seasonal patterns
- Consider storage constraints
- Balance holding costs vs. stockouts

## Troubleshooting

### Stock Levels Don't Match Physical Count

**Steps to Resolve**:
1. Check recent transactions
2. Verify all sales recorded
3. Look for manual adjustments
4. Check for transfers not recorded
5. Perform adjustment with notes

### Unable to Adjust Stock

**Common Causes**:
- Insufficient permissions
- Item locked (in active count)
- Negative adjustment exceeds quantity
- System synchronization issue

**Solution**: Contact manager or check system status

### Valuation Seems Incorrect

**Verify**:
- Recent price changes
- Valuation method setting
- Include/exclude filters
- Branch selection (all vs. specific)

## Related Documentation

- [Ingredient Items](ingredient-items.md)
- [Stock Requests](stock-requests.md)
- [Stock Transfers](stock-transfers.md)
- [Inventory Reports](inventory-reports.md)
- [Waste Management](waste-management.md)

---

**Need Help?** Contact support at support@eatlypos.com
