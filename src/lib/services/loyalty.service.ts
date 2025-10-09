import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type LoyaltyMember = Database['public']['Tables']['loyalty_members']['Row'];
type LoyaltyTier = Database['public']['Tables']['loyalty_tiers']['Row'];
type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];
type LoyaltyReward = Database['public']['Tables']['loyalty_rewards']['Row'];
type LoyaltyMemberInsert = Database['public']['Tables']['loyalty_members']['Insert'];
type LoyaltyRewardInsert = Database['public']['Tables']['loyalty_rewards']['Insert'];
type RewardTierMapping = Database['public']['Tables']['reward_tier_mappings']['Row'];
type RewardTierMappingInsert = Database['public']['Tables']['reward_tier_mappings']['Insert'];
type RewardBranchMapping = Database['public']['Tables']['reward_branch_mappings']['Row'];
type RewardBranchMappingInsert = Database['public']['Tables']['reward_branch_mappings']['Insert'];

export interface LoyaltyMemberWithTier extends LoyaltyMember {
  tier?: LoyaltyTier;
}

export interface LoyaltyMemberStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
}

export const loyaltyService = {
  /**
   * Get all loyalty members for an organization
   */
  getMembers: async (organizationId: string): Promise<LoyaltyMemberWithTier[]> => {
    const { data, error } = await supabase
      .from('loyalty_members')
      .select(`
        *,
        tier:loyalty_tiers(*)
      `)
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single loyalty member by ID
   */
  getMemberById: async (memberId: string): Promise<LoyaltyMemberWithTier | null> => {
    const { data, error } = await supabase
      .from('loyalty_members')
      .select(`
        *,
        tier:loyalty_tiers(*)
      `)
      .eq('id', memberId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Search loyalty members by name, email, or member number
   */
  searchMembers: async (organizationId: string, searchTerm: string): Promise<LoyaltyMemberWithTier[]> => {
    const { data, error } = await supabase
      .from('loyalty_members')
      .select(`
        *,
        tier:loyalty_tiers(*)
      `)
      .eq('organization_id', organizationId)
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%`)
      .order('joined_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new loyalty member
   */
  createMember: async (organizationId: string, member: Omit<LoyaltyMemberInsert, 'organization_id' | 'member_number'>): Promise<LoyaltyMember> => {
    // Generate member number
    const memberNumber = `LM${Date.now()}`;
    
    const { data, error } = await supabase
      .from('loyalty_members')
      .insert({
        ...member,
        organization_id: organizationId,
        member_number: memberNumber
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update a loyalty member
   */
  updateMember: async (memberId: string, updates: Partial<LoyaltyMember>): Promise<LoyaltyMember> => {
    const { data, error } = await supabase
      .from('loyalty_members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get loyalty tiers for an organization
   */
  getTiers: async (organizationId: string): Promise<LoyaltyTier[]> => {
    const { data, error } = await supabase
      .from('loyalty_tiers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('min_points', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Get loyalty rewards for an organization
   */
  getRewards: async (organizationId: string): Promise<LoyaltyReward[]> => {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('points_required', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new loyalty reward
   */
  createReward: async (organizationId: string, reward: Omit<LoyaltyRewardInsert, 'organization_id'>): Promise<LoyaltyReward> => {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .insert({
        ...reward,
        organization_id: organizationId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a loyalty reward
   */
  updateReward: async (rewardId: string, updates: Partial<LoyaltyReward>): Promise<LoyaltyReward> => {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', rewardId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a loyalty reward (soft delete)
   */
  deleteReward: async (rewardId: string): Promise<void> => {
    const { error } = await supabase
      .from('loyalty_rewards')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', rewardId);

    if (error) throw error;
  },

  /**
   * Get loyalty transactions for a member
   */
  getMemberTransactions: async (memberId: string): Promise<LoyaltyTransaction[]> => {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Add points to a member's account
   */
  addPoints: async (
    memberId: string,
    points: number,
    description: string,
    orderId?: string,
    branchId?: string,
    createdBy?: string
  ): Promise<LoyaltyTransaction> => {
    // Start a transaction to update both member points and create transaction record
    const { data: member } = await supabase
      .from('loyalty_members')
      .select('current_points, lifetime_points, organization_id')
      .eq('id', memberId)
      .single();

    if (!member) throw new Error('Member not found');

    // Update member points
    await supabase
      .from('loyalty_members')
      .update({
        current_points: member.current_points + points,
        lifetime_points: member.lifetime_points + points,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId);

    // Create transaction record
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .insert({
        organization_id: member.organization_id,
        member_id: memberId,
        transaction_type: 'earned',
        points: points,
        description: description,
        order_id: orderId,
        branch_id: branchId,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Redeem points from a member's account
   */
  redeemPoints: async (
    memberId: string,
    points: number,
    description: string,
    branchId?: string,
    createdBy?: string
  ): Promise<LoyaltyTransaction> => {
    // Check if member has enough points
    const { data: member } = await supabase
      .from('loyalty_members')
      .select('current_points, organization_id')
      .eq('id', memberId)
      .single();

    if (!member) throw new Error('Member not found');
    if (member.current_points < points) throw new Error('Insufficient points');

    // Update member points
    await supabase
      .from('loyalty_members')
      .update({
        current_points: member.current_points - points,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId);

    // Create transaction record
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .insert({
        organization_id: member.organization_id,
        member_id: memberId,
        transaction_type: 'redeemed',
        points: -points, // Negative for redemption
        description: description,
        branch_id: branchId,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get loyalty program statistics for an organization
   */
  getStats: async (organizationId: string): Promise<LoyaltyMemberStats> => {
    // Get member counts
    const { data: members } = await supabase
      .from('loyalty_members')
      .select('status, joined_at')
      .eq('organization_id', organizationId);

    const totalMembers = members?.length || 0;
    const activeMembers = members?.filter(m => m.status === 'active').length || 0;
    
    // Get new members this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newMembersThisMonth = members?.filter(m => 
      new Date(m.joined_at) >= thisMonth
    ).length || 0;

    // Get points statistics
    const { data: transactions } = await supabase
      .from('loyalty_transactions')
      .select('points, transaction_type')
      .eq('organization_id', organizationId);

    const totalPointsIssued = transactions?.filter(t => t.transaction_type === 'earned')
      .reduce((sum, t) => sum + t.points, 0) || 0;
    
    const totalPointsRedeemed = Math.abs(transactions?.filter(t => t.transaction_type === 'redeemed')
      .reduce((sum, t) => sum + t.points, 0) || 0);

    return {
      totalMembers,
      activeMembers,
      newMembersThisMonth,
      totalPointsIssued,
      totalPointsRedeemed
    };
  },

  /**
   * Get tier mappings for a reward
   */
  getRewardTierMappings: async (rewardId: string): Promise<RewardTierMapping[]> => {
    const { data, error } = await supabase
      .from('reward_tier_mappings')
      .select('*')
      .eq('reward_id', rewardId);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Set tier mappings for a reward (replaces all existing)
   */
  setRewardTierMappings: async (
    rewardId: string,
    tierIds: string[],
    organizationId: string,
    createdBy?: string
  ): Promise<void> => {
    // Delete existing mappings
    await supabase
      .from('reward_tier_mappings')
      .delete()
      .eq('reward_id', rewardId);
    
    // Insert new mappings
    if (tierIds.length > 0) {
      const mappings: RewardTierMappingInsert[] = tierIds.map(tierId => ({
        reward_id: rewardId,
        tier_id: tierId,
        organization_id: organizationId,
        created_by: createdBy || null
      }));
      
      const { error } = await supabase
        .from('reward_tier_mappings')
        .insert(mappings);
      
      if (error) throw error;
    }
  },

  /**
   * Get branch mappings for a reward
   */
  getRewardBranchMappings: async (rewardId: string): Promise<RewardBranchMapping[]> => {
    const { data, error } = await supabase
      .from('reward_branch_mappings')
      .select('*')
      .eq('reward_id', rewardId);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Set branch mappings for a reward (replaces all existing)
   * Pass empty array for "All Branches", or specific branch IDs for specific branches
   */
  setRewardBranchMappings: async (
    rewardId: string,
    branchIds: string[],
    organizationId: string,
    createdBy?: string
  ): Promise<void> => {
    // Delete existing mappings
    await supabase
      .from('reward_branch_mappings')
      .delete()
      .eq('reward_id', rewardId);
    
    // Insert new mappings (only if specific branches selected)
    if (branchIds.length > 0) {
      const mappings: RewardBranchMappingInsert[] = branchIds.map(branchId => ({
        reward_id: rewardId,
        branch_id: branchId,
        organization_id: organizationId,
        created_by: createdBy || null
      }));
      
      const { error } = await supabase
        .from('reward_branch_mappings')
        .insert(mappings);
      
      if (error) throw error;
    }
  },

  /**
   * Check if a member is eligible for a reward
   */
  checkRewardEligibility: async (
    memberId: string,
    rewardId: string,
    branchId: string
  ): Promise<{ eligible: boolean; reason?: string }> => {
    // Get member
    const { data: member } = await supabase
      .from('loyalty_members')
      .select('current_points, tier_id')
      .eq('id', memberId)
      .single();
    
    if (!member) {
      return { eligible: false, reason: 'Member not found' };
    }
    
    // Get reward
    const { data: reward } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('id', rewardId)
      .single();
    
    if (!reward) {
      return { eligible: false, reason: 'Reward not found' };
    }
    
    // Check if reward is active
    if (!reward.is_active) {
      return { eligible: false, reason: 'Reward is inactive' };
    }
    
    // Check expiry
    if (reward.valid_until && new Date(reward.valid_until) < new Date()) {
      return { eligible: false, reason: 'Reward has expired' };
    }
    
    // Check points
    if (reward.points_required && member.current_points && member.current_points < reward.points_required) {
      return { eligible: false, reason: 'Insufficient points' };
    }
    
    // Check tier eligibility
    const { data: tierMappings } = await supabase
      .from('reward_tier_mappings')
      .select('tier_id')
      .eq('reward_id', rewardId);
    
    if (tierMappings && tierMappings.length > 0) {
      const eligibleTiers = tierMappings.map(m => m.tier_id);
      if (member.tier_id && !eligibleTiers.includes(member.tier_id)) {
        return { eligible: false, reason: 'Not eligible for your tier' };
      }
    }
    
    // Check branch availability
    const { data: branchMappings } = await supabase
      .from('reward_branch_mappings')
      .select('branch_id')
      .eq('reward_id', rewardId);
    
    if (branchMappings && branchMappings.length > 0) {
      const eligibleBranches = branchMappings.map(m => m.branch_id);
      if (!eligibleBranches.includes(branchId)) {
        return { eligible: false, reason: 'Not available at this branch' };
      }
    }
    
    // Check max redemptions
    if (reward.max_redemptions && reward.redemption_count && reward.redemption_count >= reward.max_redemptions) {
      return { eligible: false, reason: 'Reward fully redeemed' };
    }
    
    return { eligible: true };
  },

  /**
   * Get rewards with tier and branch information
   */
  getRewardsWithMappings: async (organizationId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select(`
        *,
        reward_tier_mappings(
          tier_id,
          loyalty_tiers(id, name, tier_color)
        ),
        reward_branch_mappings(
          branch_id, 
          branches(id, name, code)
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('points_required', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
};
