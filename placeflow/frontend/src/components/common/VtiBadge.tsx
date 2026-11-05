import React from 'react';
import { ShieldCheck, Award } from 'lucide-react';
import { VtiScore } from '../../types';

interface VtiBadgeProps {
  vti?: VtiScore;
}

export const VtiBadge: React.FC<VtiBadgeProps> = ({ vti }) => {
  if (!vti) return null;

  const styleMap = {
    gold: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-900',
      icon: Award,
    },
    silver: {
      bg: 'bg-slate-100',
      border: 'border-slate-300',
      text: 'text-slate-800',
      icon: ShieldCheck,
    },
    bronze: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      icon: ShieldCheck,
    },
  };

  const current = styleMap[vti.badge_class] || styleMap.silver;
  const Icon = current.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border ${current.bg} ${current.border} ${current.text} text-xs font-semibold shadow-2xs`}
      title={vti.summary}
    >
      <Icon size={13} className="shrink-0" />
      <span>{vti.badge}</span>
      <span className="font-mono text-[11px] opacity-75">({vti.score})</span>
    </div>
  );
};

