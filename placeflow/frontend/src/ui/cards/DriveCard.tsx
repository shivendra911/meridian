import React from 'react';
import { CheckCircle2, AlertCircle, MapPin, IndianRupee, Clock, Building2 } from 'lucide-react';
import { EntityCard } from './EntityCard';
import { DriveCardSkeleton } from './CardSkeleton';
import { formatLpa, formatDeadline } from '../format';

export interface DriveCardData {
  drive_id: string;
  job_id?: string;
  company_name: string;
  company_mark?: string | null;
  role: string;
  tier?: 'Normal' | 'Dream' | 'Super Dream' | string;
  package_lpa: number | string;
  location?: string | null;
  deadline?: string | Date | null;
  eligible?: boolean;
  ineligibility_reason?: string | null;
  applied?: boolean;
  masked?: boolean;
}

export interface DriveCardProps {
  data?: DriveCardData | null;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  masked?: boolean;
  onApply?: () => void;
  onClick?: () => void;
  onRetry?: () => void;
  className?: string;
}

const TIER_COLORS: Record<string, string> = {
  'Super Dream': 'bg-purple-50 text-purple-700 border-purple-200',
  'Dream': 'bg-blue-50 text-blue-700 border-blue-200',
  'Normal': 'bg-slate-100 text-slate-700 border-slate-200',
};

export const DriveCard: React.FC<DriveCardProps> = ({
  data,
  loading = false,
  empty = !data && !loading,
  error = null,
  masked = false,
  onApply,
  onClick,
  onRetry,
  className = '',
}) => {
  if (loading) {
    return <DriveCardSkeleton className={className} />;
  }

  if (error) {
    return <EntityCard error={error} onRetry={onRetry} className={className} />;
  }

  if (empty || !data) {
    return <EntityCard empty emptyMessage="No recruitment drive available" className={className} />;
  }

  const isMasked = masked || data.masked;
  const tierStyle = TIER_COLORS[data.tier || 'Normal'] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <EntityCard clickable={Boolean(onClick)} onClick={onClick} className={className}>
      {/* Header: Company Mark, Title, Tier */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 font-semibold text-ink-muted">
          {data.company_mark ? (
            <img src={data.company_mark} alt="" className="h-full w-full object-contain rounded-lg" />
          ) : (
            <Building2 size={20} className="text-slate-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-snug text-ink truncate m-0" title={data.role}>
              {data.role}
            </h3>
            {data.tier && (
              <span className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-xs font-medium border ${tierStyle}`}>
                {data.tier}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-muted truncate m-0">
            {data.company_name}
          </p>
        </div>
      </div>

      {/* Meta row: CTC, Location, Deadline */}
      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        <div className="flex items-center gap-1 font-semibold text-ink tabular-nums">
          <IndianRupee size={12} className="text-slate-400 shrink-0" />
          <span>{isMasked ? 'CTC Hidden' : formatLpa(data.package_lpa)}</span>
        </div>

        {data.location && (
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-slate-400 shrink-0" />
            <span className="truncate max-w-[120px]">{data.location}</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Clock size={12} className="text-slate-400 shrink-0" />
          <span>{formatDeadline(data.deadline)}</span>
        </div>
      </div>

      {/* Footer: Eligibility + Apply action */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        {data.eligible ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
            <span>You are eligible</span>
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200 truncate max-w-[220px]"
            title={data.ineligibility_reason || 'Criteria not met'}
          >
            <AlertCircle size={12} className="text-amber-600 shrink-0" />
            <span className="truncate">
              {data.ineligibility_reason ? `Not eligible: ${data.ineligibility_reason}` : 'Not eligible'}
            </span>
          </div>
        )}

        {data.applied ? (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
            Applied
          </span>
        ) : onApply ? (
          <button
            type="button"
            disabled={!data.eligible}
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            className={`inline-flex items-center justify-center rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 ${
              data.eligible
                ? 'bg-brand text-white hover:bg-brand-hover'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Apply
          </button>
        ) : null}
      </div>
    </EntityCard>
  );
};

