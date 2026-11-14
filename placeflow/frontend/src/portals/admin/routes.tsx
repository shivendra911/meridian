/**
 * PlaceFlow / Meridian — Admin Portal Route Manifest (Phase 6).
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layout';

const AdminHomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.AdminHomePage })));
const InstitutionalArchitecturePage = lazy(() => import('../../pages/InstitutionalArchitecturePage').then((m) => ({ default: m.InstitutionalArchitecturePage })));
const IdentityAccessPage = lazy(() => import('../../pages/IdentityAccessPage').then((m) => ({ default: m.IdentityAccessPage })));
const AcademicLifecyclePage = lazy(() => import('../../pages/AcademicLifecyclePage').then((m) => ({ default: m.AcademicLifecyclePage })));
const InstitutionalHierarchyPage = lazy(() => import('../../pages/InstitutionalHierarchyPage').then((m) => ({ default: m.InstitutionalHierarchyPage })));
const AgentRunsPage = lazy(() => import('../../pages/AgentRunsPage').then((m) => ({ default: m.AgentRunsPage })));

export const AdminRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-ink-muted">Loading admin workspace...</div>}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<AdminHomePage />} />
          <Route path="architecture" element={<InstitutionalArchitecturePage />} />
          <Route path="hierarchy" element={<InstitutionalHierarchyPage />} />
          <Route path="iam" element={<IdentityAccessPage />} />
          <Route path="academic" element={<AcademicLifecyclePage />} />
          <Route path="ai-governance" element={<AgentRunsPage />} />
          <Route path="*" element={<Navigate to="home" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
