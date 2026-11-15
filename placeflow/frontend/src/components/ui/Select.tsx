import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  hint?: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  id?: string;
  'aria-label'?: string;
  size?: 'sm' | 'md';
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  disabled = false,
  icon,
  className = '',
  id,
  'aria-label': ariaLabel,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Sync highlighted index when opened
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev + 1;
        while (next < options.length && options[next].disabled) {
          next++;
        }
        return next < options.length ? next : prev;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev - 1;
        while (next >= 0 && options[next].disabled) {
          next--;
        }
        return next >= 0 ? next : prev;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        const opt = options[highlightedIndex];
        if (!opt.disabled) {
          handleSelect(opt.value);
        }
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden native select for accessibility and automated test engines */}
      <select
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only pointer-events-none absolute -left-[9999px] -top-[9999px]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`macos-press-sm w-full flex items-center justify-between gap-2 border border-line rounded-lg bg-canvas text-ink transition-all duration-150 cursor-pointer focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 ${
          size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
          {icon && (
            <span className="text-ink-muted shrink-0 flex items-center">
              {icon}
            </span>
          )}
          {selectedOption?.icon && (
            <span className="text-ink-muted shrink-0 flex items-center">
              {selectedOption.icon}
            </span>
          )}
          <span className={`truncate ${selectedOption ? 'font-medium' : 'text-ink-muted'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`text-ink-muted shrink-0 transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-180 text-brand' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${selectId}-opt-${highlightedIndex}` : undefined
          }
          style={{ transformOrigin: 'top left' }}
          className="absolute left-0 top-full mt-1.5 w-full min-w-[200px] max-h-60 overflow-y-auto scrollbar-none rounded-xl border border-line/80 bg-surface/98 macos-frosted-popover shadow-macos-menu p-1 z-50 macos-menu-pop focus:outline-hidden"
        >
          {options.map((option, idx) => {
            const isSelected = option.value === value;
            const isHighlighted = idx === highlightedIndex;

            return (
              <li
                key={option.value}
                id={`${selectId}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  if (!option.disabled) {
                    handleSelect(option.value);
                  }
                }}
                onMouseEnter={() => {
                  if (!option.disabled) {
                    setHighlightedIndex(idx);
                  }
                }}
                className={`macos-press-sm flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer select-none ${
                  option.disabled
                    ? 'opacity-40 cursor-not-allowed text-ink-muted'
                    : isSelected
                    ? 'bg-brand text-white font-semibold'
                    : isHighlighted
                    ? 'bg-slate-100 text-ink'
                    : 'text-ink hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {option.icon && (
                    <span className={`shrink-0 flex items-center ${isSelected ? 'text-white/80' : 'text-ink-muted'}`}>
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                  {option.hint && (
                    <span className={`text-[11px] font-normal truncate ${isSelected ? 'text-white/70' : 'text-ink-muted'}`}>
                      ({option.hint})
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check size={14} className="text-white shrink-0" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
