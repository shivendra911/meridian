import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopNavBar } from '../../ui/TopNavBar';
import { UserMenu } from '../../app/shell/UserMenu';
import { NotificationsBell } from '../../app/shell/NotificationsBell';
import { DelegationBanner } from '../../app/shell/DelegationBanner';
import { CommandPalette } from '../../components/navigation/CommandPalette';
import { CampusCopilotDrawer } from '../../components/ai/CampusCopilotDrawer';
import { ErrorBoundary } from '../../app/ErrorBoundary';
import { X, Keyboard, Sun, Calendar, Briefcase, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';

export const TPO_NAV_SPACES = [
  { id: 'today', label: 'Today', path: '/tpo/home', icon: Sun },
  { id: 'season', label: 'Season', path: '/tpo/season', icon: Calendar },
  { id: 'drives', label: 'Drives', path: '/tpo/drives', icon: Briefcase },
  { id: 'people', label: 'People', path: '/tpo/students', icon: Users },
  { id: 'insights', label: 'Insights', path: '/tpo/insights/reports', icon: BarChart3 },
];

export const TpoShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { me } = useAuth();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Global key bindings: Ctrl+K, Ctrl+/, ?
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      } else if (
        e.key === '?' &&
        !['input', 'textarea', 'select'].includes(
          (e.target as HTMLElement)?.tagName?.toLowerCase()
        )
      ) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const tabs = TPO_NAV_SPACES.map((space) => ({
    id: space.id,
    label: space.label,
    path: space.path,
    icon: space.icon,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans text-ink antialiased">
      {/* 1. Placement Office Top Bar Navigation with 5 Spaces */}
      <TopNavBar
        tabs={tabs}
        activeTab={location.pathname}
        onSelectTab={(path) => navigate(path)}
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
        notificationCount={me?.unread_notifications || 0}
        userMenuTrigger={
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <UserMenu onOpenShortcuts={() => setIsShortcutsOpen(true)} />
          </div>
        }
      />

      <DelegationBanner />

      {/* 2. Operations Viewport */}
      <main
        key={location.pathname}
        className="flex-1 w-full max-w-[1360px] mx-auto p-4 sm:p-6 lg:p-8 page-content-fade"
      >
        <ErrorBoundary>
          <Outlet context={{ onOpenCopilot: () => setIsCopilotOpen(true) }} />
        </ErrorBoundary>
      </main>

      {/* 3. Global Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onNavigateTab={(tab) => {
          setIsPaletteOpen(false);
          navigate(`/tpo/${tab}`);
        }}
        onOpenCopilot={() => {
          setIsPaletteOpen(false);
          setIsCopilotOpen(true);
        }}
      />

      {/* 4. Placement Officer Campus AI Copilot Console */}
      <CampusCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        portal="tpo"
      />

      {/* 5. Keyboard Shortcuts Dialog */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-5 shadow-2xl border border-line animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Keyboard size={18} className="text-brand" />
                <h3 className="text-sm font-semibold text-ink m-0">Placement Officer Shortcuts</h3>
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
                <span className="text-ink">Command Search</span>
                <kbd className="rounded border border-line bg-canvas px-2 py-0.5 font-mono text-ink">
                  Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink">Operations Copilot</span>
                <kbd className="rounded border border-line bg-canvas px-2 py-0.5 font-mono text-ink">
                  Ctrl + /
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink">Shortcuts Helper</span>
                <kbd className="rounded border border-line bg-canvas px-2 py-0.5 font-mono text-ink">
                  ?
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink">Close Dialog / Drawer</span>
                <kbd className="rounded border border-line bg-canvas px-2 py-0.5 font-mono text-ink">
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
