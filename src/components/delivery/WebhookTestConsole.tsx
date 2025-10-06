'use client';

import { useState } from 'react';
import { Card, Flex, Text, Button, Box, Badge, Code, Separator, TextArea } from '@radix-ui/themes';
import { Play, Copy, Check, AlertCircle } from 'lucide-react';
import type { Database } from '@/lib/supabase/database.types';

type PlatformEnum = Database['public']['Enums']['platform_enum'];

interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

interface WebhookTestConsoleProps {
  platform: PlatformEnum;
  webhookUrl: string;
  onTest: () => Promise<WebhookTestResult>;
}

const PLATFORM_NAMES: Record<PlatformEnum, string> = {
  uber_eats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  just_eat: 'Just Eat',
};

const WebhookTestConsole: React.FC<WebhookTestConsoleProps> = ({
  platform,
  webhookUrl,
  onTest,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await onTest();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Box>
          <Text size="4" weight="bold">
            {PLATFORM_NAMES[platform]} Webhook Test
          </Text>
          <Text size="2" color="gray">
            Test the webhook connectivity and authentication
          </Text>
        </Box>

        <Separator size="4" />

        {/* Webhook URL */}
        <Box>
          <Text size="2" weight="medium" className="mb-2 block">
            Webhook URL
          </Text>
          <Flex gap="2" align="center">
            <Box className="flex-1 bg-gray-100 p-3 rounded-md overflow-x-auto">
              <Code size="2">{webhookUrl}</Code>
            </Box>
            <Button
              variant="outline"
              size="2"
              onClick={handleCopyUrl}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </Flex>
        </Box>

        {/* Test Button */}
        <Button
          size="3"
          onClick={handleTest}
          disabled={testing}
        >
          <Play size={16} />
          {testing ? 'Testing...' : 'Run Test'}
        </Button>

        {/* Test Results */}
        {testResult && (
          <>
            <Separator size="4" />
            
            <Box>
              <Flex align="center" gap="2" className="mb-3">
                <Text size="3" weight="medium">Test Results</Text>
                <Badge color={testResult.success ? 'green' : 'red'}>
                  {testResult.success ? 'Success' : 'Failed'}
                </Badge>
              </Flex>

              {/* Status Code */}
              {testResult.statusCode && (
                <Flex align="center" gap="2" className="mb-2">
                  <Text size="2" color="gray">Status Code:</Text>
                  <Badge color={testResult.statusCode < 400 ? 'green' : 'red'}>
                    {testResult.statusCode}
                  </Badge>
                </Flex>
              )}

              {/* Message */}
              <Box className="mb-3">
                <Text size="2" color="gray" className="mb-1 block">
                  Message:
                </Text>
                <Box className={`p-3 rounded-md ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <Text size="2" className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                    {testResult.message}
                  </Text>
                </Box>
              </Box>

              {/* Details */}
              {testResult.details && Object.keys(testResult.details).length > 0 && (
                <Box>
                  <Text size="2" color="gray" className="mb-1 block">
                    Response Details:
                  </Text>
                  <Box className="bg-gray-900 p-3 rounded-md overflow-x-auto">
                    <pre className="text-xs text-white">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  </Box>
                </Box>
              )}

              {/* Timestamp */}
              <Flex align="center" gap="1" className="mt-3">
                <Text size="1" color="gray">
                  Tested at: {new Date(testResult.timestamp).toLocaleString()}
                </Text>
              </Flex>
            </Box>
          </>
        )}

        <Separator size="4" />

        {/* Help Text */}
        <Box className="bg-blue-50 p-3 rounded-md">
          <Flex gap="2">
            <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <Box>
              <Text size="2" weight="medium" className="text-blue-900 block mb-1">
                Testing Instructions
              </Text>
              <Text size="1" className="text-blue-700">
                This test will verify your {PLATFORM_NAMES[platform]} API credentials and webhook configuration.
                Make sure your credentials are correctly entered before testing.
              </Text>
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
};

export default WebhookTestConsole;
