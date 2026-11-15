import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth,
  size,
}) => {
  const resolvedMaxWidth = maxWidth || size || 'lg';
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

  const maxWidthStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-180"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${maxWidthStyles[resolvedMaxWidth]} bg-surface rounded-xl shadow-macos-window border border-line/80 overflow-hidden macos-sheet-enter`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-line/70 bg-surface/95 macos-frosted flex items-start justify-between gap-4">
            <div>
              {typeof title === 'string' ? (
                <h3 className="font-semibold text-base text-ink m-0">
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-xs text-ink-muted mt-0.5 m-0">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-ink-muted hover:text-ink p-1 rounded-md hover:bg-canvas transition-colors duration-150 macos-press-sm"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[75vh] overflow-y-auto bg-surface">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-3.5 border-t border-line/70 bg-canvas/60 macos-frosted flex items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
