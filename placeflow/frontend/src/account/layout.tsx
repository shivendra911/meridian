import React, { useEffect } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  Lock,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../core/auth/useAuth';
import { Avatar } from '../ui/cards/Avatar';
import { MacOsLoadingScreen } from '../components/ui/MacOsLoadingScreen';

const ACCOUNT_TABS = [
  { path: '/account/home', label: 'Overview', icon: LayoutDashboard },
  { path: '/account/profile', label: 'Profile', icon: User },
  { path: '/account/security', label: 'Security & Sessions', icon: Shield },
  { path: '/account/notifications', label: 'Notifications', icon: Bell },
  { path: '/account/privacy', label: 'Privacy & Data Rights', icon: Lock },
];

export const AccountLayout: React.FC = () => {
  const { me, status } = useAuth();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  if (status === 'loading') {
    return (
      <MacOsLoadingScreen
        message="Loading Account & Settings..."
        description="Decrypting profile and security preferences"
      />
    );
  }

  const defaultPortal = me?.default_portal || (me?.portals && me.portals[0]) || 'student';
  const workspaceUrl = `/${defaultPortal}/home`;
  const displayName = me?.profile?.display_name || me?.display_name || 'Member';
  const avatarUrl = me?.profile?.avatar_url || null;

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 h-14 border-b border-line/70 bg-surface/85 macos-frosted px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={workspaceUrl}
            className="macos-press-sm inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-brand transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            title="Return to workspace"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Workspace</span>
          </Link>

          <span className="text-slate-300">/</span>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand text-white font-bold text-xs shadow-xs">
              M
            </span>
            <span className="text-xs font-bold text-ink">Account & Settings</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/account/profile"
            className="macos-press-sm flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 transition-colors"
          >
            <Avatar src={avatarUrl} name={displayName} size={32} />
            <span className="text-xs font-medium text-ink hidden md:inline truncate max-w-[140px]">
              {displayName}
            </span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col macos-elevation-dissolve">
        {/* Navigation Tabs */}
        <div className="mb-8 overflow-x-auto scrollbar-none">
          <nav className="inline-flex macos-segmented border border-line/60 gap-1 min-w-max" aria-label="Account Settings Tabs">
            {ACCOUNT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end
                  className={({ isActive }) =>
                    `macos-press-sm flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-lg transition-all duration-180 ${
                      isActive
                        ? 'macos-segmented-pill text-ink font-semibold'
                        : 'text-ink-muted hover:text-ink hover:bg-surface/50'
                    }`
                  }
                >
                  <Icon size={14} className="shrink-0" />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Tab Content with Fluid Transition */}
        <div key={location.pathname} className="flex-1 macos-elevation-dissolve">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
