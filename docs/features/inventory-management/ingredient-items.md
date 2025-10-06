# Ingredient Items Management

**Last Updated**: October 6, 2025  
**Target Users**: Inventory Managers, Kitchen Managers  
**Route**: `/inventory/ingredient-items`

## Overview

The Ingredient Items section allows you to manage the individual ingredients and stock items used in your restaurant. This is where you define items, set parameters, and configure how they're tracked.

## Creating a New Ingredient Item

### Required Information

| Field | Description | Example |
|-------|-------------|---------|
| **Item Name** | Descriptive name | "Organic Tomatoes" |
| **SKU/Code** | Unique identifier (optional) | "VEG-TOM-001" |
| **Category** | Classification | Vegetables |
| **Unit of Measure** | Base measurement | kg |
| **Reorder Point** | Minimum threshold | 5 kg |
| **Max Capacity** | Storage maximum | 50 kg |
| **Unit Cost** | Cost per unit | $2.50/kg |
| **Supplier** | Primary supplier | Fresh Foods Co. |
| **Lead Time** | Days to delivery | 2 days |

### Optional Information

- **Alternate Unit**: Secondary measurement (e.g., "pieces" for items in kg)
- **Barcode**: For scanning
- **Storage Location**: Where item is kept
- **Expiration Tracking**: Enable/disable
- **Default Shelf Life**: Days until expiration
- **Safety Stock**: Buffer quantity
- **Notes**: Special handling instructions

## Ingredient Categories

### Standard Categories

1. **Vegetables** - Fresh produce
2. **Meat** - Beef, pork, poultry
3. **Seafood** - Fish, shellfish
4. **Dairy** - Milk, cheese, butter, cream
5. **Beverages** - Drinks, juices
6. **Dry Goods** - Flour, rice, pasta
7. **Spices** - Seasonings, herbs
8. **Bakery** - Bread, pastries
9. **Fruits** - Fresh and dried fruits
10. **Nuts** - Nuts and seeds
11. **Legumes** - Beans, lentils
12. **Grains** - Rice, quinoa, oats
13. **Herbs** - Fresh herbs
14. **Mushrooms** - All mushroom varieties
15. **Oils** - Cooking oils, vinegars
16. **Other** - Miscellaneous items

### Custom Categories

**Creating Custom Categories**:
1. Navigate to Settings > Inventory > Categories
2. Click "Add Category"
3. Enter category name
4. Set parent category (optional)
5. Choose icon/color
6. Save

## Units of Measure

### Base Units Supported

| Unit | Code | Type | Examples |
|------|------|------|----------|
| Kilogram | kg | Weight | Meat, vegetables |
| Gram | g | Weight | Spices, small items |
| Liter | l | Volume | Liquids, milk |
| Milliliter | ml | Volume | Oils, sauces |
| Pieces | pcs | Count | Eggs, buns |

### Unit Conversions

**Setting Up Conversions**:
```
1 kg = 1000 g
1 l = 1000 ml
1 dozen = 12 pcs
```

**Example Usage**:
- Recipe calls for 500g flour
- System converts to 0.5kg for inventory deduction
- Maintains accuracy across different measurement contexts

## Supplier Management

### Linking Suppliers to Items

**Primary Supplier**:
- Default source for purchase orders
- Primary contact information
- Lead time calculation
- Price negotiation reference

**Alternate Suppliers**:
- Backup sources
- Comparison pricing
- Availability fallback

### Supplier Information Stored

- Supplier name
- Contact person
- Phone/email
- Lead time (days)
- Minimum order quantity
- Unit price
- Last purchase date

## Cost Management

### Cost Tracking Methods

**Last Purchase Price**:
- Uses most recent purchase cost
- Simple to understand
- May not reflect average

**Average Cost**:
- Weighted average of all purchases
- More stable pricing
- Better for volatile items

