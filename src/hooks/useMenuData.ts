import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { menuService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface MenuItemWithCategory extends MenuItem {
  category?: MenuCategory | null;
}

interface UseMenuDataReturn {
  categories: MenuCategory[];
  menuItems: MenuItemWithCategory[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useMenuData = (): UseMenuDataReturn => {
  const { currentOrganization } = useOrganization();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMenuData = useCallback(async () => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [categoriesData, itemsData] = await Promise.all([
        menuService.getCategories(currentOrganization.id),
        menuService.getMenuItems(currentOrganization.id),
      ]);

      setCategories(categoriesData);
      setMenuItems(itemsData);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  return {
    categories,
    menuItems,
    loading,
    error,
    refetch: fetchMenuData,
  };
};
