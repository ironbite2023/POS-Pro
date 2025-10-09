import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { modifierService } from '@/lib/services';
import type { ModifierGroup, Modifier, ModifierGroupWithModifiers, MenuItemWithModifiers } from '@/lib/services/modifier.service';

interface UseModifierDataReturn {
  modifierGroups: ModifierGroup[];
  modifiersWithGroups: ModifierGroupWithModifiers[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  
  // Utility functions
  getModifiersForGroup: (groupId: string) => Promise<Modifier[]>;
  getMenuItemWithModifiers: (menuItemId: string) => Promise<MenuItemWithModifiers | null>;
  calculatePrice: (menuItemId: string, selectedModifiers: any[]) => Promise<number>;
}

export const useModifierData = (): UseModifierDataReturn => {
  const { currentOrganization } = useOrganization();
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [modifiersWithGroups, setModifiersWithGroups] = useState<ModifierGroupWithModifiers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchModifierData = useCallback(async () => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch modifier groups and groups with modifiers in parallel
      const [groupsData, groupsWithModifiersData] = await Promise.all([
        modifierService.getModifierGroups(currentOrganization.id),
        modifierService.getModifierGroupsWithModifiers(currentOrganization.id),
      ]);

      setModifierGroups(groupsData);
      setModifiersWithGroups(groupsWithModifiersData);
    } catch (err) {
      console.error('Error fetching modifier data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchModifierData();
  }, [fetchModifierData]);

  // Utility functions
  const getModifiersForGroup = useCallback(async (groupId: string): Promise<Modifier[]> => {
    try {
      return await modifierService.getModifiers(groupId);
    } catch (err) {
      console.error('Error fetching modifiers for group:', err);
      return [];
    }
  }, []);

  const getMenuItemWithModifiers = useCallback(async (menuItemId: string): Promise<MenuItemWithModifiers | null> => {
    try {
      return await modifierService.getMenuItemWithModifiers(menuItemId);
    } catch (err) {
      console.error('Error fetching menu item with modifiers:', err);
      return null;
    }
  }, []);

  const calculatePrice = useCallback(async (menuItemId: string, selectedModifiers: any[]): Promise<number> => {
    try {
      return await modifierService.calculateModifierPrice(menuItemId, selectedModifiers);
    } catch (err) {
      console.error('Error calculating modifier price:', err);
      return 0;
    }
  }, []);

  return {
    modifierGroups,
    modifiersWithGroups,
    loading,
    error,
    refetch: fetchModifierData,
    getModifiersForGroup,
    getMenuItemWithModifiers,
    calculatePrice
  };
};
