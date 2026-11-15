import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className = '',
}) => {
  const isSm = size === 'sm';

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`macos-press-sm relative inline-flex shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 ${
        isSm ? 'h-5 w-9' : 'h-6 w-11'
      } ${
        checked ? 'bg-brand' : 'bg-slate-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-out transform ${
          isSm ? 'h-4 w-4' : 'h-5 w-5'
        } ${
          checked
            ? isSm
              ? 'translate-x-4'
              : 'translate-x-5'
            : 'translate-x-0'
        }`}
      />
    </button>
  );
};
