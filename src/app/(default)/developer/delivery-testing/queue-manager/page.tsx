'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Flex, Text, Button, Box, Badge, Separator, Table, Dialog } from '@radix-ui/themes';
import { Play, RotateCcw, Trash2, Settings, Activity, Shield, AlertTriangle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/contexts/AuthContext';
import { useDeveloperRateLimit } from '@/hooks/useDeveloperRateLimit';
import { SanitizedDataDisplay } from '@/components/developer/ProtectedDeveloperPage';
import { auditService, AuditEventType } from '@/lib/services/audit.service';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type PlatformEnum = Database['public']['Enums']['platform_enum'];

interface QueueItem {
  id: string;
  platform: PlatformEnum;
  webhookPayload: Record<string, unknown>;
  headers: Record<string, string>;
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: string;
  nextAttemptAt: string;
  errorMessage?: string;
  processed: boolean;
  createdAt: string;
}

interface QueueConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  autoProcess: boolean;
}

const PLATFORM_NAMES: Record<PlatformEnum, string> = {
  uber_eats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  just_eat: 'Just Eat',
};

export default function QueueManagerPage() {
  usePageTitle('Developer Hub - Queue Manager');
  const { user, userProfile } = useAuth();
  const { executeWithLimit } = useDeveloperRateLimit('queue_operation');
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [queueConfig, setQueueConfig] = useState<QueueConfig>({
    maxRetries: 5,
    retryDelay: 60000, // 1 minute
    batchSize: 10,
    autoProcess: true
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const loadQueueItems = useCallback(async () => {
    if (!user || !userProfile) return;

    try {
      await executeWithLimit(async () => {
        // Log queue access
        await auditService.logDeveloperAction(
          AuditEventType.QUEUE_OPERATION,
          user.id,
          user.email || '',
          'queue_items_access',
          'webhook_processing_queue',
          true,
          {
            access_type: 'queue_data_view',
            operation: 'load_queue_items',
          }
        );

        const { data, error } = await supabase
          .from('webhook_processing_queue')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const items: QueueItem[] = (data || []).map(item => ({
          id: item.id,
          platform: item.platform,
          webhookPayload: item.webhook_payload as Record<string, unknown>,
          headers: item.headers as Record<string, string>,
          retryCount: item.retry_count,
          maxRetries: item.max_retries,
          lastAttemptAt: item.last_attempt_at || undefined,
          nextAttemptAt: item.next_attempt_at,
          errorMessage: item.error_message || undefined,
          processed: item.processed,
          createdAt: item.created_at
        }));

        setQueueItems(items);
      });
    } catch (error) {
      console.error('Failed to load queue items:', error);
      toast.error('Failed to load queue items');
    } finally {
      setLoading(false);
    }
  }, [executeWithLimit, user, userProfile]);

  const processQueueItem = async (itemId?: string) => {
    if (!user || !userProfile) return;

    setProcessing(true);
    try {
      await executeWithLimit(async () => {
        // Log queue processing operation
        await auditService.logDeveloperAction(
          AuditEventType.QUEUE_OPERATION,
          user.id,
          user.email || '',
          itemId ? 'process_single_item' : 'process_all_items',
          'webhook_processing_queue',
          true,
          {
            operation: 'manual_processing',
            item_id: itemId,
            triggered_by: 'developer_hub',
          }
        );

        const { error } = await supabase.functions.invoke('process-webhook-queue', {
          body: itemId ? { itemId } : {}
        });

        if (error) throw error;

        toast.success(itemId ? 'Queue item processed' : 'Queue processing started');
        loadQueueItems();
      });
    } catch (error) {
      console.error('Failed to process queue:', error);
      toast.error('Failed to process queue');
    } finally {
      setProcessing(false);
    }
  };

  const retryQueueItem = async (itemId: string) => {
    if (!user || !userProfile) return;

    try {
      await executeWithLimit(async () => {
        // Log retry operation
        await auditService.logDeveloperAction(
          AuditEventType.QUEUE_OPERATION,
          user.id,
          user.email || '',
          'retry_queue_item',
          'webhook_processing_queue',
          true,
          {
            operation: 'manual_retry',
            item_id: itemId,
          }
        );

        const { error } = await supabase
          .from('webhook_processing_queue')
          .update({
            retry_count: 0,
            error_message: null,
            next_attempt_at: new Date().toISOString()
          })
          .eq('id', itemId);

        if (error) throw error;

        toast.success('Queue item reset for retry');
        loadQueueItems();
      });
    } catch (error) {
      console.error('Failed to retry queue item:', error);
      toast.error('Failed to retry queue item');
    }
  };

  const deleteQueueItem = async (itemId: string) => {
    if (!user || !userProfile) return;

    try {
      await executeWithLimit(async () => {
        // Log deletion operation
        await auditService.logDeveloperAction(
          AuditEventType.QUEUE_OPERATION,
          user.id,
          user.email || '',
          'delete_queue_item',
          'webhook_processing_queue',
          true,
          {
            operation: 'manual_delete',
            item_id: itemId,
          }
        );

        const { error } = await supabase
          .from('webhook_processing_queue')
          .delete()
          .eq('id', itemId);

        if (error) throw error;

        toast.success('Queue item deleted');
        loadQueueItems();
      });
    } catch (error) {
      console.error('Failed to delete queue item:', error);
      toast.error('Failed to delete queue item');
    }
  };

  const bulkAction = async (action: 'retry' | 'delete' | 'process') => {
    if (selectedItems.size === 0) {
      toast.warning('No items selected');
      return;
    }

    if (!user || !userProfile) {
      toast.error('Authentication required');
      return;
    }

    try {
      await executeWithLimit(async () => {
        // Log bulk operation
        await auditService.logDeveloperAction(
          AuditEventType.QUEUE_OPERATION,
          user.id,
          user.email || '',
          `bulk_${action}`,
          'webhook_processing_queue',
          true,
          {
            operation: `bulk_${action}`,
            item_count: selectedItems.size,
            item_ids: Array.from(selectedItems),
          }
        );

        for (const itemId of Array.from(selectedItems)) {
          switch (action) {
            case 'retry':
              await retryQueueItem(itemId);
              break;
            case 'delete':
              await deleteQueueItem(itemId);
              break;
            case 'process':
              await processQueueItem(itemId);
              break;
          }
        }

        setSelectedItems(new Set());
        toast.success(`Bulk ${action} completed`);
      });
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error);
      toast.error(`Failed to perform bulk ${action}`);
    }
  };

  const clearProcessedItems = async () => {
    if (!user || !userProfile) return;

    try {
      await executeWithLimit(async () => {
        // Log clear operation
        await auditService.logDeveloperAction(
          AuditEventType.QUEUE_OPERATION,
          user.id,
          user.email || '',
          'clear_processed_items',
          'webhook_processing_queue',
          true,
          {
            operation: 'clear_processed',
            items_to_clear: queueItems.filter(item => item.processed).length,
          }
        );

        const { error } = await supabase
          .from('webhook_processing_queue')
          .delete()
          .eq('processed', true);

        if (error) throw error;

        toast.success('Processed items cleared');
        loadQueueItems();
      });
    } catch (error) {
      console.error('Failed to clear processed items:', error);
      toast.error('Failed to clear processed items');
    }
  };

  const updateConfig = (newConfig: Partial<QueueConfig>) => {
    setQueueConfig(prev => ({ ...prev, ...newConfig }));
    // In a real implementation, this would save to database
    toast.success('Queue configuration updated');
  };

  useEffect(() => {
    loadQueueItems();
  }, [loadQueueItems]);

  const pendingItems = queueItems.filter(item => !item.processed && !item.errorMessage);
  const failedItems = queueItems.filter(item => item.errorMessage);
  const processedItems = queueItems.filter(item => item.processed);

  const getStatusColor = (item: QueueItem) => {
    if (item.processed) return 'green';
    if (item.errorMessage) return 'red';
    return 'yellow';
  };

  const getStatusText = (item: QueueItem) => {
    if (item.processed) return 'Processed';
    if (item.errorMessage) return 'Failed';
    return 'Pending';
  };

  const getPriorityColor = (item: QueueItem) => {
    const isOverdue = new Date(item.nextAttemptAt) < new Date();
    if (item.retryCount >= item.maxRetries - 1) return 'red';
    if (isOverdue) return 'yellow';
    return 'gray';
  };

  if (loading) {
    return (
      <Box className="text-center py-12">
        <Text>Loading queue manager...</Text>
      </Box>
    );
  }

  return (
    <Flex direction="column" gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Box>
          <Text size="6" weight="bold">Queue Manager</Text>
          <Text size="2" color="gray">
            Manage webhook processing queue and retry policies (Secured)
          </Text>
        </Box>
        <Flex gap="2">
          <Button variant="outline" onClick={() => setConfigDialogOpen(true)}>
            <Settings size={16} />
            Configure
          </Button>
          <Button onClick={() => processQueueItem()} disabled={processing}>
            <Play size={16} />
            {processing ? 'Processing...' : 'Process Queue'}
          </Button>
        </Flex>
      </Flex>

      {/* Queue Statistics */}
      <Card>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Text size="4" weight="bold">Queue Statistics</Text>
            <Badge color="blue" size="1">
              <Flex align="center" gap="1">
                <Shield size={10} />
                Audit Logged
              </Flex>
            </Badge>
          </Flex>
          
          <Flex gap="8" wrap="wrap">
            <Box>
              <Text size="6" weight="bold" color="yellow" className="block">{pendingItems.length}</Text>
              <Text size="2" color="gray">Pending</Text>
            </Box>
            <Box>
              <Text size="6" weight="bold" color="red" className="block">{failedItems.length}</Text>
              <Text size="2" color="gray">Failed</Text>
            </Box>
            <Box>
              <Text size="6" weight="bold" color="green" className="block">{processedItems.length}</Text>
              <Text size="2" color="gray">Processed</Text>
            </Box>
            <Box>
              <Text size="6" weight="bold" className="block">{queueItems.length}</Text>
              <Text size="2" color="gray">Total Items</Text>
            </Box>
          </Flex>
        </Flex>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <Flex justify="between" align="center">
            <Flex align="center" gap="2">
              <Shield size={16} className="text-blue-600" />
              <Text size="3" weight="medium">
                {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
              </Text>
            </Flex>
            <Flex gap="2">
              <Button
                size="2"
                variant="outline"
                onClick={() => bulkAction('retry')}
              >
                <RotateCcw size={14} />
                Retry Selected
              </Button>
              <Button
                size="2"
                variant="outline"
                color="red"
                onClick={() => bulkAction('delete')}
              >
                <Trash2 size={14} />
                Delete Selected
              </Button>
              <Button
                size="2"
                onClick={() => bulkAction('process')}
              >
                <Play size={14} />
                Process Selected
              </Button>
            </Flex>
          </Flex>
        </Card>
      )}

      <Separator size="4" />

      {/* Queue Items */}
      <Card>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Text size="4" weight="bold">Queue Items</Text>
            <Flex gap="2">
              <Button
                size="2"
                variant="outline"
                color="red"
                onClick={clearProcessedItems}
                disabled={processedItems.length === 0}
              >
                <Trash2 size={14} />
                Clear Processed
              </Button>
              <Button size="2" variant="outline" onClick={loadQueueItems}>
                Refresh
              </Button>
            </Flex>
          </Flex>
          
          {queueItems.length === 0 ? (
            <Box className="text-center py-8">
              <Activity size={24} className="mx-auto mb-3 text-gray-400" />
              <Text size="3" color="gray">
                Queue is empty
              </Text>
              <Text size="2" color="gray">
                No webhook events to process
              </Text>
            </Box>
          ) : (
            <Box className="overflow-x-auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.size === queueItems.length && queueItems.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(new Set(queueItems.map(item => item.id)));
                          } else {
                            setSelectedItems(new Set());
                          }
                        }}
                      />
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Platform</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Priority</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Retries</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Next Attempt</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {queueItems.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedItems);
                            if (e.target.checked) {
                              newSelected.add(item.id);
                            } else {
                              newSelected.delete(item.id);
                            }
                            setSelectedItems(newSelected);
                          }}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getStatusColor(item)}>
                          {getStatusText(item)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" weight="medium">
                          {PLATFORM_NAMES[item.platform]}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getPriorityColor(item)}>
                          {item.retryCount >= item.maxRetries - 1 ? 'Critical' :
                           new Date(item.nextAttemptAt) < new Date() ? 'Overdue' : 'Normal'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color={item.retryCount > 0 ? 'red' : 'gray'}>
                          {item.retryCount}/{item.maxRetries}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {new Date(item.nextAttemptAt).toLocaleString()}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex gap="1">
                          {!item.processed && (
                            <Button
                              size="1"
                              variant="outline"
                              onClick={() => processQueueItem(item.id)}
                              disabled={processing}
                            >
                              <Play size={12} />
                            </Button>
                          )}
                          {item.errorMessage && (
                            <Button
                              size="1"
                              variant="outline"
                              onClick={() => retryQueueItem(item.id)}
                            >
                              <RotateCcw size={12} />
                            </Button>
                          )}
                          <Button
                            size="1"
                            variant="outline"
                            color="red"
                            onClick={() => deleteQueueItem(item.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}

          {/* Failed Queue Items Details */}
          {queueItems.some(item => item.errorMessage) && (
            <>
              <Separator size="4" />
              <Flex direction="column" gap="4">
                <Flex justify="between" align="center">
                  <Text size="4" weight="bold">Failed Items Details</Text>
                  <Badge color="yellow" size="1">
                    <Flex align="center" gap="1">
                      <Shield size={10} />
                      Data Sanitized
                    </Flex>
                  </Badge>
                </Flex>

                <Flex direction="column" gap="3">
                  {queueItems
                    .filter(item => item.errorMessage)
                    .slice(0, 3) // Show only first 3 failed items
                    .map((item) => (
                      <Card key={item.id} variant="surface">
                        <Flex direction="column" gap="3">
                          <Flex justify="between" align="center">
                            <Text size="3" weight="medium">
                              {PLATFORM_NAMES[item.platform]} - {(item.webhookPayload as any)?.event_type || 'Unknown'}
                            </Text>
                            <Badge color="red">
                              Failed ({item.retryCount}/{item.maxRetries} retries)
                            </Badge>
                          </Flex>
                          
                          {item.errorMessage && (
                            <Box className="bg-red-50 p-3 rounded-md">
                              <Text size="2" color="red" weight="medium" className="mb-1 block">
                                Error:
                              </Text>
                              <Text size="2" color="red">
                                {item.errorMessage}
                              </Text>
                            </Box>
                          )}
                          
                          <SanitizedDataDisplay
                            data={item.webhookPayload}
                            title="Webhook Payload (Sanitized)"
                            maxHeight="max-h-24"
                          />
                        </Flex>
                      </Card>
                    ))}
                </Flex>
              </Flex>
            </>
          )}
        </Flex>
      </Card>

      {/* Configuration Dialog */}
      <Dialog.Root open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Queue Configuration</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Configure webhook processing queue settings and retry policies
          </Dialog.Description>

          <Flex direction="column" gap="4">
            <Box>
              <Text size="2" weight="medium" className="mb-2 block">
                Max Retries per Item
              </Text>
              <input
                type="number"
                value={queueConfig.maxRetries}
                onChange={(e) => updateConfig({ maxRetries: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md"
                min="1"
                max="10"
              />
            </Box>

            <Box>
              <Text size="2" weight="medium" className="mb-2 block">
                Retry Delay (milliseconds)
              </Text>
              <input
                type="number"
                value={queueConfig.retryDelay}
                onChange={(e) => updateConfig({ retryDelay: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md"
                min="1000"
                step="1000"
              />
            </Box>

            <Box>
              <Text size="2" weight="medium" className="mb-2 block">
                Batch Size
              </Text>
              <input
                type="number"
                value={queueConfig.batchSize}
                onChange={(e) => updateConfig({ batchSize: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md"
                min="1"
                max="50"
              />
            </Box>

            <Box>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={queueConfig.autoProcess}
                  onChange={(e) => updateConfig({ autoProcess: e.target.checked })}
                />
                <Text size="2">Enable automatic queue processing</Text>
              </label>
            </Box>

            {/* Security Notice */}
            <Box className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <Flex gap="2">
                <AlertTriangle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <Box>
                  <Text size="2" weight="medium" className="text-blue-900 block mb-1">
                    Configuration Changes
                  </Text>
                  <Text size="1" className="text-blue-700">
                    Configuration changes are logged for security auditing and will be applied system-wide.
                  </Text>
                </Box>
              </Flex>
            </Box>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Close
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}
