/**
 * PlaceFlow / Meridian — HOD Portal Route Manifest (Phase 6).
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HodLayout } from './layout';

import { HodHomePage } from './pages/HomePage';
import { HodStudentsPage } from './pages/StudentsPage';
import { HodFacultyPage } from './pages/FacultyPage';
import { HodCurriculumPage } from './pages/CurriculumPage';
import { HodPlacementsPage } from './pages/PlacementsPage';
import { HodApprovalsPage } from './pages/ApprovalsPage';

export const HodRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<HodLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<HodHomePage />} />
        <Route path="students" element={<HodStudentsPage />} />
        <Route path="faculty" element={<HodFacultyPage />} />
        <Route path="curriculum" element={<HodCurriculumPage />} />
        <Route path="placements" element={<HodPlacementsPage />} />
        <Route path="approvals" element={<HodApprovalsPage />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
};

export default HodRoutes;
