'use client';

import React from 'react';
import { Box, Flex, Heading, Text, Button, Card } from '@radix-ui/themes';
import { Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePermissions, PermissionRequirement } from '@/lib/utils/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { auditService, AuditEventType } from '@/lib/services/audit.service';
import AuthErrorBoundary from './AuthErrorBoundary';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirements: PermissionRequirement | PermissionRequirement[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const AccessDeniedComponent: React.FC<{ redirectTo?: string }> = ({ redirectTo }) => {
  const router = useRouter();

  const handleGoBack = () => {
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.back();
    }
  };

  return (
    <Flex align="center" justify="center" className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="max-w-md w-full mx-4">
        <Flex direction="column" align="center" gap="4" className="p-6">
          <Box className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </Box>
          
          <Box>
            <Text size="6" weight="bold" className="text-red-600 mb-4">
              Access Denied
            </Text>
            <Text size="3" color="gray">
              You don&apos;t have permission to access this page.
            </Text>
          </Box>

          <Flex direction="column" gap="2" className="w-full">
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </Flex>

          <Box className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <Flex align="center" gap="2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <Text size="2" color="amber" className="text-amber-800 dark:text-amber-200">
                Need access? Contact your system administrator to request the necessary permissions.
              </Text>
            </Flex>
          </Box>
        </Flex>
      </Card>
    </Flex>
  );
};

const LoadingComponent: React.FC = () => {
  return (
    <Flex align="center" justify="center" className="min-h-screen">
      <Box className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
        <Text size="2" color="gray">Checking permissions...</Text>
      </Box>
    </Flex>
  );
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requirements,
  fallback,
  redirectTo,
}) => {
  return (
    <AuthErrorBoundary>
      <ProtectedRouteContent 
        requirements={requirements}
        fallback={fallback}
        redirectTo={redirectTo}
      >
        {children}
      </ProtectedRouteContent>
    </AuthErrorBoundary>
  );
};

const ProtectedRouteContent: React.FC<ProtectedRouteProps> = ({
  children,
  requirements,
  fallback,
  redirectTo,
}) => {
  const { hasPermission, hasPermissions, loading: permissionsLoading } = usePermissions();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect effect for unauthenticated users
  React.useEffect(() => {
    if (!authLoading && !user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      router.push(`/auth/login?returnTo=${encodeURIComponent(currentPath)}`);
    }
  }, [authLoading, user, router]);

  // Wait for BOTH auth AND permissions to finish loading
  if (authLoading || permissionsLoading) {
    return <LoadingComponent />;
  }

  // If not logged in, show loading while redirect happens
  if (!user) {
    return <LoadingComponent />;
  }

  // Check permissions
  const requirementArray = Array.isArray(requirements) ? requirements : [requirements];
  const hasAccess = hasPermissions(requirementArray);

  // If user doesn't have access, log the violation and show access denied
  if (!hasAccess) {
    // Log permission denied event
    if (user && userProfile) {
      const resourcePath = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
      const requiredPermissions = requirementArray.map(req => `${req.module}:${req.action}`).join(', ');
      
      auditService.logPermission(
        AuditEventType.PERMISSION_DENIED,
        user.id,
        user.email || 'unknown',
        resourcePath,
        false,
        requiredPermissions,
        {
          user_role: userProfile.role_id,
          attempted_resource: resourcePath,
          required_permissions: requirementArray,
        }
      ).catch(console.error);
    }

    return fallback || <AccessDeniedComponent redirectTo={redirectTo} />;
  }

  // User has access, render children
  return <>{children}</>;
};

export default ProtectedRoute;
