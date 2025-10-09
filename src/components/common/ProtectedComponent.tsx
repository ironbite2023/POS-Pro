'use client';

import React from 'react';
import { Box, Text, Flex } from '@radix-ui/themes';
import { Lock } from 'lucide-react';
import { usePermissions, PermissionRequirement } from '@/lib/utils/permissions';

interface ProtectedComponentProps {
  children: React.ReactNode;
  requirements: PermissionRequirement | PermissionRequirement[];
  fallback?: React.ReactNode;
  showFallback?: boolean; // If false, renders nothing when no permission
  loadingFallback?: React.ReactNode;
}

const DefaultPermissionFallback: React.FC = () => {
  return (
    <Box className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <Flex align="center" gap="2" justify="center">
        <Lock className="w-4 h-4 text-gray-400" />
        <Text size="2" color="gray">
          Insufficient permissions to view this content
        </Text>
      </Flex>
    </Box>
  );
};

const DefaultLoadingFallback: React.FC = () => {
  return (
    <Box className="p-4">
      <Flex align="center" gap="2" justify="center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <Text size="2" color="gray">Loading...</Text>
      </Flex>
    </Box>
  );
};

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  requirements,
  fallback,
  showFallback = true,
  loadingFallback,
}) => {
  const { hasPermissions, loading } = usePermissions();

  // Show loading state while permissions are being checked
  if (loading) {
    return loadingFallback || <DefaultLoadingFallback />;
  }

  // Check permissions
  const requirementArray = Array.isArray(requirements) ? requirements : [requirements];
  const hasAccess = hasPermissions(requirementArray);

  // If user doesn't have access
  if (!hasAccess) {
    if (!showFallback) {
      return null;
    }
    return fallback || <DefaultPermissionFallback />;
  }

  // User has access, render children
  return <>{children}</>;
};

// Utility component for quick permission checks without fallbacks
export const PermissionGuard: React.FC<{
  requirements: PermissionRequirement | PermissionRequirement[];
  children: React.ReactNode;
}> = ({ requirements, children }) => {
  return (
    <ProtectedComponent 
      requirements={requirements} 
      showFallback={false}
    >
      {children}
    </ProtectedComponent>
  );
};

// HOC for protecting functional components
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  requirements: PermissionRequirement | PermissionRequirement[],
  fallback?: React.ReactNode
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ProtectedComponent requirements={requirements} fallback={fallback}>
        <Component {...props} />
      </ProtectedComponent>
    );
  };

  WrappedComponent.displayName = `withPermissions(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ProtectedComponent;
