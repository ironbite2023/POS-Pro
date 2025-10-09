import { supabase } from '@/lib/supabase/client';

// Audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILED = 'auth.login.failed',
  LOGOUT = 'auth.logout',
  SIGNUP_SUCCESS = 'auth.signup.success',
  SIGNUP_FAILED = 'auth.signup.failed',
  PASSWORD_RESET_REQUEST = 'auth.password.reset.request',
  PASSWORD_RESET_SUCCESS = 'auth.password.reset.success',
  PASSWORD_CHANGE = 'auth.password.change',
  SESSION_EXPIRED = 'auth.session.expired',
  SESSION_EXTENDED = 'auth.session.extended',

  // Permission events
  PERMISSION_DENIED = 'permission.denied',
  ROLE_CHANGED = 'permission.role.changed',
  PERMISSION_GRANTED = 'permission.granted',

  // Security events
  SUSPICIOUS_ACTIVITY = 'security.suspicious',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  UNAUTHORIZED_ACCESS = 'security.unauthorized_access',
  IP_BLOCKED = 'security.ip.blocked',
  
  // Data access events
  SENSITIVE_DATA_ACCESS = 'data.sensitive.access',
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  DATA_DELETE = 'data.delete',

  // Admin events
  USER_CREATED = 'admin.user.created',
  USER_DELETED = 'admin.user.deleted',
  ROLE_CREATED = 'admin.role.created',
  ROLE_DELETED = 'admin.role.deleted',
  SETTINGS_CHANGED = 'admin.settings.changed',

  // Developer Hub events
  DEVELOPER_HUB_ACCESS = 'developer.hub.access',
  EDGE_FUNCTION_TEST = 'developer.edge_function.test',
  WEBHOOK_TEST = 'developer.webhook.test',
  INTEGRATION_TEST = 'developer.integration.test',
  QUEUE_OPERATION = 'developer.queue.operation',
  SYSTEM_DIAGNOSTIC = 'developer.system.diagnostic',
  SENSITIVE_DATA_VIEW = 'developer.sensitive_data.view',
}

// Risk levels for events
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Audit log entry interface
export interface AuditLogEntry {
  id?: string;
  event_type: AuditEventType;
  risk_level: RiskLevel;
  user_id?: string;
  user_email?: string;
  organization_id?: string;
  ip_address?: string;
  user_agent?: string;
  resource?: string; // What was accessed/modified
  details?: Record<string, any>; // Additional context
  success: boolean;
  timestamp: string;
  session_id?: string;
}

// Security metrics interface
export interface SecurityMetrics {
  totalEvents: number;
  failedLogins: number;
  suspiciousActivities: number;
  rateLimit24h: number;
  uniqueIPs24h: number;
  criticalEvents24h: number;
}

/**
 * Audit Service for security monitoring and compliance
 */
