import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { DelegationBanner } from './DelegationBanner';
import { PortalNavItem } from './types';
import { CommandPalette } from '../../components/navigation/CommandPalette';
import { X, Keyboard } from 'lucide-react';

export interface AppShellProps {
  portal: string;
  nav: PortalNavItem[];
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ portal, nav, children }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Global key bindings: Ctrl+K / Cmd+K and ?
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      } else if (
        e.key === '?' &&
        !['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())
      ) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-canvas font-sans text-ink antialiased">
      {/* 1. Authoritative Sidebar */}
      <Sidebar
        portal={portal}
        nav={nav}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        <TopBar
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          onOpenCommandPalette={() => setIsPaletteOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />

        <DelegationBanner />

        <main className="flex-1 w-full max-w-[1280px] mx-auto p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </main>
      </div>

      {/* 3. Global Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onNavigateTab={(tab) => {
          setIsPaletteOpen(false);
          navigate(`/${portal}/${tab}`);
        }}
        onOpenCopilot={() => {
          setIsPaletteOpen(false);
        }}
      />

      {/* 4. Keyboard Shortcuts Dialog */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-5 shadow-2xl border border-line animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Keyboard size={18} className="text-brand" />
                <h3 className="text-sm font-semibold text-ink m-0">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="text-ink-muted hover:text-ink rounded p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-ink">Global Search & Command Palette</span>
                <kbd className="rounded border border-line bg-slate-100 px-2 py-0.5 font-mono text-ink">
                  Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink">Open Shortcuts Dialog</span>
                <kbd className="rounded border border-line bg-slate-100 px-2 py-0.5 font-mono text-ink">
                  ?
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink">Close Dialog / Popover</span>
                <kbd className="rounded border border-line bg-slate-100 px-2 py-0.5 font-mono text-ink">
                  Esc
                </kbd>
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-3 text-right">
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="rounded-lg bg-brand px-3.5 py-1.5 text-xs font-medium text-white hover:bg-brand-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
