import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'destructive'
  | 'info'
  | 'neutral'
  | 'subtle'
  | 'ai'
  | 'institutional';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  isDot?: boolean;
  isPulse?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  isDot = false,
  isPulse = false,
  icon,
  className = '',
}) => {
  const sizeStyles: Record<BadgeSize, string> = {
    xs: 'text-[9px] px-1.5 py-0.2 gap-1 font-mono font-bold tracking-wider',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-mono font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    success: {
      container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    warning: {
      container: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    danger: {
      container: 'bg-red-50 text-red-800 border-red-200',
      dot: 'bg-red-500',
    },
    destructive: {
      container: 'bg-red-50 text-red-800 border-red-200',
      dot: 'bg-red-500',
    },
    info: {
      container: 'bg-blue-50 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
    },
    neutral: {
      container: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    subtle: {
      container: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    ai: {
      container: 'bg-violet-50 text-violet-800 border-violet-200',
      dot: 'bg-violet-500',
    },
    institutional: {
      container: 'bg-[#FDF2F2] text-[#8C1515] border-red-200 font-bold',
      dot: 'bg-[#8C1515]',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center rounded border uppercase transition-colors ${sizeStyles[size]} ${currentVariant.container} ${className}`}
    >
      {isDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentVariant.dot} ${
            isPulse ? 'animate-pulse' : ''
          }`}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};
