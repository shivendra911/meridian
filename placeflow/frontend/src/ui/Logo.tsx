import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  subtitle,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs rounded-md',
    md: 'w-8 h-8 text-sm rounded-lg',
    lg: 'w-10 h-10 text-base rounded-xl',
  }[size];

  const mark = (
    <div
      data-testid="logo-mark"
      className={`inline-flex shrink-0 items-center justify-center font-bold tracking-tight text-white bg-accent ${sizeClasses} ${className}`}
    >
      M
    </div>
  );

  if (!showText) return mark;

  return (
    <div className="inline-flex items-center gap-2.5">
      {mark}
      <div className="min-w-0">
        <span className="block font-semibold text-[15px] leading-tight text-white tracking-tight truncate">
          Meridian
        </span>
        {subtitle && (
          <span className="block text-xs leading-tight text-slate-400 truncate mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

