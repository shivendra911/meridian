import React from 'react';
import { AppShell } from '../../app/shell/AppShell';
import { FACULTY_NAV_ITEMS } from './nav';

export const FacultyLayout: React.FC = () => {
  return <AppShell portal="faculty" nav={FACULTY_NAV_ITEMS} />;
};

export default FacultyLayout;
