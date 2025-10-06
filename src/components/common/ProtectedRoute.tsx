'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Flex, Spinner, Text } from '@radix-ui/themes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        className="min-h-screen"
        gap="4"
      >
        <Spinner size="3" />
        <Text size="2" color="gray">Loading...</Text>
      </Flex>
    );
  }

  if (!user) {
    return null;
  }

  // TODO: Add permission checking logic here if requiredPermission is provided
  // Example:
  // if (requiredPermission && !hasPermission(userProfile, requiredPermission)) {
  //   return <UnauthorizedPage />;
  // }

  return <>{children}</>;
};