export const auditService = {
  /**
   * Log an audit event
   */
  logEvent: async (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> => {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
      };

      // Log to console for immediate visibility (remove in production)
      console.log(`[AUDIT] ${entry.event_type}:`, {
        risk: entry.risk_level,
        user: entry.user_email || 'anonymous',
        ip: entry.ip_address,
        success: entry.success,
        resource: entry.resource,
      });

      // Store in database (create audit_logs table)
      const { error } = await supabase
        .from('audit_logs')
        .insert([auditEntry]);

      if (error) {
        console.error('Failed to store audit log:', error);
        // Don't throw error to prevent breaking the main flow
      }

      // Real-time alerting for critical events
      if (entry.risk_level === RiskLevel.CRITICAL) {
        await auditService.handleCriticalEvent(auditEntry);
      }

    } catch (error) {
      console.error('Audit logging failed:', error);
      // Ensure audit failures don't break the application
    }
  },

  /**
   * Log authentication events
   */
  logAuth: async (
    eventType: AuditEventType,
    userId?: string,
    userEmail?: string,
    ipAddress?: string,
    success: boolean = true,
    details?: Record<string, any>
  ): Promise<void> => {
    const riskLevel = success 
      ? RiskLevel.LOW 
      : eventType.includes('failed') 
        ? RiskLevel.HIGH 
        : RiskLevel.MEDIUM;

    await auditService.logEvent({
      event_type: eventType,
      risk_level: riskLevel,
      user_id: userId,
      user_email: userEmail,
      ip_address: ipAddress,
      success,
      details,
    });
  },

  /**
   * Log permission events
   */
  logPermission: async (
    eventType: AuditEventType,
    userId: string,
    userEmail: string,
    resource: string,
    success: boolean,
    requiredPermission?: string,
    details?: Record<string, any>
  ): Promise<void> => {
    await auditService.logEvent({
      event_type: eventType,
      risk_level: success ? RiskLevel.LOW : RiskLevel.MEDIUM,
      user_id: userId,
      user_email: userEmail,
      resource,
      success,
      details: {
        required_permission: requiredPermission,
        ...details,
      },
    });
  },

  /**
   * Log security events
   */
  logSecurity: async (
    eventType: AuditEventType,
    ipAddress: string,
    riskLevel: RiskLevel = RiskLevel.HIGH,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> => {
    await auditService.logEvent({
      event_type: eventType,
      risk_level: riskLevel,
      user_id: userId,
      ip_address: ipAddress,
      success: false, // Security events are typically failures/violations
      details,
    });
  },

  /**
   * Handle critical security events
   */
  handleCriticalEvent: async (entry: AuditLogEntry): Promise<void> => {
    try {
      console.error(`[CRITICAL SECURITY EVENT] ${entry.event_type}:`, entry);

      // In production, this would:
      // 1. Send alerts to security team
      // 2. Trigger automated responses
      // 3. Update threat detection systems
      // 4. Log to external security information and event management (SIEM) systems

      // For now, just log to console with high visibility
      console.error('🚨 CRITICAL SECURITY ALERT 🚨', {
        event: entry.event_type,
        user: entry.user_email,
        ip: entry.ip_address,
        time: entry.timestamp,
        details: entry.details,
      });

    } catch (error) {
      console.error('Failed to handle critical event:', error);
    }
  },

  /**
   * Get security metrics for dashboard
   */
  getSecurityMetrics: async (organizationId?: string): Promise<SecurityMetrics> => {
    try {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('audit_logs')
        .select('event_type, risk_level, ip_address')
        .gte('timestamp', since24h);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: logs, error } = await query;
      
      if (error) throw error;

      const metrics: SecurityMetrics = {
        totalEvents: logs?.length || 0,
        failedLogins: logs?.filter(l => l.event_type === AuditEventType.LOGIN_FAILED).length || 0,
        suspiciousActivities: logs?.filter(l => l.event_type === AuditEventType.SUSPICIOUS_ACTIVITY).length || 0,
        rateLimit24h: logs?.filter(l => l.event_type === AuditEventType.RATE_LIMIT_EXCEEDED).length || 0,
        uniqueIPs24h: new Set(logs?.map(l => l.ip_address).filter(Boolean)).size,
        criticalEvents24h: logs?.filter(l => l.risk_level === RiskLevel.CRITICAL).length || 0,
      };

      return metrics;
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      // Return default metrics on error
      return {
        totalEvents: 0,
        failedLogins: 0,
        suspiciousActivities: 0,
        rateLimit24h: 0,
        uniqueIPs24h: 0,
        criticalEvents24h: 0,
      };
    }
  },

  /**
   * Get recent audit logs
   */
  getRecentLogs: async (
    organizationId?: string,
    limit: number = 50,
    eventTypes?: AuditEventType[]
  ): Promise<AuditLogEntry[]> => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      if (eventTypes?.length) {
        query = query.in('event_type', eventTypes);
      }

      const { data: logs, error } = await query;
      
      if (error) throw error;

      // Cast the returned data to proper types since database returns strings
      return (logs || []).map(log => ({
        ...log,
        event_type: log.event_type as AuditEventType,
        risk_level: log.risk_level as RiskLevel
      })) as AuditLogEntry[];
    } catch (error) {
      console.error('Failed to get recent logs:', error);
      return [];
    }
  },

  /**
   * Search audit logs
   */
  searchLogs: async (
    searchTerm: string,
    organizationId?: string,
    limit: number = 100
  ): Promise<AuditLogEntry[]> => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .or(`user_email.ilike.%${searchTerm}%,ip_address.ilike.%${searchTerm}%,resource.ilike.%${searchTerm}%`)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: logs, error } = await query;
      
      if (error) throw error;

      // Cast the returned data to proper types since database returns strings
      return (logs || []).map(log => ({
        ...log,
        event_type: log.event_type as AuditEventType,
        risk_level: log.risk_level as RiskLevel
      })) as AuditLogEntry[];
    } catch (error) {
      console.error('Failed to search logs:', error);
      return [];
    }
  },

  /**
   * Log developer-specific events with enhanced security context
   */
  logDeveloperAction: async (
    eventType: AuditEventType,
    userId: string,
    userEmail: string,
    action: string,
    resource: string,
    success: boolean = true,
    details?: Record<string, any>
  ): Promise<void> => {
    const riskLevel = eventType.includes('sensitive') ? RiskLevel.HIGH : RiskLevel.MEDIUM;

    await auditService.logEvent({
      event_type: eventType,
      risk_level: riskLevel,
      user_id: userId,
      user_email: userEmail,
      resource: `developer.${resource}`,
      success,
      details: {
        developer_action: action,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString(),
        ...details,
      },
    });

    // Additional logging for sensitive operations
    if (eventType === AuditEventType.SENSITIVE_DATA_VIEW && success) {
      console.warn(`[DEVELOPER AUDIT] Sensitive data accessed by ${userEmail}:`, {
        resource,
        action,
        timestamp: new Date().toISOString(),
      });
    }
  },

  /**
   * Log test execution with performance metrics
   */
  logTestExecution: async (
    testType: string,
    platform: string,
    userId: string,
    userEmail: string,
    success: boolean,
    duration: number,
    error?: string
  ): Promise<void> => {
    await auditService.logDeveloperAction(
      AuditEventType.INTEGRATION_TEST,
      userId,
      userEmail,
      'test_execution',
      'integration_validator',
      success,
      {
        test_type: testType,
        platform,
        duration_ms: duration,
        error_message: error,
        performance_metrics: {
          execution_time: duration,
          success_rate: success ? 1 : 0,
        }
      }
    );
  },
};
