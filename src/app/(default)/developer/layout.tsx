import { Separator, Container, Flex, Text, Box } from '@radix-ui/themes';
import { Code2, Database, Webhook, Activity, TestTube } from 'lucide-react';
import Link from 'next/link';
import { ProtectedDeveloperPage } from '@/components/developer/ProtectedDeveloperPage';

interface DeveloperLayoutProps {
  children: React.ReactNode;
}

export default function DeveloperLayout({ children }: DeveloperLayoutProps) {
  return (
    <ProtectedDeveloperPage 
      operation="general_access" 
      context="developer_layout"
      requireSystemAccess={false}
    >
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Header */}
          <Box>
            <Flex align="center" gap="2" className="mb-2">
              <Code2 size={24} />
              <Text size="7" weight="bold">
                Developer Hub
              </Text>
            </Flex>
            <Text size="2" color="gray">
              Secure testing, monitoring, and debugging tools for delivery platform integrations
            </Text>
          </Box>

          <Separator size="4" />

          {/* Quick Navigation */}
          <Box className="bg-gray-50 p-4 rounded-lg">
            <Text size="3" weight="medium" className="mb-3 block">
              Quick Access
            </Text>
            <Flex gap="4" wrap="wrap">
              <Link href="/developer">
                <Flex align="center" gap="2" className="px-3 py-2 bg-white rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                  <Database size={16} />
                  <Text size="2">Infrastructure Status</Text>
                </Flex>
              </Link>
              <Link href="/developer/delivery-testing/webhook-monitor">
                <Flex align="center" gap="2" className="px-3 py-2 bg-white rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                  <Webhook size={16} />
                  <Text size="2">Webhook Monitor</Text>
                </Flex>
              </Link>
              <Link href="/developer/delivery-testing/queue-manager">
                <Flex align="center" gap="2" className="px-3 py-2 bg-white rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                  <Activity size={16} />
                  <Text size="2">Queue Manager</Text>
                </Flex>
              </Link>
              <Link href="/developer/delivery-testing/integration-validator">
                <Flex align="center" gap="2" className="px-3 py-2 bg-white rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                  <TestTube size={16} />
                  <Text size="2">Integration Tests</Text>
                </Flex>
              </Link>
            </Flex>
          </Box>

          {/* Main Content */}
          <Box>
            {children}
          </Box>
        </Flex>
      </Container>
    </ProtectedDeveloperPage>
  );
}
