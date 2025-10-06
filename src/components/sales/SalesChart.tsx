// @ts-nocheck - Recharts type compatibility issues with React 19
'use client';
import { 
  Card, 
  Heading, 
  Text, 
  Flex, 
  Box,
  Select 
} from '@radix-ui/themes';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useState } from 'react';

interface SalesChartProps {
  data: Array<{
    date?: string;
    hour?: string;
    revenue: number;
    orders: number;
  }>;
  title: string;
  type?: 'line' | 'bar';
  loading?: boolean;
}

const SalesChart: React.FC<SalesChartProps> = ({ 
  data, 
  title, 
  type = 'line', 
  loading = false 
}) => {
  const [chartType, setChartType] = useState(type);

  if (loading) {
    return (
      <Card>
        <Box className="h-80 flex items-center justify-center">
          <Text color="gray">Loading chart data...</Text>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Flex justify="between" align="center" className="mb-4">
        <Heading size="4">{title}</Heading>
        <Select.Root value={chartType} onValueChange={(value: 'line' | 'bar') => setChartType(value)}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="line">Line Chart</Select.Item>
            <Select.Item value="bar">Bar Chart</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      <Box className="h-80">
        {/* @ts-ignore - ResponsiveContainer type compatibility issue */}
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={data[0]?.date ? 'date' : 'hour'} 
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? `$${value.toFixed(2)}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="revenue"
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="orders"
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={data[0]?.date ? 'date' : 'hour'} 
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? `$${value.toFixed(2)}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Bar dataKey="revenue" fill="#8884d8" name="revenue" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Card>
  );
};

export default SalesChart;
