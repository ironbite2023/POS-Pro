import { Database } from '@/lib/supabase/database.types';

// Use database types as the source of truth
export type LoyaltyMemberDB = Database['public']['Tables']['loyalty_members']['Row'];
export type LoyaltyTierDB = Database['public']['Tables']['loyalty_tiers']['Row'];
export type LoyaltyRewardDB = Database['public']['Tables']['loyalty_rewards']['Row'];
export type LoyaltyTransactionDB = Database['public']['Tables']['loyalty_transactions']['Row'];

// Legacy compatibility interfaces - gradually migrate away from these
export interface MembershipTier {
  id: string;
  name: string;
  minPoints: number;
  benefits: string[];
}

export interface LoyaltyMember {
  id: string;
  name: string;
  memberId: string;
  email: string;
  phone: string;
  joinDate: string;
  tier: MembershipTier;
  points: number;
  lastActivity: string;
  status: 'Active' | 'Inactive';
  birthday?: string;
  tags?: string[];
  transactionHistory?: Transaction[];
  notes?: string;
  avatarUrl?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'earn' | 'redeem' | 'adjustment' | 'expiry';
  points: number;
  description: string;
  relatedOrderId?: string;
  relatedRewardId?: string;
}

// Updated LoyaltyReward interface to match database schema
export interface LoyaltyReward {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  reward_type: string | null;
  points_required: number | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  free_item_id: string | null;
  is_active: boolean | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Legacy reward type compatibility - map to database fields
export type RewardType = 'Free Item' | '% Discount' | 'Cashback';
export type RewardStatus = 'Active' | 'Expired' | 'Inactive' | 'Draft';
export type BranchScope = 'All' | string[];

// Helper functions to convert between legacy and database types
export const convertDBRewardToLegacy = (dbReward: LoyaltyRewardDB): LoyaltyReward => {
  return {
    id: dbReward.id,
    organization_id: dbReward.organization_id,
    name: dbReward.name,
    description: dbReward.description,
    reward_type: dbReward.reward_type,
    points_required: dbReward.points_required,
    discount_percentage: dbReward.discount_percentage,
    discount_amount: dbReward.discount_amount,
    free_item_id: dbReward.free_item_id,
    is_active: dbReward.is_active,
    valid_from: dbReward.valid_from,
    valid_until: dbReward.valid_until,
    created_at: dbReward.created_at,
    updated_at: dbReward.updated_at
  };
};

export const convertLegacyRewardToDB = (reward: Partial<LoyaltyReward>): Partial<LoyaltyRewardDB> => {
  return {
    id: reward.id,
    organization_id: reward.organization_id,
    name: reward.name,
    description: reward.description,
    reward_type: reward.reward_type,
    points_required: reward.points_required,
    discount_percentage: reward.discount_percentage,
    discount_amount: reward.discount_amount,
    free_item_id: reward.free_item_id,
    is_active: reward.is_active,
    valid_from: reward.valid_from,
    valid_until: reward.valid_until,
    created_at: reward.created_at,
    updated_at: reward.updated_at
  };
}; 