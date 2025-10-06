'use client';

import { useEffect, useState } from 'react';
import { 
  Card, 
  Flex, 
  Heading, 
  Text, 
  Badge,
  Button,
  Box 
} from '@radix-ui/themes';
import { AlertTriangle, Package } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { inventoryService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type BranchInventory = Database['public']['Tables']['branch_inventory']['Row'] & {
  inventory_item?: Database['public']['Tables']['inventory_items']['Row'];
};

export default function LowStockAlerts() {
  const { currentOrganization, currentBranch } = useOrganization();
  const [lowStockItems, setLowStockItems] = useState<BranchInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization || !currentBranch) {
      setLoading(false);
      return;
    }

    const fetchLowStockItems = async () => {
      try {
        setLoading(true);
        const items = await inventoryService.getLowStockItems(currentBranch.id);
        setLowStockItems(items);
      } catch (error) {
        console.error('Error fetching low stock items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockItems();
  }, [currentOrganization, currentBranch]);

  if (loading || lowStockItems.length === 0) {
    return null;
  }

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Flex align="center" gap="2">
          <AlertTriangle size={20} color="orange" />
          <Heading size="4" color="orange">Low Stock Alerts</Heading>
          <Badge color="orange" variant="soft" className="ml-2">
            {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'}
          </Badge>
        </Flex>

        <Flex direction="column" gap="2">
          {lowStockItems.map((item) => (
            <Flex 
              key={item.id} 
              justify="between" 
              align="center" 
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Flex align="center" gap="3">
                <Package size={16} className="text-gray-500" />
                <Box>
                  <Text weight="medium" className="block">
                    {item.inventory_item?.name || 'Unknown Item'}
                  </Text>
                  <Text size="1" color="gray" className="block mt-1">
                    Current: {item.current_quantity || 0} units | 
                    Reorder at: {item.reorder_point || 0} units
                  </Text>
                </Box>
              </Flex>
              <Badge color="orange" variant="soft">Low Stock</Badge>
            </Flex>
          ))}
        </Flex>

        <Button size="2" variant="soft" color="orange">
          Create Purchase Order
        </Button>
      </Flex>
    </Card>
  );
}
