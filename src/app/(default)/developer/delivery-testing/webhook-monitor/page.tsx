'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Flex, Text, Button, Box, Badge, Separator, Table } from '@radix-ui/themes';
import { Webhook, RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle, Activity, Shield } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/contexts/AuthContext';
import { useDeveloperRateLimit } from '@/hooks/useDeveloperRateLimit';
import { SanitizedDataDisplay } from '@/components/developer/ProtectedDeveloperPage';
import { auditService, AuditEventType } from '@/lib/services/audit.service';
import { DataSanitizer } from '@/lib/utils/dataSanitizer';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type PlatformEnum = Database['public']['Enums']['platform_enum'];

interface WebhookEvent {
  id: string;
  platform: PlatformEnum;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  retryCount: number;
  processed: boolean;
  errorMessage?: string;
  createdAt: string;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
}

interface QueueMetrics {
  totalItems: number;
  pendingItems: number;
  processedItems: number;
  failedItems: number;
  averageProcessingTime: number;
}

const PLATFORM_NAMES: Record<PlatformEnum, string> = {
  uber_eats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  just_eat: 'Just Eat',
};

export default function WebhookMonitorPage() {
  usePageTitle('Developer Hub - Webhook Monitor');
  const { user, userProfile } = useAuth();
  const { executeWithLimit } = useDeveloperRateLimit('sensitive_data_access');
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadWebhookEvents = useCallback(async () => {
    if (!user || !userProfile) return;

    try {
      // Execute with rate limiting for sensitive data access
      await executeWithLimit(async () => {
        // Log sensitive data access
        await auditService.logDeveloperAction(
          AuditEventType.SENSITIVE_DATA_VIEW,
          user.id,
          user.email || '',
          'webhook_events_access',
          'webhook_processing_queue',
          true,
          {
            access_type: 'webhook_queue_data',
            data_sensitivity: 'high',
          }
        );

        // Load recent webhook events from the queue
        const { data: queueData, error: queueError } = await supabase
          .from('webhook_processing_queue')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (queueError) throw queueError;

        const events: WebhookEvent[] = (queueData || []).map(item => ({
          id: item.id,
          platform: item.platform,
          payload: DataSanitizer.sanitizeWebhookPayload(item.webhook_payload as Record<string, unknown>),
          headers: DataSanitizer.sanitizeWebhookPayload(item.headers as Record<string, unknown>) as Record<string, string>,
          retryCount: item.retry_count,
          processed: item.processed,
          errorMessage: item.error_message || undefined,
          createdAt: item.created_at,
          lastAttemptAt: item.last_attempt_at || undefined,
          nextAttemptAt: item.next_attempt_at
        }));

        setWebhookEvents(events);

        // Calculate metrics
        const totalItems = events.length;
        const pendingItems = events.filter(e => !e.processed && !e.errorMessage).length;
        const processedItems = events.filter(e => e.processed).length;
        const failedItems = events.filter(e => e.errorMessage && e.retryCount >= 5).length;

        setQueueMetrics({
          totalItems,
          pendingItems,
          processedItems,
          failedItems,
          averageProcessingTime: 1200 // Mock value for now
        });
      });

    } catch (error) {
      console.error('Failed to load webhook events:', error);
      toast.error('Failed to load webhook events');
    }
  }, [executeWithLimit, user, userProfile]);

  const retryFailedWebhook = async (eventId: string) => {
    if (!user || !userProfile) return;

    try {
      await executeWithLimit(async () => {
        // Log queue operation
        await auditService.logDeveloperAction(
          AuditEventType.QUEUE_OPERATION,
          user.id,
          user.email || '',
          'webhook_retry',
          'webhook_processing_queue',
          true,
          {
            operation: 'retry_webhook',
            webhook_event_id: eventId,
          }
        );

        // Reset webhook for retry
        const { error } = await supabase
          .from('webhook_processing_queue')
          .update({ 
            retry_count: 0,
            error_message: null,
            next_attempt_at: new Date().toISOString()
          })
          .eq('id', eventId);

        if (error) throw error;

        toast.success('Webhook retry queued');
        loadWebhookEvents();
      });
    } catch (error) {
      console.error('Failed to retry webhook:', error);
      toast.error('Failed to retry webhook');
    }
  };

  const processQueue = async () => {
    if (!user || !userProfile) return;

    try {
      await executeWithLimit(async () => {
        // Log queue processing operation
        await auditService.logDeveloperAction(
          AuditEventType.QUEUE_OPERATION,
          user.id,
          user.email || '',
          'process_queue',
          'webhook_processing_queue',
          true,
          {
            operation: 'manual_queue_processing',
            triggered_by: 'developer_hub',
          }
        );

        // Trigger the process-webhook-queue function
        const { error } = await supabase.functions.invoke('process-webhook-queue');
        
        if (error) throw error;

        toast.success('Queue processing triggered');
        loadWebhookEvents();
      });
    } catch (error) {
      console.error('Failed to process queue:', error);
      toast.error('Failed to process queue');
    }
  };

  useEffect(() => {
    loadWebhookEvents();
    setLoading(false);
  }, [loadWebhookEvents]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadWebhookEvents();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadWebhookEvents]);

  const getStatusColor = (event: WebhookEvent) => {
    if (event.processed) return 'green';
    if (event.errorMessage) return 'red';
    return 'yellow';
  };

  const getStatusIcon = (event: WebhookEvent) => {
    if (event.processed) return <CheckCircle2 size={16} />;
    if (event.errorMessage) return <XCircle size={16} />;
    return <Clock size={16} />;
  };

  const getStatusText = (event: WebhookEvent) => {
    if (event.processed) return 'Processed';
    if (event.errorMessage) return 'Failed';
    return 'Pending';
  };

  if (loading) {
    return (
      <Box className="text-center py-12">
        <Text>Loading webhook monitor...</Text>
      </Box>
    );
  }

  return (
    <Flex direction="column" gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Box>
          <Text size="6" weight="bold">Webhook Monitor</Text>
          <Text size="2" color="gray">
            Real-time webhook event processing and queue monitoring (Secured)
          </Text>
        </Box>
        <Flex gap="2">
          <Button
            variant={autoRefresh ? 'solid' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity size={16} />
            {autoRefresh ? 'Auto Refresh: ON' : 'Auto Refresh: OFF'}
          </Button>
          <Button variant="outline" onClick={loadWebhookEvents}>
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button onClick={processQueue}>
            <Webhook size={16} />
            Process Queue
          </Button>
        </Flex>
      </Flex>

      {/* Queue Metrics */}
      {queueMetrics && (
        <Card>
          <Flex direction="column" gap="4">
            <Text size="4" weight="bold">Queue Metrics</Text>
            
            <Flex gap="6" wrap="wrap">
              <Box>
                <Text size="6" weight="bold" className="block">{queueMetrics.totalItems}</Text>
                <Text size="2" color="gray">Total Events</Text>
              </Box>
              <Box>
                <Text size="6" weight="bold" color="yellow" className="block">{queueMetrics.pendingItems}</Text>
                <Text size="2" color="gray">Pending</Text>
              </Box>
              <Box>
                <Text size="6" weight="bold" color="green" className="block">{queueMetrics.processedItems}</Text>
                <Text size="2" color="gray">Processed</Text>
              </Box>
              <Box>
                <Text size="6" weight="bold" color="red" className="block">{queueMetrics.failedItems}</Text>
                <Text size="2" color="gray">Failed</Text>
              </Box>
              <Box>
                <Text size="6" weight="bold" className="block">{queueMetrics.averageProcessingTime}ms</Text>
                <Text size="2" color="gray">Avg Processing Time</Text>
              </Box>
            </Flex>
          </Flex>
        </Card>
      )}

      <Separator size="4" />

      {/* Webhook Events Table */}
      <Card>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Text size="4" weight="bold">Recent Webhook Events</Text>
            <Badge color="blue" size="1">
              <Flex align="center" gap="1">
                <Shield size={10} />
                Data Sanitized
              </Flex>
            </Badge>
          </Flex>
          
          {webhookEvents.length === 0 ? (
            <Box className="text-center py-8">
              <AlertCircle size={24} className="mx-auto mb-3 text-gray-400" />
              <Text size="3" color="gray">
                No webhook events in queue
              </Text>
              <Text size="2" color="gray">
                Events will appear here when webhooks are received from delivery platforms
              </Text>
            </Box>
          ) : (
            <Box className="overflow-x-auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Platform</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Event Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Retries</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {webhookEvents.map((event) => (
                    <Table.Row key={event.id}>
                      <Table.Cell>
                        <Badge color={getStatusColor(event)}>
                          <Flex align="center" gap="1">
                            {getStatusIcon(event)}
                            {getStatusText(event)}
                          </Flex>
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" weight="medium">
                          {PLATFORM_NAMES[event.platform]}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2">
                          {(event.payload as any)?.event_type || 'Unknown'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color={event.retryCount > 0 ? 'red' : 'gray'}>
                          {event.retryCount}/5
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {new Date(event.createdAt).toLocaleString()}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        {event.errorMessage && event.retryCount < 5 && (
                          <Button
                            size="1"
                            variant="outline"
                            onClick={() => retryFailedWebhook(event.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Flex>
      </Card>

      {/* Event Details for Failed Events */}
      {webhookEvents.some(e => e.errorMessage) && (
        <Card>
          <Flex direction="column" gap="4">
            <Flex justify="between" align="center">
              <Text size="4" weight="bold">Failed Event Details</Text>
              <Badge color="yellow" size="1">
                <Flex align="center" gap="1">
                  <Shield size={10} />
                  Sanitized Data
                </Flex>
              </Badge>
            </Flex>
            
            <Flex direction="column" gap="3">
              {webhookEvents
                .filter(event => event.errorMessage)
                .slice(0, 5) // Show only first 5 failed events
                .map((event) => (
                  <Card key={event.id} variant="surface">
                    <Flex direction="column" gap="3">
                      <Flex justify="between" align="center">
                        <Text size="3" weight="medium">
                          {PLATFORM_NAMES[event.platform]} - {(event.payload as any)?.event_type || 'Unknown'}
                        </Text>
                        <Badge color="red">
                          Failed ({event.retryCount}/5 retries)
                        </Badge>
                      </Flex>
                      
                      {event.errorMessage && (
                        <Box className="bg-red-50 p-3 rounded-md">
                          <Text size="2" color="red" weight="medium" className="mb-1 block">
                            Error:
                          </Text>
                          <Text size="2" color="red">
                            {event.errorMessage}
                          </Text>
                        </Box>
                      )}
                      
                      <SanitizedDataDisplay
                        data={event.payload}
                        title="Webhook Payload (Sanitized)"
                        maxHeight="max-h-32"
                      />
                    </Flex>
                  </Card>
                ))}
            </Flex>
          </Flex>
        </Card>
      )}
    </Flex>
  );
}
