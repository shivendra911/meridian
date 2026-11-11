import React from 'react';
import { AppShell } from '../../app/shell/AppShell';
import { HOD_NAV_ITEMS } from './nav';

export const HodLayout: React.FC = () => {
  return <AppShell portal="hod" nav={HOD_NAV_ITEMS} />;
};

export default HodLayout;
