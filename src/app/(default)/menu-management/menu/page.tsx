'use client';

import { useState, useEffect, Suspense } from 'react';
import { Box, Tabs, Flex, Button, Text } from '@radix-ui/themes';
import { PlusIcon, LayoutDashboard, List } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterBranchProvider, useFilterBranch } from '@/contexts/FilterBranchContext';
import { useAppOrganization } from '@/contexts/AppOrganizationContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import BranchFilterInput from '@/components/common/BranchFilterInput';
// Removed hardcoded organization import - using real organization from context
import MenuDashboard from '@/components/menu-management/menu/MenuDashboard';
import { MenuList } from '@/components/menu-management/menu/MenuList';
import MenuItemForm from '@/components/menu-management/MenuItemForm';
import { PageHeading } from '@/components/common/PageHeading';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMenuData } from '@/hooks/useMenuData';
import { menuService } from '@/lib/services';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

function MenuContent() {
  usePageTitle('Menu Management');
  const { branches } = useOrganization();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const { categories, menuItems, refetch } = useMenuData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [showItemForm, setShowItemForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | undefined>(undefined);
  const { activeBranchFilter, setActiveBranchFilter } = useFilterBranch();
  const { activeEntity } = useAppOrganization();

  // Calculate menu metrics
  const menuMetrics = {
    totalItems: menuItems.length,
    activeItems: menuItems.filter((item) => item.is_active).length,
    inactiveItems: menuItems.filter((item) => !item.is_active).length,
    lowStockItems: 0, // TODO: Implement stock tracking
  };

  // Best-selling items data for chart (placeholder for now)
  const bestSellingItems = menuItems.slice(0, 5).map((item) => ({
    name: item.name,
    sales: 0, // TODO: Add actual sales data
    image: item.image_url || '',
  }));
  
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`?${params.toString()}`);
  };
  
  // Sync filter with global context when global context changes
  useEffect(() => {
    setActiveBranchFilter(activeEntity.id === 'hq' ? null : activeEntity);
  }, [activeEntity, setActiveBranchFilter]);

  // Filtering is now handled inside MenuList component

  const handleAddMenuItem = () => {
    setSelectedItem(undefined);
    setShowItemForm(true);
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setAvailabilityFilter('all');
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item as MenuItem);
    setShowItemForm(true);
  };

  const handleDeleteItem = async (item: any) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      await menuService.deleteMenuItem(item.id);
      toast.success('Menu item deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const handleFormClose = () => {
    setShowItemForm(false);
    setSelectedItem(undefined);
  };

  const handleFormSuccess = () => {
    refetch();
  };

  return (
    <Box>
      <Flex 
        direction={{ initial: "column", sm: "row" }} 
        justify="between" 
        align={{ initial: "stretch", sm: "center" }}
        gap={{ initial: "4", sm: "0" }}
        mb="5"
      >
        <PageHeading title="Menu Management" description="Manage your restaurant menu items" noMarginBottom />
        <Flex 
          direction={{ initial: "column", sm: "row" }} 
          align={{ initial: "stretch", sm: "center" }} 
          gap="4"
          width={{ initial: "full", sm: "auto" }}
        >
          <Box width={{ initial: "full", sm: "auto" }}>
            <BranchFilterInput 
              selectedBranch={activeBranchFilter?.id || ''} 
              setSelectedBranch={(id: string) => {
                const branch = branches.find(b => b.id === id);
                // Preserve the 'tab' query parameter when changing branch filter
                const params = new URLSearchParams(searchParams.toString());
                if (branch) {
                  setActiveBranchFilter(branch as any);
                } else {
                  setActiveBranchFilter(null);
                }
                router.push(`?${params.toString()}`);
              }}
              clearFilter={() => {
                const params = new URLSearchParams(searchParams.toString());
                setActiveBranchFilter(null);
                router.push(`?${params.toString()}`);
              }}
            />
          </Box>
          <Box width={{ initial: "full", sm: "auto" }}>
            <Button onClick={handleAddMenuItem} className="w-full sm:w-auto">
              <PlusIcon size={16} />
              Add Menu Item
            </Button>
          </Box>
        </Flex>
      </Flex>

      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Trigger value="dashboard">
            <Flex gap="2" align="center">
              <LayoutDashboard size={16} />
              <Text>Dashboard</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="list">
            <Flex gap="2" align="center">
              <List size={16} />
              <Text>Menu List</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="dashboard">
          <MenuDashboard
            menuMetrics={menuMetrics}
            bestSellingItems={bestSellingItems}
            menuItems={menuItems as any}
          />
        </Tabs.Content>
        
        <Tabs.Content value="list">
          <MenuList
            items={menuItems}
            categories={categories}
            availableBranches={branches.map(b => ({ id: b.id, name: b.name }))}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            availabilityFilter={availabilityFilter}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onCategoryFilterChange={setCategoryFilter}
            onStatusFilterChange={setStatusFilter}
            onAvailabilityFilterChange={setAvailabilityFilter}
            onResetFilters={handleResetFilters}
          />
        </Tabs.Content>
      </Tabs.Root>

      {/* Menu Item Form Dialog */}
      <MenuItemForm
        menuItem={selectedItem}
        categories={categories}
        open={showItemForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </Box>
  );
}

export default function MenuPage() {
  return (
    <FilterBranchProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <MenuContent />
      </Suspense>
    </FilterBranchProvider>
  );
}