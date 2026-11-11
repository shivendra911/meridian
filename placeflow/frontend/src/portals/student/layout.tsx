import React from 'react';
import { AppShell } from '../../app/shell/AppShell';
import { STUDENT_NAV_ITEMS } from './nav';

export const StudentLayout: React.FC = () => {
  return <AppShell portal="student" nav={STUDENT_NAV_ITEMS} />;
};

export default StudentLayout;
