/**
 * PlaceFlow / Meridian — Faculty Portal Route Manifest (Phase 6).
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FacultyLayout } from './layout';

import { FacultyHomePage } from './pages/HomePage';
import { FacultyCoursesPage } from './pages/CoursesPage';
import { FacultyMenteesPage } from './pages/MenteesPage';
import { FacultyApprovalsPage } from './pages/ApprovalsPage';

export const FacultyRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<FacultyLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<FacultyHomePage />} />
        <Route path="courses" element={<FacultyCoursesPage />} />
        <Route path="mentees" element={<FacultyMenteesPage />} />
        <Route path="approvals" element={<FacultyApprovalsPage />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
};

export default FacultyRoutes;
