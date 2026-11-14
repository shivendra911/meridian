import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number | string;
  badge?: string;
  badgeColor?: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'line' | 'pill';
  size?: 'sm' | 'md';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'line',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-xs py-2 px-3 gap-1.5',
    md: 'text-xs py-2.5 px-4 gap-2',
  };

  if (variant === 'pill') {
    return (
      <div className={`flex flex-wrap items-center gap-1 p-1 bg-canvas rounded-lg border border-line select-none ${className}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center rounded-md font-medium transition-all duration-150 ${
                sizeStyles[size]
              } ${
                isActive
                  ? 'bg-surface text-ink border border-line shadow-none font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-surface/50 border border-transparent'
              }`}
            >
              {Icon && <Icon size={14} className={isActive ? 'text-brand' : 'text-ink-muted'} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-canvas text-ink font-semibold' : 'bg-line/50 text-ink-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default 'line' variant
  return (
    <div className={`border-b border-line flex flex-wrap items-center gap-2 select-none ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center border-b-2 font-medium transition-all duration-150 relative ${
              sizeStyles[size]
            } ${
              isActive
                ? 'border-brand text-brand font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
            }`}
          >
            {Icon && <Icon size={14} className={isActive ? 'text-brand' : 'text-ink-muted'} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-brand/10 text-brand font-semibold' : 'bg-canvas text-ink-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span
                className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded border ${
                  tab.badgeColor || 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
