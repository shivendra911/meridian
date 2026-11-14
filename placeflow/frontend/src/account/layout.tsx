import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  Lock,
  ArrowLeft} from 'lucide-react';
import { useAuth } from '../core/auth/useAuth';
import { Avatar } from '../ui/cards/Avatar';

const ACCOUNT_TABS = [
  { path: '/account/profile', label: 'Profile', icon: User },
  { path: '/account/security', label: 'Security & Sessions', icon: Shield },
  { path: '/account/notifications', label: 'Notifications', icon: Bell },
  { path: '/account/privacy', label: 'Privacy & Data Rights', icon: Lock },
];

export const AccountLayout: React.FC = () => {
  const { me, status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const defaultPortal = me?.default_portal || (me?.portals && me.portals[0]) || 'student';
  const workspaceUrl = `/${defaultPortal}/home`;
  const displayName = me?.profile?.display_name || me?.display_name || 'Member';
  const avatarUrl = me?.profile?.avatar_url || null;

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 h-14 border-b border-line bg-surface/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={workspaceUrl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-brand transition-colors p-1 rounded-md"
            title="Return to workspace"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Workspace</span>
          </Link>

          <span className="text-slate-300">/</span>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand text-white font-bold text-xs">
              M
            </span>
            <span className="text-xs font-bold text-ink">Account & Settings</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/account/profile"
            className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 transition-colors"
          >
            <Avatar src={avatarUrl} name={displayName} size={32} />
            <span className="text-xs font-medium text-ink hidden md:inline truncate max-w-[140px]">
              {displayName}
            </span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Navigation Tabs */}
        <div className="border-b border-line mb-8 overflow-x-auto scrollbar-none">
          <nav className="flex space-x-6 min-w-max" aria-label="Account Settings Tabs">
            {ACCOUNT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.path === '/account/profile'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 pb-3 text-xs font-semibold transition-colors border-b-2 ${
                      isActive
                        ? 'border-brand text-brand'
                        : 'border-transparent text-ink-muted hover:text-ink hover:border-slate-300'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
