'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Flex, 
  Heading, 
  Text, 
  Button,
  Badge,
  Box,
  Avatar,
  Tabs,
  Table,
  Dialog,
  TextField
} from '@radix-ui/themes';
import { Plus, Minus } from 'lucide-react';
import { useLoyaltyActions } from '@/hooks/useLoyaltyActions';
import { loyaltyService } from '@/lib/services';
import { format } from 'date-fns';
// @ts-ignore - react-qr-code types incompatible with React 19
import QRCode from 'react-qr-code';
import type { Database } from '@/lib/supabase/database.types';

type LoyaltyMember = Database['public']['Tables']['loyalty_members']['Row'];
type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];

interface MemberWithRelations extends LoyaltyMember {
  tier?: {
    name: string;
    tier_color: string | null;
  };
}

interface MemberProfileProps {
  member: MemberWithRelations;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function MemberProfile({ 
  member, 
  open, 
  onClose, 
  onUpdate 
}: MemberProfileProps) {
  const { earnPoints, redeemPoints, isProcessing } = useLoyaltyActions();
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [pointsAction, setPointsAction] = useState<'earn' | 'redeem'>('earn');
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (open && member) {
        setLoadingTransactions(true);
        try {
          const data = await loyaltyService.getMemberTransactions(member.id, 50);
          setTransactions(data);
        } catch (error) {
          console.error('Error fetching transactions:', error);
        } finally {
          setLoadingTransactions(false);
        }
      }
    };

