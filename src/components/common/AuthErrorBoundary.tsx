'use client';

import React, { Component, ReactNode } from 'react';
import { Box, Flex, Heading, Text, Button, Card } from '@radix-ui/themes';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { auditService, AuditEventType, RiskLevel } from '@/lib/services/audit.service';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface AuthErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  onGoHome: () => void;
}

const AuthErrorFallback: React.FC<AuthErrorFallbackProps> = ({ error, onRetry, onGoHome }) => {
  return (
    <Flex align="center" justify="center" className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="max-w-md w-full mx-4">
        <Flex direction="column" align="center" gap="4" className="p-6">
          <Box className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </Box>
          
          <Box className="text-center">
            <Heading size="6" className="mb-2">Authentication Error</Heading>
            <Text size="3" color="gray" className="mb-4">
              {error?.message === 'Network Error' 
                ? 'Unable to connect to authentication service. Please check your internet connection.'
                : 'An error occurred while processing your authentication request.'}
            </Text>
            {process.env.NODE_ENV === 'development' && error && (
              <Box className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded border text-left">
                <Text size="2" className="font-mono text-red-600 dark:text-red-400">
                  {error.message}
                </Text>
              </Box>
            )}
          </Box>

          <Flex direction="column" gap="3" className="w-full">
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onGoHome}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Login
            </Button>
          </Flex>

          <Box className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Text size="2" color="blue" className="text-blue-800 dark:text-blue-200">
              If this problem persists, please contact support or try logging out and back in.
            </Text>
          </Box>
        </Flex>
      </Card>
    </Flex>
  );
};

export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AuthErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error details
    console.error('🚨 Authentication Error Boundary Caught:', error, errorInfo);
    
    this.setState({ errorInfo });

    // Log to audit service for security monitoring
    auditService.logSecurity(
      AuditEventType.UNAUTHORIZED_ACCESS,
      'unknown',
      RiskLevel.HIGH,
      undefined,
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }
    ).catch((auditError) => {
      console.error('Failed to log authentication error:', auditError);
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset the error boundary state
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleGoHome = () => {
    // Navigate to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login?message=Please login again due to an authentication error.';
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <AuthErrorFallback 
          error={this.state.error}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

// Higher-order component wrapper for easier usage
export const withAuthErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <AuthErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </AuthErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default AuthErrorBoundary;
