import { useContext } from 'react';
import { TenantContext } from './TenantContext';

export const useTenant = () => useContext(TenantContext);

