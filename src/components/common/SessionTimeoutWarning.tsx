'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, Button, Flex, Text, Heading, Box } from '@radix-ui/themes';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const SessionTimeoutWarning: React.FC = () => {
  const { isSessionExpiring, sessionTimeLeft, extendSession, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  // Show warning when session is expiring
  useEffect(() => {
    if (isSessionExpiring && !isOpen) {
      setIsOpen(true);
      toast.warning('Your session is about to expire. Please extend your session to continue.');
    }
  }, [isSessionExpiring, isOpen]);

  // Format time left for display
  const formatTimeLeft = (seconds: number | null): string => {
    if (!seconds || seconds <= 0) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await extendSession();
      setIsOpen(false);
      toast.success('Session extended successfully!');
    } catch (error) {
      console.error('Failed to extend session:', error);
      toast.error('Failed to extend session. Please login again.');
    } finally {
      setIsExtending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
      toast.info('You have been logged out.');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  if (!isSessionExpiring || !sessionTimeLeft) {
    return null;
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Content 
        style={{ maxWidth: 450 }}
        className="focus:outline-none"
      >
        <Box className="p-6">
          <Flex align="center" gap="3" className="mb-4">
            <Box className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-full">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </Box>
            <Box>
              <Heading size="4" className="mb-1">
                Session Expiring Soon
              </Heading>
              <Text size="2" color="gray">
                Your session will expire automatically for security
              </Text>
            </Box>
          </Flex>

          <Box className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Flex align="center" gap="2" className="mb-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <Text size="3" weight="medium" className="text-amber-800 dark:text-amber-200">
                Time Remaining: {formatTimeLeft(sessionTimeLeft)}
              </Text>
            </Flex>
            <Text size="2" className="text-amber-700 dark:text-amber-300">
              Click &quot;Extend Session&quot; to continue working or &quot;Logout&quot; to end your session now.
            </Text>
          </Box>

          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button
                variant="outline"
                onClick={handleSignOut}
                disabled={isExtending}
              >
                Logout
              </Button>
            </Dialog.Close>
            
            <Button
              onClick={handleExtendSession}
              disabled={isExtending}
              className="min-w-[120px]"
            >
              {isExtending ? (
                <Flex align="center" gap="2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <Text>Extending...</Text>
                </Flex>
              ) : (
                'Extend Session'
              )}
            </Button>
          </Flex>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default SessionTimeoutWarning;
