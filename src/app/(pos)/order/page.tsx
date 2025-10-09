'use client';

import { useState, useEffect } from 'react';
import { 
  Flex, 
  Grid, 
  Card, 
  Button, 
  Text,
  Box,
  TextField,
  Tabs,
  Spinner
} from '@radix-ui/themes';
import { Search, Plus } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMenuData } from '@/hooks/useMenuData';
import { useTaxRate } from '@/hooks/useTaxRate';
import { useOrderCartStore } from '@/stores/orderCartStore';
import { useOrganization } from '@/contexts/OrganizationContext';
import OrderCart from '@/components/pos/OrderCart';
import Image from 'next/image';

export default function OrderEntryPage() {
  usePageTitle('Order Entry');
  const { categories, menuItems, loading } = useMenuData();
  const { currentBranch } = useOrganization();
  const cartStore = useOrderCartStore();
  const { taxRate: _taxRate } = useTaxRate(); // Automatically manage tax rate (prefixed to indicate future use)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Set current branch in cart store
  useEffect(() => {
    if (currentBranch) {
      cartStore.setBranch(currentBranch.id);
    }
  }, [currentBranch, cartStore]);

  const filteredMenuItems = menuItems.filter(item => {
    // Filter by category
    if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
      return false;
    }

    // Filter by search
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Only show active items
    return item.is_active !== false;
  });

  return (
    <Box className="h-screen bg-gray-50">
      <Flex className="h-full">
        {/* Left Panel - Menu Browser */}
        <Box className="flex-1 p-4 overflow-y-auto">
          <Flex direction="column" gap="4">
            {/* Header */}
            <Flex justify="between" align="center">
              <Text size="6" weight="bold">Menu</Text>
              <TextField.Root
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              >
                <TextField.Slot>
                  <Search size={16} />
                </TextField.Slot>
              </TextField.Root>
            </Flex>

            {/* Categories */}
            <Tabs.Root 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
            >
              <Tabs.List>
                <Tabs.Trigger value="all">All Items</Tabs.Trigger>
                {categories.map(category => (
                  <Tabs.Trigger key={category.id} value={category.id}>
                    {category.name}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              <Tabs.Content value={selectedCategory} className="mt-4">
                {loading ? (
                  <Flex justify="center" align="center" className="h-64">
                    <Spinner size="3" />
                  </Flex>
                ) : filteredMenuItems.length === 0 ? (
                  <Text color="gray" align="center">No items found</Text>
                ) : (
                  <Grid columns={{ initial: '1', sm: '2', md: '3', lg: '4' }} gap="4">
                    {filteredMenuItems.map(item => (
                      <Card 
                        key={item.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => cartStore.addItem(item)}
                      >
                        <Flex direction="column" gap="2">
                          {item.image_url && (
                            <Box className="relative h-32 w-full">
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                style={{ objectFit: 'cover' }}
                                className="rounded"
                              />
                            </Box>
                          )}
                          
                          <Box>
                            <Text weight="medium" size="3" className="block">{item.name}</Text>
                            {item.description && (
                              <Text size="2" color="gray" className="block line-clamp-2">
                                {item.description}
                              </Text>
                            )}
                            <Text weight="bold" size="4" className="block mt-2">
                              ${item.base_price.toFixed(2)}
                            </Text>
                          </Box>

                          <Button size="2">
                            <Plus size={14} />
                            Add to Order
                          </Button>
                        </Flex>
                      </Card>
                    ))}
                  </Grid>
                )}
              </Tabs.Content>
            </Tabs.Root>
          </Flex>
        </Box>

        {/* Right Panel - Order Cart */}
        <Box className="w-96 bg-white border-l p-4">
          <OrderCart />
        </Box>
      </Flex>
    </Box>
  );
} 