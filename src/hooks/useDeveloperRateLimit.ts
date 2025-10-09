import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { auditService, AuditEventType, RiskLevel } from '@/lib/services/audit.service';

interface DeveloperRateLimitConfig {
  maxRequests: number;
  windowMs: number;
  operationType: 'test' | 'diagnostic' | 'queue_operation' | 'data_access';
  skipOnRole?: string[]; // Roles that bypass rate limiting
}

interface DeveloperRateLimitResult {
  canProceed: boolean;
  remaining: number;
  resetTime: number;
  isBlocked: boolean;
  nextAvailable: string;
}

// Default rate limits for different developer operations
const DEVELOPER_RATE_LIMITS: Record<string, DeveloperRateLimitConfig> = {
  edge_function_test: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    operationType: 'test',
    skipOnRole: ['admin', 'system_admin']
  },
  webhook_test: {
    maxRequests: 5,
    windowMs: 30 * 1000, // 30 seconds
    operationType: 'test',
    skipOnRole: ['admin']
  },
  integration_test: {
    maxRequests: 3,
    windowMs: 120 * 1000, // 2 minutes
    operationType: 'test',
    skipOnRole: ['admin']
  },
  queue_operation: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    operationType: 'queue_operation',
    skipOnRole: ['admin', 'system_admin']
  },
  sensitive_data_access: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    operationType: 'data_access',
    skipOnRole: ['system_admin']
  },
};

/**
 * Enhanced rate limiting hook for developer operations
 * Integrates with existing rate limiting and adds developer-specific controls
 */
export const useDeveloperRateLimit = (operation: string): DeveloperRateLimitResult & {
  executeWithLimit: <T>(fn: () => Promise<T>) => Promise<T>;
} => {
  const { user, userProfile } = useAuth();
  const [rateLimitState, setRateLimitState] = useState<DeveloperRateLimitResult | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const config = DEVELOPER_RATE_LIMITS[operation] || DEVELOPER_RATE_LIMITS.edge_function_test;

  // Check if user role bypasses rate limiting
  const bypassesRateLimit = useCallback(() => {
    if (!userProfile?.role_id || !config.skipOnRole) return false;
    
    // This would need to be enhanced with actual role checking
    // For now, we'll assume standard roles
    return config.skipOnRole.includes('admin'); // Simplified check
  }, [userProfile, config.skipOnRole]);

  // Check rate limit status
  const checkLimit = useCallback((): DeveloperRateLimitResult => {
    if (!user || bypassesRateLimit()) {
      return {
        canProceed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
        isBlocked: false,
        nextAvailable: new Date().toISOString(),
      };
    }

    const identifier = `developer_${user.id}_${operation}`;
    const result = checkRateLimit(identifier, config);

    const nextAvailable = result.success 
      ? new Date().toISOString()
      : new Date(result.reset).toISOString();

    return {
      canProceed: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
      isBlocked: !result.success,
      nextAvailable,
    };
  }, [user, operation, config, bypassesRateLimit]);

  // Execute function with rate limiting and audit logging
  const executeWithLimit = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    const limitCheck = checkLimit();
    setRateLimitState(limitCheck);

    if (!limitCheck.canProceed) {
      setIsBlocked(true);
      
      // Log rate limit violation
      if (user && userProfile) {
        await auditService.logSecurity(
          AuditEventType.RATE_LIMIT_EXCEEDED,
          'client', // Would be actual IP in server-side implementation
          RiskLevel.MEDIUM,
          user.id,
          {
            operation,
            operation_type: config.operationType,
            limit: config.maxRequests,
            window_ms: config.windowMs,
            reset_time: new Date(limitCheck.resetTime).toISOString(),
          }
        );
      }

      throw new Error(
        `Rate limit exceeded for ${operation}. Try again in ${Math.ceil((limitCheck.resetTime - Date.now()) / 1000)} seconds.`
      );
    }

    // Execute the function and log the operation
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;

    try {
      const result = await fn();
      success = true;
      
      // Log successful operation
      if (user && userProfile) {
        await auditService.logDeveloperAction(
          getAuditEventType(config.operationType),
          user.id,
          user.email || '',
          operation,
          'developer_operation',
          true,
          {
            operation_type: config.operationType,
            duration_ms: Date.now() - startTime,
            rate_limit_remaining: limitCheck.remaining - 1,
          }
        );
      }

      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      
      // Log failed operation
      if (user && userProfile) {
        await auditService.logDeveloperAction(
          getAuditEventType(config.operationType),
          user.id,
          user.email || '',
          operation,
          'developer_operation',
          false,
          {
            operation_type: config.operationType,
            duration_ms: Date.now() - startTime,
            error_message: error,
            rate_limit_remaining: limitCheck.remaining - 1,
          }
        );
      }

      throw err;
    }
  }, [checkLimit, operation, config, user, userProfile]);

  // Update rate limit state
  useEffect(() => {
    const limitStatus = checkLimit();
    setRateLimitState(limitStatus);
    setIsBlocked(!limitStatus.canProceed);
  }, [checkLimit]);

  const currentLimit = rateLimitState || checkLimit();

  return {
    canProceed: currentLimit.canProceed,
    remaining: currentLimit.remaining,
    resetTime: currentLimit.resetTime,
    isBlocked,
    nextAvailable: currentLimit.nextAvailable,
    executeWithLimit,
  };
};

/**
 * Map operation types to audit event types
 */
function getAuditEventType(operationType: string): AuditEventType {
  switch (operationType) {
    case 'test':
      return AuditEventType.INTEGRATION_TEST;
    case 'diagnostic':
      return AuditEventType.SYSTEM_DIAGNOSTIC;
    case 'queue_operation':
      return AuditEventType.QUEUE_OPERATION;
    case 'data_access':
      return AuditEventType.SENSITIVE_DATA_VIEW;
    default:
      return AuditEventType.DEVELOPER_HUB_ACCESS;
  }
}
