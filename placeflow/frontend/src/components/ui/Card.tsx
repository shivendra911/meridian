import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actionSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  headerRibbonColor?: string;
  className?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  actionSlot,
  footerSlot,
  headerRibbonColor,
  className = '',
  bodyClassName = 'p-4',
}) => {
  return (
    <div
      className={`rounded-lg border border-line bg-surface overflow-hidden ${
        headerRibbonColor ? 'border-t-2' : ''
      } ${className}`}
      style={headerRibbonColor ? { borderTopColor: headerRibbonColor } : {}}
    >
      {(title || actionSlot) && (
        <div className="px-4 py-3 border-b border-line bg-surface flex items-center justify-between gap-4">
          <div className="min-w-0">
            {typeof title === 'string' ? (
              <h3 className="text-sm font-semibold text-ink m-0 truncate">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <div className="text-xs text-ink-muted mt-0.5 truncate">
                {subtitle}
              </div>
            )}
          </div>
          {actionSlot && <div className="shrink-0 flex items-center gap-2">{actionSlot}</div>}
        </div>
      )}

      <div className={bodyClassName}>{children}</div>

      {footerSlot && (
        <div className="px-4 py-2.5 border-t border-line bg-canvas/40 flex items-center justify-between text-xs text-ink-muted">
          {footerSlot}
        </div>
      )}
    </div>
  );
};
