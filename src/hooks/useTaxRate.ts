import { useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrderCartStore } from '@/stores/orderCartStore';
import { taxService } from '@/lib/services/tax.service';

/**
 * Custom hook to automatically manage tax rates in the order cart store
 * Updates tax rate when organization or branch context changes
 */
export const useTaxRate = () => {
  const { currentOrganization, currentBranch } = useOrganization();
  const { setTaxRate, taxRate } = useOrderCartStore();

  useEffect(() => {
    const updateTaxRate = async () => {
      if (!currentOrganization) return;

      try {
        const effectiveTaxRate = await taxService.getTaxRate(
          currentOrganization.id,
          currentBranch?.id
        );
        
        // Only update if the tax rate has changed
        if (effectiveTaxRate !== taxRate) {
          setTaxRate(effectiveTaxRate);
          console.log(
            `Tax rate updated to ${(effectiveTaxRate * 100).toFixed(1)}% for ${
              currentBranch ? `branch ${currentBranch.name}` : `organization ${currentOrganization.name}`
            }`
          );
        }
      } catch (error) {
        console.error('Error updating tax rate:', error);
        // Fall back to default rate if there's an error
        setTaxRate(0.1);
      }
    };

    updateTaxRate();
  }, [currentOrganization, currentBranch, setTaxRate, taxRate]);

  return {
    taxRate,
    isLoading: !currentOrganization,
  };
};
