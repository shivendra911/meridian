/**
 * PlaceFlow / Meridian — ErrorState Presentational Component (Phase 4).
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { formatApiError } from '../core/api/errors';

interface ErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  message,
  onRetry,
  className = '',
}) => {
  const displayMsg = message || (error ? formatApiError(error) : 'Unable to load data.');

  return (
    <div className={`p-8 border border-red-200 bg-red-50/50 rounded-xl text-center flex flex-col items-center justify-center font-sans ${className}`}>
      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
        <AlertCircle size={20} />
      </div>
      <h3 className="text-sm font-semibold text-ink mb-1">Failed to Load Content</h3>
      <p className="text-xs text-ink-muted max-w-sm mb-4 leading-relaxed">{displayMsg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-line hover:bg-canvas text-ink text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw size={13} className="text-ink-muted" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

