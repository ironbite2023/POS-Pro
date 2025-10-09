import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

type Role = Database['public']['Tables']['roles']['Row'];
type Permission = Database['public']['Tables']['role_permissions']['Row'];

// Define permission modules and actions
export const MODULES = {
  DASHBOARD: 'dashboard',
  INVENTORY: 'inventory',
  MENU_MANAGEMENT: 'menu_management',
  SALES: 'sales', 
  POS: 'pos',
  LOYALTY_PROGRAM: 'loyalty_program',
  PURCHASING: 'purchasing',
  DELIVERY: 'delivery',
  WASTE_MANAGEMENT: 'waste_management',
  ADMIN_SETTINGS: 'admin_settings',
  USERS: 'users',
  ROLES: 'roles',
  ORGANIZATION: 'organization',
  DEVELOPER: 'developer',
  SYSTEM: 'system',
} as const;

export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  MANAGE: 'manage',
} as const;

export type ModuleType = typeof MODULES[keyof typeof MODULES];
export type ActionType = typeof ACTIONS[keyof typeof ACTIONS];

// Permission interface for easier usage
export interface UserPermission {
  module: ModuleType;
  actions: ActionType[];
}

// Permission requirement interface
export interface PermissionRequirement {
  module: ModuleType;
  action: ActionType;
  requireAll?: boolean; // If true, user must have ALL specified permissions
}

/**
 * Custom hook to manage user permissions
 */
