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
    navy: 'bg-block-navy text-white shadow-md',
    teal: 'bg-block-teal text-white shadow-md',
    paper: 'bg-canvas text-ink border border-line shadow-xs',
    slate: 'bg-block-slate text-white shadow-sm',
    amber: 'bg-now text-now-ink font-medium shadow-sm',
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
