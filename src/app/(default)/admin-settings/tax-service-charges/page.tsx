'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Select,
  Switch,
  Table,
  Text,
  TextField,
  Dialog,
  Badge,
  Callout,
} from '@radix-ui/themes';
import { 
  Plus, 
  Percent, 
  AlertTriangle,
  Edit,
  Trash2,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useOrganization } from '@/contexts/OrganizationContext';
import { taxService, type TaxSetting } from '@/lib/services/tax.service';
import type { Database } from '@/lib/supabase/database.types';
import { PageHeading } from '@/components/common/PageHeading';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface TaxSettingFormData {
  tax_name: string;
  tax_rate: string;
  branch_id: string;
  applies_to_delivery: boolean;
  applies_to_dine_in: boolean;
  applies_to_takeaway: boolean;
  description: string;
}

export default function TaxServiceChargesPage() {
  usePageTitle('Tax & Service Charges');
  
  const { currentOrganization, branches } = useOrganization();
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaxSetting, setEditingTaxSetting] = useState<TaxSetting | null>(null);
  const [formData, setFormData] = useState<TaxSettingFormData>({
    tax_name: 'VAT',
    tax_rate: '10',
    branch_id: '',
    applies_to_delivery: true,
    applies_to_dine_in: true,
    applies_to_takeaway: true,
    description: '',
  });

  // Fetch tax settings
  const fetchTaxSettings = useCallback(async () => {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      const settings = await taxService.getTaxSettings(currentOrganization.id);
      setTaxSettings(settings);
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      toast.error('Failed to load tax settings');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchTaxSettings();
  }, [fetchTaxSettings]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentOrganization) return;

    const taxRate = parseFloat(formData.tax_rate) / 100; // Convert percentage to decimal
    
    if (taxRate < 0 || taxRate > 1) {
      toast.error('Tax rate must be between 0% and 100%');
      return;
    }

    try {
      if (editingTaxSetting) {
        // Update existing setting - use database types
        const updateData: Database['public']['Tables']['tax_settings']['Update'] = {
          tax_name: formData.tax_name,
          tax_rate: taxRate,
          branch_id: formData.branch_id || null,
          applies_to_delivery: formData.applies_to_delivery,
          applies_to_dine_in: formData.applies_to_dine_in,
          applies_to_takeaway: formData.applies_to_takeaway,
          description: formData.description || null,
        };
        
        await taxService.updateTaxSetting(editingTaxSetting.id, updateData);
        toast.success('Tax setting updated successfully');
      } else {
        // Create new setting - use database types
        await taxService.createTaxSetting({
          organization_id: currentOrganization.id,
          branch_id: formData.branch_id || null,
          tax_name: formData.tax_name,
          tax_rate: taxRate,
          applies_to_delivery: formData.applies_to_delivery,
          applies_to_dine_in: formData.applies_to_dine_in,
          applies_to_takeaway: formData.applies_to_takeaway,
          description: formData.description || null,
        });
        toast.success('Tax setting created successfully');
      }
      
      setDialogOpen(false);
      setEditingTaxSetting(null);
      resetForm();
      fetchTaxSettings();
    } catch (error) {
      console.error('Error saving tax setting:', error);
      toast.error('Failed to save tax setting');
    }
  };

  const resetForm = () => {
    setFormData({
      tax_name: 'VAT',
      tax_rate: '10',
      branch_id: '',
      applies_to_delivery: true,
      applies_to_dine_in: true,
      applies_to_takeaway: true,
      description: '',
    });
  };

  const handleEdit = (setting: TaxSetting) => {
    setEditingTaxSetting(setting);
    setFormData({
      tax_name: setting.tax_name,
      tax_rate: (setting.tax_rate * 100).toString(), // Convert decimal to percentage
      branch_id: setting.branch_id || '',
      applies_to_delivery: setting.applies_to_delivery,
      applies_to_dine_in: setting.applies_to_dine_in,
      applies_to_takeaway: setting.applies_to_takeaway,
      description: setting.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await taxService.deleteTaxSetting(id);
      toast.success('Tax setting deleted successfully');
      fetchTaxSettings();
    } catch (error) {
      console.error('Error deleting tax setting:', error);
      toast.error('Failed to delete tax setting');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await taxService.toggleTaxSetting(id, isActive);
      toast.success(`Tax setting ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchTaxSettings();
    } catch (error) {
      console.error('Error toggling tax setting:', error);
      toast.error('Failed to update tax setting status');
    }
  };

  const getBranchName = (branchId: string | null | undefined) => {
    if (!branchId) return 'Organization-wide';
    return branches.find(b => b.id === branchId)?.name || 'Unknown Branch';
  };

  return (
    <Container size="4">
      <Box>
        <PageHeading
          title="Tax & Service Charges"
          description="Configure tax rates for your organization and individual branches"
        />

        {/* Information Card */}
        <Callout.Root className="mb-6">
          <Callout.Icon>
            <AlertTriangle size={16} />
          </Callout.Icon>
          <Callout.Text>
            Branch-specific tax rates take precedence over organization-wide settings. 
            Only one active tax setting is allowed per organization or branch.
          </Callout.Text>
        </Callout.Root>

        {/* Header Actions */}
        <Flex justify="between" align="center" className="mb-6">
          <Heading size="6">Tax Settings</Heading>
          <Button 
            onClick={() => {
              resetForm();
              setEditingTaxSetting(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} />
            Add Tax Setting
          </Button>
        </Flex>

        {/* Tax Settings Table */}
        <Card>
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Tax Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Rate</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Scope</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Applies To</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Last Updated</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={7}>
                    <Flex justify="center" py="4">
                      <Text>Loading tax settings...</Text>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ) : taxSettings.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7}>
                    <Flex direction="column" align="center" py="8">
                      <Percent size={48} color="gray" />
                      <Text size="3" color="gray" className="mt-2">
                        No tax settings configured
                      </Text>
                      <Text size="2" color="gray">
                        Add your first tax setting to get started
                      </Text>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ) : (
                taxSettings.map((setting) => (
                  <Table.Row key={setting.id}>
                    <Table.RowHeaderCell>
                      <Text weight="medium">{setting.tax_name}</Text>
                    </Table.RowHeaderCell>
                    <Table.Cell>
                      <Text weight="bold">{(setting.tax_rate * 100).toFixed(1)}%</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{getBranchName(setting.branch_id)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="1">
                        {setting.applies_to_dine_in && <Badge size="1">Dine-in</Badge>}
                        {setting.applies_to_takeaway && <Badge size="1">Takeaway</Badge>}
                        {setting.applies_to_delivery && <Badge size="1">Delivery</Badge>}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Switch
                        checked={setting.is_active}
                        onCheckedChange={(checked) => handleToggleActive(setting.id, checked)}
                        size="1"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {formatDistanceToNow(new Date(setting.updated_at), { addSuffix: true })}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="1">
                        <Button 
                          size="1" 
                          variant="ghost" 
                          onClick={() => handleEdit(setting)}
                        >
                          <Edit size={12} />
                        </Button>
                        <Button 
                          size="1" 
                          variant="ghost" 
                          color="red"
                          onClick={() => handleDelete(setting.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Card>

        {/* Add/Edit Tax Setting Dialog */}
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Content style={{ maxWidth: 600 }}>
            <Dialog.Title>
              {editingTaxSetting ? 'Edit Tax Setting' : 'Add Tax Setting'}
            </Dialog.Title>
            
            <form onSubmit={handleFormSubmit}>
              <Flex direction="column" gap="4" className="mt-4">
                <Box>
                  <Text size="2" weight="medium" className="mb-2">Tax Name</Text>
                  <TextField.Root
                    placeholder="e.g., VAT, Sales Tax, GST"
                    value={formData.tax_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_name: e.target.value }))}
                    required
                  />
                </Box>

                <Box>
                  <Text size="2" weight="medium" className="mb-2">Tax Rate (%)</Text>
                  <TextField.Root
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="10.0"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: e.target.value }))}
                    required
                  />
                </Box>

                <Box>
                  <Text size="2" weight="medium" className="mb-2">Scope</Text>
                  <Select.Root
                    value={formData.branch_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, branch_id: value }))}
                  >
                    <Select.Trigger placeholder="Select scope" />
                    <Select.Content>
                      <Select.Item value="">Organization-wide</Select.Item>
                      {branches.map((branch) => (
                        <Select.Item key={branch.id} value={branch.id}>
                          {branch.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Box>
                  <Text size="2" weight="medium" className="mb-3">Applies To</Text>
                  <Flex direction="column" gap="2">
                    <Flex align="center" gap="2">
                      <Switch
                        checked={formData.applies_to_dine_in}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, applies_to_dine_in: checked }))
                        }
                      />
                      <Text size="2">Dine-in orders</Text>
                    </Flex>
                    <Flex align="center" gap="2">
                      <Switch
                        checked={formData.applies_to_takeaway}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, applies_to_takeaway: checked }))
                        }
                      />
                      <Text size="2">Takeaway orders</Text>
                    </Flex>
                    <Flex align="center" gap="2">
                      <Switch
                        checked={formData.applies_to_delivery}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, applies_to_delivery: checked }))
                        }
                      />
                      <Text size="2">Delivery orders</Text>
                    </Flex>
                  </Flex>
                </Box>

                <Box>
                  <Text size="2" weight="medium" className="mb-2">Description (Optional)</Text>
                  <TextField.Root
                    placeholder="Additional notes about this tax setting"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </Box>
              </Flex>

              <Flex justify="end" gap="2" className="mt-6">
                <Dialog.Close>
                  <Button variant="soft" color="gray">Cancel</Button>
                </Dialog.Close>
                <Button type="submit">
                  {editingTaxSetting ? 'Update Setting' : 'Create Setting'}
                </Button>
              </Flex>
            </form>
          </Dialog.Content>
        </Dialog.Root>
      </Box>
    </Container>
  );
}