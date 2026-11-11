import React from 'react';
import { LucideIcon, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { EntityCard } from './EntityCard';
import { TaskCardSkeleton } from './CardSkeleton';
import { formatRelative } from '../format';

export interface TaskCardData {
  task_id: string;
  title: string;
  due?: string | Date | null;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  icon?: LucideIcon;
  action_label?: string;
  masked?: boolean;
}

export interface TaskCardProps {
  data?: TaskCardData | null;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  masked?: boolean;
  onAction?: () => void;
  onClick?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  data,
  loading = false,
  empty = !data && !loading,
  error = null,
  masked = false,
  onAction,
  onClick,
  onRetry,
  className = '',
}) => {
  if (loading) {
    return <TaskCardSkeleton className={className} />;
  }

  if (error) {
    return <EntityCard error={error} onRetry={onRetry} className={className} />;
  }

  if (empty || !data) {
    return <EntityCard empty emptyMessage="No pending tasks requiring attention" className={className} />;
  }

  const isMasked = masked || data.masked;
  const displayTitle = isMasked ? 'Confidential action item (restricted)' : data.title;
  const IconComponent = data.icon || AlertCircle;
  const isHighPriority = data.priority === 'HIGH';

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-line bg-surface p-3.5 flex items-center justify-between gap-3 transition-colors ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:bg-slate-50' : ''
      } ${className}`}
    >
      {/* Icon + Title + Due */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isHighPriority ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <IconComponent size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink truncate m-0" title={displayTitle}>
            {displayTitle}
          </p>
          {data.due && !isMasked && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
              <Clock size={11} className="text-slate-400 shrink-0" />
              <span>Due {formatRelative(data.due)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      {onAction && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 transition-colors"
        >
          <span>{data.action_label || 'View'}</span>
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
};

