/**
 * PlaceFlow / Meridian — AuthProvider Context & RBAC Evaluator (Phase 4).
 *
 * Implements the contract defined in docs/RBAC_SPEC.md Section 5:
 * - Bootstraps principal identity from GET /api/auth/me/
 * - Exposes login / logout / switchContext mutations
 * - Provides coarse permission checks: can(perm), canAny(perms), hasPortal(portal)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { client } from '../api/client';
import { ApiError } from '../api/errors';

export interface AuthAssignment {
  role_code: string;
  scope_type: string;
  scope_id: string;
}

export interface AuthProfile {
  display_name: string;
  preferred_name?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
  email?: string | null;
  affiliation_label?: string | null;
  institution_name?: string | null;
  department?: string | null;
  onboarded_at?: string | null;
}

export interface AuthMe {
  account_id: string;
  person_id: string;
  display_name: string;
  tenant_id: string;
  institution_id: string;
  subject: { type: string; id: string } | null;
  assignments: AuthAssignment[];
  permissions: string[];
  portals: string[];
  default_portal: string;
  delegation: any | null;
  break_glass: any | null;
  profile?: AuthProfile;
  unread_notifications?: number;
}

export type AuthStatus = 'loading' | 'anon' | 'authed';

export interface AuthContextType {
  status: AuthStatus;
  me: AuthMe | null;
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
  login: (username: string, password: string, tenantId?: string) => Promise<AuthMe>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
  hasPortal: (portal: string) => boolean;
  switchPortal: (portal: string) => void;
  refreshMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [me, setMe] = useState<AuthMe | null>(null);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  // Load active identity on application mount
  const refreshMe = useCallback(async () => {
    try {
      await client.fetchCsrf();
      const res = await client.get<{ me: AuthMe }>('/auth/me/', { skipAuthRedirect: true });
      if (res && res.me) {
        setMe(res.me);
        setStatus('authed');
      } else {
        setMe(null);
        setStatus('anon');
      }
    } catch (err: any) {
      setMe(null);
      setStatus('anon');
    }
  }, []);

  useEffect(() => {
    refreshMe();

    // Register automatic session eviction on 401
    const unbind = client.onUnauthorized(() => {
      setMe((currentMe) => {
        if (currentMe) {
          setSessionExpired(true);
          return currentMe;
        }
        setStatus('anon');
        return null;
      });
    });

    return () => {
      unbind();
    };
  }, [refreshMe]);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
    setMe(null);
    setStatus('anon');
    window.location.href = '/login';
  }, []);

  const login = useCallback(async (username: string, password: string, tenantId?: string): Promise<AuthMe> => {
    setStatus('loading');
    try {
      const payload: Record<string, string> = { username, password };
      if (tenantId) payload.tenant_id = tenantId;

      const res = await client.post<{ me: AuthMe }>('/auth/login/', payload);
      setMe(res.me);
      setStatus('authed');
      setSessionExpired(false);
      return res.me;
    } catch (err) {
      setMe(null);
      setStatus('anon');
      throw err;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await client.post('/auth/logout/', {});
    } catch (err) {
      console.warn('Logout request warning:', err);
    } finally {
      setMe(null);
      setStatus('anon');
      window.location.href = '/login';
    }
  }, []);

  const can = useCallback((permission: string): boolean => {
    if (!me || status !== 'authed') return false;
    if (me.permissions.includes('*')) return true;
    if (me.permissions.includes(permission)) return true;

    // Support wildcard segment e.g. "placement.*"
    const [domain] = permission.split('.');
    if (me.permissions.includes(`${domain}.*`)) return true;

    return false;
  }, [me, status]);

  const canAny = useCallback((permissions: string[]): boolean => {
    return permissions.some((p) => can(p));
  }, [can]);

  const canAll = useCallback((permissions: string[]): boolean => {
    return permissions.every((p) => can(p));
  }, [can]);

  const hasPortal = useCallback((portal: string): boolean => {
    if (!me || status !== 'authed') return false;
    return Array.isArray(me.portals) && me.portals.includes(portal);
  }, [me, status]);

  const switchPortal = useCallback((portal: string) => {
    if (hasPortal(portal)) {
      window.location.href = `/${portal}/home`;
    }
  }, [hasPortal]);

  const value = useMemo<AuthContextType>(() => ({
    status,
    me,
    sessionExpired,
    dismissSessionExpired,
    login,
    logout,
    can,
    canAny,
    canAll,
    hasPortal,
    switchPortal,
    refreshMe,
  }), [status, me, sessionExpired, dismissSessionExpired, login, logout, can, canAny, canAll, hasPortal, switchPortal, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

