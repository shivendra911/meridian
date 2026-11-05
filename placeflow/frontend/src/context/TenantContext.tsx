import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlatformTenant, PlatformInstitution, Campus } from '../types';
import { api, setApiTenantHeader } from '../api';

interface TenantContextType {
  tenants: PlatformTenant[];
  activeTenant: PlatformTenant | null;
  institutions: PlatformInstitution[];
  activeInstitution: PlatformInstitution | null;
  campuses: Campus[];
  activeCampus: Campus | null;
  loading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  switchInstitution: (institutionId: string) => void;
  switchCampus: (campusId: string) => void;
  refreshTenants: () => Promise<void>;
}

export const TenantContext = createContext<TenantContextType>({
  tenants: [],
  activeTenant: null,
  institutions: [],
  activeInstitution: null,
  campuses: [],
  activeCampus: null,
  loading: true,
  switchTenant: async () => {},
  switchInstitution: () => {},
  switchCampus: () => {},
  refreshTenants: async () => {},
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<PlatformTenant | null>(null);
  const [institutions, setInstitutions] = useState<PlatformInstitution[]>([]);
  const [activeInstitution, setActiveInstitution] = useState<PlatformInstitution | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [activeCampus, setActiveCampus] = useState<Campus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadInstitutionsAndCampuses = async (tenantId: string) => {
    try {
      const [instRes, campRes] = await Promise.all([
        api.getInstitutions(tenantId),
        api.getCampuses(tenantId),
      ]);
      setInstitutions(instRes.institutions || []);
      if (instRes.institutions && instRes.institutions.length > 0) {
        setActiveInstitution(instRes.institutions[0]);
      } else {
        setActiveInstitution(null);
      }

      setCampuses(campRes.campuses || []);
      if (campRes.campuses && campRes.campuses.length > 0) {
        setActiveCampus(campRes.campuses[0]);
      } else {
        setActiveCampus(null);
      }
    } catch (err) {
      console.error('Failed to load institutions or campuses for tenant', tenantId, err);
      setInstitutions([]);
      setCampuses([]);
      setActiveInstitution(null);
      setActiveCampus(null);
    }
  };

  const refreshTenants = async () => {
    setLoading(true);
    try {
      const res = await api.getTenants();
      const list = res.tenants || [];
      setTenants(list);

      const savedTenantId = localStorage.getItem('placeflow_tenant_id');
      const matched = list.find((t) => t.id === savedTenantId) || list.find((t) => t.slug === 'iit-bombay') || list[0] || null;

      if (matched) {
        setActiveTenant(matched);
        setApiTenantHeader(matched.id);
        await loadInstitutionsAndCampuses(matched.id);
      }
    } catch (err) {
      console.error('Failed to load tenants list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTenants();
  }, []);

  const switchTenant = async (tenantId: string) => {
    const target = tenants.find((t) => t.id === tenantId);
    if (target) {
      setActiveTenant(target);
      setApiTenantHeader(target.id);
      await loadInstitutionsAndCampuses(target.id);
    }
  };

  const switchInstitution = (institutionId: string) => {
    const target = institutions.find((i) => i.institution_id === institutionId);
    if (target) {
      setActiveInstitution(target);
    }
  };

  const switchCampus = (campusId: string) => {
    const target = campuses.find((c) => c.campus_id === campusId);
    if (target) {
      setActiveCampus(target);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenants,
        activeTenant,
        institutions,
        activeInstitution,
        campuses,
        activeCampus,
        loading,
        switchTenant,
        switchInstitution,
        switchCampus,
        refreshTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export { useTenant } from './useTenant';

