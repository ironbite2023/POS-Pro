# Task 1.8: Admin Settings Integration

**Task ID**: TASK-01-008  
**Phase**: 1 - Frontend Integration  
**Priority**: 🟡 P1 - High  
**Estimated Time**: 2-3 days  
**Complexity**: 🟡 Medium  
**Status**: 📋 Not Started

---

## 1. Detailed Request Analysis

### What is Being Requested

Replace mock admin data with real Supabase API calls, implementing:
- Branch management with location settings and operational hours
- Staff management with role assignments and permissions
- Role and permissions management system
- Organization settings and configuration
- User account management and access control

### Current State
- Admin pages use mock data from `BranchData.ts`, `UserData.ts`, and `RolesPermissionsData.ts`
- Static displays with no real management functionality
- No connection to actual database
- No role-based access control
- Mock user and branch management

### Target State
- Live admin data from Supabase database
- Complete branch management with settings
- Staff management with role assignments
- Dynamic role and permission system
- Organization configuration management
- Secure user access control

### Affected Files
```
src/app/(default)/admin/
├── branches/page.tsx
├── staff/page.tsx
├── roles/page.tsx
├── settings/page.tsx
└── users/page.tsx

src/components/admin-settings/
├── BranchForm.tsx
├── StaffForm.tsx
├── RoleForm.tsx
├── PermissionsMatrix.tsx
├── OrganizationSettings.tsx
├── UserManagement.tsx
└── BranchSettings.tsx

src/data/
├── BranchData.ts (to be replaced)
├── UserData.ts (to be replaced)
└── RolesPermissionsData.ts (to be replaced)
```

---

## 2. Justification and Benefits

### Why This Task is Important

**Business Value**:
- ✅ Centralized organization and branch management
- ✅ Secure role-based access control
- ✅ Staff management and accountability
- ✅ Operational settings configuration
- ✅ Compliance and audit requirements

**Technical Benefits**:
- ✅ Validates organizationService implementation
- ✅ Tests role-based security patterns
- ✅ Proves multi-branch architecture
- ✅ Establishes admin interface patterns

**User Impact**:
- ✅ Managers can control system access
- ✅ Staff roles clearly defined
- ✅ Branch operations properly configured
- ✅ System security maintained

### Problems It Solves
1. **No Access Control**: Currently all users have same permissions
2. **Manual Configuration**: No way to update system settings
3. **No Staff Management**: Can't manage user accounts
4. **No Branch Control**: Branch settings hardcoded
5. **Security Gaps**: No proper role-based restrictions

---

## 3. Prerequisites

### Knowledge Requirements
- ✅ Role-based access control (RBAC) concepts
- ✅ Organization and branch management
- ✅ User account lifecycle management
- ✅ Security and permissions design
- ✅ System configuration management

### Technical Prerequisites
- ✅ Task 1.1 (Dashboard Integration) completed
- ✅ organizationService implemented (`src/lib/services/organization.service.ts`)
- ✅ Database schema for admin tables deployed
- ✅ RLS policies for secure data access
- ✅ Authentication system working

