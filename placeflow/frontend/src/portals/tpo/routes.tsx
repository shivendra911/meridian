/**
 * PlaceFlow / Meridian — TPO Portal Route Manifest (Phase 4).
 *
 * Scoped route tree for Placement Officers, Corporate Relations, and Coordinators.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TpoLayout } from './layout';

// Migrated TPO Pages
import { OverviewPage } from './pages/OverviewPage';
import { DrivesPage } from './pages/DrivesPage';
import { DriveDetailPage } from './pages/DriveDetailPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { CompanyDetailPage } from './pages/CompanyDetailPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { InterviewsPage } from './pages/InterviewsPage';
import { OffersPage } from './pages/OffersPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { RenegeRadarPage } from './pages/RenegeRadarPage';
import { FairnessPage } from './pages/FairnessPage';
import { ReportsPage } from './pages/ReportsPage';
import { SuperdayPage } from './pages/SuperdayPage';
import { WhatIfPage } from './pages/WhatIfPage';
import { useNavigate } from 'react-router-dom';

const WhatIfRouteWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <WhatIfPage studentId="STU001" onBack={() => navigate('/tpo/students')} />;
};

export const TpoRoutes: React.FC = () => {
  return (
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
        <Route path="insights/whatif" element={<WhatIfRouteWrapper />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
};

export default TpoRoutes;
