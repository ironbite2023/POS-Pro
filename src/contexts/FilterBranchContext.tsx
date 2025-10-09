'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
// This context is deprecated - use OrganizationContext instead  
// Keeping minimal implementation for backward compatibility
import type { Database } from '@/lib/supabase/database.types';

type Branch = Database['public']['Tables']['branches']['Row'];

// Legacy interface for backward compatibility
interface OrganizationEntity extends Branch {}

interface FilterBranchContextType {
  activeBranchFilter: OrganizationEntity | null;
  setActiveBranchFilter: (branch: OrganizationEntity | null) => void;
}

const FilterBranchContext = createContext<FilterBranchContextType>({
  activeBranchFilter: null,
  setActiveBranchFilter: () => {},
});

export function FilterBranchProvider({ children }: { children: ReactNode }) {
  const [activeBranchFilter, setActiveBranchFilter] = useState<OrganizationEntity | null>(null);

  return (
    <FilterBranchContext.Provider value={{ activeBranchFilter, setActiveBranchFilter }}>
      {children}
    </FilterBranchContext.Provider>
  );
}

export function useFilterBranch() {
  return useContext(FilterBranchContext);
} 