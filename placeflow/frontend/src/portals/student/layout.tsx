/**
 * PlaceFlow / Meridian — Student Portal Layout (Phase 4).
 *
 * Scoped layout with student-centric nav, workspace switching, and profile badge.
 */

import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';
import { STUDENT_NAV_ITEMS } from './nav';
import { Badge } from '../../ui';

const PORTAL_NAMES: Record<string, string> = {
  tpo: 'TPO Operations',
  student: 'Student Workspace',
  faculty: 'Faculty Advising',
  hod: 'Department Head',
  management: 'Executive / NIRF',
  admin: 'Institutional Admin',
};

export const StudentLayout: React.FC = () => {
  const { me, logout, can } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPortalMenu, setShowPortalMenu] = useState(false);

  const visibleNav = STUDENT_NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return can(item.permission);
  });

  const isNavActive = (path: string) => {
    if (path === '/student/home') {
      return location.pathname === '/student' || location.pathname === '/student/home';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-canvas font-sans text-ink antialiased">
      {/* 1. Student Sidebar */}
      <aside className="w-60 bg-brand text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-brand-hover select-none">
        <div className="p-4 border-b border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-xs">
            M
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-white tracking-tight truncate leading-tight">
              Meridian
            </div>
            <div className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
              Student Career Workspace
            </div>
          </div>
        </div>

        <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Workspace</span>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 font-mono">
            STUDENT
          </span>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.path);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-surface text-ink font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={16} className={active ? 'text-brand' : 'text-slate-400'} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="neutral" size="xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 bg-black/10">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {me?.display_name || 'Candidate'}
              </div>
              <div className="text-[10px] text-slate-400 truncate font-mono">
                {me?.subject?.id || me?.account_id}
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main View */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-line bg-surface px-8 flex items-center justify-between select-none z-20">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="font-semibold text-ink">Student Workspace</span>
            <span>/</span>
            <span className="text-brand font-medium">
              {location.pathname.replace('/student/', '').replace('/', ' / ') || 'Home'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {me && me.portals && me.portals.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowPortalMenu(!showPortalMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line bg-surface hover:bg-canvas text-xs text-ink transition-colors cursor-pointer"
                >
                  <Sparkles size={13} className="text-amber-500" />
                  <span className="font-medium">Switch Portal</span>
                  <ChevronDown size={12} className="text-ink-muted" />
                </button>

                {showPortalMenu && (
                  <div className="absolute right-0 mt-1 w-52 rounded-lg bg-surface border border-line shadow-lg py-1 z-50 text-xs">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted border-b border-line">
                      Available Workspaces
                    </div>
                    {me.portals.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setShowPortalMenu(false);
                          navigate(`/${p}/home`);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-canvas transition-colors cursor-pointer"
                      >
                        <span className={`capitalize ${p === 'student' ? 'font-semibold text-brand' : 'text-ink'}`}>
                          {PORTAL_NAMES[p] || p}
                        </span>
                        {p === 'student' && <Check size={14} className="text-brand" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <span className="text-xs text-ink-muted border-l border-line pl-3">
              {me?.institution_id || 'Apex University'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

