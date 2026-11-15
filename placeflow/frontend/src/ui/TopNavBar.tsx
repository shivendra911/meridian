import React from 'react';
import { LucideIcon, Search, Bell, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

export interface TopNavTabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  path: string;
  badge?: number;
}

export interface TopNavBarProps {
  tabs: TopNavTabItem[];
  activeTab: string;
  onSelectTab: (path: string) => void;
  onOpenCommandPalette?: () => void;
  onOpenNotifications?: () => void;
  onOpenCopilot?: () => void;
  notificationCount?: number;
  userMenuTrigger?: React.ReactNode;
  className?: string;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenCopilot,
  notificationCount = 0,
  userMenuTrigger,
  className = '',
}) => {
  return (
    <header
      className={`sticky top-0 z-30 h-14 w-full border-b border-line bg-surface/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between ${className}`}
    >
      <div className="flex items-center gap-8">
        <Logo size="md" showText={true} tone="onLight" />

        {/* Center / Left Navigation Tabs */}
        <nav aria-label="Main Navigation" className="hidden sm:flex items-center gap-1">
          {tabs.map((tab) => {
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
                className={`relative px-3.5 py-2 text-xs font-semibold transition-colors duration-150 flex items-center gap-1.5 ${
                  isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-line text-ink text-[10px] font-bold px-1">
                    {tab.badge}
                  </span>
                ) : null}

                {/* Amber Now Accent Underline for Active Tab */}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-now"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Command Palette Search, Copilot, Notifications, User Menu */}
      <div className="flex items-center gap-2.5">
        {onOpenCopilot && (
          <button
            type="button"
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-brand/5 to-amber-500/10 hover:from-amber-500/20 hover:to-brand/15 px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer"
            aria-label="Open Campus AI Copilot (Ctrl+J)"
          >
            <Sparkles size={14} className="text-amber-600 animate-pulse" />
            <span className="hidden sm:inline font-bold">Copilot</span>
            <kbd className="hidden lg:inline-flex rounded border border-amber-500/30 bg-surface/80 px-1 py-0.2 text-[9px] font-mono text-amber-800">
              Ctrl J
            </kbd>
          </button>
        )}

        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 rounded-lg border border-line bg-canvas/60 px-3 py-1.5 text-xs text-ink-muted hover:border-line-strong hover:text-ink transition-colors"
            aria-label="Open Command Search"
          >
            <Search size={14} />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden md:inline-flex rounded border border-line bg-surface px-1.5 py-0.2 text-[10px] font-mono text-ink-muted">
              Ctrl K
            </kbd>
          </button>
        )}

        {onOpenNotifications && (
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors"
            aria-label={`Notifications (${notificationCount} unread)`}
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-accent" />
            )}
          </button>
        )}

        {userMenuTrigger}
      </div>
    </header>
  );
};
