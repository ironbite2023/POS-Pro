"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  TextField,
  TextArea,
  Button,
  Select,
  Text,
  Grid,
  Callout,
  Card,
  AlertDialog,
  Badge,
  Checkbox,
  RadioGroup
} from "@radix-ui/themes";
import { Upload, Info, Save, Send, X, Trash2, Power, OctagonX, CircleCheck } from "lucide-react";
import { Database } from '@/lib/supabase/database.types';
import { useOrganization } from '@/contexts/OrganizationContext';
import { loyaltyService, organizationService, menuService } from '@/lib/services';
import DateRangeInput from '@/components/common/DateRangeInput';
import { Range } from 'react-date-range';
import { toast } from 'sonner';
import { PageHeading } from '@/components/common/PageHeading';
import Image from 'next/image';
import SearchableSelect from '@/components/common/SearchableSelect';
import { uploadRewardImage, deleteRewardImage, validateImage } from '@/lib/utils/imageUpload';

// Use database types directly
type LoyaltyReward = Database['public']['Tables']['loyalty_rewards']['Row'];
type LoyaltyRewardInsert = Database['public']['Tables']['loyalty_rewards']['Insert'];
type LoyaltyTier = Database['public']['Tables']['loyalty_tiers']['Row'];
type Branch = Database['public']['Tables']['branches']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

// Form data type - based on database schema
type FormData = Omit<LoyaltyReward, 'id' | 'created_at' | 'updated_at'>;

const defaultRewardState: FormData = {
  organization_id: '',
  name: '',
  description: null,
  reward_type: 'discount',
  points_required: 0,
  discount_percentage: null,
  discount_amount: null,
  free_item_id: null,
  is_active: true,
  valid_from: null,
  valid_until: null,
  image_url: null,
  max_redemptions: null,
  redemption_count: null,
};

interface AddEditRewardFormProps {
  rewardId?: string;
}

/**
 * Utility function to get display status from database fields
 */
const getStatusDisplay = (reward: LoyaltyReward): { label: string; color: 'green' | 'red' | 'gray' | 'orange' } => {
  if (!reward.is_active) return { label: 'Inactive', color: 'gray' };
  if (reward.valid_until && new Date(reward.valid_until) < new Date()) {
    return { label: 'Expired', color: 'red' };
  }
  return { label: 'Active', color: 'green' };
};

