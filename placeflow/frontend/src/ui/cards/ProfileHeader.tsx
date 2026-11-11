import React from 'react';
import { ShieldCheck, Edit3 } from 'lucide-react';
import { Avatar } from './Avatar';
import { Shimmer } from './CardSkeleton';

export interface ProfileHeaderProps {
  name: string;
  avatar_url?: string | null;
  program?: string | null;
  batch?: string | null;
  reg_no?: string | null;
  designation?: string | null;
  department?: string | null;
  role?: string | null;
  is_verified?: boolean;
  completenessPercent?: number;
  nextMissingItem?: string | null;
  loading?: boolean;
  onEdit?: () => void;
  className?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  avatar_url,
  program,
  batch,
  reg_no,
  designation,
  department,
  role = 'Student',
  is_verified = true,
  completenessPercent = 85,
  nextMissingItem = 'Add your resume link',
  loading = false,
  onEdit,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`rounded-xl border border-line bg-surface p-6 ${className}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Shimmer className="h-24 w-24 rounded-full shrink-0" />
            <div className="space-y-2">
              <Shimmer className="h-7 w-48" />
              <Shimmer className="h-4 w-64" />
              <div className="flex gap-2 pt-1">
                <Shimmer className="h-5 w-20 rounded" />
                <Shimmer className="h-5 w-32 rounded" />
              </div>
            </div>
          </div>
          <Shimmer className="h-9 w-28 rounded-md" />
        </div>
      </div>
    );
  }

  const metaParts = [
    program,
    batch ? `Batch of ${batch}` : null,
    reg_no ? `Reg: ${reg_no}` : null,
    designation,
    department,
  ].filter(Boolean);

  return (
    <div className={`rounded-xl border border-line bg-surface p-6 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Avatar + Identity */}
        <div className="flex items-center gap-5">
          <Avatar
            src={avatar_url}
            name={name}
            size={96}
            className="shrink-0 ring-4 ring-slate-50"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink m-0">
              {name}
            </h1>

            {metaParts.length > 0 && (
              <p className="mt-1 text-sm text-ink-muted m-0">
                {metaParts.join(' · ')}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-800">
                {role}
              </span>

              {is_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  Verified by institution
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Edit profile action */}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 transition-colors self-start sm:self-auto"
          >
            <Edit3 size={13} />
            <span>Edit profile</span>
          </button>
        )}
      </div>

      {/* Profile Completeness Meter */}
      {completenessPercent !== undefined && completenessPercent < 100 && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
            <span className="font-medium text-ink">Profile completeness</span>
            <span className="font-semibold text-brand tabular-nums">{completenessPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, completenessPercent))}%` }}
            />
          </div>
          {nextMissingItem && (
            <p className="mt-1.5 text-xs text-ink-muted m-0">
              Next: <span className="font-medium text-ink">{nextMissingItem}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

