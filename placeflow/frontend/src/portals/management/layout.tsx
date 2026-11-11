import React from 'react';
import { AppShell } from '../../app/shell/AppShell';
import { MANAGEMENT_NAV_ITEMS } from './nav';

export const ManagementLayout: React.FC = () => {
  return <AppShell portal="management" nav={MANAGEMENT_NAV_ITEMS} />;
};

export default ManagementLayout;
