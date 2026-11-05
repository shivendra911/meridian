import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'cardinal'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'subtle';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hotkey?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  hotkey,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none cursor-pointer border focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'text-[11px] px-2 py-1 gap-1.5 font-medium',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 font-medium',
    md: 'text-xs px-3.5 py-2 gap-2 font-medium',
    lg: 'text-sm px-4 py-2.5 gap-2.5 font-medium',
  };

  const isButtonLoading = isLoading || loading;

  const variantStyles: Record<ButtonVariant, string> = {
    // Primary is Navy brand color, clean flat appearance
    primary:
      'bg-brand hover:bg-brand-hover active:bg-[#071228] text-white border-brand focus:ring-brand/30 shadow-none',
    cardinal:
      'bg-accent hover:bg-[#701010] active:bg-[#5C0D0D] text-white border-accent focus:ring-accent/30 shadow-none',
    secondary:
      'bg-surface hover:bg-canvas text-ink border-line focus:ring-line/50 shadow-none',
    outline:
      'bg-surface hover:bg-canvas text-ink border-line focus:ring-line/50 shadow-none',
    ghost:
      'bg-transparent hover:bg-canvas text-ink-muted hover:text-ink border-transparent focus:ring-line/50 shadow-none',
    destructive:
      'bg-danger hover:bg-red-700 text-white border-danger focus:ring-danger/30 shadow-none',
    subtle:
      'bg-canvas hover:bg-line/60 text-ink border-transparent focus:ring-line/50 shadow-none',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isButtonLoading}
      {...props}
    >
      {isButtonLoading ? (
        <>
          <Loader2 size={13} className="animate-spin text-current" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          {hotkey && (
            <kbd className="ml-1 px-1 py-0.2 bg-black/10 text-current text-[10px] font-mono rounded border border-black/15">
              {hotkey}
            </kbd>
          )}
        </>
      )}
    </button>
  );
};
