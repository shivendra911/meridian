/**
 * PlaceFlow / Meridian — 403 Forbidden Error Screen (Phase 4).
 */

import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../core/auth/useAuth';

export const ForbiddenPage: React.FC = () => {
  const { me, logout } = useAuth();
  const defaultPortal = me?.default_portal || 'student';

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-surface border border-line rounded-xl p-8 shadow-xs text-center">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <ShieldAlert size={24} />
        </div>

        <h1 className="text-xl font-bold text-ink mb-2">Access Denied (403)</h1>
        <p className="text-sm text-ink-muted mb-6 leading-relaxed">
          You do not have the required permissions or institutional role to access this portal or resource.
        </p>

        {me && (
          <div className="bg-canvas border border-line rounded-lg p-3 text-xs text-left mb-6 space-y-1">
            <div className="text-ink font-medium">Signed in as: <span className="font-semibold">{me.display_name}</span></div>
            <div className="text-ink-muted">Authorized portals: <span className="font-mono text-ink">{me.portals.join(', ') || 'none'}</span></div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              window.location.href = `/${defaultPortal}/home`;
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Return to My Workspace ({defaultPortal})</span>
          </button>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-line hover:bg-canvas text-ink text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={16} className="text-ink-muted" />
            <span>Sign in with different account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

