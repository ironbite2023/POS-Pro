'use client';

import React from 'react';
import { Card, Flex, Text, Button, Box, Badge } from '@radix-ui/themes';
import { Shield, AlertCircle, Lock, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useDeveloperAccess } from '@/hooks/useDeveloperAccess';
import { useDeveloperRateLimit } from '@/hooks/useDeveloperRateLimit';
import DeveloperErrorBoundary from './DeveloperErrorBoundary';
import { DataSanitizer } from '@/lib/utils/dataSanitizer';

interface ProtectedDeveloperPageProps {
  children: React.ReactNode;
  requireSystemAccess?: boolean;
  operation?: string; // For rate limiting
  context?: string; // For error boundary logging
  title?: string;
  description?: string;
}

/**
 * Unauthorized Access Component
 */
const UnauthorizedAccess: React.FC<{ missingPermissions: string[] }> = ({ missingPermissions }) => (
  <Card className="border-red-200 bg-red-50">
    <Flex direction="column" gap="4" align="center" className="py-8">
      <Shield size={48} className="text-red-500" />
      
      <Box className="text-center">
        <Text size="5" weight="bold" color="red" className="mb-2 block">
          Access Denied
        </Text>
        <Text size="3" color="gray" className="mb-4 block">
          You don&apos;t have permission to access the Developer Hub
        </Text>
      </Box>

      <Box className="text-center">
        <Text size="2" color="gray" weight="medium" className="mb-2 block">
          Required Permissions:
        </Text>
        <Flex gap="2" wrap="wrap" justify="center">
          {missingPermissions.map((permission) => (
            <Badge key={permission} color="red" variant="soft">
              {permission}
            </Badge>
          ))}
        </Flex>
      </Box>

      <Box className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <Flex gap="2">
          <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <Box>
            <Text size="2" weight="medium" className="text-yellow-900 block mb-1">
              Need Access?
            </Text>
            <Text size="1" className="text-yellow-700">
              Contact your system administrator to request developer permissions for your role.
            </Text>
          </Box>
        </Flex>
      </Box>

      <Link href="/">
        <Button variant="outline">
          <RefreshCw size={14} />
          Return to Dashboard
        </Button>
      </Link>
    </Flex>
  </Card>
);

/**
 * Rate Limited Component
 */
const RateLimited: React.FC<{ remaining: number; resetTime: number; operation: string }> = ({ 
  remaining, 
  resetTime, 
  operation 
}) => {
  const timeUntilReset = Math.ceil((resetTime - Date.now()) / 1000);

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <Flex direction="column" gap="4" align="center" className="py-6">
        <Clock size={32} className="text-yellow-600" />
        
        <Box className="text-center">
          <Text size="4" weight="bold" color="orange" className="mb-2 block">
            Rate Limit Exceeded
          </Text>
          <Text size="2" color="gray">
            Too many {operation} requests. Please wait before trying again.
          </Text>
        </Box>

        <Box className="text-center">
          <Text size="6" weight="bold" color="orange" className="block">
            {timeUntilReset}s
          </Text>
          <Text size="2" color="gray">
            until next attempt
          </Text>
        </Box>

        <Box className="bg-blue-50 p-3 rounded-md border border-blue-200">
          <Text size="1" className="text-blue-700 text-center block">
            Rate limits protect the system from overload and ensure fair access for all developers.
          </Text>
        </Box>
      </Flex>
    </Card>
  );
};

/**
 * Loading State Component
 */
const DeveloperLoading: React.FC<{ message?: string }> = ({ message = 'Loading developer tools...' }) => (
  <Card>
    <Flex direction="column" gap="4" align="center" className="py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <Text size="3" color="gray">{message}</Text>
    </Flex>
  </Card>
);

/**
 * Main protected developer page wrapper
 */
export const ProtectedDeveloperPage: React.FC<ProtectedDeveloperPageProps> = ({
  children,
  requireSystemAccess = false,
  operation = 'general_access',
  context = 'developer_page',
  title,
  description,
}) => {
  const { 
    hasAccess, 
    isLoading: authLoading, 
    permissions 
  } = useDeveloperAccess({ 
    requireSystemAccess,
    auditResource: context 
  });

  const {
    canProceed,
    remaining,
    resetTime,
    isBlocked,
  } = useDeveloperRateLimit(operation);

  // Loading state
  if (authLoading) {
    return <DeveloperLoading message="Verifying developer permissions..." />;
  }

  // Access denied
  if (!hasAccess) {
    const requiredPermissions = requireSystemAccess 
      ? ['developer_access', 'system_management']
      : ['developer_access'];
    
    return <UnauthorizedAccess missingPermissions={requiredPermissions} />;
  }

  // Rate limited
  if (isBlocked) {
    return <RateLimited remaining={remaining} resetTime={resetTime} operation={operation} />;
  }

  // Render protected content with error boundary
  return (
    <DeveloperErrorBoundary context={context}>
      {/* Security Header */}
      <Box className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <Shield size={16} className="text-blue-600" />
            <Text size="2" className="text-blue-900 font-medium">
              Developer Mode Active
            </Text>
            <Badge color="blue" size="1">
              Secured
            </Badge>
          </Flex>
          <Flex gap="4" align="center">
            <Text size="1" color="gray">
              Rate Limit: {remaining} requests remaining
            </Text>
            <Text size="1" color="gray">
              User: {permissions.join(', ')}
            </Text>
          </Flex>
        </Flex>
      </Box>

      {/* Page Header if provided */}
      {(title || description) && (
        <Box className="mb-6">
          {title && (
            <Text size="7" weight="bold" className="mb-2 block">
              {title}
            </Text>
          )}
          {description && (
            <Text size="3" color="gray">
              {description}
            </Text>
          )}
        </Box>
      )}

      {/* Protected Content */}
      {children}
    </DeveloperErrorBoundary>
  );
};

/**
 * Higher-order component for protecting developer pages
 */
export const withDeveloperProtection = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedDeveloperPageProps, 'children'> = {}
) => {
  const ProtectedComponent: React.FC<P> = (props) => {
    return (
      <ProtectedDeveloperPage {...options}>
        <Component {...props} />
      </ProtectedDeveloperPage>
    );
  };

  ProtectedComponent.displayName = `withDeveloperProtection(${Component.displayName || Component.name})`;
  
  return ProtectedComponent;
};

/**
 * Utility component for displaying sanitized data
 */
export const SanitizedDataDisplay: React.FC<{
  data: unknown;
  title?: string;
  maxHeight?: string;
}> = ({ data, title = 'Data', maxHeight = 'max-h-64' }) => {
  const { displayData, hasSensitiveData, warnings } = DataSanitizer.createDisplaySafeData(data);

  return (
    <Box>
      <Flex justify="between" align="center" className="mb-2">
        <Text size="2" weight="medium" color="gray">
          {title}
        </Text>
        {hasSensitiveData && (
          <Badge color="yellow" size="1">
            <Flex align="center" gap="1">
              <Shield size={10} />
              Sanitized
            </Flex>
          </Badge>
        )}
      </Flex>

      {warnings.length > 0 && (
        <Box className="bg-yellow-50 p-2 rounded-md mb-2 border border-yellow-200">
          <Text size="1" className="text-yellow-700">
            Security: {warnings.join(', ')}
          </Text>
        </Box>
      )}

      <Box className={`bg-gray-100 p-3 rounded-md overflow-auto ${maxHeight}`}>
        <pre className="text-xs">
          {JSON.stringify(displayData, null, 2)}
        </pre>
      </Box>
    </Box>
  );
};

export default ProtectedDeveloperPage;
