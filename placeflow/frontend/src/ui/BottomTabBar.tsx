import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface BottomTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

export interface BottomTabBarProps {
  tabs: BottomTabItem[];
  activeTab: string;
  onSelectTab: (path: string) => void;
  className?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  className = '',
}) => {
  return (
    <nav
      aria-label="Student Mobile Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)] lg:hidden ${className}`}
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id ||
            activeTab === tab.path ||
            activeTab.startsWith(`${tab.path}/`);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors duration-150 relative ${
                isActive ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  size={20}
                  className={`transition-colors duration-150 ${
                    isActive ? 'text-now' : 'text-ink-muted'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>

              <span
                className={`text-[11px] leading-tight mt-1 transition-colors ${
                  isActive ? 'text-ink font-bold' : 'text-ink-muted'
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <span
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-now"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
