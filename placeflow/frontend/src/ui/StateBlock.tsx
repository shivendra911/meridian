import React from 'react';

export type StateBlockVariant = 'navy' | 'teal' | 'paper' | 'slate' | 'amber';

export interface StateBlockProps {
  variant?: StateBlockVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  role?: string;
}

export const StateBlock: React.FC<StateBlockProps> = ({
  variant = 'paper',
  children,
  className = '',
  onClick,
  role,
}) => {
  const variantStyles: Record<StateBlockVariant, string> = {
    navy: 'bg-block-navy bg-gradient-to-br from-[#0B1B3D] via-[#0E2352] to-[#07132B] text-white shadow-lg border-t border-white/15',
    teal: 'bg-block-teal bg-gradient-to-br from-[#0F766E] via-[#115E59] to-[#0D4D49] text-white shadow-lg border-t border-teal-300/25',
    paper: 'bg-block-paper bg-surface text-ink border border-line shadow-xs',
    slate: 'bg-block-slate bg-gradient-to-br from-[#475569] to-[#334155] text-white shadow-md border-t border-white/10',
    amber: 'bg-block-amber bg-gradient-to-br from-[#F5A524] to-[#E09418] text-now-ink font-medium shadow-md border-t border-amber-200/40',
  };

  return (
    <div
      role={role}
      onClick={onClick}
      className={`w-full rounded-[24px] p-6 sm:p-8 transition-all duration-200 ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:opacity-95' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
