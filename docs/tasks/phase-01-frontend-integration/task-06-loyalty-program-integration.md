# Task 1.6: Loyalty Program Integration

**Task ID**: TASK-01-006  
**Phase**: 1 - Frontend Integration  
**Priority**: 🟡 P1 - High  
**Estimated Time**: 2-3 days  
**Complexity**: 🟡 Medium  
**Status**: 📋 Not Started

---

## 1. Detailed Request Analysis

### What is Being Requested

Replace mock loyalty data with real Supabase API calls, implementing:
- Loyalty member management (enrollment, search, profiles)
- Points earning and redemption system
- Tier management with automatic upgrades
- Rewards catalog with redemption tracking
- Member activity history and analytics

### Current State
- Loyalty pages use mock data from `LoyaltyData.ts` and `LoyaltyRewardsData.ts`
- Static member displays with no real functionality
- No connection to actual database
- No points tracking or redemption
- Mock tier system with no automation

### Target State
- Live loyalty data from Supabase database
- Automated points earning from purchases
- Real-time tier calculations and upgrades
- Active rewards redemption system
- Comprehensive member activity tracking
- Integration with POS for seamless point earning

### Affected Files
```
src/app/(default)/loyalty/
├── members/page.tsx
├── tiers/page.tsx
├── rewards/page.tsx
├── analytics/page.tsx
└── settings/page.tsx

src/components/loyalty-program/
├── MemberForm.tsx
├── MemberProfile.tsx
├── PointsHistory.tsx
├── RewardsGallery.tsx
├── TierManagement.tsx
├── PointsCalculator.tsx
└── LoyaltyAnalytics.tsx

src/data/
├── LoyaltyData.ts (to be replaced)
└── LoyaltyRewardsData.ts (to be replaced)
```

---

## 2. Justification and Benefits

### Why This Task is Important

**Business Value**:
- ✅ Customer retention through loyalty program
- ✅ Increased average transaction value
- ✅ Customer data collection and analytics
- ✅ Competitive advantage in restaurant market
- ✅ Automated marketing through tier benefits

**Technical Benefits**:
- ✅ Validates loyaltyService implementation
- ✅ Tests complex point calculations
- ✅ Proves tier automation logic
- ✅ Establishes customer data patterns

**User Impact**:
- ✅ Customers earn rewards for loyalty
- ✅ Staff can easily manage member accounts
- ✅ Automated tier upgrades improve experience
- ✅ Clear rewards redemption process

### Problems It Solves
1. **No Customer Loyalty**: No incentive for repeat business
2. **Manual Tracking**: No automated points or tier management
3. **No Rewards System**: No way to offer customer incentives
4. **Limited Customer Data**: No insights into customer behavior
5. **Competitive Disadvantage**: Missing standard restaurant feature

---

## 3. Prerequisites

### Knowledge Requirements
- ✅ Loyalty program concepts (points, tiers, rewards)
- ✅ Customer data management
- ✅ Points calculation and redemption logic
- ✅ Tier progression algorithms
- ✅ Customer analytics and reporting

### Technical Prerequisites
- ✅ Task 1.1 (Dashboard Integration) completed
- ✅ loyaltyService implemented (`src/lib/services/loyalty.service.ts`)
- ✅ Database schema for loyalty tables deployed
- ✅ Order integration for automatic points earning
- ✅ Customer data privacy compliance

