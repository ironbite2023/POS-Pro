'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Tabs, Text, Badge, AlertDialog } from '@radix-ui/themes';
import { ArrowLeft, Save, User, Shield, Activity, X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Removed hardcoded imports - using real data from database services
import { staffService, type StaffMember } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/lib/supabase/database.types';
import { supabase } from '@/lib/supabase/client';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
import { PageHeading } from '@/components/common/PageHeading';
import ProfileInfoTab from './tabs/ProfileInfoTab';
import RolesAccessTab from './tabs/RolesAccessTab';
import ActivityLogTab from './tabs/ActivityLogTab';

// Extended user type with additional properties
interface ExtendedUser extends UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: string;
  region?: string;
  branches?: string[];
  canViewOwnReports?: boolean;
  canEditInventory?: boolean;
  activityLog?: Array<{ timestamp: string; action: string }>;
}

interface UserEditFormProps {
  userId: string;
  onDelete?: (id: string) => void;
}

export default function UserEditForm({ userId, onDelete }: UserEditFormProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  
  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        console.error('Error loading user:', error);
        router.push('/admin-settings/users');
        return;
      }
      
      // Map database fields to extended fields
      setUser({
        ...data,
        firstName: data.first_name,
        lastName: data.last_name,
        avatar: data.avatar_url,
        branches: [],
        activityLog: []
      });
    };
    
    loadUser();
  }, [userId, router]);
  
  if (!user) {
    return <Box>Loading user data...</Box>;
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: user.firstName || user.first_name,
          last_name: user.lastName || user.last_name,
          avatar_url: user.avatar || user.avatar_url,
          phone: user.phone,
          status: user.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      router.push('/admin-settings/users');
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle user data updates from child components
  const handleUserUpdate = (updates: Partial<ExtendedUser>) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates
      };
    });
  };
  
  // Handle cancel and return to users list
  const handleCancel = () => {
    router.push('/admin-settings/users');
  };

  const handleDelete = () => {
    if (user?.id && onDelete) {
      onDelete(user.id);
      setShowDeleteDialog(false);
    }
  };

  return (
    <Box>
      <Flex justify="between" gap="3" mb="5">
        <PageHeading
          title={`Edit ${user.firstName || user.first_name} ${user.lastName || user.last_name}`}
          description="Manage user details, roles, and access permissions"
          showBackButton
          onBackClick={handleCancel}
          noMarginBottom
          badge={
            <Flex gap="2">
              <Badge color="gray">{user.role || 'No Role'}</Badge>
              <Badge color={user.status === 'active' ? 'green' : 'red'} className="capitalize">{user.status}</Badge>
            </Flex>
          }
        />
      </Flex>
      
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="profile">
            <Flex gap="2" align="center">
              <User size={16} />
              <Text>Profile Info</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="roles">
            <Flex gap="2" align="center">
              <Shield size={16} />
              <Text>Roles & Access</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="activity">
            <Flex gap="2" align="center">
              <Activity size={16} />
              <Text>Activity Log</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>
        
        <Box mt="4">
          <Tabs.Content value="profile">
            <ProfileInfoTab 
              user={user} 
              onUpdate={handleUserUpdate} 
            />
          </Tabs.Content>
          
          <Tabs.Content value="roles">
            <RolesAccessTab 
              user={user} 
              onUpdate={handleUserUpdate} 
            />
          </Tabs.Content>
          
          <Tabs.Content value="activity">
            <ActivityLogTab 
              user={user}
            />
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      <Flex justify="between" mt="4">
        <Flex gap="3">
          <Button 
            color="green"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            <Save size={16} />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button 
            color="gray"
            variant="soft"
            onClick={handleCancel}
          >
            <X size={16} />
            Cancel
          </Button>
        </Flex>
        <Button 
          variant="soft" 
          color="red" 
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 size={16} />
          Delete
        </Button>
      </Flex>

      <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete User</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete this user? This action cannot be undone.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={handleDelete}>
                Delete
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
} 