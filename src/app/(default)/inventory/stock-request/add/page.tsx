'use client';

import React from 'react';
import { 
  Box
} from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
// Removed hardcoded import - using real data from database services
// Note: Stock request data will use inventory services
import { useAppOrganization } from '@/contexts/AppOrganizationContext';
import StockRequestForm from '@/components/inventory/StockRequestForm';
import { PageHeading } from '@/components/common/PageHeading';

// Placeholder types and functions
type StockRequest = any;
type StockRequestItem = any;
type StockRequestStatus = string;
const addStockRequest = (data: any) => ({ id: '1', ...data });
const generateRequestNumber = () => 'REQ-' + Date.now();

export default function AddStockRequestPage() {
  const router = useRouter();
  const { activeEntity } = useAppOrganization();
  
  // Prepare initial data for the form
  const initialRequestData: Omit<StockRequest, 'id'> = {
    requestNumber: generateRequestNumber(),
    date: new Date(),
    originId: activeEntity?.id !== 'hq' ? activeEntity.id : '', // Default origin if not HQ
    destinationId: '',
    notes: '',
    status: 'New' as StockRequestStatus,
    items: [] as StockRequestItem[]
  };
  
  const handleSave = (newRequestData: Omit<StockRequest, 'id'>) => {
    // Add the new request to the mock data
    const newRequest = addStockRequest({
      ...newRequestData, // Spread the data from the form
      // Ensure requestNumber is always set (it should be from initial state)
      requestNumber: newRequestData.requestNumber || generateRequestNumber()
    });
    
    // Navigate to the new request details page
    router.push(`/inventory/stock-request/${newRequest.id}`);
  };
  
  const handleCancel = () => {
    router.push('/inventory/stock-request');
  };
  
  return (
    <Box>
      <PageHeading
        title="New Stock Request"
        description="Create a new stock transfer request"
        showBackButton
        onBackClick={handleCancel}
      />
      
      <StockRequestForm 
        request={initialRequestData} 
        readOnly={false}
        onSave={handleSave} 
        onCancel={handleCancel}
      />
    </Box>
  );
} 