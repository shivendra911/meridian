import React from 'react';

export interface SpineStage {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming' | 'skipped';
  date?: string;
  sublabel?: string;
}

export interface SpineProps {
  stages: SpineStage[];
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onStageClick?: (stage: SpineStage) => void;
}

export const Spine: React.FC<SpineProps> = ({
  stages,
  size = 'md',
  orientation = 'horizontal',
  className = '',
  onStageClick,
}) => {
  if (!stages || stages.length === 0) return null;

  const isVertical = orientation === 'vertical';

  const nodeSizes = {
    sm: 'w-3 h-3 text-[10px]',
    md: 'w-4 h-4 text-xs',
    lg: 'w-6 h-6 text-sm font-semibold',
  };

  const lineHeights = {
    sm: 'h-0.5',
    md: 'h-0.5',
    lg: 'h-1',
  };

  return (
    <nav
      aria-label="Journey Progress"
      className={`w-full ${isVertical ? 'flex flex-col' : 'flex items-center justify-between'} ${className}`}
    >
      <ol
        className={`w-full flex ${
          isVertical ? 'flex-col gap-4' : 'flex-row items-center justify-between'
        } relative list-none m-0 p-0`}
      >
        {stages.map((stage, idx) => {
          const isCurrent = stage.status === 'current';
          const isCompleted = stage.status === 'completed';
          const isSkipped = stage.status === 'skipped';
          const isLast = idx === stages.length - 1;

          return (
            <li
              key={stage.id}
              className={`flex ${
                isVertical
                  ? 'items-start gap-3 relative'
                  : 'flex-1 flex-col items-center relative text-center'
              }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Connecting line to next stage (Horizontal) */}
              {!isVertical && !isLast && (
                <div
                  className={`absolute top-2 left-1/2 w-full ${lineHeights[size]} ${
                    isCompleted ? 'bg-brand' : 'bg-line'
                  } -z-0 transition-colors duration-200`}
                  style={{
                    transform: 'translateY(-50%)',
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Connecting line to next stage (Vertical) */}
              {isVertical && !isLast && (
                <div
                  className={`absolute left-2 top-4 w-0.5 h-full ${
                    isCompleted ? 'bg-brand' : 'bg-line'
                  } -z-0 transition-colors duration-200`}
                  style={{
                    transform: 'translateX(-50%)',
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Stage Node */}
              <div
                className={`relative z-10 flex items-center justify-center rounded-full transition-transform duration-200 ${
                  nodeSizes[size]
                } ${
                  isCurrent
                    ? 'bg-now text-now-ink shadow-xs ring-4 ring-now/20 font-bold scale-110'
                    : isCompleted
                    ? 'bg-brand text-white'
                    : isSkipped
                    ? 'bg-surface border border-dashed border-ink-faint text-ink-faint'
                    : 'bg-surface border-2 border-line text-ink-muted'
                } ${onStageClick ? 'cursor-pointer hover:scale-115' : ''}`}
                onClick={() => onStageClick?.(stage)}
                role={onStageClick ? 'button' : undefined}
                tabIndex={onStageClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onStageClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onStageClick(stage);
                  }
                }}
              >
                {isCompleted && (
                  <svg
                    className="w-2.5 h-2.5 fill-current"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {isSkipped && <span className="text-[10px] leading-none">−</span>}
              </div>

              {/* Stage Labels & Dates */}
              <div className={`mt-2 ${isVertical ? 'min-w-0' : 'w-full px-1'}`}>
                <p
                  className={`text-xs leading-tight m-0 truncate ${
                    isCurrent
                      ? 'font-bold text-ink'
                      : isCompleted
                      ? 'font-medium text-ink'
                      : 'text-ink-muted'
                  }`}
                  title={stage.label}
                >
                  {stage.label}
                </p>
                {(stage.sublabel || stage.date) && (
                  <p className="text-[11px] text-ink-faint leading-normal mt-0.5 m-0 truncate">
                    {stage.sublabel || stage.date}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
