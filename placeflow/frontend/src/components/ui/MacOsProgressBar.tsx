import React from 'react';

export interface MacOsProgressBarProps {
  className?: string;
  height?: number;
  value?: number;
}

export const MacOsProgressBar: React.FC<MacOsProgressBarProps> = ({
  className = '',
  height = 4,
  value,
}) => {
  const isDeterminate = typeof value === 'number';
  const clampedValue = isDeterminate ? Math.min(100, Math.max(0, value)) : undefined;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampedValue}
      style={{ height }}
      className={`w-full overflow-hidden rounded-full bg-slate-200/70 border border-line/60 relative ${className}`}
    >
      {isDeterminate ? (
        <div
          className="h-full rounded-full bg-linear-to-r from-brand via-brand-hover to-brand transition-all duration-300 shadow-xs"
          style={{ width: `${clampedValue}%` }}
        />
      ) : (
        <div
          className="absolute top-0 bottom-0 rounded-full bg-linear-to-r from-brand/60 via-brand to-brand/60 macos-progress-indeterminate shadow-xs"
          style={{ width: '45%' }}
        />
      )}
    </div>
  );
};
