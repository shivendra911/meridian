/**
 * PlaceFlow / Meridian — Student Portal Route Manifest (Phase 5).
 *
 * Dedicated route tree for Student self-service consuming /api/student/* endpoints.
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StudentLayout } from './layout';
import { MacOsLoadingScreen } from '../../components/ui/MacOsLoadingScreen';

// Lazy-loaded student pages
const StudentHomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.StudentHomePage })));
const StudentOpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage').then((m) => ({ default: m.StudentOpportunitiesPage })));
const DriveStoryPage = lazy(() => import('./pages/DriveStoryPage').then((m) => ({ default: m.DriveStoryPage })));
const StudentApplicationsPage = lazy(() => import('./pages/ApplicationsPage').then((m) => ({ default: m.StudentApplicationsPage })));
const StudentAcademicsPage = lazy(() => import('./pages/AcademicsPage').then((m) => ({ default: m.StudentAcademicsPage })));
const StudentProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.StudentProfilePage })));
const StudentInboxPage = lazy(() => import('./pages/InboxPage').then((m) => ({ default: m.InboxPage })));

export const StudentRoutes: React.FC = () => {
  return (
    <Suspense
      fallback={
        <MacOsLoadingScreen
          message="Loading student workspace..."
          description="Preparing dashboard, verified records, and active drives"
          fullScreen={false}
        />
      }
    >
      <Routes>
        <Route element={<StudentLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<StudentHomePage />} />
          <Route path="opportunities" element={<StudentOpportunitiesPage />} />
          <Route path="opportunities/:id" element={<DriveStoryPage />} />
          <Route path="applications" element={<StudentApplicationsPage />} />
          <Route path="inbox" element={<StudentInboxPage />} />
          <Route path="academics" element={<StudentAcademicsPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="*" element={<Navigate to="home" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default StudentRoutes;
