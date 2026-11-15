import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface PeekPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: 480 | 640;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const PeekPanel: React.FC<PeekPanelProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  width = 480,
  children,
  footer,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label={title}>
      {/* Scrim / Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          ref={panelRef}
          style={{ width: `${width}px` }}
          className="w-screen max-w-full bg-surface border-l border-line shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        >
          {/* Header */}
          <div className="h-14 border-b border-line px-5 flex items-center justify-between shrink-0 bg-surface">
            <div className="min-w-0 pr-4">
              <h2 className="text-sm font-bold text-ink truncate m-0">{title}</h2>
              {subtitle && <p className="text-xs text-ink-muted truncate m-0">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">{children}</div>

          {/* Optional Footer */}
          {footer && (
            <div className="border-t border-line p-4 bg-surface-muted/50 shrink-0 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
