'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Flex, Text, Button, Box, Badge, Separator, Code } from '@radix-ui/themes';
import { AlertTriangle, RefreshCw, Bug, Shield, Copy } from 'lucide-react';
import { auditService, AuditEventType, RiskLevel } from '@/lib/services/audit.service';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface DeveloperErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string; // Context for audit logging
}

/**
 * Specialized error boundary for developer components
 * Provides detailed error information and security audit logging
 */
export class DeveloperErrorBoundary extends Component<
  DeveloperErrorBoundaryProps,
  ErrorBoundaryState
> {
  private errorTimeout: NodeJS.Timeout | null = null;

  constructor(props: DeveloperErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `dev_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console for immediate visibility
    console.error('Developer Hub Error:', error);
    console.error('Error Info:', errorInfo);

    // Log to audit system
    this.logErrorToAudit(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-clear error after 10 seconds (allows for automatic recovery)
    this.errorTimeout = setTimeout(() => {
      this.handleRetry();
    }, 10000);
  }

  componentWillUnmount() {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

  private async logErrorToAudit(error: Error, errorInfo: ErrorInfo) {
    try {
      // Get current user info if available
      const userEmail = 'developer'; // Would get from auth context in real implementation
      const userId = 'dev_user'; // Would get from auth context

      await auditService.logEvent({
        event_type: AuditEventType.SUSPICIOUS_ACTIVITY,
        risk_level: RiskLevel.HIGH,
        user_id: userId,
        user_email: userEmail,
        resource: `developer.error_boundary.${this.props.context || 'unknown'}`,
        success: false,
        details: {
          error_message: error.message,
          error_stack: error.stack,
          error_id: this.state.errorId,
          component_stack: errorInfo.componentStack,
          error_boundary_context: this.props.context,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
      });
    } catch (auditError) {
      console.error('Failed to log error to audit system:', auditError);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
  };

  private handleCopyError = () => {
    if (!this.state.error) return;

    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error.message,
      stack: this.state.error.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      context: this.props.context,
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default developer error UI
      return (
        <Card className="border-red-200 bg-red-50">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <AlertTriangle className="text-red-600" size={20} />
              <Text size="5" weight="bold" color="red">
                Developer Tool Error
              </Text>
              <Badge color="red">
                ID: {this.state.errorId}
              </Badge>
            </Flex>

            {/* Error Message */}
            <Box>
              <Text size="3" weight="medium" className="mb-2 block">
                Error Message:
              </Text>
              <Card variant="surface" className="bg-red-100 border-red-200">
                <Text size="2" color="red">
                  {this.state.error?.message || 'Unknown error occurred'}
                </Text>
              </Card>
            </Box>

            {/* Context Information */}
            {this.props.context && (
              <Box>
                <Text size="2" color="gray" weight="medium" className="mb-1 block">
                  Context: {this.props.context}
                </Text>
              </Box>
            )}

            {/* Error Stack (Developer Mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
              <Box>
                <Text size="3" weight="medium" className="mb-2 block">
                  Stack Trace:
                </Text>
                <Box className="bg-gray-900 p-3 rounded-md max-h-40 overflow-y-auto">
                  <Code className="text-xs text-white whitespace-pre-wrap">
                    {this.state.error.stack}
                  </Code>
                </Box>
              </Box>
            )}

            <Separator size="4" />

            {/* Action Buttons */}
            <Flex gap="3" justify="between">
              <Flex gap="2">
                <Button
                  size="2"
                  onClick={this.handleRetry}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw size={14} />
                  Retry
                </Button>
                <Button
                  size="2"
                  variant="outline"
                  onClick={this.handleCopyError}
                >
                  <Copy size={14} />
                  Copy Error Details
                </Button>
              </Flex>

              <Box>
                <Text size="1" color="gray">
                  Auto-retry in 10 seconds
                </Text>
              </Box>
            </Flex>

            {/* Security Notice */}
            <Box className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <Flex gap="2">
                <Shield size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <Box>
                  <Text size="2" weight="medium" className="text-yellow-900 block mb-1">
                    Security Notice
                  </Text>
                  <Text size="1" className="text-yellow-700">
                    This error has been logged for security monitoring. 
                    If you suspect this is related to a security issue, contact your system administrator.
                  </Text>
                </Box>
              </Flex>
            </Box>
          </Flex>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version of the error boundary for function components
 */
export const useDeveloperErrorHandler = (context?: string) => {
  const handleError = (error: Error, errorInfo?: string) => {
    console.error(`[Developer Error - ${context}]:`, error);
    
    // Log to audit system
    auditService.logEvent({
      event_type: AuditEventType.SUSPICIOUS_ACTIVITY,
      risk_level: RiskLevel.MEDIUM,
      resource: `developer.${context || 'unknown'}`,
      success: false,
      details: {
        error_message: error.message,
        error_stack: error.stack,
        additional_info: errorInfo,
        timestamp: new Date().toISOString(),
      },
    }).catch(console.error);
  };

  return { handleError };
};

export default DeveloperErrorBoundary;
