/**
 * PlaceFlow / Meridian — Core Application Router (Phase 5).
 *
 * Enforces role-partitioned workspaces & account lifecycle:
 * - Public: /, /login, /forgot-password, /reset-password, /accept-invite, /claim, /privacy, /terms, /contact, /forbidden, /404
 * - Authenticated Account Area: /account/*, /onboarding
 * - Authenticated Portals: /student/*, /tpo/*, /faculty/*, /hod/*, /management/*, /admin/*
 * - Legacy migration redirects for backwards compatibility.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Core Auth & Guards
import { RequireAuth, RequirePortal } from '../core/auth/guards';
import { LoginPage } from '../core/auth/LoginPage';
import { ForgotPasswordPage } from '../core/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../core/auth/ResetPasswordPage';
import { AcceptInvitePage } from '../core/auth/AcceptInvitePage';
import { ClaimPage } from '../core/auth/ClaimPage';
import { OnboardingPage } from '../core/auth/OnboardingPage';

// Public & Static Pages
import { PortalRedirect } from './PortalRedirect';
import { HomeGate } from '../public/HomeGate';
import { ForbiddenPage } from './ForbiddenPage';
import { NotFoundPage } from './NotFoundPage';
import { DevCardsPage } from '../pages/DevCardsPage';
import { PrivacyPolicyPage } from '../public/PrivacyPolicyPage';
import { TermsOfServicePage } from '../public/TermsOfServicePage';
import { ContactSupportPage } from '../public/ContactSupportPage';

// Account Area (Cross-Portal)
import { AccountRoutes } from '../account/routes';

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
      {/* 1. Public Authentication & Lifecycle Routes */}
      <Route path="/" element={<HomeGate />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/claim" element={<ClaimPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/contact" element={<ContactSupportPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Dev-only Card System Review Gallery (PLATFORM_SPEC) */}
      {import.meta.env.DEV && (
        <Route path="/dev/cards" element={<DevCardsPage />} />
      )}

      {/* 2. Authenticated Routes */}
      <Route element={<RequireAuth />}>
        {/* First-login Onboarding Stepper */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Shared Cross-Portal Account Area */}
        <Route path="/account/*" element={<AccountRoutes />} />

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
