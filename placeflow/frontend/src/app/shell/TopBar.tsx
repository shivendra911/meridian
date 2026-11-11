import React from 'react';
import { Menu, Search, HelpCircle } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationsBell } from './NotificationsBell';
import { UserMenu } from './UserMenu';

export interface TopBarProps {
  onOpenMobileSidebar: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileSidebar,
  onOpenCommandPalette,
  onOpenShortcuts,
}) => {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4 lg:px-6">
      {/* Left: Hamburger (mobile) + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-slate-100 hover:text-ink focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="hidden sm:block min-w-0">
          <Breadcrumbs />
        </div>
      </div>

      {/* Centre-left: Global Search (Command Palette Trigger) */}
      <div className="flex-1 max-w-sm mx-4">
        {/* Desktop search bar */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden md:flex w-full items-center justify-between h-9 rounded-lg border border-line bg-canvas px-3 text-xs text-ink-muted hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <Search size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">Search students, drives, companies...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-mono text-ink-muted">
            Ctrl K
          </kbd>
        </button>

        {/* Mobile search icon button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-slate-100 hover:text-ink focus:outline-none ml-auto"
          aria-label="Search"
        >
          <Search size={18} />
        </button>
      </div>

      {/* Right: Notifications, Help, User Menu */}
      <div className="flex items-center gap-2 shrink-0">
        <NotificationsBell />

        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-slate-100 hover:text-ink focus:outline-none transition-colors"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <HelpCircle size={18} />
          </button>
        )}

        <div className="border-l border-line pl-2 ml-1">
          <UserMenu onOpenShortcuts={onOpenShortcuts} />
        </div>
      </div>
    </header>
  );
};
