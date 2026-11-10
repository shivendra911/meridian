/**
 * PlaceFlow / Meridian — Student Portal Route Manifest (Phase 5).
 *
 * Dedicated route tree for Student self-service consuming /api/student/* endpoints.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StudentLayout } from './layout';

// End-to-end self-scoped student pages
import { StudentHomePage } from './pages/HomePage';
import { StudentOpportunitiesPage } from './pages/OpportunitiesPage';
import { StudentApplicationsPage } from './pages/ApplicationsPage';
import { StudentAcademicsPage } from './pages/AcademicsPage';
import { StudentProfilePage } from './pages/ProfilePage';

export const StudentRoutes: React.FC = () => {
  return (
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
  );
};

export default StudentRoutes;
