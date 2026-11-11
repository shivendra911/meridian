/**
 * PlaceFlow / Meridian — Core Application Router (Phase 4).
 *
 * Enforces role-partitioned workspaces:
 * - Public: /login
 * - Authenticated: / (redirects to default portal), /forbidden, /404
 * - Portals: /student/*, /tpo/*, /faculty/*, /hod/*, /management/*, /admin/*
 * - Legacy migration redirects for backwards compatibility.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Core Auth & Guards
import { RequireAuth, RequirePortal } from '../core/auth/guards';
import { LoginPage } from '../core/auth/LoginPage';
import { PortalRedirect } from './PortalRedirect';
import { HomeGate } from '../public/HomeGate';
import { ForbiddenPage } from './ForbiddenPage';
import { NotFoundPage } from './NotFoundPage';

// Portal Root Trees
import { StudentRoutes } from '../portals/student/routes';
import { TpoRoutes } from '../portals/tpo/routes';
import { FacultyRoutes } from '../portals/faculty/routes';
import { HodRoutes } from '../portals/hod/routes';
import { ManagementRoutes } from '../portals/management/routes';
import { AdminRoutes } from '../portals/admin/routes';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Authentication Route */}
      <Route path="/" element={<HomeGate />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* 2. Authenticated Portal Trees */}
      <Route element={<RequireAuth />}>

        {/* Student Workspace */}
        <Route
          path="/student/*"
          element={
            <RequirePortal portal="student">
              <StudentRoutes />
            </RequirePortal>
          }
        />

        {/* TPO Operations */}
        <Route
          path="/tpo/*"
          element={
            <RequirePortal portal="tpo">
              <TpoRoutes />
            </RequirePortal>
          }
        />

        {/* Faculty Mentorship */}
        <Route
          path="/faculty/*"
          element={
            <RequirePortal portal="faculty">
              <FacultyRoutes />
            </RequirePortal>
          }
        />

        {/* Department Head (HOD) */}
        <Route
          path="/hod/*"
          element={
            <RequirePortal portal="hod">
              <HodRoutes />
            </RequirePortal>
          }
        />

        {/* Executive Management / NIRF */}
        <Route
          path="/management/*"
          element={
            <RequirePortal portal="management">
              <ManagementRoutes />
            </RequirePortal>
          }
        />

        {/* Institutional Admin */}
        <Route
          path="/admin/*"
          element={
            <RequirePortal portal="admin">
              <AdminRoutes />
            </RequirePortal>
          }
        />

        {/* 3. Migration Redirections (Legacy paths -> Role-Partitioned Portals) */}
        <Route path="/home" element={<PortalRedirect />} />
        <Route path="/placement/drives/*" element={<Navigate to="/tpo/drives" replace />} />
        <Route path="/companies/*" element={<Navigate to="/tpo/companies" replace />} />
        <Route path="/applications" element={<Navigate to="/tpo/applications" replace />} />
        <Route path="/interviews" element={<Navigate to="/tpo/interviews" replace />} />
        <Route path="/offers" element={<Navigate to="/tpo/offers" replace />} />
        <Route path="/students/*" element={<Navigate to="/tpo/students" replace />} />
        <Route path="/insights/*" element={<Navigate to="/tpo/insights/renege" replace />} />
        <Route path="/opportunities" element={<Navigate to="/student/opportunities" replace />} />
        <Route path="/me/applications" element={<Navigate to="/student/applications" replace />} />
        <Route path="/me/profile" element={<Navigate to="/student/profile" replace />} />
        <Route path="/me/academics" element={<Navigate to="/student/academics" replace />} />
        <Route path="/teaching/courses" element={<Navigate to="/faculty/courses" replace />} />
        <Route path="/advising" element={<Navigate to="/faculty/mentees" replace />} />
        <Route path="/department/*" element={<Navigate to="/hod/home" replace />} />
        <Route path="/outcomes/*" element={<Navigate to="/management/home" replace />} />
        <Route path="/compliance/*" element={<Navigate to="/management/home" replace />} />
        <Route path="/institution/hierarchy" element={<Navigate to="/admin/hierarchy" replace />} />

        {/* 4. Not Found Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;

