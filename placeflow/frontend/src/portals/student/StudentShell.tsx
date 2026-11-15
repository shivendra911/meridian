import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { STUDENT_NAV_ITEMS } from './nav';
import { TopNavBar } from '../../ui/TopNavBar';
import { BottomTabBar } from '../../ui/BottomTabBar';
import { UserMenu } from '../../app/shell/UserMenu';
import { NotificationsBell } from '../../app/shell/NotificationsBell';
import { DelegationBanner } from '../../app/shell/DelegationBanner';
import { CommandPalette } from '../../components/navigation/CommandPalette';
import { CampusCopilotDrawer } from '../../components/ai/CampusCopilotDrawer';
import { FloatingCopilotTrigger } from '../../components/ai/FloatingCopilotTrigger';
import { ErrorBoundary } from '../../app/ErrorBoundary';
import { X, Keyboard } from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';

export const StudentShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { me } = useAuth();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Instant scroll restoration on route change
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

  const topTabs = STUDENT_NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    path: item.path,
    icon: item.icon,
  }));

  const bottomTabs = STUDENT_NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    path: item.path,
    badge: item.id === 'student-inbox' ? me?.unread_notifications || 0 : undefined,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans text-ink antialiased">
      {/* 1. Desktop & Tablet Top Navigation Bar (Phone-first, no sidebar) */}
      <TopNavBar
        tabs={topTabs}
        activeTab={location.pathname}
        onSelectTab={(path) => navigate(path)}
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        notificationCount={me?.unread_notifications || 0}
        userMenuTrigger={
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <UserMenu onOpenShortcuts={() => setIsShortcutsOpen(true)} />
          </div>
        }
      />

      <DelegationBanner />

      {/* 2. Main Candidate Viewport */}
      <main
        key={location.pathname}
        className="flex-1 w-full max-w-[1280px] mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 page-content-fade"
      >
        <ErrorBoundary>
          <Outlet context={{ onOpenCopilot: () => setIsCopilotOpen(true) }} />
        </ErrorBoundary>
      </main>

      {/* 3. Mobile Bottom Tab Bar (Phone-first 390px, fixed bottom) */}
      <BottomTabBar
        tabs={bottomTabs}
        activeTab={location.pathname}
        onSelectTab={(path) => navigate(path)}
      />

      {/* 4. Global Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onNavigateTab={(tab) => {
          setIsPaletteOpen(false);
          navigate(`/student/${tab}`);
        }}
        onOpenCopilot={() => {
          setIsPaletteOpen(false);
          setIsCopilotOpen(true);
        }}
      />

      {/* 5. Role-Specific Campus AI Copilot Console & Floating Dock Trigger */}
      <FloatingCopilotTrigger onClick={() => setIsCopilotOpen(true)} portal="student" />
      <CampusCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        portal="student"
      />

      {/* 6. Keyboard Shortcuts Dialog */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-5 shadow-2xl border border-line animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Keyboard size={18} className="text-brand" />
                <h3 className="text-sm font-semibold text-ink m-0">Candidate Shortcuts</h3>
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
                <kbd className="rounded border border-line bg-canvas px-2 py-0.5 font-mono text-ink">
                  Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink">Campus AI Copilot Console</span>
                <kbd className="rounded border border-line bg-canvas px-2 py-0.5 font-mono text-ink">
                  Ctrl + J
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink">Open Shortcuts Dialog</span>
                <kbd className="rounded border border-line bg-canvas px-2 py-0.5 font-mono text-ink">
                  ?
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink">Close Dialog / Popover</span>
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