### Environment Prerequisites
- ✅ Test loyalty member data
- ✅ Sample rewards and tier configurations
- ✅ Order history for points calculations
- ✅ Organization context working

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "react-qr-code": "^2.x",
  "date-fns": "^2.x"
}
```

---

## 4. Implementation Methodology

### Step 1: Create Loyalty Data Hooks (2-3 hours)

#### 1.1 Create `src/hooks/useLoyaltyData.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { loyaltyService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type LoyaltyMember = Database['public']['Tables']['loyalty_members']['Row'];
type LoyaltyTier = Database['public']['Tables']['loyalty_tiers']['Row'];
type LoyaltyReward = Database['public']['Tables']['loyalty_rewards']['Row'];
type PointsTransaction = Database['public']['Tables']['points_transactions']['Row'];

interface LoyaltyMetrics {
  totalMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  averagePointsPerMember: number;
  topTierMembers: number;
  recentTransactions: number;
}

interface UseLoyaltyDataReturn {
  members: LoyaltyMember[];
  tiers: LoyaltyTier[];
  rewards: LoyaltyReward[];
  transactions: PointsTransaction[];
  metrics: LoyaltyMetrics;
  loading: boolean;
  error: Error | null;
  refetchMembers: () => Promise<void>;
  refetchTiers: () => Promise<void>;
  refetchRewards: () => Promise<void>;
  refetchTransactions: () => Promise<void>;
}

export const useLoyaltyData = (): UseLoyaltyDataReturn => {
  const { currentOrganization } = useOrganization();
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [metrics, setMetrics] = useState<LoyaltyMetrics>({
    totalMembers: 0,
    totalPointsIssued: 0,
    totalPointsRedeemed: 0,
    averagePointsPerMember: 0,
    topTierMembers: 0,
    recentTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const membersData = await loyaltyService.getMembers({
        organizationId: currentOrganization.id,
      });
      setMembers(membersData);
    } catch (err) {
      console.error('Error fetching loyalty members:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchTiers = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const tiersData = await loyaltyService.getTiers({
        organizationId: currentOrganization.id,
      });
      setTiers(tiersData);
    } catch (err) {
      console.error('Error fetching loyalty tiers:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchRewards = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const rewardsData = await loyaltyService.getRewards({
        organizationId: currentOrganization.id,
      });
      setRewards(rewardsData);
    } catch (err) {
      console.error('Error fetching loyalty rewards:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchTransactions = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const transactionsData = await loyaltyService.getPointsTransactions({
        organizationId: currentOrganization.id,
        limit: 100,
      });
      setTransactions(transactionsData);
    } catch (err) {
      console.error('Error fetching points transactions:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchAllData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchMembers(),
        fetchTiers(),
        fetchRewards(),
        fetchTransactions(),
      ]);

      // Calculate metrics
      const totalMembers = members.length;
      const totalPointsIssued = transactions
        .filter(t => t.type === 'earned')
        .reduce((sum, t) => sum + t.points, 0);
      const totalPointsRedeemed = transactions
        .filter(t => t.type === 'redeemed')
        .reduce((sum, t) => sum + Math.abs(t.points), 0);
      
      const averagePointsPerMember = totalMembers > 0 
        ? members.reduce((sum, m) => sum + m.current_points, 0) / totalMembers 
        : 0;

      const topTier = tiers.sort((a, b) => b.minimum_points - a.minimum_points)[0];
      const topTierMembers = topTier 
        ? members.filter(m => m.current_tier_id === topTier.id).length 
        : 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const recentTransactions = transactions.filter(
        t => new Date(t.created_at) >= today
      ).length;

      setMetrics({
        totalMembers,
        totalPointsIssued,
        totalPointsRedeemed,
        averagePointsPerMember,
        topTierMembers,
        recentTransactions,
      });
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentOrganization]);

  return {
    members,
    tiers,
    rewards,
    transactions,
    metrics,
    loading,
    error,
    refetchMembers: fetchMembers,
    refetchTiers: fetchTiers,
    refetchRewards: fetchRewards,
    refetchTransactions: fetchTransactions,
  };
};
```

#### 1.2 Create `src/hooks/useLoyaltyActions.ts`

```typescript
import { useState } from 'react';
import { loyaltyService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface UseLoyaltyActionsReturn {
  enrollMember: (memberData: any) => Promise<void>;
  earnPoints: (memberId: string, points: number, source: string) => Promise<void>;
  redeemPoints: (memberId: string, points: number, rewardId: string) => Promise<void>;
  updateTier: (memberId: string) => Promise<void>;
  isProcessing: boolean;
  error: Error | null;
}

export const useLoyaltyActions = (): UseLoyaltyActionsReturn => {
  const { currentOrganization } = useOrganization();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const enrollMember = async (memberData: any) => {
    if (!currentOrganization) return;

    try {
      setIsProcessing(true);
      setError(null);

      await loyaltyService.createMember({
        ...memberData,
        organization_id: currentOrganization.id,
      });

      toast.success('Member enrolled successfully!');
    } catch (err) {
      console.error('Error enrolling member:', err);
      setError(err as Error);
      toast.error('Failed to enroll member');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const earnPoints = async (memberId: string, points: number, source: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      await loyaltyService.earnPoints({
        memberId,
        points,
        source,
        description: `Points earned from ${source}`,
      });

      toast.success(`${points} points added!`);
    } catch (err) {
      console.error('Error earning points:', err);
      setError(err as Error);
      toast.error('Failed to add points');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const redeemPoints = async (memberId: string, points: number, rewardId: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      await loyaltyService.redeemPoints({
        memberId,
        points,
        rewardId,
        description: 'Points redeemed for reward',
      });

      toast.success(`${points} points redeemed!`);
    } catch (err) {
      console.error('Error redeeming points:', err);
      setError(err as Error);
      toast.error('Failed to redeem points');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTier = async (memberId: string) => {
    try {
      await loyaltyService.updateMemberTier(memberId);
      toast.success('Member tier updated!');
    } catch (err) {
      console.error('Error updating tier:', err);
      setError(err as Error);
      toast.error('Failed to update tier');
    }
  };

  return {
    enrollMember,
    earnPoints,
    redeemPoints,
    updateTier,
    isProcessing,
    error,
  };
};
```

**Success Criteria**:
- ✅ Hooks compile without errors
- ✅ Loyalty data fetching works correctly
- ✅ Points operations function properly
- ✅ Error handling implemented

---

### Step 2: Create Loyalty Components (3-4 hours)

#### 2.1 Create `src/components/loyalty-program/MemberForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  Button, 
  TextField, 
  Select,
  Flex, 
  Box,
  Text 
} from '@radix-ui/themes';
import { useLoyaltyActions } from '@/hooks/useLoyaltyActions';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type LoyaltyMember = Database['public']['Tables']['loyalty_members']['Row'];
type LoyaltyTier = Database['public']['Tables']['loyalty_tiers']['Row'];

const memberSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  preferred_contact: z.enum(['email', 'phone', 'sms']).default('email'),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  member?: LoyaltyMember;
  tiers: LoyaltyTier[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MemberForm({ 
  member, 
  tiers,
  open, 
  onClose, 
  onSuccess 
}: MemberFormProps) {
  const { enrollMember } = useLoyaltyActions();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: member ? {
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || '',
      date_of_birth: member.date_of_birth || '',
      preferred_contact: member.preferred_contact as any,
    } : {
      preferred_contact: 'email',
    },
  });

  const onSubmit = async (data: MemberFormData) => {
    try {
      // Get base tier (lowest tier)
      const baseTier = tiers.sort((a, b) => a.minimum_points - b.minimum_points)[0];
      
      const memberData = {
        ...data,
        current_points: 0,
        lifetime_points: 0,
        current_tier_id: baseTier?.id,
        status: 'active',
        enrollment_date: new Date().toISOString(),
      };

      if (member) {
        // Update existing member (implementation needed)
        toast.error('Member update not implemented yet');
      } else {
        await enrollMember(memberData);
      }
      
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>
          {member ? 'Edit Member' : 'Enroll New Member'}
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Name Fields */}
            <Flex gap="4">
              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">First Name *</Text>
                <TextField.Root
                  {...register('first_name')}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <Text size="1" color="red">{errors.first_name.message}</Text>
                )}
              </Box>

              <Box className="flex-1">
                <Text as="label" size="2" weight="medium">Last Name *</Text>
                <TextField.Root
                  {...register('last_name')}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <Text size="1" color="red">{errors.last_name.message}</Text>
                )}
              </Box>
            </Flex>

            {/* Contact Info */}
            <Box>
              <Text as="label" size="2" weight="medium">Email *</Text>
              <TextField.Root
                {...register('email')}
                type="email"
                placeholder="email@example.com"
              />
              {errors.email && (
                <Text size="1" color="red">{errors.email.message}</Text>
              )}
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium">Phone</Text>
              <TextField.Root
                {...register('phone')}
                type="tel"
                placeholder="+1 (555) 123-4567"
              />
            </Box>

            {/* Optional Info */}
            <Box>
              <Text as="label" size="2" weight="medium">Date of Birth</Text>
              <TextField.Root
                {...register('date_of_birth')}
                type="date"
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium">Preferred Contact</Text>
              <Select.Root
                onValueChange={(value) => setValue('preferred_contact', value as any)}
                defaultValue="email"
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="email">Email</Select.Item>
                  <Select.Item value="phone">Phone</Select.Item>
                  <Select.Item value="sms">SMS</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="end">
              <Button type="button" variant="soft" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : member ? 'Update' : 'Enroll Member'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

#### 2.2 Create `src/components/loyalty-program/MemberProfile.tsx`

```typescript
'use client';

import { useState } from 'react';
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
import { Calendar, Gift, TrendingUp, Plus, Minus } from 'lucide-react';
import { useLoyaltyActions } from '@/hooks/useLoyaltyActions';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import type { Database } from '@/lib/supabase/database.types';

type LoyaltyMember = Database['public']['Tables']['loyalty_members']['Row'] & {
  loyalty_tiers: { name: string; color: string };
  points_transactions: Array<{
    id: string;
    points: number;
    type: string;
    description: string;
    created_at: string;
  }>;
};

interface MemberProfileProps {
  member: LoyaltyMember;
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
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onClose}>
        <Dialog.Content style={{ maxWidth: 700 }}>
          <Dialog.Title>Member Profile</Dialog.Title>
          
          <Flex direction="column" gap="6">
            {/* Member Header */}
            <Flex gap="4" align="center">
              <Avatar
                size="6"
                fallback={`${member.first_name[0]}${member.last_name[0]}`}
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
                  {member.current_points}
                </Text>
                <Text size="2" color="gray">points</Text>
                <Badge color={member.loyalty_tiers?.color || 'gray'}>
                  {member.loyalty_tiers?.name || 'No Tier'}
                </Badge>
              </Box>
            </Flex>

            {/* Member QR Code */}
            <Card>
              <Flex direction="column" align="center" gap="2">
                <Text size="3" weight="medium">Member QR Code</Text>
                <QRCode
                  value={member.member_number}
                  size={128}
                />
                <Text size="2" color="gray">{member.member_number}</Text>
              </Flex>
            </Card>

            {/* Tabs */}
            <Tabs.Root defaultValue="stats">
              <Tabs.List>
                <Tabs.Trigger value="stats">Statistics</Tabs.Trigger>
                <Tabs.Trigger value="history">Points History</Tabs.Trigger>
                <Tabs.Trigger value="rewards">Rewards</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="stats">
                <Flex direction="column" gap="4">
                  <Flex justify="between">
                    <Text>Current Points:</Text>
                    <Text weight="bold">{member.current_points}</Text>
                  </Flex>
                  <Flex justify="between">
                    <Text>Lifetime Points:</Text>
                    <Text weight="bold">{member.lifetime_points}</Text>
                  </Flex>
                  <Flex justify="between">
                    <Text>Member Since:</Text>
                    <Text>{format(new Date(member.enrollment_date), 'MMM dd, yyyy')}</Text>
                  </Flex>
                  <Flex justify="between">
                    <Text>Current Tier:</Text>
                    <Badge color={member.loyalty_tiers?.color || 'gray'}>
                      {member.loyalty_tiers?.name || 'No Tier'}
                    </Badge>
                  </Flex>

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
                    {member.points_transactions?.map((transaction) => (
                      <Table.Row key={transaction.id}>
                        <Table.Cell>
                          {format(new Date(transaction.created_at), 'MMM dd, HH:mm')}
                        </Table.Cell>
                        <Table.Cell>
                          <Text color={transaction.type === 'earned' ? 'green' : 'red'}>
                            {transaction.type === 'earned' ? '+' : ''}
                            {transaction.points}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color={transaction.type === 'earned' ? 'green' : 'blue'}>
                            {transaction.type}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">{transaction.description}</Text>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Tabs.Content>

              <Tabs.Content value="rewards">
                <Text color="gray">Available rewards will be displayed here</Text>
              </Tabs.Content>
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
              <Text as="label" size="2" weight="medium">
                Points Amount *
              </Text>
              <TextField.Root
                type="number"
                min={pointsAction === 'redeem' ? 1 : undefined}
                max={pointsAction === 'redeem' ? member.current_points : undefined}
                placeholder="Enter points amount"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
              />
              {pointsAction === 'redeem' && (
                <Text size="1" color="gray">
                  Available: {member.current_points} points
                </Text>
              )}
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium">Reason *</Text>
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
```

**Success Criteria**:
- ✅ Member form renders correctly
- ✅ Member enrollment works
- ✅ Points transactions function
- ✅ QR code generation works

---

### Step 3: Create Loyalty Pages (2-3 hours)

#### 3.1 Update `src/app/(default)/loyalty/members/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Button, 
  Table, 
  Badge,
  IconButton,
  Text,
  Box,
  TextField,
  Grid
} from '@radix-ui/themes';
import { Plus, Edit2, User, Search, Gift, TrendingUp } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLoyaltyData } from '@/hooks/useLoyaltyData';
import { format } from 'date-fns';
import MemberForm from '@/components/loyalty-program/MemberForm';
import MemberProfile from '@/components/loyalty-program/MemberProfile';
import StatsCard from '@/components/common/StatsCard';

