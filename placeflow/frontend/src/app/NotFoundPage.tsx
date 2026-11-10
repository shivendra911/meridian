/**
 * PlaceFlow / Meridian — 404 Not Found Screen (Phase 4).
 */

import React from 'react';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { useAuth } from '../core/auth/useAuth';

export const NotFoundPage: React.FC = () => {
  const { me } = useAuth();
  const defaultPortal = me?.default_portal || 'student';

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 font-sans">
      <div className="max-w-md w-full bg-surface border border-line rounded-xl p-8 shadow-xs text-center">
        <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-line">
          <FileQuestion size={24} />
        </div>
        <h1 className="text-xl font-bold text-ink mb-2">Page Not Found</h1>
        <p className="text-sm text-ink-muted mb-6">
          The requested page could not be located or may have been relocated.
        </p>
        <button
          onClick={() => {
            window.location.href = `/${defaultPortal}/home`;
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Return to Workspace</span>
        </button>
      </div>
    </div>
  );
};

