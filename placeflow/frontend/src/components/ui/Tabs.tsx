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
      <div className={`flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 select-none ${className}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center rounded-md font-medium transition-all ${
                sizeStyles[size]
              } ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {Icon && <Icon size={14} className={isActive ? 'text-[#8C1515]' : 'text-slate-400'} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-red-50 text-[#8C1515]' : 'bg-slate-200 text-slate-600'
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
    <div className={`border-b border-slate-200 flex flex-wrap items-center gap-2 select-none ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center border-b-2 font-medium transition-all relative ${
              sizeStyles[size]
            } ${
              isActive
                ? 'border-[#8C1515] text-[#8C1515] font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {Icon && <Icon size={14} className={isActive ? 'text-[#8C1515]' : 'text-slate-400'} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-red-50 text-[#8C1515]' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span
                className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
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

