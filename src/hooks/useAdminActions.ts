import { useState } from 'react';
import { organizationService } from '@/lib/services';
import { supabase } from '@/lib/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type BranchInsert = Database['public']['Tables']['branches']['Insert'];
type Branch = Database['public']['Tables']['branches']['Row'];

interface UseAdminActionsReturn {
  createBranch: (branchData: Omit<BranchInsert, 'organization_id'>) => Promise<Branch>;
  updateBranch: (branchId: string, updates: Partial<Branch>) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;
  updateUserRole: (userId: string, roleId: string) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  isProcessing: boolean;
  error: Error | null;
}

export const useAdminActions = (): UseAdminActionsReturn => {
  const { currentOrganization } = useOrganization();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createBranch = async (branchData: Omit<BranchInsert, 'organization_id'>): Promise<Branch> => {
    if (!currentOrganization) throw new Error('No organization selected');

    try {
      setIsProcessing(true);
      setError(null);

      const branch = await organizationService.createBranch({
        ...branchData,
        organization_id: currentOrganization.id,
      });

      toast.success('Branch created successfully!');
      return branch;
    } catch (err) {
      console.error('Error creating branch:', err);
      setError(err as Error);
      toast.error('Failed to create branch');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBranch = async (branchId: string, updates: Partial<Branch>): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);

      await organizationService.updateBranch(branchId, updates);
      toast.success('Branch updated successfully');
    } catch (err) {
      console.error('Error updating branch:', err);
      setError(err as Error);
      toast.error('Failed to update branch');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteBranch = async (branchId: string): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);

      await organizationService.deleteBranch(branchId);
      toast.success('Branch deleted successfully');
    } catch (err) {
      console.error('Error deleting branch:', err);
      setError(err as Error);
      toast.error('Failed to delete branch');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateUserRole = async (userId: string, roleId: string): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role_id: roleId, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;
      toast.success('User role updated successfully');
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err as Error);
      toast.error('Failed to update user role');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const deactivateUser = async (userId: string): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;
      toast.success('User deactivated successfully');
    } catch (err) {
      console.error('Error deactivating user:', err);
      setError(err as Error);
      toast.error('Failed to deactivate user');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createBranch,
    updateBranch,
    deleteBranch,
    updateUserRole,
    deactivateUser,
    isProcessing,
    error,
  };
};
