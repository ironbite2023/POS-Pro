'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SupplierDetails from '@/components/purchasing/supplier/SupplierDetails';
// Removed hardcoded import - using real suppliers from database
// eslint-disable-next-line unused-imports/no-unused-imports
import { suppliersService } from '@/lib/services';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Text } from '@radix-ui/themes';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
import { usePageTitle } from '@/hooks/usePageTitle';

export default function SupplierDetailPage() {
  usePageTitle('Edit Supplier');
  const router = useRouter();
  const params = useParams();
  const { currentOrganization } = useOrganization();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSupplier = async () => {
      if (!currentOrganization) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // TODO: Implement suppliersService.getSupplierById method
        // const fetchedSupplier = await suppliersService.getSupplierById(supplierId);
        // setSupplier(fetchedSupplier);
        
        // Temporary: Return null until service is implemented
        setSupplier(null);
        setError(`Supplier loading not yet implemented. Supplier ID: ${supplierId}`);
      } catch (error) {
        console.error('Error loading supplier:', error);
        setError(`Error loading supplier: ${error}`);
        setSupplier(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadSupplier();
  }, [supplierId, currentOrganization]);

  const handleUpdateItem = (updatedSupplier: Supplier) => {
    // Implement API call to update the supplier
    console.log('Updating supplier:', updatedSupplier);
    
    toast.success('Supplier updated successfully!');

    setTimeout(() => {
      router.push('/purchasing/suppliers');
    }, 500);
  };

  const handleCancel = () => {
    router.push('/purchasing/suppliers');
  };

  if (loading) {
    return <Text>Loading supplier details...</Text>;
  }

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  return <SupplierDetails
    editingItem={supplier}
    onSubmit={handleUpdateItem}
    onCancel={handleCancel}
  />;
}
