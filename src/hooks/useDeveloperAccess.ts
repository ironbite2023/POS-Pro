import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, PermissionUtils } from '@/lib/utils/permissions';
import { auditService, AuditEventType, RiskLevel } from '@/lib/services/audit.service';

interface DeveloperAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  permissions: string[];
  user: any;
  canExecuteTests: boolean;
  canViewLogs: boolean;
  canManageSystem: boolean;
}

interface DeveloperAccessOptions {
  requireSystemAccess?: boolean;
  logAccess?: boolean;
  auditResource?: string;
}

/**
 * Enhanced hook for developer access control with comprehensive security
 * Integrates with existing auth/permissions system and adds developer-specific validations
 */
export const useDeveloperAccess = (options: DeveloperAccessOptions = {}): DeveloperAccessResult => {
  const { user, userProfile } = useAuth();
  const { hasPermissions, loading: permissionsLoading } = usePermissions();
  const [accessLogged, setAccessLogged] = useState(false);

  const {
    requireSystemAccess = false,
    logAccess = true,
    auditResource = 'developer_hub'
  } = options;

  // Check developer permissions
  const hasBasicAccess = hasPermissions([
    PermissionUtils.REQUIREMENTS.ACCESS_DEVELOPER_HUB
  ]);

  const canExecuteTests = hasPermissions([
    PermissionUtils.REQUIREMENTS.EXECUTE_TESTS
  ]);

  const canViewLogs = hasPermissions([
    PermissionUtils.REQUIREMENTS.VIEW_SYSTEM_LOGS
  ]);

  const canManageSystem = hasPermissions([
    PermissionUtils.REQUIREMENTS.MANAGE_SYSTEM_CONFIG
  ]);

  // Enhanced access check including system access if required
  const hasAccess = requireSystemAccess 
    ? hasBasicAccess && canManageSystem
    : hasBasicAccess;

  // Get user's available permissions for developer tools
  const availablePermissions = useMemo(() => {
    const permissions = [];
    if (hasBasicAccess) permissions.push('developer_access');
    if (canExecuteTests) permissions.push('execute_tests');
    if (canViewLogs) permissions.push('view_logs');
    if (canManageSystem) permissions.push('manage_system');
    return permissions;
  }, [hasBasicAccess, canExecuteTests, canViewLogs, canManageSystem]);

  // Log developer access attempts
  const logAccessAttempt = useCallback(async () => {
    if (!user || !userProfile || accessLogged) return;

    try {
      // Get client IP (in a real implementation, this would come from request headers)
      const ipAddress = 'client'; // Placeholder - would be actual IP in server-side implementation

      await auditService.logPermission(
        hasAccess ? AuditEventType.PERMISSION_GRANTED : AuditEventType.PERMISSION_DENIED,
        user.id,
        user.email || '',
        auditResource,
        hasAccess,
        'developer_access',
        {
          requested_permissions: availablePermissions,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          access_type: 'developer_hub'
        }
      );

      // Log security event for denied access
      if (!hasAccess) {
        await auditService.logSecurity(
          AuditEventType.UNAUTHORIZED_ACCESS,
          ipAddress,
          RiskLevel.MEDIUM,
          user.id,
          {
            attempted_resource: auditResource,
            user_role: userProfile.role_id,
            required_permissions: ['developer_access']
          }
        );
      }

      setAccessLogged(true);
    } catch (error) {
      console.error('Failed to log developer access:', error);
    }
  }, [user, userProfile, hasAccess, accessLogged, auditResource, availablePermissions]);

  // Log access on first check
  useEffect(() => {
    if (!permissionsLoading && logAccess) {
      logAccessAttempt();
    }
  }, [permissionsLoading, logAccess, logAccessAttempt]);

  return {
    hasAccess,
    isLoading: permissionsLoading,
    permissions: availablePermissions,
    user: userProfile,
    canExecuteTests,
    canViewLogs,
    canManageSystem,
  };
};