**Standard Cost**:
- Fixed cost for budgeting
- Manually set
- Updated periodically

### Price History

**Tracking**:
- Date of purchase
- Quantity purchased
- Unit price paid
- Supplier
- Total cost

**Analysis Features**:
- Price trend chart
- Variance alerts (>10% change)
- Best price identification
- Seasonal pattern recognition

## Storage and Handling

### Storage Locations

**Configurable Storage Areas**:
- Walk-in Refrigerator
- Walk-in Freezer
- Dry Storage
- Beverage Cooler
- Prep Area
- Custom locations

**Location Benefits**:
- Faster physical counts
- Organized inventory
- Temperature monitoring
- Cross-contamination prevention

### Handling Instructions

**Special Requirements**:
- Temperature range (e.g., 32-40°F)
- Humidity requirements
- Light exposure
- Stacking limitations
- Rotation requirements (FIFO/FEFO)

## Expiration Date Management

### Enabling Expiration Tracking

**For Items Requiring Expiration Tracking**:
```
☑ Track Expiration Dates
Default Shelf Life: 7 days
Alert Threshold: 2 days before expiration
```

**Batch-Level Tracking**:
- Each receipt creates a new batch
- Batch ID: [Item Code]-[Receipt Date]
- Tracks quantity and expiration per batch
- System recommends oldest batch first

### Expiration Alert System

**Alert Levels**:
- 🟢 **>7 days**: No alert
- 🟡 **3-7 days**: Warning
- 🟠 **1-3 days**: Urgent
- 🔴 **<1 day**: Critical

**Automated Actions**:
- Email to inventory manager
- Dashboard notification
- Suggested use in recipes
- Discount recommendation (if applicable)

## Recipe Integration

### Ingredient Usage in Recipes

**Automatic Deduction**:
When a menu item is sold, the system:
1. Looks up the recipe
2. Identifies required ingredients
3. Calculates quantities
4. Deducts from inventory
5. Logs transaction

**Example**:
```
Menu Item: Classic Burger
Sold: 1 unit

Ingredient Deductions:
- Beef Patty: -1 pcs
- Burger Bun: -1 pcs
- Lettuce: -0.02 kg
- Tomato: -0.05 kg
- Cheese: -0.03 kg
```

### Yield and Waste Factors

**Yield Percentage**:
- Accounts for preparation loss
- Example: Lettuce has 85% yield (15% waste in trimming)
- System adjusts inventory deduction accordingly

**Formula**:
```
Actual Usage = Recipe Amount / Yield Percentage
Example: 100g / 0.85 = 118g needed
```

## Par Levels and Reorder Points

### Setting Optimal Levels

**Par Level (Target Stock)**:
- Ideal quantity to have on hand
- Covers typical usage period
- Includes safety buffer

**Reorder Point**:
- When to reorder
- Ensures stock during lead time

**Maximum Level**:
- Storage capacity limit
- Prevents over-ordering

**Calculation Example**:
```
Daily Usage: 5 kg
Lead Time: 3 days
Safety Stock: 2 days usage = 10 kg

Reorder Point: (5 kg × 3 days) + 10 kg = 25 kg
Par Level: (5 kg × 7 days) = 35 kg
Maximum: 50 kg (storage constraint)
```

### Automatic Reorder Suggestions

**System Generates Purchase Orders When**:
- Stock falls below reorder point
- Considers pending orders
- Groups by supplier
- Respects minimum order quantities

**Notification**:
```
📦 Reorder Alert

Item: Organic Tomatoes
Current: 20 kg
Reorder Point: 25 kg
Suggested Order: 30 kg (to reach par level)
Supplier: Fresh Foods Co.
```

## Item Status Management

### Status Options

**Active**:
- Currently in use
- Appears in ordering
- Tracked in inventory

**Inactive**:
- Temporarily not in use
- Seasonal items off-season
- Hidden from active lists
- Historical data retained

