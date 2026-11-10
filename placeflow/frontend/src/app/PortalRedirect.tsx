/**
 * PlaceFlow / Meridian — Portal Workspace Redirection Dispatcher (Phase 4).
 *
 * Redirects the authenticated user to their role's authoritative default portal home.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../core/auth/useAuth';

export const PortalRedirect: React.FC = () => {
  const { me, status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === 'anon' || !me) {
    return <Navigate to="/login" replace />;
  }

  const target = me.default_portal || (me.portals && me.portals[0]) || 'student';
  return <Navigate to={`/${target}/home`} replace />;
};

