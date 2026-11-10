/**
 * PlaceFlow / Meridian — Admin Portal Route Manifest (Phase 6).
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layout';

import { AdminHomePage } from './pages/HomePage';
import { InstitutionalArchitecturePage } from '../../pages/InstitutionalArchitecturePage';
import { IdentityAccessPage } from '../../pages/IdentityAccessPage';
import { AcademicLifecyclePage } from '../../pages/AcademicLifecyclePage';
import { InstitutionalHierarchyPage } from '../../pages/InstitutionalHierarchyPage';
import { AgentRunsPage } from '../../pages/AgentRunsPage';

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<AdminHomePage />} />
        <Route path="architecture" element={<InstitutionalArchitecturePage />} />
        <Route path="hierarchy" element={<InstitutionalHierarchyPage />} />
        <Route path="iam" element={<IdentityAccessPage />} />
        <Route path="academic" element={<AcademicLifecyclePage />} />
        <Route path="ai-governance" element={<AgentRunsPage onOpenCopilot={() => {}} />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
