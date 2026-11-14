import React from 'react';
import { LucideIcon, HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  subValue?: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  explainTooltip?: string;
  actionSlot?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  hint,
  subValue,
  change,
  changeType = 'neutral',
  explainTooltip,
  actionSlot,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-line bg-surface p-4 transition-colors ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted truncate m-0">
              {label}
            </p>
            {explainTooltip && (
              <span
                title={explainTooltip}
                className="cursor-help text-ink-muted/70 hover:text-ink shrink-0"
              >
                <HelpCircle size={13} />
              </span>
            )}
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums text-ink m-0">
              {value}
            </p>
            {subValue && (
              <span className="text-xs text-ink-muted font-medium tabular-nums">
                {subValue}
              </span>
            )}
          </div>

          {hint && (
            <p className="mt-1 text-xs text-ink-muted leading-tight m-0">
              {hint}
            </p>
          )}

          {change && (
            <div className="mt-1.5 flex items-center gap-1 text-xs tabular-nums">
              {changeType === 'up' && (
                <TrendingUp size={13} className="text-success shrink-0" />
              )}
              {changeType === 'down' && (
                <TrendingDown size={13} className="text-danger shrink-0" />
              )}
              {changeType === 'neutral' && (
                <Minus size={13} className="text-ink-muted shrink-0" />
              )}
              <span
                className={`font-medium ${
                  changeType === 'up'
                    ? 'text-success'
                    : changeType === 'down'
                    ? 'text-danger'
                    : 'text-ink-muted'
                }`}
              >
                {change}
              </span>
            </div>
          )}
        </div>
      </div>

      {actionSlot && <div className="mt-3 pt-2.5 border-t border-line">{actionSlot}</div>}
    </div>
  );
};
