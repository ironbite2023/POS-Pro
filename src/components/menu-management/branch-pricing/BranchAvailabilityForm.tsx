'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  Button, 
  TextField, 
  TextArea, 
  Select,
  Flex, 
  Box,
  Text,
  Switch,
  Separator,
  Badge,
  Grid
} from '@radix-ui/themes';
import { useState, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { menuService, type BranchAvailabilityUpdate, type MenuItemWithBranchData } from '@/lib/services/menu.service';
import { toast } from 'sonner';
import { Calendar, Clock, DollarSign, Package, AlertTriangle } from 'lucide-react';

// Form validation schema
const branchAvailabilitySchema = z.object({
  is_available: z.boolean(),
  price_override: z.number().positive().optional().nullable(),
  stock_quantity: z.number().int().min(0).optional().nullable(),
  daily_limit: z.number().int().min(0).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  available_days: z.array(z.number().int().min(0).max(6)),
  notes: z.string().optional()
}).refine((data) => {
  // Validate date range
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"]
}).refine((data) => {
  // Validate time range
  if (data.start_time && data.end_time) {
    const [startH, startM] = data.start_time.split(':').map(Number);
    const [endH, endM] = data.end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return startMinutes < endMinutes;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["end_time"]
});

type BranchAvailabilityFormData = z.infer<typeof branchAvailabilitySchema>;

interface BranchAvailabilityFormProps {
  menuItem: MenuItemWithBranchData;
  branchId: string;
  branchName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' }
];

export default function BranchAvailabilityForm({ 
  menuItem, 
  branchId,
  branchName,
  open, 
  onClose, 
  onSuccess 
}: BranchAvailabilityFormProps) {
  const { currentOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);

  // Get current branch availability data
  const branchAvailability = menuItem.branch_availability;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<BranchAvailabilityFormData>({
    resolver: zodResolver(branchAvailabilitySchema),
    defaultValues: {
      is_available: branchAvailability?.is_available ?? true,
      price_override: branchAvailability?.price_override || null,
      stock_quantity: branchAvailability?.stock_quantity || null,
      daily_limit: branchAvailability?.daily_limit || null,
      start_date: branchAvailability?.start_date || null,
      end_date: branchAvailability?.end_date || null,
      start_time: branchAvailability?.start_time || null,
      end_time: branchAvailability?.end_time || null,
      available_days: (branchAvailability?.available_days as number[]) || [0, 1, 2, 3, 4, 5, 6],
      notes: branchAvailability?.notes || ''
    },
  });

  const watchedFields = watch();
  const hasChanges = JSON.stringify(watchedFields) !== JSON.stringify({
    is_available: branchAvailability?.is_available ?? true,
    price_override: branchAvailability?.price_override || null,
    stock_quantity: branchAvailability?.stock_quantity || null,
    daily_limit: branchAvailability?.daily_limit || null,
    start_date: branchAvailability?.start_date || null,
    end_date: branchAvailability?.end_date || null,
    start_time: branchAvailability?.start_time || null,
    end_time: branchAvailability?.end_time || null,
    available_days: branchAvailability?.available_days || [0, 1, 2, 3, 4, 5, 6],
    notes: branchAvailability?.notes || ''
  });

  const toggleDay = useCallback((dayValue: number) => {
    const currentDays = watchedFields.available_days;
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(d => d !== dayValue)
      : [...currentDays, dayValue].sort();
    
    setValue('available_days', newDays);
  }, [setValue, watchedFields.available_days]);

  const onSubmit = async (data: BranchAvailabilityFormData): Promise<void> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected');
      return;
    }

    try {
      setIsLoading(true);
      
      // Clean the data - convert empty strings to null
      const cleanData: BranchAvailabilityUpdate = {
        ...data,
        price_override: data.price_override || null,
        stock_quantity: data.stock_quantity || null,
        daily_limit: data.daily_limit || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        notes: data.notes || undefined
      };

      await menuService.updateBranchAvailability(menuItem.id, branchId, cleanData);
      
      toast.success(`Branch availability updated for ${branchName}`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error updating branch availability:', error);
      toast.error('Failed to update branch availability');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleResetToDefault = async () => {
    try {
      setIsLoading(true);
      await menuService.deleteBranchAvailability(menuItem.id, branchId);
      toast.success(`Reset to default settings for ${branchName}`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error resetting branch availability:', error);
      toast.error('Failed to reset to default settings');
    } finally {
      setIsLoading(false);
    }
  };

  const effectivePrice = watchedFields.price_override || menuItem.base_price;
  const priceDifference = watchedFields.price_override 
    ? ((watchedFields.price_override - (menuItem.base_price || 0)) / (menuItem.base_price || 1)) * 100
    : 0;

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }}>
        <Dialog.Title>
          Branch Availability Settings
        </Dialog.Title>
        
        <Box mb="4">
          <Flex align="center" gap="2" mb="2">
            <Text weight="medium">{menuItem.name}</Text>
            <Badge color="blue">{branchName}</Badge>
          </Flex>
          <Text size="2" color="gray">
            Base Price: ${menuItem.base_price?.toFixed(2)} • Category: {menuItem.category?.name}
          </Text>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="5">
            
            {/* Availability Toggle */}
            <Box>
              <Flex align="center" gap="3" mb="2">
                <Controller
                  control={control}
                  name="is_available"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Text weight="medium">Available at this branch</Text>
                {!watchedFields.is_available && (
                  <Badge color="red" variant="soft">
                    <AlertTriangle size={12} />
                    Unavailable
                  </Badge>
                )}
              </Flex>
            </Box>

            <Separator />

            {/* Pricing Override */}
            <Box>
              <Flex align="center" gap="2" mb="3">
                <DollarSign size={16} />
                <Text weight="medium">Pricing</Text>
              </Flex>
              
              <Grid columns="2" gap="4">
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Override Price ($)
                  </Text>
                  <TextField.Root
                    {...register('price_override', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={`Default: ${menuItem.base_price?.toFixed(2)}`}
                  />
                  {errors.price_override && (
                    <Text size="1" color="red" mt="1">
                      {errors.price_override.message}
                    </Text>
                  )}
                </Box>
                
                <Box>
                  <Text size="2" weight="medium" mb="1">
                    Effective Price
                  </Text>
                  <Box p="2" style={{ border: '1px solid var(--gray-6)', borderRadius: '4px' }}>
                    <Flex align="center" justify="between">
                      <Text weight="bold">${effectivePrice?.toFixed(2)}</Text>
                      {priceDifference !== 0 && (
                        <Badge color={priceDifference > 0 ? 'orange' : 'green'} variant="soft">
                          {priceDifference > 0 ? '+' : ''}{priceDifference.toFixed(1)}%
                        </Badge>
                      )}
                    </Flex>
                  </Box>
                </Box>
              </Grid>
            </Box>

            <Separator />

            {/* Stock Management */}
            <Box>
              <Flex align="center" gap="2" mb="3">
                <Package size={16} />
                <Text weight="medium">Stock & Limits</Text>
              </Flex>
              
              <Grid columns="2" gap="4">
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Stock Quantity
                  </Text>
                  <TextField.Root
                    {...register('stock_quantity', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                  />
                  <Text size="1" color="gray" mt="1">
                    Leave empty for unlimited stock
                  </Text>
                </Box>
                
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Daily Sales Limit
                  </Text>
                  <TextField.Root
                    {...register('daily_limit', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="No limit"
                  />
                  <Text size="1" color="gray" mt="1">
                    Maximum sales per day
                  </Text>
                </Box>
              </Grid>
            </Box>

            <Separator />

            {/* Schedule Controls */}
            <Box>
              <Flex align="center" gap="2" mb="3">
                <Clock size={16} />
                <Text weight="medium">Schedule</Text>
              </Flex>
              
              <Grid columns="2" gap="4" mb="4">
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Available From
                  </Text>
                  <TextField.Root
                    {...register('start_date')}
                    type="date"
                  />
                </Box>
                
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Available Until
                  </Text>
                  <TextField.Root
                    {...register('end_date')}
                    type="date"
                  />
                  {errors.end_date && (
                    <Text size="1" color="red" mt="1">
                      {errors.end_date.message}
                    </Text>
                  )}
                </Box>
              </Grid>

              <Grid columns="2" gap="4" mb="4">
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Daily Start Time
                  </Text>
                  <TextField.Root
                    {...register('start_time')}
                    type="time"
                  />
                </Box>
                
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Daily End Time
                  </Text>
                  <TextField.Root
                    {...register('end_time')}
                    type="time"
                  />
                  {errors.end_time && (
                    <Text size="1" color="red" mt="1">
                      {errors.end_time.message}
                    </Text>
                  )}
                </Box>
              </Grid>

              {/* Days of Week */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="2">
                  Available Days
                </Text>
                <Grid columns="7" gap="2">
                  {DAYS_OF_WEEK.map(day => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={watchedFields.available_days.includes(day.value) ? 'solid' : 'soft'}
                      size="1"
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </Grid>
                <Text size="1" color="gray" mt="1">
                  {watchedFields.available_days.length === 0 
                    ? 'Item will never be available' 
                    : `Available ${watchedFields.available_days.length} days per week`
                  }
                </Text>
              </Box>
            </Box>

            <Separator />

            {/* Notes */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Notes
              </Text>
              <TextArea
                {...register('notes')}
                placeholder="Special instructions or notes for this branch..."
                rows={3}
              />
            </Box>

            {/* Form Actions */}
            <Flex gap="3" mt="4" justify="between">
              <Box>
                {branchAvailability && (
                  <Button
                    type="button"
                    variant="soft"
                    color="orange"
                    onClick={handleResetToDefault}
                    disabled={isLoading || isSubmitting}
                  >
                    Reset to Default
                  </Button>
                )}
              </Box>
              
              <Flex gap="3">
                <Button
                  type="button"
                  variant="soft"
                  color="gray"
                  onClick={handleClose}
                  disabled={isLoading || isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || isSubmitting || !hasChanges}
                >
                  {isSubmitting || isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
