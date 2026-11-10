/**
 * PlaceFlow / Meridian — Security Route Guards & Access Controls (Phase 4).
 *
 * Enforces client-side navigation boundaries backed by server RBAC rules.
 */

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ForbiddenPage } from '../../app/ForbiddenPage';

interface GuardProps {
  children?: React.ReactNode;
}

/**
 * Ensures user is authenticated; redirects to /login?next= if anonymous.
 * Displays loading state to prevent page flicker before auth verification.
 */
export const RequireAuth: React.FC<GuardProps> = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span className="text-xs text-ink-muted">Authenticating workspace...</span>
        </div>
      </div>
    );
  }

  if (status === 'anon') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

/**
 * Restricts access to members entitled to the specified portal workspace.
 * Renders ForbiddenPage (403) when user lacks the portal.
 */
export const RequirePortal: React.FC<GuardProps & { portal: string }> = ({ portal, children }) => {
  const { status, hasPortal } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!hasPortal(portal)) {
    return <ForbiddenPage />;
  }

  return children ? <>{children}</> : <Outlet />;
};

/**
 * Requires at least one of the listed permission keys.
 */
export const RequirePermission: React.FC<GuardProps & { any: string[] }> = ({ any: permissions, children }) => {
  const { status, canAny } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (!canAny(permissions)) {
    return <ForbiddenPage />;
  }

  return children ? <>{children}</> : <Outlet />;
};

/**
 * Presentational conditional renderer to hide/show buttons or controls based on permissions.
 */
export const Can: React.FC<{ permission: string; children: React.ReactNode }> = ({ permission, children }) => {
  const { can } = useAuth();

  if (!can(permission)) {
    return null;
  }

  return <>{children}</>;
};

