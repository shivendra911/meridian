import React from 'react';
import { AppShell } from '../../app/shell/AppShell';
import { ADMIN_NAV_ITEMS } from './nav';

export const AdminLayout: React.FC = () => {
  return <AppShell portal="admin" nav={ADMIN_NAV_ITEMS} />;
};

export default AdminLayout;
