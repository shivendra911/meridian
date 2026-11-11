import React from 'react';
import { Calendar, Video, MapPin, ExternalLink, CalendarPlus, Clock } from 'lucide-react';
import { EntityCard } from './EntityCard';
import { InterviewCardSkeleton } from './CardSkeleton';
import { formatDateTime } from '../format';

export interface InterviewCardData {
  interview_id: string;
  role: string;
  company_name: string;
  round_name: string;
  scheduled_start: string | Date;
  scheduled_end?: string | Date | null;
  mode: 'VIRTUAL' | 'IN_PERSON' | string;
  venue_or_link?: string | null;
  interviewer_name?: string | null;
  masked?: boolean;
}

export interface InterviewCardProps {
  data?: InterviewCardData | null;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  masked?: boolean;
  onJoin?: () => void;
  onAddToCalendar?: () => void;
  onClick?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const InterviewCard: React.FC<InterviewCardProps> = ({
  data,
  loading = false,
  empty = !data && !loading,
  error = null,
  masked = false,
  onJoin,
  onAddToCalendar,
  onClick,
  onRetry,
  className = '',
}) => {
  if (loading) {
    return <InterviewCardSkeleton className={className} />;
  }

  if (error) {
    return <EntityCard error={error} onRetry={onRetry} className={className} />;
  }

  if (empty || !data) {
    return <EntityCard empty emptyMessage="No scheduled interviews" className={className} />;
  }

  const isVirtual = data.mode?.toUpperCase() === 'VIRTUAL';

  return (
    <EntityCard clickable={Boolean(onClick)} onClick={onClick} className={className}>
      {/* Header: Company, Role, Round */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink truncate m-0" title={data.role}>
            {data.role}
          </h3>
          <p className="mt-0.5 text-xs text-ink-muted truncate m-0">{data.company_name}</p>
        </div>

        <span className="shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          {data.round_name}
        </span>
      </div>

      {/* Meta rows: Date/time, Mode & Venue */}
      <div className="mt-3.5 space-y-2 text-xs text-ink-muted">
        <div className="flex items-center gap-2 text-ink font-medium">
          <Calendar size={13} className="text-slate-400 shrink-0" />
          <span>{formatDateTime(data.scheduled_start)}</span>
        </div>

        <div className="flex items-center gap-2">
          {isVirtual ? (
            <Video size={13} className="text-slate-400 shrink-0" />
          ) : (
            <MapPin size={13} className="text-slate-400 shrink-0" />
          )}
          <span className="truncate max-w-[240px]">
            {masked
              ? 'Location hidden for your role'
              : data.venue_or_link || (isVirtual ? 'Online video call' : 'Campus Placement Cell')}
          </span>
        </div>

        {data.interviewer_name && !masked && (
          <div className="flex items-center gap-2 text-[11px]">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <span>Interviewer: {data.interviewer_name}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 border-t border-line pt-3 flex items-center justify-end gap-2">
        {onAddToCalendar && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCalendar();
            }}
            className="inline-flex items-center gap-1.5 rounded border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <CalendarPlus size={12} />
            <span>Add to calendar</span>
          </button>
        )}

        {isVirtual && (onJoin || data.venue_or_link) && !masked && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onJoin) onJoin();
              else if (data.venue_or_link) window.open(data.venue_or_link, '_blank');
            }}
            className="inline-flex items-center gap-1 rounded bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
          >
            <span>Join</span>
            <ExternalLink size={11} />
          </button>
        )}
      </div>
    </EntityCard>
  );
};

