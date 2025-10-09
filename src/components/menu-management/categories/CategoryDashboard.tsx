import { Box, ReceiptText, TrendingDown, TrendingUp, Utensils } from "lucide-react"
// Removed hardcoded imports - using real data from database services
import { menuService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEffect, useState } from 'react';
import type { Database } from '@/lib/supabase/database.types';

type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];
import MetricCard from "@/components/common/MetricCard"
import { Heading } from "@radix-ui/themes"

export function CategoryDashboard() {
  const { currentOrganization } = useOrganization();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      if (!currentOrganization) return;

      try {
        setLoading(true);
        const [categoriesData, itemsData] = await Promise.all([
          menuService.getCategories(currentOrganization.id),
          menuService.getMenuItems(currentOrganization.id)
        ]);
        
        setCategories(categoriesData);
        setMenuItems(itemsData);
      } catch (error) {
        console.error('Error loading category dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentOrganization]);

  // Calculate statistics
  const totalCategories = categories.length

  // Calculate items per category
  const itemsPerCategory = categories.map(category => ({
    id: category.id,
    name: category.name,
    count: menuItems.filter(item => item.category_id === category.id).length
  }))

  // Find category with most items
  const categoryWithMostItems = itemsPerCategory.reduce((prev, current) => 
    (prev.count > current.count) ? prev : current
  )

  // Find category with least items
  const categoryWithLeastItems = itemsPerCategory.reduce((prev, current) => 
    (prev.count < current.count) ? prev : current
  )

  // Mock data for top and least selling categories (since we don't have actual sales data)
  const topSellingCategory = { name: "Main Course", sales: 1250 }
  const leastSellingCategory = { name: "Beverages", sales: 450 }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Categories"
        value={totalCategories}
        description="Total number of menu categories"
        icon={<ReceiptText size={16} />}
      />
      <MetricCard
        title="Top Selling Category"
        value={topSellingCategory.name}
        description={`${topSellingCategory.sales} sales`}
        icon={<TrendingUp size={16} color="green" />}
        trend="up"
        trendValue="+12%"
      />
      <MetricCard
        title="Least Selling Category"
        value={leastSellingCategory.name}
        description={`${leastSellingCategory.sales} sales`}
        icon={<TrendingDown size={16} color="red" />}
        trend="down"
        trendValue="-5%"
      />
      <MetricCard
        title="Category with Most Items"
        value={categoryWithMostItems.name}
        description={`${categoryWithMostItems.count} items`}
        icon={<Utensils size={16} color="blue" />}
      />
    </div>
  )
} 