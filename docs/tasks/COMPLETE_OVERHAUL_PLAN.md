# 🎯 Complete Overhaul Plan: Mock Data Elimination

**Date:** October 7, 2025  
**Status:** 📋 PLANNING PHASE  
**Scope:** Complete transformation from demo app to production SaaS platform

---

## 🎯 **Executive Summary**

**Current State:** 127+ files using mock data, 17 data files with fake information  
**Target State:** 100% database-driven application with proper service architecture  
**Architecture:** Multi-tenant SaaS with organization-level data isolation

---

## 📊 **System Analysis**

### **Database Schema (Existing)**
```sql
-- Core Tables (Already Exist)
- organizations (✅ Real data)
- branches (✅ Real data) 
- user_profiles (✅ Real data)
- orders (✅ Real data)
- order_items (✅ Real data)
- roles (✅ Exists)
- branch_inventory (✅ Exists)

-- Missing Tables (Need Creation)
- menu_categories
- menu_items
- suppliers
- purchase_orders
- loyalty_members
- loyalty_rewards
- waste_logs
- notifications
```

### **Service Architecture (Target)**
```
┌─────────────────────────────────────────┐
│           PRESENTATION LAYER            │
│  (React Components - No Mock Data)     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            BUSINESS LOGIC               │
│     (Hooks + Context - Real Data)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            SERVICE LAYER                │
│   (Database Services - Supabase)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            DATA LAYER                   │
│        (Supabase Database)              │
└─────────────────────────────────────────┘
```

---

## 🚀 **Phase 1: Foundation & Critical Services**

### **Priority 1.1: Database Schema Creation**

**Create Missing Tables:**

```sql
-- Menu Management
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    category_id UUID REFERENCES menu_categories(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    dietary_labels TEXT[],
    preparation_time INTEGER, -- minutes
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Management  
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address JSONB,
    payment_terms VARCHAR(50),
    delivery_days INTEGER[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    order_date DATE NOT NULL,
    expected_delivery DATE,
    total_amount DECIMAL(12,2),
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Loyalty Program
CREATE TABLE loyalty_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    member_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    tier_level VARCHAR(20) DEFAULT 'bronze',
    points_balance INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    reward_type VARCHAR(50), -- 'discount', 'free_item', 'points'
    points_required INTEGER,
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    free_item_id UUID REFERENCES menu_items(id),
    is_active BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES user_profiles(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50), -- 'info', 'warning', 'success', 'error'
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Waste Management
CREATE TABLE waste_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    reason VARCHAR(100),
    cost_impact DECIMAL(10,2),
    logged_by UUID REFERENCES user_profiles(id),
    logged_at TIMESTAMPTZ DEFAULT now()
);
```

**Files to Create:**
- `supabase/migrations/20251007_complete_schema.sql`

---

### **Priority 1.2: Core Service Layer**

**Create Service Files:**

