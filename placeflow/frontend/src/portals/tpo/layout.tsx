import React from 'react';
import { AppShell } from '../../app/shell/AppShell';
import { TPO_NAV_ITEMS } from './nav';

export const TpoLayout: React.FC = () => {
  return <AppShell portal="tpo" nav={TPO_NAV_ITEMS} />;
};

export default TpoLayout;