    fetchTransactions();
  }, [open, member]);

  const handlePointsTransaction = async () => {
    const points = parseInt(pointsAmount);
    if (!points || !pointsReason) {
      return;
    }

    try {
      if (pointsAction === 'earn') {
        await earnPoints(member.id, points, pointsReason);
      } else {
        await redeemPoints(member.id, points, pointsReason);
      }
      
      setShowPointsDialog(false);
      setPointsAmount('');
      setPointsReason('');
      onUpdate();

      // Refresh transactions
      const data = await loyaltyService.getMemberTransactions(member.id, 50);
      setTransactions(data);
    } catch (error) {
      // Error handled in hook
      console.error('Error in points transaction:', error);
    }
  };

  const getTierColor = (colorString: string | null): React.ComponentProps<typeof Badge>['color'] => {
    if (!colorString) return 'gray';
    const colorMap: Record<string, React.ComponentProps<typeof Badge>['color']> = {
      'blue': 'blue',
      'green': 'green',
      'orange': 'orange',
      'purple': 'purple',
      'red': 'red',
      'gold': 'amber',
    };
    return colorMap[colorString.toLowerCase()] || 'gray';
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onClose}>
        <Dialog.Content style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }}>
          <Dialog.Title>Member Profile</Dialog.Title>
          
          <Flex direction="column" gap="6">
            {/* Member Header */}
            <Flex gap="4" align="center">
              <Avatar
                size="6"
                fallback={`${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`}
              />
              
              <Box className="flex-1">
                <Heading size="5">
                  {member.first_name} {member.last_name}
                </Heading>
                <Text size="2" color="gray">{member.email}</Text>
                <Text size="2" color="gray">{member.phone}</Text>
              </Box>

              <Box className="text-right">
                <Text size="6" weight="bold" color="blue">
                  {member.current_points || 0}
                </Text>
                <Text size="2" color="gray">points</Text>
                {member.tier && (
                  <Badge color={getTierColor(member.tier.tier_color)}>
                    {member.tier.name}
                  </Badge>
                )}
              </Box>
            </Flex>

            {/* Member QR Code */}
            <Card>
              <Flex direction="column" align="center" gap="2">
                <Text size="3" weight="medium">Member QR Code</Text>
                {React.createElement(QRCode as any, {
                  value: member.member_number,
                  size: 128,
                })}
                <Text size="2" color="gray">{member.member_number}</Text>
              </Flex>
            </Card>

            {/* Tabs */}
            <Tabs.Root defaultValue="stats">
              <Tabs.List>
                <Tabs.Trigger value="stats">Statistics</Tabs.Trigger>
                <Tabs.Trigger value="history">Points History</Tabs.Trigger>
              </Tabs.List>

              <Box pt="4">
                <Tabs.Content value="stats">
                  <Flex direction="column" gap="4">
                    <Flex justify="between">
                      <Text>Current Points:</Text>
                      <Text weight="bold">{member.current_points || 0}</Text>
                    </Flex>
                    <Flex justify="between">
                      <Text>Lifetime Points:</Text>
                      <Text weight="bold">{member.lifetime_points || 0}</Text>
                    </Flex>
                    <Flex justify="between">
                      <Text>Member Since:</Text>
                      <Text>
                        {member.joined_at ? format(new Date(member.joined_at), 'MMM dd, yyyy') : 'N/A'}
                      </Text>
                    </Flex>
                    {member.tier && (
                      <Flex justify="between">
                        <Text>Current Tier:</Text>
                        <Badge color={getTierColor(member.tier.tier_color)}>
                          {member.tier.name}
                        </Badge>
                      </Flex>
                    )}

                    <Flex gap="2" mt="4">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setPointsAction('earn');
                          setShowPointsDialog(true);
                        }}
                      >
                        <Plus size={16} />
                        Add Points
                      </Button>
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => {
                          setPointsAction('redeem');
                          setShowPointsDialog(true);
                        }}
                      >
                        <Minus size={16} />
                        Redeem Points
                      </Button>
                    </Flex>
                  </Flex>
                </Tabs.Content>

                <Tabs.Content value="history">
                  {loadingTransactions ? (
                    <Text>Loading transactions...</Text>
                  ) : transactions.length === 0 ? (
                    <Text color="gray">No transaction history</Text>
                  ) : (
                    <Table.Root>
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Points</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {transactions.map((transaction) => (
                          <Table.Row key={transaction.id}>
                            <Table.Cell>
                              {transaction.created_at 
                                ? format(new Date(transaction.created_at), 'MMM dd, HH:mm') 
                                : 'N/A'}
                            </Table.Cell>
                            <Table.Cell>
                              <Text color={transaction.transaction_type === 'earn' ? 'green' : 'red'}>
                                {transaction.transaction_type === 'earn' ? '+' : ''}
                                {transaction.points}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge color={transaction.transaction_type === 'earn' ? 'green' : 'blue'}>
                                {transaction.transaction_type}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <Text size="2">{transaction.description || 'N/A'}</Text>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  )}
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Points Transaction Dialog */}
      <Dialog.Root open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <Dialog.Content style={{ maxWidth: 400 }}>
          <Dialog.Title>
            {pointsAction === 'earn' ? 'Add Points' : 'Redeem Points'}
          </Dialog.Title>
          
          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Points Amount *
              </Text>
              <TextField.Root
                type="number"
                min={1}
                max={pointsAction === 'redeem' ? (member.current_points || 0) : undefined}
                placeholder="Enter points amount"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
              />
              {pointsAction === 'redeem' && (
                <Text size="1" color="gray">
                  Available: {member.current_points || 0} points
                </Text>
              )}
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Reason *
              </Text>
              <TextField.Root
                placeholder={pointsAction === 'earn' ? 'e.g., Purchase bonus' : 'e.g., Reward redemption'}
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
              />
            </Box>

            <Flex gap="3" justify="end">
              <Button
                type="button"
                variant="soft"
                color="gray"
                onClick={() => setShowPointsDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePointsTransaction}
                disabled={isProcessing || !pointsAmount || !pointsReason}
                color={pointsAction === 'earn' ? 'green' : 'blue'}
              >
                {isProcessing ? 'Processing...' : 
                 pointsAction === 'earn' ? 'Add Points' : 'Redeem Points'}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
