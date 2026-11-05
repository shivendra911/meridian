import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-lg border border-dashed border-line bg-surface p-12 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-canvas border border-line flex items-center justify-center text-ink-muted mb-3">
        <Icon size={18} />
      </div>
      <h3 className="text-sm font-semibold text-ink m-0">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-ink-muted leading-relaxed m-0">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

