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
    xs: 'text-xs px-1.5 py-0.5 gap-1 font-medium',
    sm: 'text-xs px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    success: {
      container: 'bg-emerald-50 text-success border-emerald-200',
      dot: 'bg-success',
    },
    warning: {
      container: 'bg-amber-50 text-warning border-amber-200',
      dot: 'bg-warning',
    },
    danger: {
      container: 'bg-red-50 text-danger border-red-200',
      dot: 'bg-danger',
    },
    destructive: {
      container: 'bg-red-50 text-danger border-red-200',
      dot: 'bg-danger',
    },
    info: {
      container: 'bg-blue-50 text-info border-blue-200',
      dot: 'bg-info',
    },
    neutral: {
      container: 'bg-canvas text-ink-muted border-line',
      dot: 'bg-ink-muted',
    },
    subtle: {
      container: 'bg-canvas text-ink-muted border-line',
      dot: 'bg-ink-muted',
    },
    ai: {
      container: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-600',
    },
    institutional: {
      container: 'bg-brand/10 text-brand border-brand/20 font-semibold',
      dot: 'bg-brand',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center rounded-md border transition-colors ${sizeStyles[size]} ${currentVariant.container} ${className}`}
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
