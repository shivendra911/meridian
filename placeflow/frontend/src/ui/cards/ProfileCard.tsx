import React from 'react';
import { ShieldCheck, ExternalLink, Lock } from 'lucide-react';
import { Avatar } from './Avatar';
import { EntityCard } from './EntityCard';
import { ProfileCardSkeleton } from './CardSkeleton';
import { formatRoleLabel } from '../format';

export interface ProfileCardData {
  person_id?: string;
  name: string;
  avatar_url?: string | null;
  headline?: string | null;
  department?: string | null;
  designation?: string | null;
  roles?: string[];
  is_verified?: boolean;
  cgpa?: number | string | null;
  reg_no?: string | null;
  email?: string | null;
  phone?: string | null;
  hidden?: string[];
  masked?: boolean;
}

export interface ProfileCardProps {
  data?: ProfileCardData | null;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  masked?: boolean;
  onRetry?: () => void;
  onViewProfile?: () => void;
  onMessage?: () => void;
  className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  data,
  loading = false,
  empty = !data && !loading,
  error = null,
  masked = Boolean(data?.masked || (data?.hidden && data.hidden.length > 0)),
  onRetry,
  onViewProfile,
  onMessage,
  className = '',
}) => {
  if (loading) {
    return <ProfileCardSkeleton className={className} />;
  }

  if (error) {
    return (
      <EntityCard error={error} onRetry={onRetry} className={`w-80 ${className}`} />
    );
  }

  if (empty || !data) {
    return (
      <EntityCard empty emptyMessage="Profile not found" className={`w-80 ${className}`} />
    );
  }

  const hiddenFields = data.hidden || (masked ? ['Phone', 'Email', 'CGPA'] : []);
  const subtitle = data.headline || data.designation || data.department || 'Institutional Member';

  return (
    <div className={`w-80 rounded-lg border border-line bg-surface p-4 text-ink shadow-sm ${className}`}>
      {/* Header with 56px Avatar and Name */}
      <div className="flex items-start gap-3">
        <Avatar
          src={data.avatar_url}
          name={data.name}
          size={56}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold leading-tight text-ink truncate m-0" title={data.name}>
            {data.name}
          </h4>
          <p className="mt-0.5 text-xs text-ink-muted truncate m-0" title={subtitle}>
            {subtitle}
          </p>

          {/* Badges: Role and Verified marker */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {data.roles && data.roles.length > 0 ? (
              data.roles.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700"
                >
                  {formatRoleLabel(r)}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
                Member
              </span>
            )}

            {data.is_verified !== false && (
              <span
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                title="Official records verified by institution authority"
              >
                <ShieldCheck size={11} className="shrink-0 text-emerald-600" />
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta rows (Official Institutional Data) */}
      <div className="mt-3.5 border-t border-line pt-3 space-y-1.5 text-xs">
        {data.reg_no && (
          <div className="flex justify-between items-center text-ink-muted">
            <span>Reg no:</span>
            <span className="font-medium text-ink tabular-nums">{data.reg_no}</span>
          </div>
        )}

        {/* CGPA rendered only if viewer has permission / not masked */}
        {data.cgpa !== undefined && data.cgpa !== null && !hiddenFields.map((h) => h.toLowerCase()).includes('cgpa') && (
          <div className="flex justify-between items-center text-ink-muted">
            <span>CGPA:</span>
            <span className="font-medium text-ink tabular-nums">{data.cgpa}</span>
          </div>
        )}

        {/* Masked notice chip per spec */}
        {hiddenFields.length > 0 && (
          <div
            data-testid="profile-card-masked-chip"
            className="mt-2 flex items-center gap-1.5 rounded bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-ink-muted"
          >
            <Lock size={12} className="text-slate-500 shrink-0" />
            <span className="truncate">
              Hidden for your role: {hiddenFields.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 border-t border-line pt-3 flex items-center justify-end gap-2">
        {onMessage && (
          <button
            type="button"
            onClick={onMessage}
            className="rounded border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Message
          </button>
        )}
        {onViewProfile && (
          <button
            type="button"
            onClick={onViewProfile}
            className="inline-flex items-center gap-1 rounded bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
          >
            <span>View profile</span>
            <ExternalLink size={11} />
          </button>
        )}
      </div>
    </div>
  );
};

