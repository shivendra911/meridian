import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AccountLayout } from './layout';
import { AccountProfilePage } from './pages/AccountProfilePage';
import { AccountSecurityPage } from './pages/AccountSecurityPage';
import { AccountNotificationsPage } from './pages/AccountNotificationsPage';
import { AccountPrivacyPage } from './pages/AccountPrivacyPage';

export const AccountRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AccountLayout />}>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<AccountProfilePage />} />
        <Route path="security" element={<AccountSecurityPage />} />
        <Route path="notifications" element={<AccountNotificationsPage />} />
        <Route path="privacy" element={<AccountPrivacyPage />} />
        <Route path="*" element={<Navigate to="profile" replace />} />
      </Route>
    </Routes>
  );
};

export default AccountRoutes;
