import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { inventoryService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type BranchInventory = Database['public']['Tables']['branch_inventory']['Row'] & {
  inventory_item?: InventoryItem;
};
type InventoryMovement = Database['public']['Tables']['inventory_movements']['Row'];

interface InventoryMetrics {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  recentMovements: number;
}

interface UseInventoryDataReturn {
  items: InventoryItem[];
  branchInventory: BranchInventory[];
  movements: InventoryMovement[];
  metrics: InventoryMetrics;
  loading: boolean;
  error: Error | null;
  refetchItems: () => Promise<void>;
  refetchInventory: () => Promise<void>;
  refetchMovements: () => Promise<void>;
}

export const useInventoryData = (): UseInventoryDataReturn => {
  const { currentOrganization, currentBranch } = useOrganization();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [branchInventory, setBranchInventory] = useState<BranchInventory[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    recentMovements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInventoryItems = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const itemsData = await inventoryService.getItems(currentOrganization.id);
      setItems(itemsData);
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchBranchInventory = useCallback(async () => {
    if (!currentOrganization || !currentBranch) return;

    try {
      const inventoryData = await inventoryService.getBranchInventory(currentBranch.id);
      setBranchInventory(inventoryData);
    } catch (err) {
      console.error('Error fetching branch inventory:', err);
      throw err;
    }
  }, [currentOrganization, currentBranch]);

  const fetchInventoryMovements = useCallback(async () => {
    if (!currentOrganization || !currentBranch) return;

    try {
      // Get movements for all items in the branch (limit to recent 50)
      const allMovements: InventoryMovement[] = [];
      for (const item of items.slice(0, 10)) {
        const itemMovements = await inventoryService.getItemMovements(
          item.id,
          currentBranch.id,
          5
        );
        allMovements.push(...itemMovements);
      }
      setMovements(allMovements.slice(0, 50));
    } catch (err) {
      console.error('Error fetching inventory movements:', err);
      throw err;
    }
  }, [currentOrganization, currentBranch, items]);

  const fetchAllData = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchInventoryItems(),
        fetchBranchInventory(),
      ]);

      // Calculate metrics after data is loaded
      if (currentBranch) {
        const lowStockItems = await inventoryService.getLowStockItems(currentBranch.id);
        
        const totalValue = branchInventory.reduce((sum, inv) => {
          const quantity = inv.current_quantity || 0;
          const cost = inv.inventory_item?.cost_per_unit || 0;
          return sum + (quantity * cost);
        }, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const recentMovements = movements.filter(
          movement => new Date(movement.created_at || '') >= today
        ).length;

        setMetrics({
          totalItems: items.length,
          lowStockItems: lowStockItems.length,
          totalValue,
          recentMovements,
        });
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, currentBranch, fetchInventoryItems, fetchBranchInventory, branchInventory, movements, items.length]);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id, currentBranch?.id]);

  return {
    items,
    branchInventory,
    movements,
    metrics,
    loading,
    error,
    refetchItems: fetchInventoryItems,
    refetchInventory: fetchBranchInventory,
    refetchMovements: fetchInventoryMovements,
  };
};
