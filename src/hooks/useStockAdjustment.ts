import { useState } from 'react';
import { inventoryService } from '@/lib/services';
import { toast } from 'sonner';

interface AdjustStockParams {
  branchId: string;
  inventoryItemId: string;
  organizationId: string;
  quantity: number;
  movementType: string;
  userId?: string;
  notes?: string;
}

interface UseStockAdjustmentReturn {
  adjustStock: (params: AdjustStockParams) => Promise<void>;
  isAdjusting: boolean;
  error: Error | null;
}

export const useStockAdjustment = (): UseStockAdjustmentReturn => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const adjustStock = async (params: AdjustStockParams) => {
    try {
      setIsAdjusting(true);
      setError(null);

      await inventoryService.adjustInventory(
        params.branchId,
        params.inventoryItemId,
        params.organizationId,
        params.quantity,
        params.movementType,
        params.userId,
        params.notes
      );
      
      toast.success(
        `Stock ${params.quantity > 0 ? 'increased' : 'decreased'} by ${Math.abs(params.quantity)}`
      );
    } catch (err) {
      console.error('Error adjusting stock:', err);
      setError(err as Error);
      toast.error('Failed to adjust stock');
      throw err;
    } finally {
      setIsAdjusting(false);
    }
  };

  return { adjustStock, isAdjusting, error };
};
