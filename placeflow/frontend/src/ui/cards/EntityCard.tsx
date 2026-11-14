import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface EntityCardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyMessage?: string;
  as?: React.ElementType;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  children,
  className = '',
  onClick,
  clickable = Boolean(onClick),
  loading: _loading = false,
  error = null,
  onRetry,
  empty = false,
  emptyMessage = 'No data available',
  as: Component = 'div',
}) => {
  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50/50 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-red-900 m-0">Failed to load content</h4>
            <p className="mt-1 text-xs text-red-700 m-0">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded bg-white px-2.5 py-1 text-xs font-medium text-red-800 border border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <RefreshCw size={12} />
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className={`rounded-lg border border-line bg-surface p-6 text-center text-ink-muted ${className}`}>
        <p className="text-xs font-medium m-0">{emptyMessage}</p>
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Component
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      className={`rounded-lg border border-line bg-surface p-4 transition-all duration-150 ${
        clickable
          ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2'
          : ''
      } ${className}`}
    >
      {children}
    </Component>
  );
};

