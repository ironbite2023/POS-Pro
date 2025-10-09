import React from 'react';
import { Box, Card, Flex, Select, Switch, Text } from '@radix-ui/themes';
// Removed hardcoded imports - using real data from database services
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEffect, useState } from 'react';
import type { Database } from '@/lib/supabase/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type Branch = Database['public']['Tables']['branches']['Row'];

interface ExtendedUser extends UserProfile {
  role?: string;
  region?: string;
  branches?: string[];
  canViewOwnReports?: boolean;
  canEditInventory?: boolean;
}

interface RolesAccessTabProps {
  user: ExtendedUser;
  onUpdate: (updates: Partial<ExtendedUser>) => void;
}

export default function RolesAccessTab({ user, onUpdate }: RolesAccessTabProps) {
  const { branches: contextBranches } = useOrganization();
  const [roles, setRoles] = useState<Role[]>([]);
  
  // Fetch roles
  useEffect(() => {
    // TODO: Load roles from database
    setRoles([]);
  }, []);
  
  const regions = Array.from(new Set(contextBranches.map(b => b.region)));
  // Handle role change
  const handleRoleChange = (value: string) => {
    onUpdate({ role: value });
  };
  
  // Handle region selection
  const handleRegionChange = (value: string) => {
    onUpdate({ region: value });
  };
  
  // Handle branch selection
  const handleBranchToggle = (branchId: string) => {
    const currentBranches = user.branches || [];
    const newBranches = currentBranches.includes(branchId)
      ? currentBranches.filter(id => id !== branchId)
      : [...currentBranches, branchId];
    
    onUpdate({ branches: newBranches });
  };
  
  // Handle access permission changes
  const handlePermissionChange = (permission: 'canViewOwnReports' | 'canEditInventory', checked: boolean) => {
    onUpdate({ [permission]: checked });
  };
  
  return (
    <Card size="3">
      <Flex direction="column" gap="5">
        <Flex direction="column" gap="6">
          {/* Role Selection */}
          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="medium">Role</Text>
            <Select.Root 
              value={user.role} 
              onValueChange={handleRoleChange}
            >
              <Select.Trigger placeholder="Select user role" />
              <Select.Content>
                <Select.Group>
                  {roles.map(role => (
                    <Select.Item key={role.id} value={role.name}>
                      {role.name}
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Content>
            </Select.Root>
            <Text size="1" color="gray">
              {"The user's role determines their default system permissions"}
            </Text>
          </Flex>
          
          {/* Region (for Regional Managers) */}
          {user.role === 'Regional Manager' && (
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Region</Text>
              <Select.Root 
                value={user.region || ''} 
                onValueChange={handleRegionChange}
              >
                <Select.Trigger placeholder="Select region" />
                <Select.Content>
                  <Select.Group>
                    {regions.map(region => (
                      <Select.Item key={region} value={region}>
                        {region}
                      </Select.Item>
                    ))}
                  </Select.Group>
                </Select.Content>
              </Select.Root>
            </Flex>
          )}
          
          {/* Branch Assignments */}
          <Flex direction="column" gap="3">
            <Text as="label" size="2" weight="medium">
              Branch Assignments
            </Text>
            <Box>
              <Flex direction="column" gap="4">
                {contextBranches.map(branch => (
                  <Flex key={branch.id} align="center" gap="2">
                    <Switch 
                      color="green"
                      checked={(user.branches || []).includes(branch.id)}
                      onCheckedChange={() => handleBranchToggle(branch.id)}
                    />
                    <Text size="2">{branch.name}</Text>
                    <Text size="1" color="gray">({branch.region})</Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </Flex>
          
          {/* Access Restrictions */}
          <Flex direction="column" gap="3">
            <Text as="label" size="2" weight="medium">
              Access Restrictions
            </Text>
            <Box>
              <Flex direction="column" gap="3">
                <Flex align="center" gap="2">
                  <Switch 
                    color="green"
                    checked={user.canViewOwnReports || false}
                    onCheckedChange={(checked) => handlePermissionChange('canViewOwnReports', checked)}
                  />
                  <Flex direction="column">
                    <Text size="2" weight="bold">Can only view own reports?</Text>
                    <Text size="1" color="gray" mt="1">
                      If enabled, user can only see reports related to their assigned branches and own activities
                    </Text>
                  </Flex>
                </Flex>
                
                <Flex align="center" gap="2">
                  <Switch 
                    color="green"
                    checked={user.canEditInventory || false}
                    onCheckedChange={(checked) => handlePermissionChange('canEditInventory', checked)}
                  />
                  <Flex direction="column">
                    <Text size="2" weight="bold">Can edit inventory?</Text>
                    <Text size="1" color="gray" mt="1">
                      If enabled, user can modify inventory items, stock levels, and recipes
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
} 