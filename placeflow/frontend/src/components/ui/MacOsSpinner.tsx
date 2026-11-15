import React from 'react';

export interface MacOsSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'brand' | 'muted' | 'white' | 'current';
  className?: string;
  'aria-label'?: string;
}

const OPACITIES = [1, 0.91, 0.83, 0.75, 0.66, 0.58, 0.5, 0.41, 0.33, 0.25, 0.16, 0.08];

export const MacOsSpinner: React.FC<MacOsSpinnerProps> = ({
  size = 'md',
  color = 'brand',
  className = '',
  'aria-label': ariaLabel = 'Loading...',
}) => {
  const sizeMap = {
    sm: { box: 16, width: 1.5, height: 4.5, radius: 5 },
    md: { box: 24, width: 2.2, height: 6.5, radius: 7 },
    lg: { box: 36, width: 3.2, height: 9.5, radius: 10.5 },
    xl: { box: 48, width: 4.2, height: 13, radius: 14 },
  };

  const { box, width, height, radius } = sizeMap[size];

  const colorClass =
    color === 'brand'
      ? 'bg-brand'
      : color === 'white'
      ? 'bg-white'
      : color === 'muted'
      ? 'bg-slate-400'
      : 'bg-current';

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      style={{ width: box, height: box }}
      className={`relative inline-flex items-center justify-center macos-cupertino-spin shrink-0 ${className}`}
    >
      {OPACITIES.map((opacity, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: `${width}px`,
            opacity,
            transform: `rotate(${i * 30}deg) translateY(-${radius}px)`,
            transformOrigin: `50% ${radius + height / 2}px`,
          }}
          className={colorClass}
        />
      ))}
    </div>
  );
};
