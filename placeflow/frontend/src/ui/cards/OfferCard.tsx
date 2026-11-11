import React, { useState } from 'react';
import { Award, Clock, Check, X, AlertTriangle } from 'lucide-react';
import { EntityCard } from './EntityCard';
import { OfferCardSkeleton } from './CardSkeleton';
import { formatLpa, formatDeadline } from '../format';

export interface OfferCardData {
  offer_id: string;
  role: string;
  company_name: string;
  package_lpa: number | string;
  respond_by: string | Date;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | string;
  masked?: boolean;
}

export interface OfferCardProps {
  data?: OfferCardData | null;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  masked?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onClick?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  data,
  loading = false,
  empty = !data && !loading,
  error = null,
  masked = false,
  onAccept,
  onDecline,
  onClick,
  onRetry,
  className = '',
}) => {
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  if (loading) {
    return <OfferCardSkeleton className={className} />;
  }

  if (error) {
    return <EntityCard error={error} onRetry={onRetry} className={className} />;
  }

  if (empty || !data) {
    return <EntityCard empty emptyMessage="No offers recorded" className={className} />;
  }

  const isPending = data.status?.toUpperCase() === 'PENDING';
  const isAccepted = data.status?.toUpperCase() === 'ACCEPTED';
  const isDeclined = data.status?.toUpperCase() === 'DECLINED';

  return (
    <>
      <EntityCard clickable={Boolean(onClick)} onClick={onClick} className={className}>
        {/* Header: Company, Role, Package Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink truncate m-0" title={data.role}>
              {data.role}
            </h3>
            <p className="mt-0.5 text-xs text-ink-muted truncate m-0">{data.company_name}</p>
          </div>

          <span className="shrink-0 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 tabular-nums">
            <Award size={14} className="text-emerald-600" />
            <span>{masked ? 'CTC Masked' : formatLpa(data.package_lpa)}</span>
          </span>
        </div>

        {/* Deadline countdown & status */}
        <div className="mt-3.5 flex items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <span>Respond by: {formatDeadline(data.respond_by)}</span>
          </div>

          {!isPending && (
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium border ${
                isAccepted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isDeclined
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {data.status}
            </span>
          )}
        </div>

        {/* Footer: Accept / Decline buttons (when pending) */}
        {isPending && (onAccept || onDecline) && (
          <div className="mt-4 border-t border-line pt-3 flex items-center justify-end gap-2">
            {onDecline && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeclineConfirm(true);
                }}
                className="inline-flex items-center gap-1 rounded border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <X size={12} />
                <span>Decline</span>
              </button>
            )}

            {onAccept && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                className="inline-flex items-center gap-1 rounded bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
              >
                <Check size={12} />
                <span>Accept offer</span>
              </button>
            )}
          </div>
        )}
      </EntityCard>

      {/* Decline Confirmation Dialog */}
      {showDeclineConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface p-5 shadow-2xl border border-line animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-semibold text-ink m-0">Decline this placement offer?</h3>
            </div>
            <p className="mt-2 text-xs text-ink-muted leading-relaxed">
              Are you sure you want to decline the offer from{' '}
              <strong className="text-ink">{data.company_name}</strong> for{' '}
              <strong className="text-ink">{data.role}</strong>? This decision is final and recorded in the placement system.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeclineConfirm(false)}
                className="rounded border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeclineConfirm(false);
                  if (onDecline) onDecline();
                }}
                className="rounded bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
              >
                Confirm decline
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

