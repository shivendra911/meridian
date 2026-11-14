import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';
import { PortalNavItem, PORTAL_METAS } from './types';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { Logo } from '../../ui/Logo';

export interface SidebarProps {
  portal: string;
  nav: PortalNavItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenShortcuts?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  portal,
  nav,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenShortcuts,
}) => {
  const { can, me } = useAuth();
  const location = useLocation();

  const portalMeta = PORTAL_METAS[portal] || {
    name: 'Workspace',
    shortName: portal.toUpperCase(),
    icon: PORTAL_METAS.student.icon,
  };

  const visibleNav = nav.filter((item) => {
    if (!item.permission) return true;
    return can(item.permission);
  });

  const isNavActive = (path: string) => {
    if (path.endsWith('/home')) {
      return location.pathname === `/${portal}` || location.pathname === `/${portal}/home` || location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col select-none bg-brand text-slate-300">
      {/* 56px Header: Aligned with TopBar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Logo size="md" showText={!isCollapsed} subtitle={portalMeta.shortName} />
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden text-slate-400 hover:text-white p-1 rounded"
        >
          <X size={18} />
        </button>
      </div>

      {/* Workspace Switcher in Header (when not collapsed and user has multiple portals) */}
      {!isCollapsed && me?.portals && me.portals.length > 1 && (
        <div className="border-b border-white/10 p-2.5">
          <WorkspaceSwitcher currentPortal={portal} />
        </div>
      )}

      {/* Nav items list */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item.path);

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={onCloseMobile}
              title={isCollapsed ? item.label : undefined}
              className={`relative flex items-center h-9 rounded-lg px-3 text-xs font-medium transition-all duration-150 ${
                active
                  ? 'bg-white/12 text-white font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-white before:rounded-r'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon size={16} className={`shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
              {!isCollapsed && (
                <>
                  <span className="ml-2.5 flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto inline-flex items-center rounded-full bg-white/15 px-1.5 py-0.2 text-xs font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Help & Collapse Button only */}
      <div className="shrink-0 border-t border-white/10 p-2 flex items-center justify-between">
        {onOpenShortcuts && !isCollapsed && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="flex items-center gap-2 rounded-lg p-2 text-xs text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle size={15} />
            <span>Shortcuts</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/8 transition-colors ml-auto"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="fixed inset-y-0 left-0 z-30 h-full overflow-hidden transition-all duration-200" style={{ width: isCollapsed ? '4rem' : '15rem' }}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex w-64 flex-1 flex-col z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
