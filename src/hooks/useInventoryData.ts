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
      // OPTIMIZED: Single database query instead of sequential loop
      const movementsData = await inventoryService.getRecentMovements(
        currentBranch.id,
        50 // limit to 50 most recent movements
      );
      setMovements(movementsData);
    } catch (err) {
      console.error('Error fetching inventory movements:', err);
      throw err;
    }
  }, [currentOrganization, currentBranch]);

  const fetchAllData = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel for better performance
      await Promise.all([
        fetchInventoryItems(),
        fetchBranchInventory(),
        fetchInventoryMovements()
      ]);

    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, fetchInventoryItems, fetchBranchInventory, fetchInventoryMovements]);

  // Calculate metrics whenever data changes
  useEffect(() => {
    const calculateMetrics = async () => {
      if (!currentBranch || loading) return;

      try {
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
      } catch (err) {
        console.error('Error calculating metrics:', err);
      }
    };

    calculateMetrics();
  }, [currentBranch, branchInventory, movements, items.length, loading]);

  // Main data fetching effect with proper dependency
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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
