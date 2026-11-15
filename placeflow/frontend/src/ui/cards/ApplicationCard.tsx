import React from 'react';
import { Clock } from 'lucide-react';
import { EntityCard } from './EntityCard';
import { CompanyMark } from './CompanyMark';
import { ApplicationCardSkeleton } from './CardSkeleton';
import { formatDate } from '../format';
import { Spine, SpineStage } from '../Spine';

export interface ApplicationCardData {
  application_id: string;
  role: string;
  company_name: string;
  company_mark?: string | null;
  stage: 'Applied' | 'Shortlisted' | 'Interview' | 'Selected' | 'Rejected' | string;
  last_update?: string | null;
  applied_at?: string | Date | null;
  masked?: boolean;
}

export interface ApplicationCardProps {
  data?: ApplicationCardData | null;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  masked?: boolean;
  onClick?: () => void;
  onRetry?: () => void;
  className?: string;
}

const STAGES = ['Applied', 'Shortlisted', 'Interview', 'Offer'] as const;

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  data,
  loading = false,
  empty = !data && !loading,
  error = null,
  masked: _masked = false,
  onClick,
  onRetry,
  className = '',
}) => {
  if (loading) {
    return <ApplicationCardSkeleton className={className} />;
  }

  if (error) {
    return <EntityCard error={error} onRetry={onRetry} className={className} />;
  }

  if (empty || !data) {
    return <EntityCard empty emptyMessage="No application found" className={className} />;
  }

  const isRejected = data.stage === 'Rejected';
  const currentStageIndex = isRejected
    ? 1
    : data.stage === 'Selected' || data.stage === 'Offer'
    ? 3
    : data.stage === 'Interview'
    ? 2
    : data.stage === 'Shortlisted'
    ? 1
    : 0;

  const spineStages: SpineStage[] = STAGES.map((s, idx) => ({
    id: s.toLowerCase(),
    label: s,
    status:
      idx < currentStageIndex
        ? 'completed'
        : idx === currentStageIndex
        ? isRejected
          ? 'skipped'
          : 'current'
        : 'upcoming',
  }));

  return (
    <EntityCard clickable={Boolean(onClick)} onClick={onClick} className={className}>
      {/* Header: Role and Company */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <CompanyMark name={data.company_name} mark={data.company_mark} size="sm" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink truncate m-0" title={data.role}>
              {data.role}
            </h3>
            <p className="text-xs text-ink-muted truncate m-0">{data.company_name}</p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium border ${
            isRejected
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : data.stage === 'Selected' || data.stage === 'Offer'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {data.stage}
        </span>
      </div>

      {/* Universal Spine Stage Tracker */}
      <div className="mt-4 px-1">
        <Spine stages={spineStages} size="sm" />
      </div>

      {/* Last update footer */}
      <div className="mt-3.5 border-t border-line pt-2.5 flex items-center gap-1.5 text-xs text-ink-muted">
        <Clock size={12} className="shrink-0 text-slate-400" />
        <span className="truncate">
          {data.last_update
            ? `Last update: ${data.last_update}`
            : data.applied_at
            ? `Applied on ${formatDate(data.applied_at)}`
            : 'Application in progress'}
        </span>
      </div>
    </EntityCard>
  );
};

