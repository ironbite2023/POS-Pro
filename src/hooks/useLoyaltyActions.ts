import { useState } from 'react';
import { loyaltyService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type LoyaltyMemberInsert = Database['public']['Tables']['loyalty_members']['Insert'];

interface UseLoyaltyActionsReturn {
  enrollMember: (memberData: Omit<LoyaltyMemberInsert, 'organization_id'>) => Promise<void>;
  earnPoints: (memberId: string, points: number, description?: string, orderId?: string) => Promise<void>;
  redeemPoints: (memberId: string, points: number, description?: string) => Promise<void>;
  updateTier: (memberId: string) => Promise<void>;
  isProcessing: boolean;
  error: Error | null;
}

export const useLoyaltyActions = (): UseLoyaltyActionsReturn => {
  const { currentOrganization, currentBranch } = useOrganization();
  const { userProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const enrollMember = async (memberData: Omit<LoyaltyMemberInsert, 'organization_id'>) => {
    if (!currentOrganization) {
      toast.error('No organization selected');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Generate a unique member number
      const memberNumber = `MEM${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      await loyaltyService.createMember({
        ...memberData,
        organization_id: currentOrganization.id,
        member_number: memberNumber,
        current_points: 0,
        lifetime_points: 0,
        status: 'active',
        joined_at: new Date().toISOString(),
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

  const earnPoints = async (
    memberId: string, 
    points: number, 
    description?: string,
    orderId?: string
  ) => {
    if (!currentOrganization) {
      toast.error('No organization selected');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      await loyaltyService.addPoints(
        memberId,
        currentOrganization.id,
        points,
        description || 'Points earned',
        orderId,
        currentBranch?.id,
        userProfile?.id
      );

      // Update tier after earning points
      await loyaltyService.updateMemberTier(memberId);

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

  const redeemPoints = async (
    memberId: string, 
    points: number, 
    description?: string
  ) => {
    if (!currentOrganization) {
      toast.error('No organization selected');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      await loyaltyService.redeemPoints(
        memberId,
        currentOrganization.id,
        points,
        description || 'Points redeemed',
        currentBranch?.id,
        userProfile?.id
      );

      toast.success(`${points} points redeemed!`);
    } catch (err) {
      console.error('Error redeeming points:', err);
      setError(err as Error);
      const errorMessage = err instanceof Error ? err.message : 'Failed to redeem points';
      toast.error(errorMessage);
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
      throw err;
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
