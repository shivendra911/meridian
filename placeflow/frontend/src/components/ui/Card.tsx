import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actionSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  headerRibbonColor?: string; // e.g. '#8C1515' or '#0B1B3D'
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
  bodyClassName = 'p-5',
}) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded shadow-xs overflow-hidden transition-all ${
        headerRibbonColor ? 'border-t-4' : ''
      } ${className}`}
      style={headerRibbonColor ? { borderTopColor: headerRibbonColor } : {}}
    >
      {(title || actionSlot) && (
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {typeof title === 'string' ? (
              <h3 className="font-serif font-bold text-sm text-slate-900 m-0 truncate">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <div className="text-xs text-slate-500 mt-0.5 truncate font-sans">
                {subtitle}
              </div>
            )}
          </div>
          {actionSlot && <div className="shrink-0 flex items-center gap-2">{actionSlot}</div>}
        </div>
      )}

      <div className={bodyClassName}>{children}</div>

      {footerSlot && (
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          {footerSlot}
        </div>
      )}
    </div>
  );
};

