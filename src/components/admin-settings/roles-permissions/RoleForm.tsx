'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Tabs, Text, TextField, TextArea, Select, Card, AlertDialog } from '@radix-ui/themes';
import { Save, Shield, Users, X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Removed hardcoded imports - using real data from database services
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

type Role = Database['public']['Tables']['roles']['Row'];
import { PageHeading } from '@/components/common/PageHeading';
import PermissionsMatrix from './PermissionsMatrix';

interface Permission {
  id: string;
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface RoleFormProps {
  roleId?: string;
  onDelete?: (id: string) => void;
}

// Module names for default permissions
const moduleNames = [
  'Dashboard',
  'POS',
  'Inventory',
  'Menu Management',
  'Purchasing',
  'Sales',
  'Delivery',
  'Loyalty Program',
  'Waste Management',
  'Admin Settings'
];

export default function RoleForm({ roleId, onDelete }: RoleFormProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const isNewRole = !roleId;
  
  // Load role data
  useEffect(() => {
    const loadRole = async () => {
      // For new role, create a default template
      if (isNewRole) {
        setRole({
          id: crypto.randomUUID(),
          organization_id: currentOrganization?.id || '',
          name: '',
          description: '',
          permissions: {},
          is_system_role: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        // Initialize default permissions
        setPermissions(moduleNames.map(module => ({
          id: `${module.toLowerCase().replace(/\s/g, '-')}-new`,
          module,
          view: false,
          create: false,
          edit: false,
          delete: false
        })));
        return;
      }
      
      // For existing role, load from database
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .single();
      
      if (error || !data) {
        console.error('Error loading role:', error);
        router.push('/admin-settings/roles-permissions');
        return;
      }
      
      setRole(data);
      
      // Parse permissions from JSON
      if (typeof data.permissions === 'object' && data.permissions !== null) {
        const perms = data.permissions as any;
        if (Array.isArray(perms)) {
          setPermissions(perms);
        }
      } else {
        // Initialize with default permissions if none exist
        setPermissions(moduleNames.map(module => ({
          id: `${module.toLowerCase().replace(/\s/g, '-')}`,
          module,
          view: false,
          create: false,
          edit: false,
          delete: false
        })));
      }
    };
    
    loadRole();
  }, [roleId, router, isNewRole, currentOrganization?.id]);
  
  if (!role) {
    return <Box>Loading role data...</Box>;
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    
    setIsLoading(true);
    
    try {
      const roleData = {
        ...role,
        permissions: permissions as any,
        updated_at: new Date().toISOString()
      };
      
      if (isNewRole) {
        const { error } = await supabase
          .from('roles')
          .insert(roleData);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('roles')
          .update(roleData)
          .eq('id', role.id);
        
        if (error) throw error;
      }
      
      router.push('/admin-settings/roles-permissions');
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle permission updates
  const handlePermissionsUpdate = (updatedPermissions: Permission[]) => {
    setPermissions(updatedPermissions);
  };
  
  // Handle cancel and return to roles list
  const handleCancel = () => {
    router.push('/admin-settings/roles-permissions');
  };
  
  // Handle field changes
  const handleFieldChange = (field: keyof Role, value: any) => {
    setRole(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleDelete = () => {
    if (role?.id && onDelete) {
      onDelete(role.id);
      setShowDeleteDialog(false);
    }
  };

  return (
    <Box>
      <Flex justify="between" gap="3" mb="5">
        <PageHeading
          title={isNewRole ? 'Create New Role' : `Edit ${role.name}`}
          description={isNewRole 
            ? "Define a new role and its permissions" 
            : "Update role details and permissions"}
          showBackButton
          onBackClick={handleCancel}
          noMarginBottom
        />
      </Flex>
      
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="details">
            <Flex gap="2" align="center">
              <Shield size={16} />
              <Text>Role Details</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="permissions">
            <Flex gap="2" align="center">
              <Users size={16} />
              <Text>Permissions</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>
        
        <Box mt="4">
          <Tabs.Content value="details">
            <Card size="3">
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">
                    Role Name
                  </Text>
                  <TextField.Root 
                    placeholder="Enter role name" 
                    value={role.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                  />
                </Flex>
                
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">
                    Description
                  </Text>
                  <TextArea 
                    placeholder="Describe this role's purpose and responsibilities" 
                    value={role.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                  />
                </Flex>
                
              </Flex>
            </Card>
          </Tabs.Content>
          
          <Tabs.Content value="permissions">
            <Box>
              <Text as="p" size="2" mb="3">
                Select what users with this role can do in each module of the system.
              </Text>
              <PermissionsMatrix 
                permissions={permissions}
                onChange={handlePermissionsUpdate}
              />
            </Box>
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
        {!isNewRole && (
          <Button 
            variant="soft" 
            color="red" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 size={16} />
            Delete
          </Button>
        )}
      </Flex>

      <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete Role</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete this role? This action cannot be undone.
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