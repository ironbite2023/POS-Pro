'use client';

import { Box, Text, Table, Badge, Flex, Card, Heading } from '@radix-ui/themes';
import { DollarSign, Hash } from 'lucide-react';
import type { ModifierGroupWithModifiers } from '@/lib/services/modifier.service';

interface ModifierListProps {
  modifierGroups: ModifierGroupWithModifiers[];
  loading: boolean;
  onRefetch: () => void;
}

export function ModifierList({
  modifierGroups,
  loading,
  onRefetch
}: ModifierListProps) {

  if (loading) {
    return <Text>Loading modifiers...</Text>;
  }

  if (modifierGroups.length === 0) {
    return (
      <Box className="text-center py-12">
        <Text size="3" color="gray">
          No modifier groups found. Create modifier groups first to add individual modifiers.
        </Text>
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      {modifierGroups.map((group) => (
        <Card key={group.id} className="p-4">
          <Flex align="center" justify="between" mb="4">
            <Box>
              <Heading size="4">{group.name}</Heading>
              <Text size="2" color="gray">{group.description}</Text>
            </Box>
            <Flex align="center" gap="2">
              <Badge color={group.is_required ? 'red' : 'gray'} variant="soft">
                {group.is_required ? 'Required' : 'Optional'}
              </Badge>
              <Badge color={group.selection_type === 'single' ? 'blue' : 'purple'} variant="soft">
                {group.selection_type}
              </Badge>
            </Flex>
          </Flex>

          {group.modifiers.length === 0 ? (
            <Text size="2" color="gray" className="italic">
              No modifiers in this group yet.
            </Text>
          ) : (
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Modifier Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">Price Adjustment</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Default</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Order</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {group.modifiers.map((modifier) => (
                  <Table.Row key={modifier.id}>
                    <Table.Cell>
                      <Text weight="medium">{modifier.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {modifier.description || '-'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Flex align="center" gap="1" justify="end">
                        {modifier.price_adjustment !== 0 && <DollarSign size={12} />}
                        <Text 
                          color={
                            modifier.price_adjustment > 0 ? 'green' : 
                            modifier.price_adjustment < 0 ? 'red' : 'gray'
                          }
                          weight={modifier.price_adjustment !== 0 ? 'medium' : 'regular'}
                        >
                          {modifier.price_adjustment > 0 ? '+' : ''}
                          {modifier.price_adjustment.toFixed(2)}
                        </Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      {modifier.is_default && (
                        <Badge color="blue" variant="soft" size="1">Default</Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap="1">
                        <Hash size={12} className="text-gray-400" />
                        <Text size="2" color="gray">{modifier.display_order}</Text>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Card>
      ))}
    </Box>
  );
}