**Discontinued**:
- No longer ordered
- Replaced by alternative
- Archive mode
- Cannot be reactivated

### Seasonal Items

**Seasonal Flags**:
- Mark items as seasonal
- Set active date ranges
- Automatic activation/deactivation
- Advance planning notifications

**Example**:
```
Item: Pumpkin Puree
Seasonal: Yes
Active: September 1 - November 30
Status: Auto-activate on Sept 1
```

## Bulk Operations

### Mass Updates

**Bulk Edit Capabilities**:
- Update multiple items at once
- Category reassignment
- Supplier changes
- Reorder point adjustments
- Unit cost updates
- Status changes

**How to Perform Bulk Edit**:
1. Filter/search for items
2. Select items (checkboxes)
3. Click "Bulk Edit"
4. Choose fields to update
5. Enter new values
6. Preview changes
7. Confirm

### Import/Export

**CSV Import**:
- Bulk add new items
- Update existing items
- Required columns: Name, Category, Unit
- Download template provided

**CSV Export**:
- All items or filtered selection
- Include all fields or selected fields
- Excel compatible format

**Template Format**:
```csv
Name,SKU,Category,Unit,Reorder,Max,Cost,Supplier
"Organic Tomatoes","VEG-TOM-001","Vegetables","kg",5,50,2.50,"Fresh Foods Co."
```

## Quality Control

### Receiving Standards

**Inspection Criteria**:
- Visual quality check
- Temperature verification (perishables)
- Quantity verification
- Expiration date check
- Packaging condition

**Acceptance/Rejection**:
- Accept full delivery
- Partial acceptance (with note)
- Full rejection (with reason)
- Photo documentation (optional)

### Issue Tracking

**Common Issues**:
- Poor quality
- Wrong item delivered
- Short shipment
- Damaged packaging
- Incorrect pricing

**Recording Issues**:
1. Note issue type
2. Photograph (if applicable)
3. Record in system
4. Alert supplier
5. Generate credit memo

## Best Practices

### Naming Conventions

**Consistent Naming**:
- Use full descriptive names
- Include key attributes (Organic, Fresh, Frozen)
- Avoid abbreviations unless standard
- Be specific (not just "Cheese" but "Cheddar Cheese, Shredded")

**Good Examples**:
- ✓ "Chicken Breast, Boneless, Skinless"
- ✓ "Olive Oil, Extra Virgin"
- ✓ "Tomatoes, Roma, Fresh"

**Poor Examples**:
- ✗ "Chicken" (too vague)
- ✗ "EVOO" (abbreviation)
- ✗ "Toms" (non-standard)

### Regular Maintenance

**Weekly Tasks**:
- Review new items for duplicates
- Clean up inactive items
- Update costs from invoices
- Verify reorder points

**Monthly Tasks**:
- Audit category assignments
- Review supplier performance
- Update seasonal items
- Archive discontinued items

### Data Accuracy

1. **Single Source of Truth**: Don't create duplicates
2. **Timely Updates**: Change costs when invoices arrive
3. **Consistent Units**: Use same units across system
4. **Regular Audits**: Verify data monthly

## Troubleshooting

### Item Not Appearing in Lists
- Check if item is Active
- Verify category filter
- Check branch assignment
- Confirm user permissions

### Incorrect Cost Showing
- Verify which cost method is selected
- Check recent purchase prices
- Review manual cost adjustments
- Ensure no pending cost updates

### Unable to Delete Item
**Reasons**:
- Item used in recipes
- Historical transaction data
- Active in purchase orders
- Linked to menu items

**Solution**: Mark as Inactive or Discontinued instead

## Related Documentation

- [Stock Overview](stock-overview.md)
- [Stock Requests](stock-requests.md)
- [Recipe Management](../menu-management/recipe-management.md)
- [Supplier Management](../purchasing/supplier-management.md)

---

**Need Help?** Contact support at support@eatlypos.com
