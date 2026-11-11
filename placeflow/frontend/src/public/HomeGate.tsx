/**
 * Root route gate: visitors see the public landing page, signed-in users
 * are sent straight to their workspace.
 */
import React from 'react';
import { useAuth } from '../core/auth/useAuth';
import { PortalRedirect } from '../app/PortalRedirect';
import { LandingPage } from './LandingPage';

export const HomeGate: React.FC = () => {
  const { status } = useAuth();
  if (status === 'authed') return <PortalRedirect />;
  return <LandingPage />;
};
