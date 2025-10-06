'use client';

import { useState } from 'react';
import { Card, Flex, Text, TextField, Button, Box, Select, Separator } from '@radix-ui/themes';
import { Eye, EyeOff, Key, Building2 } from 'lucide-react';
import type { Database } from '@/lib/supabase/database.types';

type PlatformEnum = Database['public']['Enums']['platform_enum'];

interface PlatformCredentialsFormProps {
  platform: PlatformEnum;
  initialValues?: {
    platform_restaurant_id: string;
    credentials: {
      client_id?: string;
      client_secret?: string;
      api_token?: string;
      store_id?: string;
      restaurant_id?: string;
    };
    settings?: {
      auto_accept_orders?: boolean;
      notification_webhook?: string;
    };
  };
  onSubmit: (data: {
    platform_restaurant_id: string;
    credentials: Record<string, string>;
    settings: Record<string, unknown>;
  }) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const PLATFORM_CONFIGS: Record<PlatformEnum, {
  name: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password';
    required: boolean;
    placeholder: string;
    helpText?: string;
  }>;
}> = {
  uber_eats: {
    name: 'Uber Eats',
    fields: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'password',
        required: true,
        placeholder: 'Enter your Uber Eats Client ID',
        helpText: 'Found in the Uber Eats Developer Portal',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        placeholder: 'Enter your Uber Eats Client Secret',
        helpText: 'Keep this secure and never share it - also used for webhook verification',
      },
      {
        key: 'store_id',
        label: 'Store ID',
        type: 'text',
        required: true,
        placeholder: 'Enter your Store ID',
        helpText: 'Your unique Uber Eats store identifier',
      },
    ],
  },
  deliveroo: {
    name: 'Deliveroo',
    fields: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'password',
        required: true,
        placeholder: 'Enter your Deliveroo Client ID',
        helpText: 'OAuth Client ID from Deliveroo Developer Portal',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        placeholder: 'Enter your Deliveroo Client Secret',
        helpText: 'OAuth Client Secret for API access',
      },
      {
        key: 'webhook_secret',
        label: 'Webhook Secret',
        type: 'password',
        required: true,
        placeholder: 'Enter your Deliveroo Webhook Secret',
        helpText: 'Separate webhook signing secret from Deliveroo portal',
      },
      {
        key: 'restaurant_id',
        label: 'Restaurant ID',
        type: 'text',
        required: true,
        placeholder: 'Enter your Restaurant ID',
        helpText: 'Your unique Deliveroo restaurant identifier',
      },
    ],
  },
  just_eat: {
    name: 'Just Eat',
    fields: [
      {
        key: 'api_token',
        label: 'API Token',
        type: 'password',
        required: true,
        placeholder: 'Enter your Just Eat API Token',
        helpText: 'Bearer token from your Just Eat Partner Centre',
      },
      {
        key: 'webhook_secret',
        label: 'Webhook Secret',
        type: 'password',
        required: true,
        placeholder: 'Enter your Just Eat Webhook Secret',
        helpText: 'Webhook signing secret from Just Eat partner portal',
      },
      {
        key: 'restaurant_id',
        label: 'Restaurant ID',
        type: 'text',
        required: true,
        placeholder: 'Enter your Restaurant ID',
        helpText: 'Your unique Just Eat restaurant identifier',
      },
    ],
  },
};

const PlatformCredentialsForm: React.FC<PlatformCredentialsFormProps> = ({
  platform,
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const config = PLATFORM_CONFIGS[platform];
  
  const [formData, setFormData] = useState({
    platform_restaurant_id: initialValues?.platform_restaurant_id || '',
    credentials: initialValues?.credentials || {},
    settings: {
      auto_accept_orders: initialValues?.settings?.auto_accept_orders ?? false,
      notification_webhook: initialValues?.settings?.notification_webhook || '',
    },
  });

  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const handleCredentialChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value,
      },
    }));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPassword(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      platform_restaurant_id: formData.platform_restaurant_id,
      credentials: formData.credentials,
      settings: formData.settings,
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="4">
          <Box>
            <Text size="5" weight="bold">{config.name} Integration</Text>
            <Text size="2" color="gray">
              Configure your {config.name} API credentials
            </Text>
          </Box>

          <Separator size="4" />

          {/* Platform Restaurant ID */}
          <Box>
            <label htmlFor="platform_restaurant_id">
              <Text size="2" weight="medium" className="mb-1 block">
                Platform Restaurant ID *
              </Text>
            </label>
            <TextField.Root
              id="platform_restaurant_id"
              placeholder="Enter your restaurant ID on the platform"
              value={formData.platform_restaurant_id}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setFormData(prev => ({ ...prev, platform_restaurant_id: e.target.value }))
              }
              required
            >
              <TextField.Slot>
                <Building2 size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          <Separator size="4" />

          {/* Platform-Specific Credentials */}
          <Box>
            <Text size="3" weight="medium" className="mb-3 block">
              API Credentials
            </Text>
            
            <Flex direction="column" gap="3">
              {config.fields.map(field => (
                <Box key={field.key}>
                  <label htmlFor={field.key}>
                    <Text size="2" weight="medium" className="mb-1 block">
                      {field.label} {field.required && '*'}
                    </Text>
                  </label>
                  
                  <TextField.Root
                    id={field.key}
                    type={
                      field.type === 'password' && !showPassword[field.key]
                        ? 'password'
                        : 'text'
                    }
                    placeholder={field.placeholder}
                    value={(formData.credentials as Record<string, string>)[field.key] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleCredentialChange(field.key, e.target.value)
                    }
                    required={field.required}
                  >
                    <TextField.Slot>
                      <Key size={16} />
                    </TextField.Slot>
                    {field.type === 'password' && (
                      <TextField.Slot side="right">
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(field.key)}
                          className="cursor-pointer"
                        >
                          {showPassword[field.key] ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </TextField.Slot>
                    )}
                  </TextField.Root>
                  
                  {field.helpText && (
                    <Text size="1" color="gray" className="mt-1 block">
                      {field.helpText}
                    </Text>
                  )}
                </Box>
              ))}
            </Flex>
          </Box>

          <Separator size="4" />

          {/* Settings */}
          <Box>
            <Text size="3" weight="medium" className="mb-3 block">
              Settings
            </Text>
            
            <Flex direction="column" gap="3">
              <Flex align="center" justify="between">
                <Box>
                  <Text size="2" weight="medium">Auto-accept orders</Text>
                  <Text size="1" color="gray" className="block">
                    Automatically accept new orders from this platform
                  </Text>
                </Box>
                <Select.Root
                  value={formData.settings.auto_accept_orders ? 'true' : 'false'}
                  onValueChange={(value: string) =>
                    setFormData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        auto_accept_orders: value === 'true',
                      },
                    }))
                  }
                >
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="true">Enabled</Select.Item>
                    <Select.Item value="false">Disabled</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Flex>
            </Flex>
          </Box>

          <Separator size="4" />

          {/* Actions */}
          <Flex gap="2" justify="end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Card>
  );
};

export default PlatformCredentialsForm;
