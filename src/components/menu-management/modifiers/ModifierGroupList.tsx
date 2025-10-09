'use client';

import { useState } from 'react';
import { Box, Table, Text, Badge, IconButton, Flex, Skeleton, Button } from '@radix-ui/themes';
import { Edit, Trash2, Plus, Settings, AlertCircle } from 'lucide-react';
import { modifierService } from '@/lib/services';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { ModifierGroup } from '@/lib/services/modifier.service';

interface ModifierGroupListProps {
  groups: ModifierGroup[];
  loading: boolean;
  onEdit: (group: ModifierGroup) => void;
  onRefetch: () => void;
}

export function ModifierGroupList({
  groups,
  loading,
  onEdit,
  onRefetch
}: ModifierGroupListProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<ModifierGroup | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (group: ModifierGroup) => {
    setGroupToDelete(group);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    try {
      setDeleting(true);
      await modifierService.deleteModifierGroup(groupToDelete.id);
      toast.success('Modifier group deleted successfully');
      onRefetch();
    } catch (error) {
      console.error('Error deleting modifier group:', error);
      toast.error('Failed to delete modifier group');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setGroupToDelete(null);
    }
  };

  if (loading) {
    return (
      <Box>
        {[...Array(5)].map((_item, i) => (
          <Skeleton key={i} height="60px" className="mb-2" />
        ))}
      </Box>
    );
  }

  if (groups.length === 0) {
    return (
      <Box className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <Settings size={48} className="mx-auto mb-4 text-gray-400" />
        <Text size="3" weight="medium" className="mb-2">No Modifier Groups</Text>
        <Text size="2" color="gray" className="mb-4">
          Create your first modifier group to start adding customization options to your menu items.
        </Text>
        <Text size="2" color="gray">
          Examples: Sizes (Small, Large), Toppings (Extra Cheese, Bacon), Temperature (Hot, Mild)
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Group Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Rules</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Order</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="right">Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {groups.map((group) => (
            <Table.Row key={group.id}>
              <Table.Cell>
                <Flex align="center" gap="2">
                  <Text weight="medium">{group.name}</Text>
                  {group.is_required && (
                    <Badge color="red" variant="soft" size="1">Required</Badge>
                  )}
                </Flex>
              </Table.Cell>
              <Table.Cell>
                <Text size="2" color="gray">
                  {group.description || '-'}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Badge color={group.selection_type === 'single' ? 'blue' : 'purple'} variant="soft">
                  {group.selection_type === 'single' ? 'Single Choice' : 'Multiple Choice'}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Text size="2" color="gray">
                  {group.min_selections === 0 ? 'No min' : `Min: ${group.min_selections}`}
                  {' • '}
                  {group.max_selections === 1 ? '1 max' : `Max: ${group.max_selections}`}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Badge color={group.is_active ? 'green' : 'gray'} variant="soft">
                  {group.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Text size="2" color="gray">{group.display_order}</Text>
              </Table.Cell>
              <Table.Cell align="right">
                <Flex gap="2" justify="end">
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="gray"
                    onClick={() => onEdit(group)}
                    disabled={deleting}
                  >
                    <Edit size={14} />
                  </IconButton>
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="red"
                    onClick={() => handleDeleteClick(group)}
                    disabled={deleting}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Modifier Group"
        description={`Are you sure you want to delete "${groupToDelete?.name}"? This will also remove all modifiers in this group and unassign it from menu items.`}
        confirmText="Delete"
        cancelText="Cancel"
        color="red"
      />
    </Box>
  );
}
