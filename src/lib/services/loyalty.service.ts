import { supabase } from '../supabase/client';
import type { Database } from '../supabase/database.types';

type LoyaltyMember = Database['public']['Tables']['loyalty_members']['Row'];
type LoyaltyMemberInsert = Database['public']['Tables']['loyalty_members']['Insert'];
type LoyaltyTier = Database['public']['Tables']['loyalty_tiers']['Row'];
type LoyaltyTierInsert = Database['public']['Tables']['loyalty_tiers']['Insert'];
type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];
type LoyaltyTransactionInsert = Database['public']['Tables']['loyalty_transactions']['Insert'];

export const loyaltyService = {
  // ========== Members ==========

  /**
   * Get all loyalty members for an organization
   */
  getMembers: async (organizationId: string): Promise<LoyaltyMember[]> => {
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
   * Get member by ID
   */
  getMemberById: async (memberId: string): Promise<LoyaltyMember | null> => {
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
   * Get member by email or phone
   */
  findMember: async (
    organizationId: string,
    emailOrPhone: string
  ): Promise<LoyaltyMember | null> => {
    const { data, error } = await supabase
      .from('loyalty_members')
      .select(`
        *,
        tier:loyalty_tiers(*)
      `)
      .eq('organization_id', organizationId)
      .or(`email.eq.${emailOrPhone},phone.eq.${emailOrPhone}`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create new loyalty member
   */
  createMember: async (member: LoyaltyMemberInsert): Promise<LoyaltyMember> => {
    const { data, error } = await supabase
      .from('loyalty_members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update loyalty member
   */
  updateMember: async (
    memberId: string,
    updates: Partial<Omit<LoyaltyMember, 'id' | 'created_at' | 'organization_id'>>
  ): Promise<LoyaltyMember> => {
    const { data, error } = await supabase
      .from('loyalty_members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ========== Tiers ==========

  /**
   * Get all loyalty tiers for an organization
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
   * Create loyalty tier
   */
  createTier: async (tier: LoyaltyTierInsert): Promise<LoyaltyTier> => {
    const { data, error } = await supabase
      .from('loyalty_tiers')
      .insert(tier)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update loyalty tier
   */
  updateTier: async (
    tierId: string,
    updates: Partial<Omit<LoyaltyTier, 'id' | 'created_at' | 'organization_id'>>
  ): Promise<LoyaltyTier> => {
    const { data, error } = await supabase
      .from('loyalty_tiers')
      .update(updates)
      .eq('id', tierId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ========== Transactions ==========

  /**
   * Get member transactions
   */
  getMemberTransactions: async (
    memberId: string,
    limit = 50
  ): Promise<LoyaltyTransaction[]> => {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Add points to member
   */
  addPoints: async (
    memberId: string,
    organizationId: string,
    points: number,
    description?: string,
    orderId?: string,
    branchId?: string,
    userId?: string
  ): Promise<{ member: LoyaltyMember; transaction: LoyaltyTransaction }> => {
    // Get current member
    const member = await loyaltyService.getMemberById(memberId);
    if (!member) throw new Error('Member not found');

    const newCurrentPoints = (member.current_points || 0) + points;
    const newLifetimePoints = (member.lifetime_points || 0) + points;

    // Update member points
    const updatedMember = await loyaltyService.updateMember(memberId, {
      current_points: newCurrentPoints,
      lifetime_points: newLifetimePoints,
      last_activity: new Date().toISOString(),
    });

    // Record transaction
    const { data: transaction, error } = await supabase
      .from('loyalty_transactions')
      .insert({
        member_id: memberId,
        organization_id: organizationId,
        transaction_type: 'earn',
        points,
        description: description || null,
        order_id: orderId || null,
        branch_id: branchId || null,
        created_by: userId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { member: updatedMember, transaction };
  },

  /**
   * Redeem points from member
   */
  redeemPoints: async (
    memberId: string,
    organizationId: string,
    points: number,
    description?: string,
    branchId?: string,
    userId?: string
  ): Promise<{ member: LoyaltyMember; transaction: LoyaltyTransaction }> => {
    // Get current member
    const member = await loyaltyService.getMemberById(memberId);
    if (!member) throw new Error('Member not found');

    if ((member.current_points || 0) < points) {
      throw new Error('Insufficient points');
    }

    const newCurrentPoints = (member.current_points || 0) - points;

    // Update member points
    const updatedMember = await loyaltyService.updateMember(memberId, {
      current_points: newCurrentPoints,
      last_activity: new Date().toISOString(),
    });

    // Record transaction
    const { data: transaction, error } = await supabase
      .from('loyalty_transactions')
      .insert({
        member_id: memberId,
        organization_id: organizationId,
        transaction_type: 'redeem',
        points: -points,
        description: description || null,
        branch_id: branchId || null,
        created_by: userId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { member: updatedMember, transaction };
  },

  /**
   * Check and update member tier based on lifetime points
   */
  updateMemberTier: async (memberId: string): Promise<LoyaltyMember> => {
    const member = await loyaltyService.getMemberById(memberId);
    if (!member) throw new Error('Member not found');

    const tiers = await loyaltyService.getTiers(member.organization_id);
    
    // Find appropriate tier based on lifetime points
    const appropriateTier = tiers
      .sort((a, b) => b.min_points - a.min_points)
      .find((tier) => (member.lifetime_points || 0) >= tier.min_points);

    if (appropriateTier && appropriateTier.id !== member.tier_id) {
      return await loyaltyService.updateMember(memberId, {
        tier_id: appropriateTier.id,
      });
    }

    return member;
  },
};