export default function LoyaltyMembersPage() {
  usePageTitle('Loyalty Members');
  const { members, tiers, metrics, loading, error, refetchMembers } = useLoyaltyData();
  const [selectedMember, setSelectedMember] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter(member => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      member.first_name.toLowerCase().includes(searchLower) ||
      member.last_name.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.member_number.toLowerCase().includes(searchLower)
    );
  });

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowProfile(true);
  };

  const getTierBadgeColor = (tierName: string) => {
    const tier = tiers.find(t => t.name === tierName);
    return tier?.color || 'gray';
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="7">Loyalty Members</Heading>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Enroll Member
          </Button>
        </Flex>

        {/* Metrics */}
        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
          <StatsCard
            title="Total Members"
            value={metrics.totalMembers.toString()}
            icon={<User />}
            loading={loading}
          />
          
          <StatsCard
            title="Points Issued"
            value={metrics.totalPointsIssued.toLocaleString()}
            icon={<Gift />}
            loading={loading}
          />
          
          <StatsCard
            title="Points Redeemed"
            value={metrics.totalPointsRedeemed.toLocaleString()}
            icon={<TrendingUp />}
            loading={loading}
          />
          
          <StatsCard
            title="Avg Points/Member"
            value={Math.round(metrics.averagePointsPerMember).toString()}
            icon={<User />}
            loading={loading}
          />
        </Grid>

        {/* Search */}
        <Box>
          <TextField.Root
            placeholder="Search members by name, email, or member number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        {/* Members Table */}
        {loading ? (
          <Text>Loading members...</Text>
        ) : filteredMembers.length === 0 ? (
          <Box className="text-center py-12">
            <Text size="3" color="gray">
              {searchTerm ? 'No members match your search' : 'No members enrolled yet'}
            </Text>
          </Box>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Member</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Member #</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Current Points</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Tier</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Enrolled</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredMembers.map((member) => (
                <Table.Row 
                  key={member.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleMemberClick(member)}
                >
                  <Table.Cell>
                    <Flex align="center" gap="2">
                      <Avatar
                        size="2"
                        fallback={`${member.first_name[0]}${member.last_name[0]}`}
                      />
                      <Box>
                        <Text weight="medium">
                          {member.first_name} {member.last_name}
                        </Text>
                        <Text size="1" color="gray">{member.email}</Text>
                      </Box>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2" color="gray">{member.member_number}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text weight="bold" color="blue">
                      {member.current_points}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={getTierBadgeColor(member.loyalty_tiers?.name)}>
                      {member.loyalty_tiers?.name || 'No Tier'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">
                      {format(new Date(member.enrollment_date), 'MMM dd, yyyy')}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <IconButton
                      size="1"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMemberClick(member);
                      }}
                    >
                      <Edit2 size={14} />
                    </IconButton>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}

        {/* Member Form */}
        <MemberForm
          member={selectedMember}
          tiers={tiers}
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            refetchMembers();
            setSelectedMember(null);
          }}
        />

        {/* Member Profile */}
        {selectedMember && (
          <MemberProfile
            member={selectedMember}
            open={showProfile}
            onClose={() => setShowProfile(false)}
            onUpdate={() => {
              refetchMembers();
            }}
          />
        )}
      </Flex>
    </Container>
  );
}
```

**Success Criteria**:
- ✅ Members page loads correctly
- ✅ Member enrollment works
- ✅ Member profiles display
- ✅ Points transactions work
- ✅ Search functionality works

---

### Step 4: Create Rewards Management (2-3 hours)

#### 4.1 Update `src/app/(default)/loyalty/rewards/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { 
  Container, 
  Flex, 
  Heading, 
  Button, 
  Grid,
  Card,
  Text,
  Box,
  Badge,
  IconButton
} from '@radix-ui/themes';
import { Plus, Edit2, Gift, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLoyaltyData } from '@/hooks/useLoyaltyData';
import { loyaltyService } from '@/lib/services';
import { toast } from 'sonner';

