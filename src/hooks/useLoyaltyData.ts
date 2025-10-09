import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { loyaltyService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type LoyaltyMember = Database['public']['Tables']['loyalty_members']['Row'];
type LoyaltyTier = Database['public']['Tables']['loyalty_tiers']['Row'];
type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];

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
  transactions: LoyaltyTransaction[];
  metrics: LoyaltyMetrics;
  loading: boolean;
  error: Error | null;
  refetchMembers: () => Promise<void>;
  refetchTiers: () => Promise<void>;
  refetchTransactions: () => Promise<void>;
}

export const useLoyaltyData = (): UseLoyaltyDataReturn => {
  const { currentOrganization } = useOrganization();
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
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
      const membersData = await loyaltyService.getMembers(currentOrganization.id);
      setMembers(membersData);
    } catch (err) {
      console.error('Error fetching loyalty members:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchTiers = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const tiersData = await loyaltyService.getTiers(currentOrganization.id);
      setTiers(tiersData);
    } catch (err) {
      console.error('Error fetching loyalty tiers:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchTransactions = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      // Get transactions from all members
      const allTransactions: LoyaltyTransaction[] = [];
      for (const member of members) {
        const memberTransactions = await loyaltyService.getMemberTransactions(member.id);
        allTransactions.push(...memberTransactions);
      }
      setTransactions(allTransactions);
    } catch (err) {
      console.error('Error fetching loyalty transactions:', err);
      throw err;
    }
  }, [currentOrganization, members]);

  const calculateMetrics = useCallback(() => {
    const totalMembers = members.length;
    const totalPointsIssued = transactions
      .filter(t => t.transaction_type === 'earn')
      .reduce((sum, t) => sum + (t.points || 0), 0);
    const totalPointsRedeemed = transactions
      .filter(t => t.transaction_type === 'redeem')
      .reduce((sum, t) => sum + Math.abs(t.points || 0), 0);
    
    const averagePointsPerMember = totalMembers > 0 
      ? members.reduce((sum, m) => sum + (m.current_points || 0), 0) / totalMembers 
      : 0;

    const topTier = tiers.sort((a, b) => b.min_points - a.min_points)[0];
    const topTierMembers = topTier 
      ? members.filter(m => m.tier_id === topTier.id).length 
      : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recentTransactions = transactions.filter(
      t => new Date(t.created_at || '') >= today
    ).length;

    setMetrics({
      totalMembers,
      totalPointsIssued,
      totalPointsRedeemed,
      averagePointsPerMember,
      topTierMembers,
      recentTransactions,
    });
  }, [members, tiers, transactions]);

  const fetchAllData = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchMembers(),
        fetchTiers(),
      ]);
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, fetchMembers, fetchTiers]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (members.length > 0) {
      fetchTransactions();
    }
  }, [members, fetchTransactions]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  return {
    members,
    tiers,
    transactions,
    metrics,
    loading,
    error,
    refetchMembers: fetchMembers,
    refetchTiers: fetchTiers,
    refetchTransactions: fetchTransactions,
  };
};