### Environment Prerequisites
- ✅ Test branch and user data
- ✅ Role and permission configurations
- ✅ Organization context working
- ✅ Admin user with proper permissions

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "date-fns": "^2.x"
}
```

---

## 4. Implementation Methodology

### Step 1: Create Admin Data Hooks (2-3 hours)

#### 1.1 Create `src/hooks/useAdminData.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { organizationService } from '@/lib/services';
import { authService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type Branch = Database['public']['Tables']['branches']['Row'];
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type Permission = Database['public']['Tables']['permissions']['Row'];

interface AdminMetrics {
  totalBranches: number;
  totalStaff: number;
  activeUsers: number;
  totalRoles: number;
  lastLoginActivity: string;
}

interface UseAdminDataReturn {
  branches: Branch[];
  staff: UserProfile[];
  roles: Role[];
  permissions: Permission[];
  metrics: AdminMetrics;
  loading: boolean;
  error: Error | null;
  refetchBranches: () => Promise<void>;
  refetchStaff: () => Promise<void>;
  refetchRoles: () => Promise<void>;
  refetchPermissions: () => Promise<void>;
}

export const useAdminData = (): UseAdminDataReturn => {
  const { currentOrganization } = useOrganization();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalBranches: 0,
    totalStaff: 0,
    activeUsers: 0,
    totalRoles: 0,
    lastLoginActivity: '-',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBranches = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const branchesData = await organizationService.getBranches({
        organizationId: currentOrganization.id,
      });
      setBranches(branchesData);
    } catch (err) {
      console.error('Error fetching branches:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchStaff = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const staffData = await organizationService.getStaff({
        organizationId: currentOrganization.id,
      });
      setStaff(staffData);
    } catch (err) {
      console.error('Error fetching staff:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchRoles = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const rolesData = await organizationService.getRoles({
        organizationId: currentOrganization.id,
      });
      setRoles(rolesData);
    } catch (err) {
      console.error('Error fetching roles:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchPermissions = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const permissionsData = await organizationService.getPermissions({
        organizationId: currentOrganization.id,
      });
      setPermissions(permissionsData);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchAllData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchBranches(),
        fetchStaff(),
        fetchRoles(),
        fetchPermissions(),
      ]);

      // Calculate metrics
      const totalBranches = branches.length;
      const totalStaff = staff.length;
      const activeUsers = staff.filter(user => user.status === 'active').length;
      const totalRoles = roles.length;
      
      // Find most recent login
      const recentLogins = staff
        .filter(user => user.last_login)
        .sort((a, b) => new Date(b.last_login!).getTime() - new Date(a.last_login!).getTime());
      const lastLoginActivity = recentLogins[0]?.last_login 
        ? new Date(recentLogins[0].last_login).toLocaleString()
        : '-';

      setMetrics({
        totalBranches,
        totalStaff,
        activeUsers,
        totalRoles,
        lastLoginActivity,
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentOrganization]);

  return {
    branches,
    staff,
    roles,
    permissions,
    metrics,
    loading,
    error,
    refetchBranches: fetchBranches,
    refetchStaff: fetchStaff,
    refetchRoles: fetchRoles,
    refetchPermissions: fetchPermissions,
  };
};
```

#### 1.2 Create `src/hooks/useAdminActions.ts`

```typescript
import { useState } from 'react';
import { organizationService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface UseAdminActionsReturn {
  createBranch: (branchData: any) => Promise<any>;
  updateBranch: (branchId: string, updates: any) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;
  createStaffUser: (userData: any) => Promise<any>;
  updateUserRole: (userId: string, roleId: string) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  isProcessing: boolean;
  error: Error | null;
}

export const useAdminActions = (): UseAdminActionsReturn => {
  const { currentOrganization } = useOrganization();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createBranch = async (branchData: any) => {
    if (!currentOrganization) throw new Error('No organization selected');

    try {
      setIsProcessing(true);
      setError(null);

      const branch = await organizationService.createBranch({
        ...branchData,
        organization_id: currentOrganization.id,
      });

      toast.success('Branch created successfully!');
      return branch;
    } catch (err) {
      console.error('Error creating branch:', err);
      setError(err as Error);
      toast.error('Failed to create branch');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBranch = async (branchId: string, updates: any) => {
    try {
      setIsProcessing(true);
      setError(null);

      await organizationService.updateBranch(branchId, updates);
      toast.success('Branch updated successfully');
    } catch (err) {
      console.error('Error updating branch:', err);
      setError(err as Error);
      toast.error('Failed to update branch');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteBranch = async (branchId: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      await organizationService.deleteBranch(branchId);
      toast.success('Branch deleted successfully');
    } catch (err) {
      console.error('Error deleting branch:', err);
      setError(err as Error);
      toast.error('Failed to delete branch');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const createStaffUser = async (userData: any) => {
    if (!currentOrganization) throw new Error('No organization selected');

    try {
      setIsProcessing(true);
      setError(null);

      // This would integrate with your user creation API
      // const user = await organizationService.createStaffUser({
      //   ...userData,
      //   organization_id: currentOrganization.id,
      // });

      toast.success('Staff user created successfully!');
      // return user;
    } catch (err) {
      console.error('Error creating staff user:', err);
      setError(err as Error);
      toast.error('Failed to create staff user');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateUserRole = async (userId: string, roleId: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      await organizationService.updateUserRole(userId, roleId);
      toast.success('User role updated successfully');
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err as Error);
      toast.error('Failed to update user role');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const deactivateUser = async (userId: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      await organizationService.deactivateUser(userId);
      toast.success('User deactivated successfully');
    } catch (err) {
      console.error('Error deactivating user:', err);
      setError(err as Error);
      toast.error('Failed to deactivate user');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createBranch,
    updateBranch,
    deleteBranch,
    createStaffUser,
    updateUserRole,
    deactivateUser,
    isProcessing,
    error,
  };
};
```

**Success Criteria**:
- ✅ Hooks compile without errors
- ✅ Admin data fetching works correctly
- ✅ Admin operations function properly
- ✅ Error handling implemented

---

### Step 2: Create Admin Components (3-4 hours)

#### 2.1 Create `src/components/admin-settings/BranchForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  Button, 
  TextField, 
  TextArea,
  Select,
  Switch,
  Flex, 
  Box,
  Text 
} from '@radix-ui/themes';
import { useAdminActions } from '@/hooks/useAdminActions';
import type { Database } from '@/lib/supabase/database.types';

type Branch = Database['public']['Tables']['branches']['Row'];

const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(100),
  code: z.string().min(1, 'Branch code is required').max(10),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().min(1, 'Country is required'),
  }),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  manager_id: z.string().uuid().optional(),
  timezone: z.string().default('UTC'),
  currency: z.string().default('USD'),
  operating_hours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), is_open: z.boolean() }),
  }),
  services: z.object({
    dine_in: z.boolean().default(true),
    takeaway: z.boolean().default(true),
    delivery: z.boolean().default(false),
  }),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface BranchFormProps {
  branch?: Branch;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BranchForm({ 
  branch, 
  open, 
  onClose, 
  onSuccess 
}: BranchFormProps) {
  const { createBranch, updateBranch } = useAdminActions();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: branch ? {
      name: branch.name,
      code: branch.code,
      address: branch.address as any,
      phone: branch.phone || '',
      email: branch.email || '',
      timezone: branch.timezone,
      currency: branch.currency || 'USD',
      operating_hours: branch.operating_hours as any || {
        monday: { open: '09:00', close: '21:00', is_open: true },
        tuesday: { open: '09:00', close: '21:00', is_open: true },
        wednesday: { open: '09:00', close: '21:00', is_open: true },
        thursday: { open: '09:00', close: '21:00', is_open: true },
        friday: { open: '09:00', close: '21:00', is_open: true },
        saturday: { open: '09:00', close: '21:00', is_open: true },
        sunday: { open: '10:00', close: '20:00', is_open: true },
      },
      services: branch.services as any || {
        dine_in: true,
        takeaway: true,
        delivery: false,
      },
    } : {
      timezone: 'UTC',
      currency: 'USD',
      operating_hours: {
        monday: { open: '09:00', close: '21:00', is_open: true },
        tuesday: { open: '09:00', close: '21:00', is_open: true },
        wednesday: { open: '09:00', close: '21:00', is_open: true },
        thursday: { open: '09:00', close: '21:00', is_open: true },
        friday: { open: '09:00', close: '21:00', is_open: true },
        saturday: { open: '09:00', close: '21:00', is_open: true },
        sunday: { open: '10:00', close: '20:00', is_open: true },
      },
      services: {
        dine_in: true,
        takeaway: true,
        delivery: false,
      },
      address: {},
    },
  });

  const onSubmit = async (data: BranchFormData) => {
    try {
      const branchData = {
        ...data,
        status: 'active',
      };

      if (branch) {
        await updateBranch(branch.id, branchData);
      } else {
        await createBranch(branchData);
      }
      
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }}>
        <Dialog.Title>
          {branch ? 'Edit Branch' : 'Create Branch'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="6">
            {/* Basic Info */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Branch Name *</Text>
                <TextField.Root
                  {...register('name')}
                  placeholder="Enter branch name"
                />
                {errors.name && (
                  <Text size="1" color="red">{errors.name.message}</Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">Branch Code *</Text>
                <TextField.Root
                  {...register('code')}
                  placeholder="e.g., NYC01"
                  className="w-32"
                />
                {errors.code && (
                  <Text size="1" color="red">{errors.code.message}</Text>
                )}
              </Box>
            </Flex>

            {/* Address */}
            <Box>
              <Text as="label" size="2" weight="medium">Address *</Text>
              <Flex direction="column" gap="2">
                <TextField.Root
                  {...register('address.street')}
                  placeholder="Street address"
                />
                {errors.address?.street && (
                  <Text size="1" color="red">{errors.address.street.message}</Text>
                )}
                
                <Flex gap="2">
                  <TextField.Root
                    {...register('address.city')}
                    placeholder="City"
                    className="flex-1"
                  />
                  <TextField.Root
                    {...register('address.state')}
                    placeholder="State"
                  />
                  <TextField.Root
                    {...register('address.postal_code')}
                    placeholder="ZIP"
                  />
                </Flex>
                
                <TextField.Root
                  {...register('address.country')}
                  placeholder="Country"
                />
                {errors.address?.country && (
                  <Text size="1" color="red">{errors.address.country.message}</Text>
                )}
              </Flex>
            </Box>

            {/* Contact */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Phone</Text>
                <TextField.Root
                  {...register('phone')}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                />
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Email</Text>
                <TextField.Root
                  {...register('email')}
                  type="email"
                  placeholder="branch@restaurant.com"
                />
              </Box>
            </Flex>

            {/* Settings */}
            <Flex gap="4">
              <Box>
                <Text as="label" size="2" weight="medium">Timezone</Text>
                <Select.Root
                  onValueChange={(value) => setValue('timezone', value)}
                  defaultValue="UTC"
                >
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="UTC">UTC</Select.Item>
                    <Select.Item value="America/New_York">Eastern Time</Select.Item>
                    <Select.Item value="America/Chicago">Central Time</Select.Item>
                    <Select.Item value="America/Denver">Mountain Time</Select.Item>
                    <Select.Item value="America/Los_Angeles">Pacific Time</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">Currency</Text>
                <Select.Root
                  onValueChange={(value) => setValue('currency', value)}
                  defaultValue="USD"
                >
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="USD">USD ($)</Select.Item>
                    <Select.Item value="EUR">EUR (€)</Select.Item>
                    <Select.Item value="GBP">GBP (£)</Select.Item>
                    <Select.Item value="CAD">CAD (C$)</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>

            {/* Services */}
            <Box>
              <Text size="3" weight="medium" className="mb-3">Services Offered</Text>
              <Flex gap="6">
                <Flex align="center" gap="2">
                  <Switch
                    {...register('services.dine_in')}
                    defaultChecked={watch('services.dine_in')}
                    onCheckedChange={(checked) => setValue('services.dine_in', checked)}
                  />
                  <Text>Dine In</Text>
                </Flex>
                
                <Flex align="center" gap="2">
                  <Switch
                    {...register('services.takeaway')}
                    defaultChecked={watch('services.takeaway')}
                    onCheckedChange={(checked) => setValue('services.takeaway', checked)}
                  />
                  <Text>Takeaway</Text>
                </Flex>
                
                <Flex align="center" gap="2">
                  <Switch
                    {...register('services.delivery')}
                    defaultChecked={watch('services.delivery')}
                    onCheckedChange={(checked) => setValue('services.delivery', checked)}
                  />
                  <Text>Delivery</Text>
                </Flex>
              </Flex>
            </Box>

            {/* Operating Hours */}
            <Box>
              <Text size="3" weight="medium" className="mb-3">Operating Hours</Text>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <Flex key={day} align="center" gap="4" className="mb-2">
                  <Box className="w-24">
                    <Text size="2" weight="medium" className="capitalize">{day}</Text>
                  </Box>
                  
                  <Switch
                    defaultChecked={watch(`operating_hours.${day}.is_open` as any)}
                    onCheckedChange={(checked) => setValue(`operating_hours.${day}.is_open` as any, checked)}
                  />
                  
                  <TextField.Root
                    {...register(`operating_hours.${day}.open` as any)}
                    type="time"
                    className="w-32"
                    disabled={!watch(`operating_hours.${day}.is_open` as any)}
                  />
                  
                  <Text size="2">to</Text>
                  
                  <TextField.Root
                    {...register(`operating_hours.${day}.close` as any)}
                    type="time"
                    className="w-32"
                    disabled={!watch(`operating_hours.${day}.is_open` as any)}
                  />
                </Flex>
              ))}
            </Box>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button type="button" variant="soft" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : branch ? 'Update' : 'Create'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

#### 2.2 Create `src/components/admin-settings/StaffForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  Button, 
  TextField, 
  Select,
  Flex, 
  Box,
  Text 
} from '@radix-ui/themes';
import { useAdminActions } from '@/hooks/useAdminActions';
import type { Database } from '@/lib/supabase/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type Branch = Database['public']['Tables']['branches']['Row'];

const staffSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role_id: z.string().uuid('Please select a role'),
  primary_branch_id: z.string().uuid('Please select a branch').optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface StaffFormProps {
  user?: UserProfile;
  roles: Role[];
  branches: Branch[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffForm({ 
  user, 
  roles,
  branches,
  open, 
  onClose, 
  onSuccess 
}: StaffFormProps) {
  const { createStaffUser } = useAdminActions();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: user ? {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      role_id: user.role_id || '',
      primary_branch_id: user.primary_branch_id || '',
    } : {},
  });

  const onSubmit = async (data: StaffFormData) => {
    try {
      if (user) {
        // Update existing user (implementation needed)
        console.log('Update user not implemented yet');
      } else {
        await createStaffUser(data);
      }
      
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>
          {user ? 'Edit Staff Member' : 'Add Staff Member'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Name */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">First Name *</Text>
                <TextField.Root
                  {...register('first_name')}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <Text size="1" color="red">{errors.first_name.message}</Text>
                )}
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Last Name *</Text>
                <TextField.Root
                  {...register('last_name')}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <Text size="1" color="red">{errors.last_name.message}</Text>
                )}
              </Box>
            </Flex>

            {/* Contact */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Email *</Text>
                <TextField.Root
                  {...register('email')}
                  type="email"
                  placeholder="staff@restaurant.com"
                />
                {errors.email && (
                  <Text size="1" color="red">{errors.email.message}</Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium">Phone</Text>
                <TextField.Root
                  {...register('phone')}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                />
              </Box>
            </Flex>

            {/* Role and Branch */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Role *</Text>
                <Select.Root
                  onValueChange={(value) => setValue('role_id', value)}
                  defaultValue={user?.role_id || ''}
                >
                  <Select.Trigger placeholder="Select role" />
                  <Select.Content>
                    {roles.map(role => (
                      <Select.Item key={role.id} value={role.id}>
                        {role.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                {errors.role_id && (
                  <Text size="1" color="red">{errors.role_id.message}</Text>
                )}
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Primary Branch</Text>
                <Select.Root
                  onValueChange={(value) => setValue('primary_branch_id', value)}
                  defaultValue={user?.primary_branch_id || ''}
                >
                  <Select.Trigger placeholder="Select branch" />
                  <Select.Content>
                    {branches.map(branch => (
                      <Select.Item key={branch.id} value={branch.id}>
                        {branch.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button type="button" variant="soft" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : user ? 'Update' : 'Create'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

**Success Criteria**:
- ✅ Branch form renders correctly
- ✅ Operating hours configuration works
- ✅ Staff form with role assignment functional
- ✅ Form validation prevents invalid data

---

### Step 3: Create Admin Pages (2-3 hours)

#### 3.1 Update `src/app/(default)/admin/branches/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Button, 
  Table, 
  Badge,
  IconButton,
  Text,
  Box,
  Grid
} from '@radix-ui/themes';
import { Plus, Edit2, Trash2, MapPin, Clock, Phone } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminActions } from '@/hooks/useAdminActions';
import BranchForm from '@/components/admin-settings/BranchForm';
import StatsCard from '@/components/common/StatsCard';

export default function BranchesPage() {
  usePageTitle('Branch Management');
  const { branches, metrics, loading, refetchBranches } = useAdminData();
  const { deleteBranch } = useAdminActions();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setShowForm(true);
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('Are you sure you want to delete this branch? This action cannot be undone.')) return;

    try {
      await deleteBranch(branchId);
      refetchBranches();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="7">Branch Management</Heading>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Branch
          </Button>
        </Flex>

        {/* Metrics */}
        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
          <StatsCard
            title="Total Branches"
            value={metrics.totalBranches.toString()}
            icon={<MapPin />}
            loading={loading}
          />
          
          <StatsCard
            title="Total Staff"
            value={metrics.totalStaff.toString()}
            icon={<Plus />}
            loading={loading}
          />
          
          <StatsCard
            title="Active Users"
            value={metrics.activeUsers.toString()}
            icon={<Plus />}
            loading={loading}
          />
          
          <StatsCard
            title="Total Roles"
            value={metrics.totalRoles.toString()}
            icon={<Plus />}
            loading={loading}
          />
        </Grid>

        {/* Branches Table */}
        {loading ? (
          <Text>Loading branches...</Text>
        ) : branches.length === 0 ? (
          <Box className="text-center py-12">
            <Text size="3" color="gray">No branches created yet</Text>
          </Box>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Branch</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Address</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Services</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {branches.map((branch) => (
                <Table.Row key={branch.id}>
                  <Table.Cell>
                    <Box>
                      <Text weight="medium">{branch.name}</Text>
                      <Text size="1" color="gray">Code: {branch.code}</Text>
                    </Box>
                  </Table.Cell>
                  <Table.Cell>
                    <Box>
                      <Text size="2">{branch.address?.street || '-'}</Text>
                      <Text size="1" color="gray">
                        {branch.address?.city ? `${branch.address.city}, ${branch.address.state || ''}` : '-'}
                      </Text>
                    </Box>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex direction="column" gap="1">
                      {branch.phone && (
                        <Flex align="center" gap="1">
                          <Phone size={12} />
                          <Text size="1">{branch.phone}</Text>
                        </Flex>
                      )}
                      {branch.email && (
                        <Text size="1">{branch.email}</Text>
                      )}
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="1" wrap="wrap">
                      {branch.services?.dine_in && <Badge size="1" color="blue">Dine In</Badge>}
                      {branch.services?.takeaway && <Badge size="1" color="green">Takeaway</Badge>}
                      {branch.services?.delivery && <Badge size="1" color="purple">Delivery</Badge>}
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={branch.status === 'active' ? 'green' : 'gray'}>
                      {branch.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
                      <IconButton
                        size="1"
                        variant="ghost"
                        onClick={() => handleEdit(branch)}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={() => handleDelete(branch.id)}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}

        {/* Branch Form */}
        <BranchForm
          branch={selectedBranch}
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedBranch(null);
          }}
          onSuccess={() => {
            refetchBranches();
            setSelectedBranch(null);
          }}
        />
      </Flex>
    </Container>
  );
}
```

#### 3.2 Update `src/app/(default)/admin/staff/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Button, 
  Table, 
  Badge,
  IconButton,
  Text,
  Box,
  TextField,
  Avatar,
  Select
} from '@radix-ui/themes';
import { Plus, Edit2, UserX, Search } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminActions } from '@/hooks/useAdminActions';
import StaffForm from '@/components/admin-settings/StaffForm';
import { format } from 'date-fns';

export default function StaffPage() {
  usePageTitle('Staff Management');
  const { staff, branches, roles, loading, refetchStaff } = useAdminData();
  const { updateUserRole, deactivateUser } = useAdminActions();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredStaff = staff.filter(user => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!(
        user.first_name.toLowerCase().includes(searchLower) ||
        user.last_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      )) {
        return false;
      }
    }

    // Role filter
    if (roleFilter !== 'all' && user.role_id !== roleFilter) {
      return false;
    }

    return true;
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleRoleUpdate = async (userId: string, roleId: string) => {
    try {
      await updateUserRole(userId, roleId);
      refetchStaff();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await deactivateUser(userId);
      refetchStaff();
    } catch (error) {
      // Error handled in hook
    }
  };

  const getRoleName = (roleId: string) => {
    return roles.find(role => role.id === roleId)?.name || 'Unknown Role';
  };

  const getBranchName = (branchId: string) => {
    return branches.find(branch => branch.id === branchId)?.name || 'No Branch';
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="7">Staff Management</Heading>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Staff Member
          </Button>
        </Flex>

        {/* Filters */}
        <Flex gap="4">
          <Box className="flex-1">
            <TextField.Root
              placeholder="Search staff members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            >
              <TextField.Slot>
                <Search size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>
          
          <Select.Root value={roleFilter} onValueChange={setRoleFilter}>
            <Select.Trigger placeholder="Filter by role" className="w-48" />
            <Select.Content>
              <Select.Item value="all">All Roles</Select.Item>
              {roles.map(role => (
                <Select.Item key={role.id} value={role.id}>
                  {role.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        {/* Staff Table */}
        {loading ? (
          <Text>Loading staff...</Text>
        ) : filteredStaff.length === 0 ? (
          <Box className="text-center py-12">
            <Text size="3" color="gray">No staff members found</Text>
          </Box>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Staff Member</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Branch</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Last Login</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredStaff.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>
                    <Flex align="center" gap="3">
                      <Avatar
                        size="2"
                        fallback={`${user.first_name[0]}${user.last_name[0]}`}
                      />
                      <Box>
                        <Text weight="medium">
                          {user.first_name} {user.last_name}
                        </Text>
                        <Text size="1" color="gray">{user.email}</Text>
                      </Box>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge>{getRoleName(user.role_id || '')}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{getBranchName(user.primary_branch_id || '')}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">
                      {user.last_login 
                        ? format(new Date(user.last_login), 'MMM dd, HH:mm')
                        : 'Never'
                      }
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={user.status === 'active' ? 'green' : 'gray'}>
                      {user.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
                      <IconButton
                        size="1"
                        variant="ghost"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      {user.status === 'active' && (
                        <IconButton
                          size="1"
                          variant="ghost"
                          color="red"
                          onClick={() => handleDeactivate(user.id)}
                        >
                          <UserX size={14} />
                        </IconButton>
                      )}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}

        {/* Staff Form */}
        <StaffForm
          user={selectedUser}
          roles={roles}
          branches={branches}
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            refetchStaff();
            setSelectedUser(null);
          }}
        />
      </Flex>
    </Container>
  );
}
```

**Success Criteria**:
- ✅ Branch management page functional
- ✅ Staff management page operational
- ✅ Role assignments work correctly
- ✅ Permissions properly enforced

---

### Step 4: Testing and Validation (1-2 hours)

#### 4.1 Manual Testing Checklist
```
Branch Management:
- [ ] Branches page loads correctly
- [ ] Can create new branches
- [ ] Branch form validation works
- [ ] Operating hours configuration functional
- [ ] Address and contact info saves properly
- [ ] Branch services configuration works
- [ ] Can edit existing branches
- [ ] Branch deletion with confirmation

Staff Management:
- [ ] Staff page loads correctly
- [ ] Can add new staff members
- [ ] Role assignment works
- [ ] Staff search and filtering functional
- [ ] User profile updates work
- [ ] User deactivation works
- [ ] Permission restrictions enforced

Role Management:
- [ ] Roles page displays correctly
- [ ] Can create/edit roles
- [ ] Permission matrix functional
- [ ] Role assignments reflect immediately
- [ ] Permission changes take effect

Security:
- [ ] Only authorized users can access admin
- [ ] Role-based page restrictions work
- [ ] Data modifications properly secured
- [ ] Audit trail for admin actions
```

---

## 5. Success Criteria

### Functional Requirements
- ✅ **Branch Management**: Full CRUD operations for branches
- ✅ **Staff Management**: Complete user and role management
- ✅ **Role System**: Dynamic role and permission assignments
- ✅ **Organization Settings**: Configurable system settings
- ✅ **Access Control**: Proper security restrictions

### Technical Requirements
- ✅ **No Mock Data**: All imports from `data/` folder removed
- ✅ **Security**: Role-based access properly implemented
- ✅ **Type Safety**: Proper TypeScript types throughout
- ✅ **Error Handling**: Graceful error recovery
- ✅ **Performance**: Admin pages load quickly

### Security Requirements
- ✅ **Authorization**: Only admins can access admin functions
- ✅ **Data Protection**: Sensitive data properly secured
- ✅ **Audit Trail**: Admin actions logged
- ✅ **Permission Enforcement**: Role restrictions working

---

## 6. Deliverables

### Code Files
```
✅ src/hooks/useAdminData.ts (new)
✅ src/hooks/useAdminActions.ts (new)
✅ src/components/admin-settings/BranchForm.tsx (new)
✅ src/components/admin-settings/StaffForm.tsx (new)
✅ src/components/admin-settings/RoleForm.tsx (new)
✅ src/components/admin-settings/PermissionsMatrix.tsx (new)
✅ src/app/(default)/admin/branches/page.tsx (updated)
✅ src/app/(default)/admin/staff/page.tsx (updated)
✅ src/app/(default)/admin/roles/page.tsx (updated)
```

---

## 7. Rollback Plan

If integration fails:
1. Restore mock admin data temporarily
2. Keep existing UI using mock data
3. Debug organizationService separately
4. Test role/permission logic in isolation
5. Fix issues incrementally

---

## 8. Next Steps After Completion

1. **Advanced Permissions**: Fine-grained permission controls
2. **User Invitations**: Email-based staff invitation system
3. **Activity Monitoring**: Admin action audit logs
4. **Move to Next Phase**: Real-Time Features (Task 2.1)

---

**Status**: 📋 Ready to Start  
**Dependencies**: Task 1.1 (Dashboard), organizationService  
**Blocked By**: None  
**Blocks**: Advanced admin features
