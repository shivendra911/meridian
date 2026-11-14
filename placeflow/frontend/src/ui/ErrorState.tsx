/**
 * PlaceFlow / Meridian — ErrorState Presentational Component.
 * Strictly presentational: renders error state with icon, message, optional copyable error id, and reload/retry actions.
 */

import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { formatApiError } from '../core/api/errors';

export interface ErrorStateProps {
  error?: unknown;
  title?: string;
  message?: string;
  errorId?: string;
  onRetry?: () => void;
  onReload?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Something went wrong on this page',
  message,
  errorId,
  onRetry,
  onReload,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const displayMsg = message || (error ? formatApiError(error) : 'Unable to load data.');
  const handleAction = onReload || onRetry;

  const handleCopyId = () => {
    if (!errorId) return;
    navigator.clipboard.writeText(errorId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      role="alert"
      className={`p-8 border border-red-200 bg-red-50/50 rounded-xl text-center flex flex-col items-center justify-center font-sans ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-base font-semibold text-ink mb-1.5">{title}</h3>
      <p className="text-xs text-ink-muted max-w-md mb-4 leading-relaxed">{displayMsg}</p>

      {errorId && (
        <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-surface border border-line rounded-md text-xs font-mono text-ink-muted">
          <span>Error ID: {errorId}</span>
          <button
            type="button"
            onClick={handleCopyId}
            className="inline-flex items-center gap-1 text-xs text-ink hover:text-brand focus:outline-none cursor-pointer"
            title="Copy Error ID to clipboard"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}

      {handleAction && (
        <button
          type="button"
          onClick={handleAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-hover shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>{onReload ? 'Reload' : 'Try again'}</span>
        </button>
      )}
    </div>
  );
};
