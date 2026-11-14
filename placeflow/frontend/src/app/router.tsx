/**
 * PlaceFlow / Meridian — Core Application Router (Phase 5).
 *
 * Enforces role-partitioned workspaces & account lifecycle:
 * - Public: /, /login, /forgot-password, /reset-password, /accept-invite, /claim, /privacy, /terms, /contact, /forbidden, /404
 * - Authenticated Account Area: /account/*, /onboarding
 * - Authenticated Portals: /student/*, /tpo/*, /faculty/*, /hod/*, /management/*, /admin/*
 * - Lazy code-splitting across portal route trees and heavy modules.
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

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
import { ForbiddenPage } from './ForbiddenPage';
import { NotFoundPage } from './NotFoundPage';
import { RouteErrorElement } from './ErrorBoundary';

// Lazy-loaded Public & Heavy Views
const HomeGate = lazy(() => import('../public/HomeGate').then((m) => ({ default: m.HomeGate })));
const PrivacyPolicyPage = lazy(() => import('../public/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('../public/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage })));
const ContactSupportPage = lazy(() => import('../public/ContactSupportPage').then((m) => ({ default: m.ContactSupportPage })));
const DevCardsPage = lazy(() => import('../pages/DevCardsPage').then((m) => ({ default: m.DevCardsPage })));

// Lazy-loaded Cross-Portal Account Area
const AccountRoutes = lazy(() => import('../account/routes').then((m) => ({ default: m.AccountRoutes })));

// Lazy-loaded Portal Root Trees
const StudentRoutes = lazy(() => import('../portals/student/routes').then((m) => ({ default: m.StudentRoutes })));
const TpoRoutes = lazy(() => import('../portals/tpo/routes').then((m) => ({ default: m.TpoRoutes })));
const FacultyRoutes = lazy(() => import('../portals/faculty/routes').then((m) => ({ default: m.FacultyRoutes })));
const HodRoutes = lazy(() => import('../portals/hod/routes').then((m) => ({ default: m.HodRoutes })));
const ManagementRoutes = lazy(() => import('../portals/management/routes').then((m) => ({ default: m.ManagementRoutes })));
const AdminRoutes = lazy(() => import('../portals/admin/routes').then((m) => ({ default: m.AdminRoutes })));

const WildcardRedirect: React.FC<{ to: string }> = ({ to }) => {
  const params = useParams();
  const rest = params['*'];
  return <Navigate to={rest ? `${to}/${rest}` : to} replace />;
};

const FallbackLoader = () => (
  <div className="flex items-center justify-center min-h-[40vh] p-8 text-xs text-ink-muted">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
      <span>Loading workspace...</span>
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<FallbackLoader />}>
      <Routes>
        {/* 1. Public Authentication & Lifecycle Routes */}
        <Route path="/" element={<HomeGate />} errorElement={<RouteErrorElement />} />
        <Route path="/login" element={<LoginPage />} errorElement={<RouteErrorElement />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} errorElement={<RouteErrorElement />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} errorElement={<RouteErrorElement />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} errorElement={<RouteErrorElement />} />
        <Route path="/claim" element={<ClaimPage />} errorElement={<RouteErrorElement />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} errorElement={<RouteErrorElement />} />
        <Route path="/terms" element={<TermsOfServicePage />} errorElement={<RouteErrorElement />} />
        <Route path="/contact" element={<ContactSupportPage />} errorElement={<RouteErrorElement />} />
        <Route path="/forbidden" element={<ForbiddenPage />} errorElement={<RouteErrorElement />} />

        {/* Dev-only Card System Review Gallery (PLATFORM_SPEC) */}
        {import.meta.env.DEV && (
          <Route path="/dev/cards" element={<DevCardsPage />} errorElement={<RouteErrorElement />} />
        )}

        {/* 2. Authenticated Routes */}
        <Route element={<RequireAuth />} errorElement={<RouteErrorElement />}>
          {/* First-login Onboarding Stepper */}
          <Route path="/onboarding" element={<OnboardingPage />} errorElement={<RouteErrorElement />} />

          {/* Shared Cross-Portal Account Area */}
          <Route path="/account/*" element={<AccountRoutes />} errorElement={<RouteErrorElement />} />

          {/* Student Workspace */}
          <Route
            path="/student/*"
            errorElement={<RouteErrorElement />}
            element={
              <RequirePortal portal="student">
                <StudentRoutes />
              </RequirePortal>
            }
          />

          {/* TPO Operations */}
          <Route
            path="/tpo/*"
            errorElement={<RouteErrorElement />}
            element={
              <RequirePortal portal="tpo">
                <TpoRoutes />
              </RequirePortal>
            }
          />

          {/* Faculty Mentorship */}
          <Route
            path="/faculty/*"
            errorElement={<RouteErrorElement />}
            element={
              <RequirePortal portal="faculty">
                <FacultyRoutes />
              </RequirePortal>
            }
          />

          {/* Department Head (HOD) */}
          <Route
            path="/hod/*"
            errorElement={<RouteErrorElement />}
            element={
              <RequirePortal portal="hod">
                <HodRoutes />
              </RequirePortal>
            }
          />

          {/* Executive Management / NIRF */}
          <Route
            path="/management/*"
            errorElement={<RouteErrorElement />}
            element={
              <RequirePortal portal="management">
                <ManagementRoutes />
              </RequirePortal>
            }
          />

          {/* Institutional Admin */}
          <Route
            path="/admin/*"
            errorElement={<RouteErrorElement />}
            element={
              <RequirePortal portal="admin">
                <AdminRoutes />
              </RequirePortal>
            }
          />

          {/* 3. Migration Redirections (Legacy paths -> Role-Partitioned Portals) */}
          <Route path="/home" element={<PortalRedirect />} />
          <Route path="/placement/drives/*" element={<WildcardRedirect to="/tpo/drives" />} />
          <Route path="/companies/*" element={<WildcardRedirect to="/tpo/companies" />} />
          <Route path="/applications" element={<Navigate to="/tpo/applications" replace />} />
          <Route path="/interviews" element={<Navigate to="/tpo/interviews" replace />} />
          <Route path="/offers" element={<Navigate to="/tpo/offers" replace />} />
          <Route path="/students/*" element={<WildcardRedirect to="/tpo/students" />} />
          <Route path="/insights/*" element={<WildcardRedirect to="/tpo/insights" />} />
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
    </Suspense>
  );
};

export default AppRouter;
