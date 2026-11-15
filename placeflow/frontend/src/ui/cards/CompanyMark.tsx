import React from 'react';

/**
 * Company identity tile. Uses the logo when there is one, otherwise a monogram on a
 * muted colour that is stable per company name, so every company is recognisable at a glance.
 */
const PALETTE = [
  'bg-blue-50 text-blue-700 border-blue-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-violet-50 text-violet-700 border-violet-100',
  'bg-rose-50 text-rose-700 border-rose-100',
  'bg-cyan-50 text-cyan-700 border-cyan-100',
  'bg-lime-50 text-lime-700 border-lime-100',
  'bg-orange-50 text-orange-700 border-orange-100',
];

const SIZES = {
  sm: 'h-8 w-8 rounded-md text-sm',
  md: 'h-10 w-10 rounded-lg text-base',
  lg: 'h-12 w-12 rounded-lg text-lg',
};

export function companyTone(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export interface CompanyMarkProps {
  name: string;
  mark?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

export const CompanyMark: React.FC<CompanyMarkProps> = ({ name, mark, size = 'md', className = '' }) => {
  const letter = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      data-testid="company-mark"
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center border font-semibold ${SIZES[size]} ${mark ? 'bg-surface border-line' : companyTone(name || '?')} ${className}`}
    >
      {mark ? <img src={mark} alt="" className="h-full w-full object-contain rounded-[inherit]" /> : letter}
    </div>
  );
};
