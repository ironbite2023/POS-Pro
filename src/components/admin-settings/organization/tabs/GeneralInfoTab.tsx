import React from 'react';
import { Flex, Grid, Text, TextField, Select, Card } from '@radix-ui/themes';
// Removed hardcoded import - using real branch data from context
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Database } from '@/lib/supabase/database.types';

type Branch = Database['public']['Tables']['branches']['Row'];

interface GeneralInfoTabProps {
  branch: Branch;
  regions: string[];
  onUpdate: (updates: Partial<Branch>) => void;
}

export default function GeneralInfoTab({ branch, regions, onUpdate }: GeneralInfoTabProps) {
  return (
    <Card size="3">
      <Flex direction="column" gap="5">
        <Grid columns="2" gap="4">
          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="medium">
              Branch Name
            </Text>
            <TextField.Root 
              placeholder="Enter branch name"
              value={branch.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              required
            />
          </Flex>
          
          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="medium">
              Branch Code
            </Text>
            <TextField.Root 
              placeholder="Enter branch code"
              value={branch.code}
              onChange={(e) => onUpdate({ code: e.target.value })}
              required
            />
          </Flex>
          
          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="medium">
              Region
            </Text>
            <Select.Root 
              value={branch.region}
              onValueChange={(value) => onUpdate({ region: value })}
              required
            >
              <Select.Trigger placeholder="Select region" />
              <Select.Content>
                {regions.map(region => (
                  <Select.Item key={region} value={region}>
                    {region}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
          
          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="medium">
              Phone Number
            </Text>
            <TextField.Root 
              placeholder="Enter phone number"
              value={String(branch.phone || '')}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              required
            />
          </Flex>
        </Grid>
        
        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium">
            Address
          </Text>
          <TextField.Root 
            placeholder="Enter branch address"
            value={String(branch.address || '')}
            onChange={(e) => onUpdate({ address: e.target.value })}
            required
          />
        </Flex>
        
        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium">
            City
          </Text>
          <TextField.Root 
            placeholder="Enter city"
            value={(branch as any).city || ''}
            onChange={(e) => (onUpdate as any)({ city: e.target.value })}
            required
          />
        </Flex>
      </Flex>
    </Card>
  );
} 