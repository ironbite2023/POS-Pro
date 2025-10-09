'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { organizationService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type Branch = Database['public']['Tables']['branches']['Row'];

interface OrganizationContextType {
  currentOrganization: Organization | null;
  currentBranch: Branch | null;
  branches: Branch[];
  loading: boolean;
  switchBranch: (branchId: string) => void;
  refreshOrganization: () => Promise<void>;
  refreshBranches: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Load organization data
  const loadOrganization = useCallback(async (organizationId: string) => {
    try {
      const org = await organizationService.getById(organizationId);
      setCurrentOrganization(org);
    } catch (error) {
      console.error('Error loading organization:', error);
      setCurrentOrganization(null);
    }
  }, []);

  // Load branches
  const loadBranches = useCallback(async (organizationId: string) => {
    try {
      console.log('OrganizationContext: Loading branches for org:', organizationId);
      const branchList = await organizationService.getBranches(organizationId);
      console.log('OrganizationContext: Loaded branches:', branchList.length, branchList);
      setBranches(branchList);
      
      // Set default branch (first available branch or from localStorage)
      const savedBranchId = localStorage.getItem('currentBranchId');
      const defaultBranch = savedBranchId
        ? branchList.find(b => b.id === savedBranchId) || branchList[0]
        : branchList[0];
      
      if (defaultBranch) {
        console.log('OrganizationContext: Setting default branch:', defaultBranch.name);
        setCurrentBranch(defaultBranch);
        localStorage.setItem('currentBranchId', defaultBranch.id);
      } else {
        console.warn('OrganizationContext: No default branch found');
      }
    } catch (error) {
      console.error('OrganizationContext: Error loading branches:', error);
      setBranches([]);
    }
  }, []);

  // Initialize organization and branches when user profile is loaded
  useEffect(() => {
    const initializeOrganization = async () => {
      if (userProfile?.organization_id) {
        setLoading(true);
        try {
          await Promise.all([
            loadOrganization(userProfile.organization_id),
            loadBranches(userProfile.organization_id),
          ]);
        } catch (error) {
          console.error('Error initializing organization:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeOrganization();
  }, [userProfile, loadOrganization, loadBranches]);

  // Switch branch
  const switchBranch = useCallback((branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
      localStorage.setItem('currentBranchId', branch.id);
    }
  }, [branches]);

  // Refresh organization data
  const refreshOrganization = useCallback(async () => {
    if (currentOrganization) {
      await loadOrganization(currentOrganization.id);
    }
  }, [currentOrganization, loadOrganization]);

  // Refresh branches
  const refreshBranches = useCallback(async () => {
    if (currentOrganization) {
      await loadBranches(currentOrganization.id);
    }
  }, [currentOrganization, loadBranches]);

  const value: OrganizationContextType = {
    currentOrganization,
    currentBranch,
    branches,
    loading,
    switchBranch,
    refreshOrganization,
    refreshBranches,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
