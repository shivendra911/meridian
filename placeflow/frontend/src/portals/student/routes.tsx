/**
 * PlaceFlow / Meridian — Student Portal Route Manifest (Phase 5).
 *
 * Dedicated route tree for Student self-service consuming /api/student/* endpoints.
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StudentLayout } from './layout';

// Lazy-loaded student pages
const StudentHomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.StudentHomePage })));
const StudentOpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage').then((m) => ({ default: m.StudentOpportunitiesPage })));
const StudentApplicationsPage = lazy(() => import('./pages/ApplicationsPage').then((m) => ({ default: m.StudentApplicationsPage })));
const StudentAcademicsPage = lazy(() => import('./pages/AcademicsPage').then((m) => ({ default: m.StudentAcademicsPage })));
const StudentProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.StudentProfilePage })));

export const StudentRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-ink-muted">Loading student portal...</div>}>
      <Routes>
        <Route element={<StudentLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<StudentHomePage />} />
          <Route path="opportunities" element={<StudentOpportunitiesPage />} />
          <Route path="applications" element={<StudentApplicationsPage />} />
          <Route path="academics" element={<StudentAcademicsPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="*" element={<Navigate to="home" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default StudentRoutes;
