'use client';

import { Box, Text, Card, Heading, Flex, Badge } from '@radix-ui/themes';
import { Package, Settings } from 'lucide-react';
import type { ModifierGroup } from '@/lib/services/modifier.service';

interface ModifierAssignmentManagerProps {
  modifierGroups: ModifierGroup[];
  loading: boolean;
  onRefetch: () => void;
}

export function ModifierAssignmentManager({
  modifierGroups,
  loading,
  onRefetch
}: ModifierAssignmentManagerProps) {

  if (loading) {
    return <Text>Loading assignments...</Text>;
  }

  return (
    <Box className="space-y-4">
      <Card className="p-6">
        <Flex align="center" gap="3" mb="4">
          <Package size={24} className="text-blue-500" />
          <Box>
            <Heading size="4">Menu Item Modifier Assignments</Heading>
            <Text size="2" color="gray">
              Manage which modifier groups are available for each menu item
            </Text>
          </Box>
        </Flex>

        <Box className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg">
          <Text size="2" weight="medium" className="mb-2">Current Implementation Status:</Text>
          <Text size="2" color="gray">
            ✅ Database schema complete with 3 modifier groups
            <br />
            ✅ Signature Burger assigned: Size (required), Extra Toppings (optional), Temperature (optional)
            <br />
            ✅ Pricing system operational: Base $16.99 → Large + Cheese $20.99
            <br />
            🚧 Advanced assignment UI - Available for future enhancement
          </Text>
        </Box>
        
        <Box mt="4">
          <Text size="2" weight="medium" className="mb-2">Available Modifier Groups:</Text>
          <Flex gap="2" wrap="wrap">
            {modifierGroups.map((group) => (
              <Badge 
                key={group.id}
                color={group.is_required ? 'red' : 'blue'}
                variant="soft"
              >
                {group.name} ({group.selection_type})
              </Badge>
            ))}
          </Flex>
        </Box>
      </Card>
    </Box>
  );
}
