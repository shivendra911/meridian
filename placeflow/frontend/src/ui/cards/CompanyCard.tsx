import React from 'react';
import { Building2, MapPin, Briefcase, Calendar } from 'lucide-react';
import { EntityCard } from './EntityCard';
import { CompanyCardSkeleton } from './CardSkeleton';
import { formatDate } from '../format';

export interface CompanyCardData {
  company_id: string;
  name: string;
  mark?: string | null;
  industry?: string | null;
  location?: string | null;
  active_drives_count?: number;
  last_visit?: string | Date | null;
  tier?: string | null;
  masked?: boolean;
}

export interface CompanyCardProps {
  data?: CompanyCardData | null;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  masked?: boolean;
  onClick?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  data,
  loading = false,
  empty = !data && !loading,
  error = null,
  masked = false,
  onClick,
  onRetry,
  className = '',
}) => {
  if (loading) {
    return <CompanyCardSkeleton className={className} />;
  }

  if (error) {
    return <EntityCard error={error} onRetry={onRetry} className={className} />;
  }

  if (empty || !data) {
    return <EntityCard empty emptyMessage="No company details" className={className} />;
  }

  return (
    <EntityCard clickable={Boolean(onClick)} onClick={onClick} className={className}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
          {data.mark ? (
            <img src={data.mark} alt="" className="h-full w-full object-contain rounded-lg" />
          ) : (
            <Building2 size={20} className="text-slate-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink truncate m-0" title={data.name}>
              {data.name}
            </h3>
            {data.tier && (
              <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
                {data.tier}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-muted truncate m-0">{data.industry || 'Technology & Engineering'}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-3 flex flex-wrap items-center justify-between gap-y-1 text-xs text-ink-muted">
        {data.location && (
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-slate-400 shrink-0" />
            <span className="truncate max-w-[120px]">{data.location}</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-ink font-medium">
          <Briefcase size={12} className="text-slate-400 shrink-0" />
          <span>
            {data.active_drives_count ?? 0} active drive{(data.active_drives_count ?? 0) === 1 ? '' : 's'}
          </span>
        </div>

        {data.last_visit && !masked && (
          <div className="flex items-center gap-1 text-xs">
            <Calendar size={12} className="text-slate-400 shrink-0" />
            <span>Visited {formatDate(data.last_visit)}</span>
          </div>
        )}
      </div>
    </EntityCard>
  );
};