export const usePermissions = () => {
  const { userProfile } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user permissions from database
  const loadPermissions = useCallback(async () => {
    if (!userProfile?.role_id) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get role permissions from database
      const { data: rolePermissions, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', userProfile.role_id);

      if (error) {
        console.error('Error loading permissions:', error);
        setPermissions([]);
        return;
      }

      // Transform database permissions to UserPermission format
      const userPermissions = rolePermissions.reduce((acc: UserPermission[], perm) => {
        const existingModule = acc.find(p => p.module === perm.module);
        
        if (existingModule) {
          // Add action to existing module if it has permission
          if (perm.can_view && !existingModule.actions.includes(ACTIONS.VIEW)) {
            existingModule.actions.push(ACTIONS.VIEW);
          }
          if (perm.can_create && !existingModule.actions.includes(ACTIONS.CREATE)) {
            existingModule.actions.push(ACTIONS.CREATE);
          }
          if (perm.can_edit && !existingModule.actions.includes(ACTIONS.EDIT)) {
            existingModule.actions.push(ACTIONS.EDIT);
          }
          if (perm.can_delete && !existingModule.actions.includes(ACTIONS.DELETE)) {
            existingModule.actions.push(ACTIONS.DELETE);
          }
        } else {
          // Create new module permission entry
          const actions: ActionType[] = [];
          if (perm.can_view) actions.push(ACTIONS.VIEW);
          if (perm.can_create) actions.push(ACTIONS.CREATE);
          if (perm.can_edit) actions.push(ACTIONS.EDIT);
          if (perm.can_delete) actions.push(ACTIONS.DELETE);

          if (actions.length > 0) {
            acc.push({
              module: perm.module as ModuleType,
              actions
            });
          }
        }
        
        return acc;
      }, []);

      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.role_id]);

  // Load permissions when user role changes
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((requirement: PermissionRequirement): boolean => {
    if (!permissions.length) return false;

    const modulePermission = permissions.find(p => p.module === requirement.module);
    if (!modulePermission) return false;

    return modulePermission.actions.includes(requirement.action);
  }, [permissions]);

  /**
   * Check if user has multiple permissions
   */
  const hasPermissions = useCallback((requirements: PermissionRequirement[]): boolean => {
    if (!requirements.length) return true;

    const firstRequirement = requirements[0];
    const requireAll = firstRequirement.requireAll ?? false;

    if (requireAll) {
      // User must have ALL permissions
      return requirements.every(req => hasPermission(req));
    } else {
      // User must have AT LEAST ONE permission
      return requirements.some(req => hasPermission(req));
    }
  }, [hasPermission]);

  /**
   * Check if user can access a specific module
   */
  const canAccessModule = useCallback((module: ModuleType): boolean => {
    return hasPermission({ module, action: ACTIONS.VIEW });
  }, [hasPermission]);

  /**
   * Get user's permissions for a specific module
   */
  const getModulePermissions = useCallback((module: ModuleType): ActionType[] => {
    const modulePermission = permissions.find(p => p.module === module);
    return modulePermission?.actions || [];
  }, [permissions]);

  return {
    permissions,
    loading,
    hasPermission,
    hasPermissions,
    canAccessModule,
    getModulePermissions,
    refresh: loadPermissions,
  };
};

/**
 * Check if user is admin (has all permissions)
 */
export const useIsAdmin = () => {
  const { userProfile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!userProfile?.role_id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Get role details
        const { data: role, error } = await supabase
          .from('roles')
          .select('name')
          .eq('id', userProfile.role_id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(role?.name?.toLowerCase() === 'admin' || role?.name?.toLowerCase() === 'system_admin' || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [userProfile?.role_id]);

  return { isAdmin, loading };
};

/**
 * Utility functions for permission checking
 */
export const PermissionUtils = {
  /**
   * Create permission requirement object
   */
  createRequirement: (module: ModuleType, action: ActionType): PermissionRequirement => ({
    module,
    action,
  }),

  /**
   * Create multiple permission requirements
   */
  createRequirements: (
    requirements: Array<{ module: ModuleType; action: ActionType }>,
    requireAll = false
  ): PermissionRequirement[] => {
    return requirements.map(req => ({ ...req, requireAll }));
  },

  /**
   * Common permission requirements for quick access
   */
  REQUIREMENTS: {
    // Dashboard
    VIEW_DASHBOARD: { module: MODULES.DASHBOARD, action: ACTIONS.VIEW },
    
    // Inventory
    VIEW_INVENTORY: { module: MODULES.INVENTORY, action: ACTIONS.VIEW },
    MANAGE_INVENTORY: { module: MODULES.INVENTORY, action: ACTIONS.EDIT },
    CREATE_INVENTORY: { module: MODULES.INVENTORY, action: ACTIONS.CREATE },
    
    // Menu Management
    VIEW_MENU: { module: MODULES.MENU_MANAGEMENT, action: ACTIONS.VIEW },
    MANAGE_MENU: { module: MODULES.MENU_MANAGEMENT, action: ACTIONS.EDIT },
    CREATE_MENU_ITEMS: { module: MODULES.MENU_MANAGEMENT, action: ACTIONS.CREATE },
    
    // Sales & POS
    VIEW_SALES: { module: MODULES.SALES, action: ACTIONS.VIEW },
    USE_POS: { module: MODULES.POS, action: ACTIONS.VIEW },
    
    // Admin
    MANAGE_USERS: { module: MODULES.USERS, action: ACTIONS.MANAGE },
    MANAGE_ROLES: { module: MODULES.ROLES, action: ACTIONS.MANAGE },
    MANAGE_ORGANIZATION: { module: MODULES.ORGANIZATION, action: ACTIONS.MANAGE },
    
    // Purchasing
    VIEW_PURCHASING: { module: MODULES.PURCHASING, action: ACTIONS.VIEW },
    MANAGE_PURCHASING: { module: MODULES.PURCHASING, action: ACTIONS.EDIT },
    
    // Delivery
    VIEW_DELIVERY: { module: MODULES.DELIVERY, action: ACTIONS.VIEW },
    MANAGE_DELIVERY: { module: MODULES.DELIVERY, action: ACTIONS.EDIT },
    
    // Developer Hub
    ACCESS_DEVELOPER_HUB: { module: MODULES.DEVELOPER, action: ACTIONS.VIEW },
    USE_DEVELOPER_TOOLS: { module: MODULES.DEVELOPER, action: ACTIONS.MANAGE },
    EXECUTE_TESTS: { module: MODULES.DEVELOPER, action: ACTIONS.CREATE },
    VIEW_SYSTEM_LOGS: { module: MODULES.SYSTEM, action: ACTIONS.VIEW },
    MANAGE_SYSTEM_CONFIG: { module: MODULES.SYSTEM, action: ACTIONS.MANAGE },
  } as const,
};
