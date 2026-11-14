/**
 * PlaceFlow / Meridian — Portal Workspace Redirection Dispatcher (Phase 4).
 *
 * Redirects the authenticated user to their role's authoritative default portal home.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { useAuth } from '../core/auth/useAuth';
import { Button } from '../ui';

export const PortalRedirect: React.FC = () => {
  const { me, status, logout } = useAuth();

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

  if (!me.default_portal && (!me.portals || me.portals.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-canvas font-sans p-6 text-center">
        <div className="max-w-md w-full p-8 bg-surface rounded-xl border border-line shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mx-auto text-ink-muted">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-ink">Your account has no workspace yet</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            You are signed in as <span className="font-medium text-ink">{me.display_name}</span>. No active portal workspace has been provisioned for this account role.
          </p>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => logout()} className="w-full">
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const target = me.default_portal || (me.portals && me.portals[0]) || 'student';
  return <Navigate to={`/${target}/home`} replace />;
};

