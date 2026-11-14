import React from 'react';
import { Building2, Check, Clock, X } from 'lucide-react';
import { EntityCard } from './EntityCard';
import { ApplicationCardSkeleton } from './CardSkeleton';
import { formatDate } from '../format';

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

  return (
    <EntityCard clickable={Boolean(onClick)} onClick={onClick} className={className}>
      {/* Header: Role and Company */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 border border-slate-200">
            {data.company_mark ? (
              <img src={data.company_mark} alt="" className="h-full w-full object-contain rounded-md" />
            ) : (
              <Building2 size={16} className="text-slate-500" />
            )}
          </div>
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

      {/* StageStepper Visual */}
      <div className="mt-4 px-1">
        <div className="relative flex items-center justify-between">
          {/* Connector bar behind steps */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-200 -z-0" />

          {STAGES.map((s, idx) => {
            const isDone = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors ${
                    isRejected && isCurrent
                      ? 'border-rose-600 bg-rose-600 text-white'
                      : isDone
                      ? 'border-brand bg-brand text-white'
                      : isCurrent
                      ? 'border-brand bg-white text-brand ring-2 ring-brand-50'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {isRejected && isCurrent ? (
                    <X size={10} />
                  ) : isDone ? (
                    <Check size={10} />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className="mt-1 text-xs font-medium text-ink-muted">{s}</span>
              </div>
            );
          })}
        </div>
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

