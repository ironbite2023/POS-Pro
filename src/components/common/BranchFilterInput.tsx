import { Flex, Select, Text, Button } from '@radix-ui/themes';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Store, X } from 'lucide-react';

interface BranchFilterInputProps {
  selectedBranch: string | null;
  setSelectedBranch: (id: string | null) => void;
  clearFilter: () => void;
}

export default function BranchFilterInput({ selectedBranch, setSelectedBranch, clearFilter }: BranchFilterInputProps) {
  const { branches } = useOrganization();

  return (
    <Flex align="center" gap="2">
      <Text size="2">Filter by branch:</Text>
      <Select.Root 
        value={selectedBranch || ""} 
        onValueChange={setSelectedBranch}
      >
        <Select.Trigger placeholder="Select Branch" variant="soft" />
        <Select.Content>
          {branches.map((branch) => (
            <Select.Item key={branch.id} value={branch.id}>
              <Flex align="center" gap="2"> 
                <Store size={14} />
                {branch.name}
              </Flex>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      {selectedBranch && (
        <Button variant="outline" onClick={clearFilter} ml="1">
          <X size={14} />
          Clear
        </Button>
      )}
    </Flex>
  );
}