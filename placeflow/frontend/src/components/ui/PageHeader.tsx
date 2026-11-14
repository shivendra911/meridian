import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  badge,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-ink m-0">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <div className="mt-1 text-sm text-ink-muted leading-relaxed m-0">
            {description}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

