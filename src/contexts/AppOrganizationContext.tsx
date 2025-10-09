'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
// This context is deprecated - use OrganizationContext instead
// Keeping minimal implementation for backward compatibility
import type { Database } from '@/lib/supabase/database.types';

type Branch = Database['public']['Tables']['branches']['Row'];

// Legacy interface for backward compatibility
interface OrganizationEntity extends Branch {}

interface AppOrganizationContextType {
  activeEntity: OrganizationEntity;
  setActiveEntity: (entity: OrganizationEntity) => void;
}

export const AppOrganizationContext = createContext<AppOrganizationContextType>({
  activeEntity: {} as OrganizationEntity,
  setActiveEntity: () => {},
});

interface AppOrganizationProviderProps {
  children: ReactNode;
}

export const AppOrganizationProvider = ({ children }: AppOrganizationProviderProps) => {
  // Default placeholder for backward compatibility
  const [activeEntity, setActiveEntity] = useState<OrganizationEntity>({
    id: 'default',
    name: 'Default Organization',
    organization_id: '',
    address: null,
    business_hours: null,
    code: 'DEF',
    email: null,
    phone: null,
    region: 'default',
    services: null,
    settings: null,
    status: 'active',
    timezone: 'UTC',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  return (
    <AppOrganizationContext.Provider value={{ activeEntity, setActiveEntity }}>
      {children}
    </AppOrganizationContext.Provider>
  );
};

export const useAppOrganization = () => useContext(AppOrganizationContext); 