export default function AddEditRewardForm({ rewardId }: AddEditRewardFormProps) {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id || '';
  
  const isEditing = !!rewardId;
  const [formData, setFormData] = useState<FormData>(defaultRewardState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [initialRewardData, setInitialRewardData] = useState<LoyaltyReward | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Tier selection state
  const [availableTiers, setAvailableTiers] = useState<LoyaltyTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  
  // Branch selection state
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [branchSelectionType, setBranchSelectionType] = useState<'All' | 'Specific'>('All');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  
  // Menu items state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(false);

  // Load tiers, branches, and menu items on mount
  useEffect(() => {
    if (organizationId) {
      // Load tiers
      loyaltyService.getTiers(organizationId)
        .then(setAvailableTiers)
        .catch(error => {
          console.error('Error loading tiers:', error);
          toast.error('Failed to load membership tiers');
        });
      
      // Load branches
      organizationService.getBranches(organizationId)
        .then(setAvailableBranches)
        .catch(error => {
          console.error('Error loading branches:', error);
          toast.error('Failed to load branches');
        });
      
      // Load menu items
      setIsLoadingMenuItems(true);
      menuService.getMenuItems(organizationId)
        .then(items => {
          setMenuItems(items.filter(item => item.is_active));
        })
        .catch(error => {
          console.error('Error loading menu items:', error);
          toast.error('Failed to load menu items');
        })
        .finally(() => setIsLoadingMenuItems(false));
    }
  }, [organizationId]);

  // Load reward data in edit mode
  useEffect(() => {
    if (isEditing && rewardId && organizationId) {
      setIsLoading(true);
      loyaltyService.getRewards(organizationId)
        .then(rewards => {
          const reward = rewards.find(r => r.id === rewardId);
          if (reward) {
            setInitialRewardData(reward);
            setFormData({
              organization_id: reward.organization_id,
              name: reward.name,
              description: reward.description,
              reward_type: reward.reward_type,
              points_required: reward.points_required,
              discount_percentage: reward.discount_percentage,
              discount_amount: reward.discount_amount,
              free_item_id: reward.free_item_id,
              is_active: reward.is_active,
              valid_from: reward.valid_from,
              valid_until: reward.valid_until,
              image_url: reward.image_url,
              max_redemptions: reward.max_redemptions,
              redemption_count: reward.redemption_count,
            });
            
            // Set image preview if exists
            if (reward.image_url) {
              setImagePreview(reward.image_url);
            }
          } else {
            toast.error('Reward not found');
            router.push('/loyalty-program/rewards');
          }
        })
        .catch(error => {
          console.error('Error loading reward:', error);
          toast.error('Failed to load reward');
          router.push('/loyalty-program/rewards');
        })
        .finally(() => setIsLoading(false));
    } else if (!isEditing) {
      setInitialRewardData(null);
      setFormData({ ...defaultRewardState, organization_id: organizationId });
      setIsLoading(false);
    }
    setFormErrors({});
  }, [rewardId, isEditing, organizationId, router]);

  // Load tier mappings in edit mode
  useEffect(() => {
    if (isEditing && rewardId) {
      loyaltyService.getRewardTierMappings(rewardId)
        .then(mappings => {
          setSelectedTiers(mappings.map(m => m.tier_id));
        })
        .catch(error => {
          console.error('Error loading tier mappings:', error);
        });
    }
  }, [isEditing, rewardId]);

  // Load branch mappings in edit mode
  useEffect(() => {
    if (isEditing && rewardId) {
      loyaltyService.getRewardBranchMappings(rewardId)
        .then(mappings => {
          if (mappings.length === 0) {
            setBranchSelectionType('All');
            setSelectedBranches([]);
          } else {
            setBranchSelectionType('Specific');
            setSelectedBranches(mappings.map(m => m.branch_id));
          }
        })
        .catch(error => {
          console.error('Error loading branch mappings:', error);
        });
    }
  }, [isEditing, rewardId]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Reward name is required.";
    }
    
    if (!formData.points_required || formData.points_required <= 0) {
      errors.points_required = "Points must be greater than zero.";
    }
    
    if (!formData.reward_type) {
      errors.reward_type = "Reward type is required.";
    }
    
    if (formData.reward_type === 'percentage' && 
        (!formData.discount_percentage || formData.discount_percentage <= 0 || formData.discount_percentage > 100)) {
      errors.discount_percentage = "Discount must be between 1 and 100.";
    }
    
    if (formData.reward_type === 'amount' && 
        (!formData.discount_amount || formData.discount_amount <= 0)) {
      errors.discount_amount = "Discount amount must be greater than zero.";
    }
    
    if (formData.reward_type === 'free_item' && !formData.free_item_id) {
      errors.free_item_id = "Please select the free item.";
    }
    
    if (formData.valid_from && formData.valid_until && 
        new Date(formData.valid_from) > new Date(formData.valid_until)) {
      errors.validity = "Start date cannot be after end date.";
    }
    
    // Validate tier selection
    if (selectedTiers.length === 0) {
      errors.applicable_tiers = "Select at least one membership tier.";
    }
    
    // Validate branch selection
    if (branchSelectionType === 'Specific' && selectedBranches.length === 0) {
      errors.branch_scope = "Select at least one branch when 'Specific Branches' is chosen.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, selectedTiers, branchSelectionType, selectedBranches]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' 
      ? (value === '' ? null : Number(value)) 
      : (value === '' ? null : value);
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [formErrors]);

  const handleSelectChange = useCallback((name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear conditional fields when reward type changes
    if (name === 'reward_type') {
      setFormData(prev => ({
        ...prev,
        discount_percentage: value !== 'percentage' ? null : prev.discount_percentage,
        discount_amount: value !== 'amount' ? null : prev.discount_amount,
        free_item_id: value !== 'free_item' ? null : prev.free_item_id,
      }));
      setFormErrors(prev => ({
        ...prev,
        discount_percentage: '',
        discount_amount: '',
        free_item_id: ''
      }));
    }
  }, [formErrors]);

  const handleDateRangeChange = useCallback((range: Range) => {
    setFormData(prev => ({
      ...prev,
      valid_from: range.startDate ? range.startDate.toISOString() : null,
      valid_until: range.endDate ? range.endDate.toISOString() : null,
    }));
    
    if (formErrors.validity) {
      setFormErrors(prev => ({ ...prev, validity: '' }));
    }
  }, [formErrors]);

  const handleCancel = useCallback(() => {
    router.push('/loyalty-program/rewards');
  }, [router]);

  // Image upload handlers
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate
    const validationError = validateImage(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    // Set file and preview
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    
    // Clear error
    if (formErrors.image_url) {
      setFormErrors(prev => ({ ...prev, image_url: '' }));
    }
  }, [formErrors]);

  const handleImageRemove = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
  }, []);

  // Tier selection handlers
  const handleTierChange = useCallback((tierId: string, checked: boolean) => {
    setSelectedTiers(prev =>
      checked ? [...prev, tierId] : prev.filter(id => id !== tierId)
    );
    
    if (formErrors.applicable_tiers) {
      setFormErrors(prev => ({ ...prev, applicable_tiers: '' }));
    }
  }, [formErrors]);

  // Branch selection handlers
  const handleBranchSelectionTypeChange = useCallback((value: 'All' | 'Specific') => {
    setBranchSelectionType(value);
    if (value === 'All') {
      setSelectedBranches([]);
    }
    if (formErrors.branch_scope) {
      setFormErrors(prev => ({ ...prev, branch_scope: '' }));
    }
  }, [formErrors]);

  const handleBranchMultiSelectChange = useCallback((value: string | string[] | null) => {
    const branchIds = Array.isArray(value) ? value : value ? [value] : [];
    setSelectedBranches(branchIds);
    if (branchIds.length > 0) {
      setBranchSelectionType('Specific');
    }
    if (formErrors.branch_scope) {
      setFormErrors(prev => ({ ...prev, branch_scope: '' }));
    }
  }, [formErrors]);

  const handleSubmit = useCallback(async (publish: boolean) => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setIsSaving(true);

    try {
      // Upload image if new file selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          const uploadResult = await uploadRewardImage(
            imageFile,
            rewardId || 'temp',
            organizationId
          );
          imageUrl = uploadResult.url;
          
          // Delete old image if exists and is different
          if (formData.image_url && formData.image_url !== imageUrl) {
            await deleteRewardImage(formData.image_url).catch(console.error);
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Failed to upload image');
          setIsUploadingImage(false);
          setIsSaving(false);
          return;
        }
        setIsUploadingImage(false);
      }

      const rewardData: Omit<LoyaltyRewardInsert, 'organization_id'> = {
        name: formData.name,
        description: formData.description,
        reward_type: formData.reward_type,
        points_required: formData.points_required,
        discount_percentage: formData.discount_percentage,
        discount_amount: formData.discount_amount,
        free_item_id: formData.free_item_id,
        is_active: publish,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        image_url: imageUrl,
        max_redemptions: formData.max_redemptions,
      };

      let savedRewardId: string;

      if (isEditing && rewardId) {
        await loyaltyService.updateReward(rewardId, rewardData);
        savedRewardId = rewardId;
        toast.success(`Reward updated ${publish ? 'and published' : 'as draft'}`);
      } else {
        const created = await loyaltyService.createReward(organizationId, rewardData);
        savedRewardId = created.id;
        toast.success(`Reward created ${publish ? 'and published' : 'as draft'}`);
      }
      
      // Save tier mappings
      await loyaltyService.setRewardTierMappings(
        savedRewardId,
        selectedTiers,
        organizationId
      );
      
      // Save branch mappings
      await loyaltyService.setRewardBranchMappings(
        savedRewardId,
        branchSelectionType === 'All' ? [] : selectedBranches,
        organizationId
      );
      
      router.push('/loyalty-program/rewards');
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error('Failed to save reward');
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  }, [validateForm, formData, isEditing, rewardId, organizationId, router, imageFile, selectedTiers, selectedBranches, branchSelectionType]);

  const handleDelete = useCallback(async () => {
    if (!rewardId) return;

    try {
      await loyaltyService.deleteReward(rewardId);
      toast.success('Reward deleted successfully');
      router.push('/loyalty-program/rewards');
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Failed to delete reward');
    }
  }, [rewardId, router]);

  const handleToggleStatus = useCallback(async () => {
    if (!rewardId || !initialRewardData) return;

    try {
      await loyaltyService.updateReward(rewardId, {
        is_active: !initialRewardData.is_active
      });
      toast.success(`Reward ${initialRewardData.is_active ? 'disabled' : 'enabled'}`);
      router.push('/loyalty-program/rewards');
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update reward status');
    }
  }, [rewardId, initialRewardData, router]);

  if (isLoading) {
    return <Box p="4"><Text>Loading reward details...</Text></Box>;
  }

  return (
    <Box>
      <Flex align="center" justify="between" gap="3" mb="4">
        <PageHeading
          title={isEditing ? initialRewardData?.name : 'Add New Reward'}
          description={isEditing ? 'Edit Reward' : 'Add new reward to the loyalty program'}
          showBackButton
          noMarginBottom
          onBackClick={handleCancel}
          badge={isEditing && initialRewardData ? 
            <Badge
              variant="solid"
              color={getStatusDisplay(initialRewardData).color}
            >
              {getStatusDisplay(initialRewardData).label}
            </Badge> 
            : undefined}
        />
      </Flex>

      {Object.keys(formErrors).length > 0 && (
        <Callout.Root color="red" role="alert" mb="4">
          <Callout.Icon>
            <Info />
          </Callout.Icon>
          <Callout.Text>
            Please fix the errors marked below before saving.
          </Callout.Text>
        </Callout.Root>
      )}

      <Grid columns={{ initial: '1', lg: '3' }} gap="5">
        <Card size="3" className="lg:col-span-2">
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="rewardName" size="2" weight="medium">Reward Name</Text>
              <TextField.Root
                id="rewardName"
                name="name"
                placeholder="e.g., Free Coffee, 10% Off"
                value={formData.name}
                onChange={handleInputChange}
                color={formErrors.name ? 'red' : undefined}
              />
              {formErrors.name && <Text size="1" color="red">{formErrors.name}</Text>}
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="rewardDescription" size="2" weight="medium">Description</Text>
              <TextArea
                id="rewardDescription"
                name="description"
                placeholder="Briefly describe the reward for the customer"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={3}
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Validity Period (Optional)</Text>
              <Text size="1" color="gray" mb="1">Leave blank if the reward doesn&apos;t expire.</Text>
              <DateRangeInput
                value={{
                  startDate: formData.valid_from ? new Date(formData.valid_from) : undefined,
                  endDate: formData.valid_until ? new Date(formData.valid_until) : undefined,
                  key: 'selection'
                }}
                onChange={handleDateRangeChange}
                placeholder="Select start and end date..."
                position="top"
              />
              {formErrors.validity && <Text size="1" color="red">{formErrors.validity}</Text>}
            </Flex>
          </Flex>
        </Card>

        <Card size="3" className="lg:col-span-1">
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="rewardType" size="2" weight="medium">Reward Type</Text>
              <Select.Root
                name="reward_type"
                value={formData.reward_type || ''}
                onValueChange={handleSelectChange('reward_type')}
              >
                <Select.Trigger id="rewardType" placeholder="Select type..." color={formErrors.reward_type ? 'red' : undefined}/>
                <Select.Content>
                  <Select.Item value="free_item">Free Item</Select.Item>
                  <Select.Item value="percentage">% Discount</Select.Item>
                  <Select.Item value="amount">$ Discount</Select.Item>
                </Select.Content>
              </Select.Root>
              {formErrors.reward_type && <Text size="1" color="red">{formErrors.reward_type}</Text>}
            </Flex>

            {formData.reward_type === 'free_item' && (
              <Flex direction="column" gap="1">
                <Text as="label" htmlFor="free_item_id" size="2" weight="medium">Select Free Item</Text>
                {isLoadingMenuItems ? (
                  <Text size="1" color="gray">Loading menu items...</Text>
                ) : (
                  <SearchableSelect
                    options={menuItems.map(item => ({
                      value: item.id,
                      label: `${item.name} - $${item.base_price}`
                    }))}
                    value={formData.free_item_id}
                    onChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        free_item_id: value as string | null
                      }));
                      if (formErrors.free_item_id) {
                        setFormErrors(prev => ({ ...prev, free_item_id: '' }));
                      }
                    }}
                    placeholder="Search menu items..."
                    isMulti={false}
                    isClearable={true}
                    usePortal={true}
                  />
                )}
                {formErrors.free_item_id && <Text size="1" color="red">{formErrors.free_item_id}</Text>}
              </Flex>
            )}
            
            {formData.reward_type === 'percentage' && (
              <Flex direction="column" gap="1">
                <Text as="label" htmlFor="discount_percentage" size="2" weight="medium">Discount (%)</Text>
                <TextField.Root
                  id="discount_percentage"
                  name="discount_percentage"
                  type="number"
                  placeholder="e.g., 15"
                  value={formData.discount_percentage ?? ''}
                  onChange={handleInputChange}
                  color={formErrors.discount_percentage ? 'red' : undefined}
                >
                  <TextField.Slot>%</TextField.Slot>
                </TextField.Root>
                {formErrors.discount_percentage && <Text size="1" color="red">{formErrors.discount_percentage}</Text>}
              </Flex>
            )}
            
            {formData.reward_type === 'amount' && (
              <Flex direction="column" gap="1">
                <Text as="label" htmlFor="discount_amount" size="2" weight="medium">Discount Amount ($)</Text>
                <TextField.Root
                  id="discount_amount"
                  name="discount_amount"
                  type="number"
                  placeholder="e.g., 5.00"
                  value={formData.discount_amount ?? ''}
                  onChange={handleInputChange}
                  color={formErrors.discount_amount ? 'red' : undefined}
                >
                  <TextField.Slot>$</TextField.Slot>
                </TextField.Root>
                {formErrors.discount_amount && <Text size="1" color="red">{formErrors.discount_amount}</Text>}
              </Flex>
            )}

            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="points_required" size="2" weight="medium">Required Points</Text>
              <TextField.Root
                id="points_required"
                name="points_required"
                type="number"
                placeholder="e.g., 100"
                value={formData.points_required ?? ''}
                min="1"
                onChange={handleInputChange}
                color={formErrors.points_required ? 'red' : undefined}
              />
              {formErrors.points_required && <Text size="1" color="red">{formErrors.points_required}</Text>}
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="max_redemptions" size="2" weight="medium">
                Max Redemptions (Optional)
              </Text>
              <Text size="1" color="gray" mb="1">
                Limit total redemptions across all members. Leave blank for unlimited.
              </Text>
              <TextField.Root
                id="max_redemptions"
                name="max_redemptions"
                type="number"
                placeholder="e.g., 100"
                value={formData.max_redemptions ?? ''}
                min="1"
                onChange={handleInputChange}
              />
            </Flex>

            {isEditing && initialRewardData && (
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">Redemptions So Far</Text>
                <Badge size="3" color={
                  initialRewardData.max_redemptions &&
                  (initialRewardData.redemption_count || 0) >= initialRewardData.max_redemptions
                    ? 'red'
                    : 'green'
                }>
                  {initialRewardData.redemption_count || 0}
                  {initialRewardData.max_redemptions && (
                    <> / {initialRewardData.max_redemptions}</>
                  )}
                </Badge>
              </Flex>
            )}
          </Flex>
        </Card>
      </Grid>

      {/* Additional sections */}
      <Grid columns={{ initial: '1', lg: '3' }} gap="5" mt="5">
        {/* Image Upload */}
        <Card size="3" className="lg:col-span-1">
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Reward Image</Text>
              <Text size="1" color="gray" mb="2">
                Upload an image to make your reward more appealing (Max 5MB)
              </Text>
              
              {imagePreview && (
                <Box position="relative" mb="2" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <Image
                    src={imagePreview}
                    alt="Reward preview"
                    width={400}
                    height={225}
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    size="1"
                    variant="soft"
                    color="red"
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={handleImageRemove}
                  >
                    <X size={14} /> Remove
                  </Button>
                </Box>
              )}
              
              <label htmlFor="imageUpload" style={{ cursor: 'pointer' }}>
                <Button asChild variant="outline" style={{ width: '100%' }}>
                  <span>
                    <Upload size={14} style={{ marginRight: '4px' }}/>
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </span>
                </Button>
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </label>
              
              {isUploadingImage && (
                <Text size="1" color="blue">Uploading image...</Text>
              )}
            </Flex>
          </Flex>
        </Card>

        {/* Tier and Branch Selection */}
        <Card size="3" className="lg:col-span-2">
          <Flex direction="column" gap="4">
            {/* Tier Selection */}
            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="medium">Applicable Membership Tiers</Text>
              <Text size="1" color="gray" mb="1">
                Select which membership tiers can redeem this reward
              </Text>
              <Grid columns={{ initial: '2', sm: '4'}} gap="2">
                {availableTiers.map(tier => (
                  <Text key={tier.id} as="label" size="2">
                    <Flex gap="2" align="center">
                      <Checkbox
                        checked={selectedTiers.includes(tier.id)}
                        onCheckedChange={(checked) => handleTierChange(tier.id, checked as boolean)}
                        color={formErrors.applicable_tiers ? 'red' : undefined}
                      />
                      <Badge color={tier.tier_color as any}>{tier.name}</Badge>
                    </Flex>
                  </Text>
                ))}
              </Grid>
              {formErrors.applicable_tiers && (
                <Text size="1" color="red">{formErrors.applicable_tiers}</Text>
              )}
            </Flex>

            {/* Branch Selection */}
            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="medium">Applicable Branches</Text>
              <RadioGroup.Root 
                value={branchSelectionType} 
                onValueChange={(value) => handleBranchSelectionTypeChange(value as 'All' | 'Specific')}
              >
                <Flex gap="2" align="center"> 
                  <RadioGroup.Item value="All" id="branchAll" />
                  <Text as="label" htmlFor="branchAll" size="2">All Branches</Text>
                </Flex>
                <Flex gap="2" align="center"> 
                  <RadioGroup.Item value="Specific" id="branchSpecific" />
                  <Text as="label" htmlFor="branchSpecific" size="2">Specific Branches</Text>
                </Flex>
              </RadioGroup.Root>
              
              {branchSelectionType === 'Specific' && (
                <Box mt="1">
                  <SearchableSelect
                    options={availableBranches.map(branch => ({
                      value: branch.id,
                      label: `${branch.name} (${branch.code})`
                    }))}
                    value={selectedBranches}
                    onChange={handleBranchMultiSelectChange}
                    placeholder="Search & select branches..."
                    isMulti={true}
                    isClearable={false}
                    usePortal={true}
                  />
                  {formErrors.branch_scope && (
                    <Text size="1" color="red" mt="1">{formErrors.branch_scope}</Text>
                  )}
                </Box>
              )}
            </Flex>
          </Flex>
        </Card>
      </Grid>

      <Flex justify="between" mt="4">
        <Flex gap="4">
          <Button 
            onClick={() => handleSubmit(true)} 
            color="green"
            disabled={isSaving}
          >
            <Send size={16} /> {isEditing ? 'Update & Publish' : 'Save & Publish'}
          </Button>
          <Button 
            variant="soft" 
            color="green" 
            onClick={() => handleSubmit(false)}
            disabled={isSaving}
          >
            <Save size={16} /> Save Draft
          </Button>
          <Button 
            variant="soft" 
            color="gray" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X size={16} /> Cancel
          </Button>
        </Flex>
        {isEditing && initialRewardData && (
          <Flex gap="4">
            <Button 
              variant="soft"
              color={initialRewardData.is_active ? 'gray' : 'green'}
              onClick={handleToggleStatus}
              disabled={isSaving}
            >
              {initialRewardData.is_active ? 
                <>
                  <OctagonX size={16} />
                  Disable
                </>
                : 
                <>
                  <CircleCheck size={16} />
                  Enable
                </>
              }
            </Button>
            <Button 
              variant="soft" 
              color="red" 
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSaving}
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </Flex>
        )}
      </Flex>

      <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete Reward</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete this reward? This action cannot be undone.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={handleDelete}>
                Delete
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
} 