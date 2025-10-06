'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { purchasingService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];

interface PurchasingMetrics {
  totalSuppliers: number;
  activePurchaseOrders: number;
  pendingReceiving: number;
  monthlySpend: number;
  averageOrderValue: number;
  topSupplierByVolume: string;
}

interface UsePurchasingDataReturn {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  metrics: PurchasingMetrics;
  loading: boolean;
  error: Error | null;
  refetchSuppliers: () => Promise<void>;
  refetchPurchaseOrders: () => Promise<void>;
}

export const usePurchasingData = (): UsePurchasingDataReturn => {
  const { currentOrganization, currentBranch } = useOrganization();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [metrics, setMetrics] = useState<PurchasingMetrics>({
    totalSuppliers: 0,
    activePurchaseOrders: 0,
    pendingReceiving: 0,
    monthlySpend: 0,
    averageOrderValue: 0,
    topSupplierByVolume: '-',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuppliers = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const suppliersData = await purchasingService.getSuppliers(currentOrganization.id);
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      throw err;
    }
  }, [currentOrganization]);

  const fetchPurchaseOrders = useCallback(async () => {
    if (!currentBranch) return;

    try {
      const purchaseOrdersData = await purchasingService.getPurchaseOrders(currentBranch.id);
      setPurchaseOrders(purchaseOrdersData);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      throw err;
    }
  }, [currentBranch]);

  const calculateMetrics = useCallback(() => {
    const totalSuppliers = suppliers.length;
    const activePurchaseOrders = purchaseOrders.filter(
      (po) => po.status === 'pending' || po.status === 'approved' || po.status === 'sent'
    ).length;
    const pendingReceiving = purchaseOrders.filter((po) => po.status === 'sent').length;

    // Calculate monthly spend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyOrders = purchaseOrders.filter(
      (po) =>
        new Date(po.created_at || '') >= thirtyDaysAgo && po.status === 'completed'
    );
    const monthlySpend = monthlyOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0);
    const averageOrderValue = monthlyOrders.length > 0 ? monthlySpend / monthlyOrders.length : 0;

    // Top supplier by volume
    const supplierVolumes = suppliers.map((supplier) => ({
      name: supplier.name,
      volume: purchaseOrders
        .filter((po) => po.supplier_id === supplier.id && po.status === 'completed')
        .reduce((sum, po) => sum + (po.total_amount || 0), 0),
    }));
    const topSupplier = supplierVolumes.sort((a, b) => b.volume - a.volume)[0];

    setMetrics({
      totalSuppliers,
      activePurchaseOrders,
      pendingReceiving,
      monthlySpend,
      averageOrderValue,
      topSupplierByVolume: topSupplier?.name || '-',
    });
  }, [suppliers, purchaseOrders]);

  const fetchAllData = useCallback(async () => {
    if (!currentOrganization || !currentBranch) return;

    try {
      setLoading(true);
      setError(null);

      await Promise.all([fetchSuppliers(), fetchPurchaseOrders()]);
    } catch (err) {
      console.error('Error fetching purchasing data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, currentBranch, fetchSuppliers, fetchPurchaseOrders]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  return {
    suppliers,
    purchaseOrders,
    metrics,
    loading,
    error,
    refetchSuppliers: fetchSuppliers,
    refetchPurchaseOrders: fetchPurchaseOrders,
  };
};