1. **`src/lib/services/menu.service.ts`**
```typescript
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export const menuService = {
  // Categories
  getCategories: async (organizationId: string): Promise<MenuCategory[]> => {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('display_order');
    
    if (error) throw error;
    return data || [];
  },

  // Menu Items
  getMenuItems: async (organizationId: string, categoryId?: string): Promise<MenuItem[]> => {
    let query = supabase
      .from('menu_items')
      .select('*, category:menu_categories(*)')
      .eq('organization_id', organizationId)
      .eq('is_available', true);
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data || [];
  },

  createCategory: async (organizationId: string, category: Partial<MenuCategory>) => {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({ ...category, organization_id: organizationId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  createMenuItem: async (organizationId: string, item: Partial<MenuItem>) => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({ ...item, organization_id: organizationId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

2. **`src/lib/services/suppliers.service.ts`**
3. **`src/lib/services/loyalty.service.ts`**
4. **`src/lib/services/notifications.service.ts`**
5. **`src/lib/services/waste.service.ts`**

---

### **Priority 1.3: Service Index Update**

**Update `src/lib/services/index.ts`:**
```typescript
export { ordersService } from './orders.service';
export { inventoryService } from './inventory.service';
export { staffService } from './staff.service';
export { menuService } from './menu.service';
export { suppliersService } from './suppliers.service';
export { loyaltyService } from './loyalty.service';
export { notificationsService } from './notifications.service';
export { wasteService } from './waste.service';
```

---

## 🚀 **Phase 2: High-Priority Module Replacement**

### **Priority 2.1: Menu Management System**

**Files to Replace:**
1. `src/app/(default)/menu-management/menu/page.tsx`
2. `src/components/menu-management/menu/MenuList.tsx`
3. `src/components/menu-management/menu/MenuForm.tsx`
4. `src/components/menu-management/categories/CategoryDashboard.tsx`

**Current Issues:**
```typescript
// ❌ REMOVE THESE IMPORTS
import { MenuItem, menuCategories } from '@/data/MenuData';
import { organization } from '@/data/CommonData';
```

**New Implementation:**
```typescript
// ✅ USE THESE INSTEAD
import { menuService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';

const { currentOrganization } = useOrganization();
const categories = await menuService.getCategories(currentOrganization.id);
const menuItems = await menuService.getMenuItems(currentOrganization.id);
```

---

### **Priority 2.2: Loyalty Program System**

**Files to Replace:**
1. `src/app/(default)/loyalty-program/rewards/page.tsx`
2. `src/components/loyalty-program/MemberList.tsx`
3. `src/components/loyalty-program/MemberDetails.tsx`
4. `src/components/loyalty-program/AddEditRewardForm.tsx`

**Current Issues:**
```typescript
// ❌ REMOVE THESE
import { mockLoyaltyRewards } from '@/data/LoyaltyRewardsData';
import { loyaltyMembers, membershipTiers } from '@/data/LoyaltyData';
```

**New Implementation:**
```typescript
// ✅ USE THESE
import { loyaltyService } from '@/lib/services';

const members = await loyaltyService.getMembers(organizationId);
const rewards = await loyaltyService.getRewards(organizationId);
```

---

### **Priority 2.3: Purchasing System**

**Files to Replace (20+ files):**
- All files in `src/components/purchasing/`
- Purchase order pages
- Supplier management

**Current Issues:**
```typescript
// ❌ REMOVE THESE
import { mockSuppliers } from '@/data/SupplierData';
import { mockPurchaseOrders } from '@/data/PurchaseOrderData';
```

**New Implementation:**
```typescript
// ✅ USE THESE
import { suppliersService } from '@/lib/services';

const suppliers = await suppliersService.getSuppliers(organizationId);
const purchaseOrders = await suppliersService.getPurchaseOrders(organizationId);
```

---

## 🚀 **Phase 3: Admin & Management Systems**

### **Priority 3.1: User Management**

**Files to Replace:**
1. `src/components/admin-settings/users/UserEditForm.tsx`
2. `src/components/admin-settings/users/tabs/RolesAccessTab.tsx`
3. `src/components/admin-settings/users/UserInviteForm.tsx`

**Current Issues:**
```typescript
// ❌ REMOVE THESE
import { mockUsers, roles } from '@/data/UserData';
import { mockBranches } from '@/data/BranchData';
```

**New Implementation:**
```typescript
// ✅ USE THESE (Already exist)
import { staffService } from '@/lib/services/staff.service';
import { useOrganization } from '@/contexts/OrganizationContext';

const staff = await staffService.getStaffByOrganization(organizationId);
const { branches } = useOrganization();
```

---

### **Priority 3.2: Organization Context Cleanup**

**Files to Fix:**
1. `src/contexts/AppOrganizationContext.tsx`
2. `src/contexts/FilterBranchContext.tsx`
3. `src/utilities/index.ts`

**Current Issues:**
```typescript
// ❌ REMOVE THESE
import { organization } from '@/data/CommonData';
```

**New Implementation:**
```typescript
// ✅ USE EXISTING OrganizationContext
import { useOrganization } from '@/contexts/OrganizationContext';
const { currentOrganization } = useOrganization();
```

---

## 🚀 **Phase 4: Inventory & Operations**

### **Priority 4.1: Enhanced Inventory System**

**Current State:** Mix of real and fake data  
**Target:** 100% database-driven

**Files to Update:**
1. `src/components/inventory/StockDashboard.tsx`
2. `src/components/inventory/StockTracking.tsx`
3. `src/components/inventory/StockRequestForm.tsx`

**Remove Mock Data:**
```typescript
// ❌ REMOVE THESE
import { mockStockItems } from '@/data/StockItemData';
import { organization } from '@/data/CommonData';
```

---

### **Priority 4.2: Waste Management System**

**Files to Replace (10+ files):**
- All waste management components
- Waste logging pages
- Waste reports

**Create Service:**
```typescript
// src/lib/services/waste.service.ts
export const wasteService = {
  getWasteLogs: async (organizationId: string, branchId?: string) => {
    // Fetch from waste_logs table
  },
  createWasteLog: async (organizationId: string, wasteData: WasteLog) => {
    // Insert into waste_logs table
  }
};
```

---

## 🚀 **Phase 5: Reports & Analytics**

### **Priority 5.1: Real-time Notifications System**

**Update TopBar:**
```typescript
// src/components/common/TopBar.tsx
const notifications = await notificationsService.getNotifications(
  currentOrganization.id,
  user.id
);
```

**Create Notification Service:**
```typescript
export const notificationsService = {
  getNotifications: async (organizationId: string, userId?: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    
    return data || [];
  },

  markAsRead: async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  }
};
```

---

### **Priority 5.2: Sales & Order Reports**

**Files to Replace:**
1. `src/app/(default)/sales/order-history/[id]/page.tsx`
2. Order history components using `OrderHistoryData`

**New Implementation:**
```typescript
// Use existing ordersService
const orderHistory = await ordersService.getOrders(
  organizationId,
  branchIds,
  { startDate, endDate }
);
```

---

## 🚀 **Phase 6: Data Migration & Cleanup**

### **Priority 6.1: Database Seeding**

**Create Initial Data Scripts:**
```sql
-- Insert default menu categories
INSERT INTO menu_categories (organization_id, name, description) VALUES
($1, 'Appetizers', 'Starter dishes'),
($1, 'Main Courses', 'Primary dishes'),
($1, 'Beverages', 'Drinks and refreshments'),
($1, 'Desserts', 'Sweet treats');

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('Admin', 'Full system access'),
('Manager', 'Branch management'),
('Staff', 'Basic operations'),
('Cashier', 'POS operations only');
```

---

### **Priority 6.2: Mock Data Directory Removal**

**Final Step:**
1. Verify all imports removed
2. Delete entire `/src/data/` directory
3. Update any remaining references
4. Test all modules

---

## 📊 **Implementation Timeline**

### **Week 1: Foundation**
- ✅ Database schema creation
- ✅ Core service layer
- ✅ Menu management system

### **Week 2: Major Modules**
- ✅ Loyalty program system  
- ✅ Purchasing system
- ✅ User management cleanup

### **Week 3: Operations**
- ✅ Inventory enhancement
- ✅ Waste management
- ✅ Organization context cleanup

### **Week 4: Reports & Cleanup**
- ✅ Notifications system
- ✅ Reports enhancement
- ✅ Mock data removal
- ✅ Final testing

---

## 🧪 **Testing Strategy**

### **Per Phase Testing:**
1. **Service Layer Tests:** Unit tests for all services
2. **Integration Tests:** Database connectivity
3. **UI Tests:** Component data loading
4. **E2E Tests:** Complete user workflows

### **Data Validation:**
1. **Organization Isolation:** Ensure data security
2. **Performance:** Query optimization
3. **Error Handling:** Graceful failures
4. **Empty States:** No data scenarios

---

## 📋 **Success Criteria**

### **Phase Completion Checklist:**
- [ ] All mock data imports removed
- [ ] All services connected to database
- [ ] All components showing real data
- [ ] All empty states handled gracefully
- [ ] All error scenarios tested
- [ ] Performance optimized
- [ ] Security validated (RLS policies)

### **Final Validation:**
- [ ] Zero references to `/src/data/` directory
- [ ] All features work with empty database
- [ ] All features work with populated database
- [ ] Multi-organization isolation verified
- [ ] User permissions respected

---

## 🚀 **Immediate Next Steps**

1. **Create database migration** with all missing tables
2. **Create core service files** (menu, suppliers, loyalty, notifications, waste)
3. **Start with Menu Management** (highest user impact)
4. **Replace one module at a time** systematically
5. **Test each module** before moving to next

---

**Status:** 📋 **PLAN READY FOR EXECUTION**  
**Architecture:** Service-layer pattern with complete Supabase integration  
**Timeline:** 4 weeks systematic implementation  
**Result:** 100% database-driven SaaS platform

This plan will transform your demo application into a production-ready, multi-tenant SaaS platform with complete database integration.
