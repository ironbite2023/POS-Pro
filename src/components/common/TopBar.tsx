"use client";
import { useState, useEffect, useContext } from "react";
import { DropdownMenu, Avatar, TextField, Flex, Text, Link as RadixLink, Button, Box, IconButton } from "@radix-ui/themes";
import { Bell, User, Search, Moon, Sun, Settings, LogOut, ChevronDown, Building, Store, Menu, Rocket, AlertTriangle } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";

interface NotificationItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const { currentOrganization, currentBranch, branches, switchBranch } = useOrganization();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    // Update localStorage and dispatch storage event for other components
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new Event('storage'));
  };

  // Load real notifications from database
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!currentOrganization || !user) return;
      
      try {
        const { notificationsService } = await import('@/lib/services');
        const dbNotifications = await notificationsService.getNotifications(
          currentOrganization.id,
          user.id,
          5 // Limit to 5 most recent
        );
        
        // Convert database notifications to UI format
        const uiNotifications: NotificationItem[] = dbNotifications.map(notification => ({
          icon: notification.type === 'warning' ? <Bell size={14} /> : 
                notification.type === 'error' ? <AlertTriangle size={14} /> :
                notification.type === 'success' ? <Rocket size={14} /> :
                <User size={14} />,
          title: notification.title,
          description: notification.message
        }));
        
        setNotifications(uiNotifications);
        
        // Get unread count
        const unreadCount = await notificationsService.getUnreadCount(
          currentOrganization.id,
          user.id
        );
        setNotificationCount(unreadCount);
      } catch (error) {
        console.error('Error loading notifications:', error);
        // Keep empty array on error
      }
    };

    loadNotifications();
  }, [currentOrganization, user]);

  return (
    <Box
      className="sticky top-0 z-10 w-full transition-all duration-200"
      style={{
        backgroundColor: isScrolled ? 'var(--color-panel-solid)' : 'transparent',
        borderBottomWidth: isScrolled ? 1 : 0,
        borderBottomColor: 'var(--slate-4)',
      }}
    >
      <Box className="w-full px-4 py-3 max-w-[1200px] mx-auto">
        <Flex justify="between" align="center" gap="4">
          <div className="lg:hidden">
            <IconButton variant="ghost" color="gray" onClick={onMenuClick}>
              <Menu />
            </IconButton>
          </div>
          
          {/* Search input on the left */}
          <div className="hidden lg:block">
            <TextField.Root placeholder="Search...">
              <TextField.Slot>
                <Search size={14} />
              </TextField.Slot>
            </TextField.Root>
          </div>
          
          {/* Right side items */}
          <Flex align="center" gap="4">
            {/* Branch dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button highContrast>
                  <Store size={14} />
                  {currentBranch ? currentBranch.name : currentOrganization?.name || 'Select Branch'}
                  <ChevronDown size={12} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Label>
                  <Flex align="center" gap="2">
                    <Building size={14} />
                    {currentOrganization?.name || 'Organization'}
                  </Flex>
                </DropdownMenu.Label>
                <DropdownMenu.Separator />
                
                {branches.length > 0 ? (
                  branches.map((branch) => (
                    <DropdownMenu.Item 
                      key={branch.id} 
                      onSelect={() => switchBranch(branch.id)}
                    >
                      <Store size={14} />
                      {branch.name}
                      {branch.id === currentBranch?.id && " (Current)"}
                    </DropdownMenu.Item>
                  ))
                ) : (
                  <DropdownMenu.Item disabled>
                    No branches available
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            
            {/* Notification bell */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <span className="relative cursor-pointer bg-gray-100 dark:bg-neutral-800 rounded-full p-2">
                  <Bell size={18} className="text-gray-400 dark:text-neutral-600" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </span>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {notifications.length > 0 ? (
                  <>
                    {notifications.map((notification, index) => (
                      <DropdownMenu.Item key={index} className="flex items-center gap-2 p-2 !cursor-pointer !h-auto group">
                        <span className="p-2 rounded-full bg-gray-100 text-gray-400 dark:bg-neutral-800 dark:text-neutral-600 dark:group-hover:bg-neutral-200">
                          {notification.icon}
                        </span>
                        <div className="flex flex-col">
                          <Text as="p" size="2" weight="medium">{notification.title}</Text>
                          <Text as="p" size="1" color="gray">{notification.description}</Text>
                        </div>
                      </DropdownMenu.Item>
                    ))}
                    <DropdownMenu.Separator />
                    <div className="flex justify-center">
                      <RadixLink href="/" size="2">
                        View all notifications
                      </RadixLink>
                    </div>
                  </>
                ) : (
                  <DropdownMenu.Item disabled>
                    <div className="flex flex-col items-center py-4">
                      <Bell size={24} className="text-gray-400 mb-2" />
                      <Text size="2" color="gray">No notifications</Text>
                    </div>
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            {/* User dropdown */}
            <DropdownMenu.Root open={isDropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenu.Trigger>
                <Flex align="center" gap="1" className="bg-gray-100 dark:bg-neutral-800 px-3 py-2 rounded-md cursor-pointer" onClick={() => setDropdownOpen(!isDropdownOpen)}>
                  <Avatar 
                    radius="full" 
                    size="1" 
                    src={userProfile?.avatar_url || undefined}
                    fallback={userProfile?.first_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                  />
                  <div className="hidden lg:block">
                    <Text as="p" size="1" weight="bold">
                      {userProfile?.first_name && userProfile?.last_name 
                        ? `${userProfile.first_name} ${userProfile.last_name}`
                        : user?.email || 'User'}
                    </Text>
                    <Text as="p" size="1" weight="medium" className="text-gray-400 dark:text-gray-400">
                      {currentOrganization?.name || 'No Organization'}
                    </Text>
                  </div>
                  <DropdownMenu.TriggerIcon />
                </Flex>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User size={14} />
                    <span>Profile</span>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item>
                  <Link href="/admin-settings/system-preferences" className="flex items-center gap-2">
                    <Settings size={14} />
                    <span>Settings</span>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item color="red" onClick={signOut}>
                  <LogOut size={14} />
                  <span>Logout</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
} 