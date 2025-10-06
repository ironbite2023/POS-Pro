'use client';

import { 
  Card, 
  Flex, 
  Text, 
  Select, 
  TextField,
  Button,
  Box
} from '@radix-ui/themes';
import { Search, Calendar } from 'lucide-react';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface OrderFiltersProps {
  onFilterChange: (filters: {
    search?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    orderType?: string;
    paymentMethod?: string;
  }) => void;
  loading?: boolean;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({ onFilterChange, loading }) => {
  const [filters, setFilters] = useState({
    search: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endDate: new Date(),
    status: 'all',
    orderType: 'all',
    paymentMethod: 'all',
  });

  const handleFilterChange = (key: string, value: string | Date) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      status: 'all',
      orderType: 'all',
      paymentMethod: 'all',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Text size="4" weight="medium">Filters</Text>
          <Button size="1" variant="soft" onClick={resetFilters}>
            Reset
          </Button>
        </Flex>

        <Flex gap="4" wrap="wrap">
          {/* Search */}
          <Box className="flex-1 min-w-64">
            <Text size="2" weight="medium" className="mb-1 block">Search</Text>
            <TextField.Root
              placeholder="Order number, customer name..."
              value={filters.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('search', e.target.value)}
            >
              <TextField.Slot>
                <Search size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          {/* Date Range */}
          <Box>
            <Text size="2" weight="medium" className="mb-1 block">Start Date</Text>
            {/* @ts-ignore - DatePicker type compatibility issue */}
            <DatePicker
              selected={filters.startDate}
              onChange={(date: Date | null) => date && handleFilterChange('startDate', date)}
              selectsStart
              startDate={filters.startDate}
              endDate={filters.endDate}
              className="radix-ui-input px-3 py-2 rounded-md border border-gray-300"
            />
          </Box>

          <Box>
            <Text size="2" weight="medium" className="mb-1 block">End Date</Text>
            {/* @ts-ignore - DatePicker type compatibility issue */}
            <DatePicker
              selected={filters.endDate}
              onChange={(date: Date | null) => date && handleFilterChange('endDate', date)}
              selectsEnd
              startDate={filters.startDate}
              endDate={filters.endDate}
              minDate={filters.startDate}
              className="radix-ui-input px-3 py-2 rounded-md border border-gray-300"
            />
          </Box>

          {/* Status Filter */}
          <Box>
            <Text size="2" weight="medium" className="mb-1 block">Status</Text>
            <Select.Root
              value={filters.status}
              onValueChange={(value: string) => handleFilterChange('status', value)}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">All Statuses</Select.Item>
                <Select.Item value="pending">Pending</Select.Item>
                <Select.Item value="preparing">Preparing</Select.Item>
                <Select.Item value="ready">Ready</Select.Item>
                <Select.Item value="completed">Completed</Select.Item>
                <Select.Item value="cancelled">Cancelled</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Order Type Filter */}
          <Box>
            <Text size="2" weight="medium" className="mb-1 block">Order Type</Text>
            <Select.Root
              value={filters.orderType}
              onValueChange={(value: string) => handleFilterChange('orderType', value)}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">All Types</Select.Item>
                <Select.Item value="dine_in">Dine In</Select.Item>
                <Select.Item value="takeaway">Takeaway</Select.Item>
                <Select.Item value="delivery">Delivery</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>
        </Flex>
      </Flex>
    </Card>
  );
};

export default OrderFilters;
