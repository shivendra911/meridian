import React from 'react';

export interface SummaryStripItem {
  label: string;
  value: string | number;
  hint?: string;
  onClick?: () => void;
  className?: string;
}

export interface SummaryStripProps {
  items: SummaryStripItem[];
  className?: string;
}

/**
 * SummaryStrip: A single unified summary card with cells separated by 1px dividers,
 * 24px bold numbers, 12px muted labels, and no icons.
 * Replaces repetitive rows of 3-4 separate StatCards on list pages.
 */
export const SummaryStrip: React.FC<SummaryStripProps> = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <div
      data-testid="summary-strip"
      className={`rounded-xl border border-line bg-surface p-0 shadow-xs overflow-hidden ${className}`}
    >
      <div
        className={`grid divide-y sm:divide-y-0 sm:divide-x divide-line ${
          items.length === 2
            ? 'grid-cols-2'
            : items.length === 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-4'
        }`}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            onClick={item.onClick}
            className={`px-5 py-3.5 flex flex-col justify-center min-h-[72px] ${
              item.onClick ? 'cursor-pointer hover:bg-canvas/50 transition-colors macos-press-sm' : ''
            } ${item.className || ''}`}
          >
            <span className="text-2xl font-bold tracking-tight text-ink tabular-nums leading-tight">
              {item.value}
            </span>
            <span className="text-xs text-ink-muted mt-0.5 leading-tight truncate">
              {item.label}
            </span>
            {item.hint && (
              <span className="text-[11px] text-ink-muted/80 mt-0.5 leading-tight truncate">
                {item.hint}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
