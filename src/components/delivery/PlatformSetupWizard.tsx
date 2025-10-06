'use client';

import { useState } from 'react';
import { Card, Flex, Text, Button, Box, Badge, Separator, Progress } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight, CheckCircle, Circle } from 'lucide-react';
import PlatformCredentialsForm from './PlatformCredentialsForm';
import WebhookTestConsole from './WebhookTestConsole';
import { deliveryPlatformService } from '@/lib/services/delivery-platform.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type PlatformEnum = Database['public']['Enums']['platform_enum'];

interface PlatformSetupWizardProps {
  platform: PlatformEnum;
  existingIntegration?: {
    id: string;
    platform_restaurant_id: string;
    credentials: Record<string, unknown>;
    settings?: Record<string, unknown>;
  };
  onComplete?: () => void;
  onCancel?: () => void;
}

const PLATFORM_NAMES: Record<PlatformEnum, string> = {
  uber_eats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  just_eat: 'Just Eat',
};

const STEPS = [
  { id: 1, title: 'Platform Selection', description: 'Choose your delivery platform' },
  { id: 2, title: 'Credentials', description: 'Enter your API credentials' },
  { id: 3, title: 'Test Connection', description: 'Verify the integration' },
  { id: 4, title: 'Complete', description: 'Finish setup' },
];

const PlatformSetupWizard: React.FC<PlatformSetupWizardProps> = ({
  platform,
  existingIntegration,
  onComplete,
  onCancel,
}) => {
  const { currentOrganization } = useOrganization();
  const [currentStep, setCurrentStep] = useState(existingIntegration ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [integrationData, setIntegrationData] = useState<{
    platform_restaurant_id: string;
    credentials: Record<string, string>;
    settings: Record<string, unknown>;
  } | null>(
    existingIntegration
      ? {
          platform_restaurant_id: existingIntegration.platform_restaurant_id,
          credentials: existingIntegration.credentials as Record<string, string>,
          settings: existingIntegration.settings || {},
        }
      : null
  );
  const [webhookUrl, setWebhookUrl] = useState('');
  const [integrationId, setIntegrationId] = useState<string>('');
  const [testPassed, setTestPassed] = useState(false);

  const handleCredentialsSubmit = async (data: {
    platform_restaurant_id: string;
    credentials: Record<string, string>;
    settings: Record<string, unknown>;
  }) => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected');
      return;
    }

    setLoading(true);
    try {
      const result = await deliveryPlatformService.upsertPlatformIntegration({
        organization_id: currentOrganization.id,
        platform,
        platform_restaurant_id: data.platform_restaurant_id,
        credentials: data.credentials as any,
        settings: data.settings,
      });

      if (result.success && result.data) {
        setIntegrationData(data);
        setWebhookUrl(result.data.webhook_url || '');
        setIntegrationId(result.data.id);
        toast.success('Credentials saved successfully');
        setCurrentStep(3);
      } else {
        throw new Error(result.error || 'Failed to save credentials');
      }
    } catch (error) {
      console.error('Failed to save credentials:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!integrationId || !integrationData) return { success: false, message: 'No integration data', timestamp: new Date().toISOString() };

    try {
      const result = await deliveryPlatformService.testPlatformConnection(integrationId);

      if (result.success && result.data) {
        setTestPassed(true);
        return {
          success: true,
          statusCode: 200,
          message: result.data.message || 'Connection successful',
          details: (result.data.details || {}) as Record<string, unknown>,
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          statusCode: 500,
          message: result.error || 'Connection test failed',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: new Date().toISOString(),
      };
    }
  };

  const handleActivateIntegration = async () => {
    if (!integrationId) return;

    setLoading(true);
    try {
      const result = await deliveryPlatformService.togglePlatformActive(integrationId, true);

      if (result.success) {
        toast.success(`${PLATFORM_NAMES[platform]} integration activated`);
        setCurrentStep(4);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to activate integration:', error);
      toast.error('Failed to activate integration');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Box>
            <Text size="4" weight="bold" className="mb-4 block">
              Select Delivery Platform
            </Text>
            <Card variant="surface" className="mb-4">
              <Flex direction="column" gap="3">
                <Text size="3" weight="medium">{PLATFORM_NAMES[platform]}</Text>
                <Text size="2" color="gray">
                  You are setting up integration with {PLATFORM_NAMES[platform]}.
                  Make sure you have your API credentials ready before proceeding.
                </Text>
              </Flex>
            </Card>
            <Button size="3" onClick={() => setCurrentStep(2)}>
              Continue
              <ChevronRight size={16} />
            </Button>
          </Box>
        );

      case 2:
        return (
          <PlatformCredentialsForm
            platform={platform}
            initialValues={
              integrationData
                ? {
                    platform_restaurant_id: integrationData.platform_restaurant_id,
                    credentials: integrationData.credentials as Record<string, string>,
                    settings: integrationData.settings,
                  }
                : undefined
            }
            onSubmit={handleCredentialsSubmit}
            onCancel={() => setCurrentStep(1)}
            loading={loading}
          />
        );

      case 3:
        return (
          <Box>
            <WebhookTestConsole
              platform={platform}
              webhookUrl={webhookUrl}
              onTest={handleTestConnection}
            />
            <Flex gap="2" justify="end" className="mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                disabled={loading}
              >
                <ChevronLeft size={16} />
                Back
              </Button>
              <Button
                onClick={handleActivateIntegration}
                disabled={!testPassed || loading}
              >
                {loading ? 'Activating...' : 'Activate Integration'}
                <ChevronRight size={16} />
              </Button>
            </Flex>
          </Box>
        );

      case 4:
        return (
          <Box className="text-center py-8">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <Text size="6" weight="bold" className="mb-2 block">
              Setup Complete!
            </Text>
            <Text size="3" color="gray" className="mb-6 block">
              Your {PLATFORM_NAMES[platform]} integration is now active and ready to receive orders.
            </Text>
            <Button size="3" onClick={onComplete}>
              Go to Dashboard
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Progress Bar */}
      <Card className="mb-6">
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Text size="5" weight="bold">
              {PLATFORM_NAMES[platform]} Setup
            </Text>
            {onCancel && currentStep < 4 && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Flex>

          <Box>
            <Flex justify="between" className="mb-2">
              <Text size="2" color="gray">
                Step {currentStep} of {STEPS.length}
              </Text>
              <Text size="2" color="gray">
                {Math.round((currentStep / STEPS.length) * 100)}% Complete
              </Text>
            </Flex>
            <Progress value={(currentStep / STEPS.length) * 100} />
          </Box>

          {/* Steps */}
          <Flex gap="2" wrap="wrap">
            {STEPS.map((step) => (
              <Flex key={step.id} align="center" gap="2" className="flex-1 min-w-32">
                {currentStep > step.id ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : currentStep === step.id ? (
                  <Circle size={20} className="text-blue-500 fill-blue-500" />
                ) : (
                  <Circle size={20} className="text-gray-300" />
                )}
                <Box>
                  <Text size="2" weight={currentStep === step.id ? 'bold' : 'regular'}>
                    {step.title}
                  </Text>
                  <Text size="1" color="gray" className="block">
                    {step.description}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Card>

      {/* Step Content */}
      {renderStepContent()}
    </Box>
  );
};

export default PlatformSetupWizard;
