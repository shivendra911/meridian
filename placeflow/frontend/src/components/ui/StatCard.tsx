import React from 'react';
import { LucideIcon, HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
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
  subValue,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-[#8C1515]',
  iconBg = 'bg-red-50',
  explainTooltip,
  actionSlot,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded p-4 shadow-xs transition-all hover:border-slate-300 ${
        onClick ? 'cursor-pointer hover:shadow-sm' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
            <span>{label}</span>
            {explainTooltip && (
              <span title={explainTooltip} className="cursor-help text-slate-400 hover:text-slate-600">
                <HelpCircle size={12} />
              </span>
            )}
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif font-bold text-2xl text-slate-900 tracking-tight">
              {value}
            </span>
            {subValue && (
              <span className="text-xs text-slate-400 font-mono font-medium">
                {subValue}
              </span>
            )}
          </div>

          {change && (
            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-mono">
              {changeType === 'up' && (
                <TrendingUp size={12} className="text-emerald-600" />
              )}
              {changeType === 'down' && (
                <TrendingDown size={12} className="text-red-600" />
              )}
              {changeType === 'neutral' && (
                <Minus size={12} className="text-slate-400" />
              )}
              <span
                className={`font-semibold ${
                  changeType === 'up'
                    ? 'text-emerald-700'
                    : changeType === 'down'
                    ? 'text-red-700'
                    : 'text-slate-500'
                }`}
              >
                {change}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={`w-9 h-9 rounded flex items-center justify-center shrink-0 border border-black/5 ${iconBg} ${iconColor}`}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      {actionSlot && <div className="mt-3 pt-2.5 border-t border-slate-100">{actionSlot}</div>}
    </div>
  );
};