export default function LoyaltyRewardsPage() {
  usePageTitle('Loyalty Rewards');
  const { rewards, loading, refetchRewards } = useLoyaltyData();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      setDeleting(rewardId);
      await loyaltyService.deleteReward(rewardId);
      toast.success('Reward deleted successfully');
      refetchRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Failed to delete reward');
    } finally {
      setDeleting(null);
    }
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'discount': return 'blue';
      case 'free_item': return 'green';
      case 'cashback': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="7">Loyalty Rewards</Heading>
          <Button>
            <Plus size={16} />
            Add Reward
          </Button>
        </Flex>

        {/* Rewards Grid */}
        {loading ? (
          <Text>Loading rewards...</Text>
        ) : rewards.length === 0 ? (
          <Box className="text-center py-12">
            <Gift size={48} color="gray" className="mx-auto mb-4" />
            <Text size="3" color="gray">No rewards configured</Text>
            <Text size="2" color="gray">Create your first reward to get started</Text>
          </Box>
        ) : (
          <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <Flex direction="column" gap="3">
                  <Flex justify="between" align="start">
                    <Box>
                      <Text size="4" weight="bold">{reward.name}</Text>
                      <Text size="2" color="gray">{reward.description}</Text>
                    </Box>
                    
                    <Flex gap="1">
                      <IconButton size="1" variant="ghost">
                        <Edit2 size={14} />
                      </IconButton>
                      <IconButton 
                        size="1" 
                        variant="ghost" 
                        color="red"
                        onClick={() => handleDeleteReward(reward.id)}
                        disabled={deleting === reward.id}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </Flex>
                  </Flex>

                  <Flex justify="between" align="center">
                    <Badge color={getRewardTypeColor(reward.reward_type)}>
                      {reward.reward_type.replace('_', ' ')}
                    </Badge>
                    <Text size="3" weight="bold" color="blue">
                      {reward.points_required} pts
                    </Text>
                  </Flex>

                  {reward.reward_value && (
                    <Text size="2" color="green">
                      Value: ${reward.reward_value}
                    </Text>
                  )}

                  <Text size="1" color="gray">
                    Redeemed {reward.redemption_count || 0} times
                  </Text>
                </Flex>
              </Card>
            ))}
          </Grid>
        )}
      </Flex>
    </Container>
  );
}
```

**Success Criteria**:
- ✅ Rewards display correctly
- ✅ Reward management works
- ✅ Deletion confirms properly
- ✅ Reward types categorized

---

### Step 5: Testing and Validation (1-2 hours)

#### 5.1 Manual Testing Checklist
```
Member Management:
- [ ] Members page loads correctly
- [ ] Can enroll new members
- [ ] Member search works
- [ ] Member profiles display correctly
- [ ] QR codes generate properly
- [ ] Points transactions work (earn/redeem)

