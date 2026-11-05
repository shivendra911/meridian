import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'cardinal' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
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
    'inline-flex items-center justify-center font-medium rounded transition-all select-none cursor-pointer border focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'text-[11px] px-2 py-0.5 gap-1.5 font-medium',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-3.5 py-2 gap-2 font-semibold',
    lg: 'text-sm px-4 py-2.5 gap-2.5 font-semibold',
  };

  const isButtonLoading = isLoading || loading;

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#8C1515] hover:bg-[#701010] active:bg-[#5C0D0D] text-white border-red-800 shadow-xs focus:ring-[#8C1515]/30',
    cardinal:
      'bg-[#8C1515] hover:bg-[#701010] active:bg-[#5C0D0D] text-white border-red-800 shadow-xs focus:ring-[#8C1515]/30',
    secondary:
      'bg-[#0B1B3D] hover:bg-[#071228] active:bg-[#040A17] text-white border-slate-800 shadow-xs focus:ring-[#0B1B3D]/30',
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs focus:ring-slate-300',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-transparent focus:ring-slate-200',
    destructive:
      'bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-xs focus:ring-red-400',
    subtle:
      'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 focus:ring-slate-300',
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
