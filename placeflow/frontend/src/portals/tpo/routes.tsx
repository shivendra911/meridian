/**
 * PlaceFlow / Meridian — TPO Portal Route Manifest (Phase 4).
 *
 * Scoped route tree for Placement Officers, Corporate Relations, and Coordinators.
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { TpoLayout } from './layout';

// Lazy-loaded TPO Pages
const OverviewPage = lazy(() => import('./pages/OverviewPage').then((m) => ({ default: m.OverviewPage })));
const DrivesPage = lazy(() => import('./pages/DrivesPage').then((m) => ({ default: m.DrivesPage })));
const DriveDetailPage = lazy(() => import('./pages/DriveDetailPage').then((m) => ({ default: m.DriveDetailPage })));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage').then((m) => ({ default: m.CompaniesPage })));
const CompanyDetailPage = lazy(() => import('./pages/CompanyDetailPage').then((m) => ({ default: m.CompanyDetailPage })));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })));
const InterviewsPage = lazy(() => import('./pages/InterviewsPage').then((m) => ({ default: m.InterviewsPage })));
const OffersPage = lazy(() => import('./pages/OffersPage').then((m) => ({ default: m.OffersPage })));
const StudentsPage = lazy(() => import('./pages/StudentsPage').then((m) => ({ default: m.StudentsPage })));
const StudentDetailPage = lazy(() => import('./pages/StudentDetailPage').then((m) => ({ default: m.StudentDetailPage })));

// Heavy Analytical Insights Views (Code-Split)
const RenegeRadarPage = lazy(() => import('./pages/RenegeRadarPage').then((m) => ({ default: m.RenegeRadarPage })));
const FairnessPage = lazy(() => import('./pages/FairnessPage').then((m) => ({ default: m.FairnessPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SuperdayPage = lazy(() => import('./pages/SuperdayPage').then((m) => ({ default: m.SuperdayPage })));
const WhatIfPage = lazy(() => import('./pages/WhatIfPage').then((m) => ({ default: m.WhatIfPage })));

const WhatIfRouteWrapper: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  if (!studentId) {
    return <Navigate to="/tpo/students" replace />;
  }
  return <WhatIfPage studentId={studentId} onBack={() => navigate(`/tpo/students/${studentId}`)} />;
};

export const TpoRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-ink-muted">Loading placement operations...</div>}>
      <Routes>
        <Route element={<TpoLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<OverviewPage />} />
          <Route path="drives" element={<DrivesPage />} />
          <Route path="drives/:id" element={<DriveDetailPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="companies/:id" element={<CompanyDetailPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="interviews" element={<InterviewsPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:id" element={<StudentDetailPage />} />
          <Route path="insights/renege" element={<RenegeRadarPage />} />
          <Route path="insights/fairness" element={<FairnessPage />} />
          <Route path="insights/reports" element={<ReportsPage />} />
          <Route path="insights/superday" element={<SuperdayPage />} />
          <Route path="insights/whatif/:studentId" element={<WhatIfRouteWrapper />} />
          <Route path="insights/whatif" element={<Navigate to="/tpo/students" replace />} />
          <Route path="*" element={<Navigate to="home" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default TpoRoutes;
