'use client';

import { useState } from 'react';
import { purchasingService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row'];

interface CreatePOItem {
  inventoryItemId: string;
  quantityOrdered: number;
  unitCost: number;
}

interface CreatePOData {
  supplierId: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: CreatePOItem[];
}

interface UsePurchaseOrderActionsReturn {
  createPurchaseOrder: (poData: CreatePOData) => Promise<void>;
  updatePurchaseOrderStatus: (poId: string, status: string) => Promise<void>;
  receivePurchaseOrder: (poId: string, receivedItems: ReceiveItem[]) => Promise<void>;
  isProcessing: boolean;
  error: Error | null;
}

interface ReceiveItem {
  itemId: string;
  quantityReceived: number;
}

export const usePurchaseOrderActions = (): UsePurchaseOrderActionsReturn => {
  const { currentOrganization, currentBranch } = useOrganization();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPurchaseOrder = async (poData: CreatePOData): Promise<void> => {
    if (!currentOrganization || !currentBranch) {
      throw new Error('No organization or branch selected');
    }

    try {
      setIsProcessing(true);
      setError(null);

      await purchasingService.createPurchaseOrder({
        branchId: currentBranch.id,
        organizationId: currentOrganization.id,
        supplierId: poData.supplierId,
        expectedDeliveryDate: poData.expectedDeliveryDate,
        notes: poData.notes,
        items: poData.items,
      });

      toast.success('Purchase order created successfully!');
    } catch (err) {
      console.error('Error creating purchase order:', err);
      setError(err as Error);
      toast.error('Failed to create purchase order');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const updatePurchaseOrderStatus = async (poId: string, status: string): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);

      await purchasingService.updatePurchaseOrderStatus(poId, status);
      toast.success(`Purchase order ${status}`);
    } catch (err) {
      console.error('Error updating purchase order status:', err);
      setError(err as Error);
      toast.error('Failed to update purchase order');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const receivePurchaseOrder = async (poId: string, receivedItems: ReceiveItem[]): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);

      await purchasingService.receivePurchaseOrder(poId, receivedItems);
      toast.success('Purchase order received and inventory updated!');
    } catch (err) {
      console.error('Error receiving purchase order:', err);
      setError(err as Error);
      toast.error('Failed to receive purchase order');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    receivePurchaseOrder,
    isProcessing,
    error,
  };
};
