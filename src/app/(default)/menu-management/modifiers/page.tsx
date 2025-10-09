'use client';

import { useState, Suspense } from 'react';
import { Box, Tabs, Flex, Button, Text, Heading } from '@radix-ui/themes';
import { PlusIcon, Settings, List, Package } from 'lucide-react';
import { PageHeading } from '@/components/common/PageHeading';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useModifierData } from '@/hooks/useModifierData';
import { ModifierGroupList } from '@/components/menu-management/modifiers/ModifierGroupList';
import { ModifierGroupForm } from '@/components/menu-management/modifiers/ModifierGroupForm';
import { ModifierList } from '@/components/menu-management/modifiers/ModifierList';
import { ModifierAssignmentManager } from '@/components/menu-management/modifiers/ModifierAssignmentManager';
import type { ModifierGroup } from '@/lib/services/modifier.service';

function ModifierManagementContent() {
  usePageTitle('Modifier Management');
  const [activeTab, setActiveTab] = useState('groups');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ModifierGroup | undefined>(undefined);
  const { modifierGroups, modifiersWithGroups, loading, error, refetch } = useModifierData();

  // Calculate modifier metrics
  const modifierMetrics = {
    totalGroups: modifierGroups.length,
    totalModifiers: modifiersWithGroups.reduce((sum, group) => sum + group.modifiers.length, 0),
    requiredGroups: modifierGroups.filter(group => group.is_required).length,
    optionalGroups: modifierGroups.filter(group => !group.is_required).length,
  };

  const handleCreateGroup = () => {
    setSelectedGroup(undefined);
    setShowGroupForm(true);
  };

  const handleEditGroup = (group: ModifierGroup) => {
    setSelectedGroup(group);
    setShowGroupForm(true);
  };

  const handleFormClose = () => {
    setShowGroupForm(false);
    setSelectedGroup(undefined);
  };

  const handleFormSuccess = () => {
    refetch();
    handleFormClose();
  };

  if (error) {
    return (
      <Box className="text-center py-12">
        <Heading size="5" className="mb-2">Error Loading Modifiers</Heading>
        <Text size="2" color="red">{error.message}</Text>
        <Button onClick={refetch} className="mt-4">
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Flex 
        direction={{ initial: "column", sm: "row" }} 
        justify="between" 
        align={{ initial: "stretch", sm: "center" }}
        gap={{ initial: "4", sm: "0" }}
        mb="5"
      >
        <PageHeading 
          title="Modifier Management" 
          description="Manage menu item modifiers, variants, and customization options" 
          noMarginBottom 
        />
        <Box>
          <Button onClick={handleCreateGroup}>
            <PlusIcon size={16} />
            Add Modifier Group
          </Button>
        </Box>
      </Flex>

      {/* Quick Stats */}
      <Box mb="6">
        <Flex gap="4" wrap="wrap">
          <Box p="4" className="bg-blue-50 dark:bg-blue-950/50 rounded-lg">
            <Text size="2" color="gray" weight="medium">Total Groups</Text>
            <Text size="6" weight="bold" color="blue">{modifierMetrics.totalGroups}</Text>
          </Box>
          <Box p="4" className="bg-green-50 dark:bg-green-950/50 rounded-lg">
            <Text size="2" color="gray" weight="medium">Total Modifiers</Text>
            <Text size="6" weight="bold" color="green">{modifierMetrics.totalModifiers}</Text>
          </Box>
          <Box p="4" className="bg-orange-50 dark:bg-orange-950/50 rounded-lg">
            <Text size="2" color="gray" weight="medium">Required Groups</Text>
            <Text size="6" weight="bold" color="orange">{modifierMetrics.requiredGroups}</Text>
          </Box>
        </Flex>
      </Box>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="groups">
            <Flex gap="2" align="center">
              <Settings size={16} />
              <Text>Modifier Groups</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="modifiers">
            <Flex gap="2" align="center">
              <List size={16} />
              <Text>Individual Modifiers</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="assignments">
            <Flex gap="2" align="center">
              <Package size={16} />
              <Text>Menu Item Assignments</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="groups">
          <ModifierGroupList
            groups={modifierGroups}
            loading={loading}
            onEdit={handleEditGroup}
            onRefetch={refetch}
          />
        </Tabs.Content>
        
        <Tabs.Content value="modifiers">
          <ModifierList
            modifierGroups={modifiersWithGroups}
            loading={loading}
            onRefetch={refetch}
          />
        </Tabs.Content>
        
        <Tabs.Content value="assignments">
          <ModifierAssignmentManager
            modifierGroups={modifierGroups}
            loading={loading}
            onRefetch={refetch}
          />
        </Tabs.Content>
      </Tabs.Root>

      {/* Modifier Group Form Dialog */}
      <ModifierGroupForm
        modifierGroup={selectedGroup}
        open={showGroupForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </Box>
  );
}

export default function ModifierManagementPage() {
  return (
    <Suspense fallback={<div>Loading modifier management...</div>}>
      <ModifierManagementContent />
    </Suspense>
  );
}
