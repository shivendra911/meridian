import React from 'react';
import { MacOsSpinner } from './MacOsSpinner';
import { MacOsProgressBar } from './MacOsProgressBar';

export interface MacOsLoadingScreenProps {
  message?: string;
  description?: string;
  fullScreen?: boolean;
  variant?: 'spinner' | 'progress' | 'both';
  className?: string;
}

export const MacOsLoadingScreen: React.FC<MacOsLoadingScreenProps> = ({
  message = 'Loading workspace...',
  description = 'Connecting to verified campus network',
  fullScreen = true,
  variant = 'both',
  className = '',
}) => {
  const content = (
    <div
      className={`w-full max-w-xs sm:max-w-sm rounded-2xl border border-line/80 bg-surface/92 macos-frosted p-6 shadow-macos-window macos-sheet-enter flex flex-col items-center text-center space-y-4 ${className}`}
    >
      {/* Brand Glyph with subtle breathing glow */}
      <div className="relative">
        <div className="w-11 h-11 rounded-xl bg-brand text-white font-bold text-base shadow-md flex items-center justify-center macos-pulse-glow">
          M
        </div>
      </div>

      {/* Primary indicator */}
      {(variant === 'spinner' || variant === 'both') && (
        <MacOsSpinner size="md" color="brand" aria-label={message} />
      )}

      {/* Progress track */}
      {(variant === 'progress' || variant === 'both') && (
        <div className="w-full px-2">
          <MacOsProgressBar height={4} />
        </div>
      )}

      {/* Typography */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-ink tracking-wide m-0">
          {message}
        </h3>
        {description && (
          <p className="text-[11.5px] text-ink-muted leading-relaxed m-0">
            {description}
          </p>
        )}
      </div>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className="flex items-center justify-center p-8 w-full min-h-[220px]">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-canvas/85 macos-frosted flex items-center justify-center p-4">
      {content}
    </div>
  );
};
