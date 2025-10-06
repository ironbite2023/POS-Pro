'use client';

import { Container, Flex, Heading, Text, Box } from '@radix-ui/themes';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useFilterBranch } from '@/contexts/FilterBranchContext';
import UnifiedOrderCenter from '@/components/delivery/UnifiedOrderCenter';

export default function UnifiedOrdersPage() {
  usePageTitle('Unified Orders - Delivery Platform');
  const { activeBranchFilter } = useFilterBranch();

  return (
    <Container size="4">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Box>
          <Heading size="7">Unified Order Center</Heading>
          <Text size="2" color="gray">
            Manage all delivery platform orders from a single interface
          </Text>
        </Box>

        {/* Unified Order Center */}
        <UnifiedOrderCenter branchId={activeBranchFilter?.id} />
      </Flex>
    </Container>
  );
}
