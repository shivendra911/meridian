/**
 * PlaceFlow / Meridian — Management Portal Route Manifest (Phase 6).
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ManagementLayout } from './layout';

import { ManagementHomePage } from './pages/HomePage';
import { ManagementPlacementsPage } from './pages/PlacementsPage';
import { ManagementAccreditationPage } from './pages/AccreditationPage';
import { ManagementCompliancePage } from './pages/CompliancePage';

export const ManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<ManagementLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<ManagementHomePage />} />
        <Route path="placements" element={<ManagementPlacementsPage />} />
        <Route path="accreditation" element={<ManagementAccreditationPage />} />
        <Route path="compliance" element={<ManagementCompliancePage />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
};

export default ManagementRoutes;
