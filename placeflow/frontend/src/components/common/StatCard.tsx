import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  context?: string;
  icon: LucideIcon;
  variant?: 'default' | 'cardinal' | 'forest' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  context,
  icon: Icon,
  variant = 'default',
}) => {
  const borderColors = {
    default: 'border-t-slate-800',
    cardinal: 'border-t-[#8C1515]',
    forest: 'border-t-emerald-600',
    amber: 'border-t-amber-600',
  };

  const textColors = {
    default: 'text-slate-900',
    cardinal: 'text-[#8C1515]',
    forest: 'text-emerald-700',
    amber: 'text-amber-700',
  };

  return (
    <div
      className={`bg-white border border-slate-200 border-t-3 ${borderColors[variant]} rounded p-4 shadow-subtle flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className="w-7 h-7 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
          <Icon size={14} />
        </div>
      </div>
      <div>
        <div className={`text-2xl font-bold font-serif ${textColors[variant]}`}>
          {value}
        </div>
        {context && (
          <div className="text-[11px] text-slate-500 mt-1">{context}</div>
        )}
      </div>
    </div>
  );
};