Tier Management:
- [ ] Tiers display correctly
- [ ] Tier progression works automatically
- [ ] Tier benefits apply correctly
- [ ] Member tier updates properly

Rewards:
- [ ] Rewards gallery displays correctly
- [ ] Can create/edit rewards
- [ ] Point requirements enforced
- [ ] Redemption tracking works
- [ ] Reward categories function

Integration:
- [ ] Points earned from POS orders
- [ ] Tier upgrades happen automatically
- [ ] Reward redemptions deduct points
- [ ] Member data secure and private

Analytics:
- [ ] Loyalty metrics accurate
- [ ] Member activity tracked
- [ ] Redemption patterns visible
- [ ] Tier distribution correct
```

---

## 5. Success Criteria

### Functional Requirements
- ✅ **Member Management**: Full enrollment and profile management
- ✅ **Points System**: Earning and redemption working
- ✅ **Tier System**: Automatic progression based on points
- ✅ **Rewards Catalog**: Active reward management
- ✅ **Integration**: Points earned from POS orders
- ✅ **Analytics**: Member activity and program metrics

### Technical Requirements
- ✅ **No Mock Data**: All imports from `data/` folder removed
- ✅ **Type Safety**: Proper TypeScript types throughout
- ✅ **Error Handling**: Graceful error recovery
- ✅ **Performance**: Pages load quickly with many members

### Business Requirements
- ✅ **Customer Privacy**: Member data protected
- ✅ **Program Integrity**: Points calculations accurate
- ✅ **Tier Fairness**: Transparent progression rules
- ✅ **Reward Value**: Clear redemption terms

---

## 6. Deliverables

### Code Files
```
✅ src/hooks/useLoyaltyData.ts (new)
✅ src/hooks/useLoyaltyActions.ts (new)
✅ src/components/loyalty-program/MemberForm.tsx (new)
✅ src/components/loyalty-program/MemberProfile.tsx (new)
✅ src/components/loyalty-program/RewardsGallery.tsx (new)
✅ src/app/(default)/loyalty/members/page.tsx (updated)
✅ src/app/(default)/loyalty/tiers/page.tsx (updated)
✅ src/app/(default)/loyalty/rewards/page.tsx (updated)
```

---

## 7. Rollback Plan

If integration fails:
1. Restore mock loyalty data temporarily
2. Keep existing UI using mock data
3. Debug loyaltyService separately
4. Test points calculations in isolation
5. Fix issues incrementally

---

## 8. Next Steps After Completion

1. **POS Integration**: Automatic points earning from orders
2. **Member App**: Customer-facing loyalty app/portal
3. **Advanced Analytics**: Member segmentation and insights
4. **Move to Next Task**: Purchasing Integration (Task 1.7)

---

**Status**: 📋 Ready to Start  
**Dependencies**: Task 1.1 (Dashboard), loyaltyService  
**Blocked By**: None  
**Blocks**: Advanced customer features
