"use client";

import { Box, Flex } from "@radix-ui/themes";
import TopBar from "@/components/common/TopBar";
import Sidebar from "@/components/common/Sidebar";
import SessionTimeoutWarning from "@/components/common/SessionTimeoutWarning";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Text } from "@radix-ui/themes";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { PermissionUtils } from "@/lib/utils/permissions";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [_isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarWidth = '260px';
  
  const onScroll = useCallback(() => {
    const mainContent = document.querySelector('[data-main-content]');
    if (mainContent) {
      const scrollPosition = mainContent.scrollTop;
      setIsScrolled(scrollPosition > 50);
    }
  }, []);

  useEffect(() => {
    const mainContent = document.querySelector('[data-main-content]');
    if (mainContent) {
      mainContent.addEventListener('scroll', onScroll);
      return () => {
        mainContent.removeEventListener('scroll', onScroll);
      };
    }
  }, [onScroll]);
  
  return (
    <ProtectedRoute requirements={PermissionUtils.REQUIREMENTS.VIEW_DASHBOARD}>
      <Box className="flex flex-col h-screen overflow-x-hidden">
        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <Box 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <Box 
          style={{ position: 'fixed', zIndex: 20, width: sidebarWidth, height: '100vh' }} 
          className={`transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[260px] lg:translate-x-0'}`}
        >
          <Sidebar width={sidebarWidth} onClose={() => setIsSidebarOpen(false)} />
        </Box>
        
        {/* Main content area */}
        <Box 
          className="h-screen overflow-y-auto lg:ml-[260px] lg:w-[calc(100%-260px)] min-w-0"
          data-main-content
        >
          {/* Top bar */}
          <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          
          {/* Page content */}
          <Box className="flex-1 overflow-y-auto">
            <Box className="w-full flex justify-center py-6">
              <Box className="px-4 max-w-[1200px] w-full mx-auto">
                {children}
              </Box>
            </Box>
          </Box>
          
          {/* Footer */}
          <Box className="py-4 mt-auto">
            <Flex justify="center">
              <Text size="1" className="text-gray-400 dark:text-neutral-600 text-center">&copy; {new Date().getFullYear()} EatlyPOS. All rights reserved.</Text>
            </Flex>
          </Box>
        </Box>
        
        {/* Session timeout warning modal */}
        <SessionTimeoutWarning />
      </Box>
    </ProtectedRoute>
  );
} 