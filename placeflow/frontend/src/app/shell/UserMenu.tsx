import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  Keyboard,
  LogOut,
  ChevronDown,
  Building2} from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';
import { formatRoleLabel } from '../../core/auth/roleLabels';
import { Avatar } from '../../ui/cards/Avatar';

export interface UserMenuProps {
  onOpenShortcuts?: () => void;
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onOpenShortcuts, className = '' }) => {
  const { me, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const displayName = me?.profile?.display_name || me?.display_name || 'Member';
  const email = me?.profile?.email || me?.subject?.id || 'Active Account';
  const roleLabel = me?.profile?.affiliation_label ? formatRoleLabel(me.profile.affiliation_label) : formatRoleLabel(me?.assignments?.[0]?.role_code);
  const institutionName = me?.profile?.institution_name || 'Meridian Campus';
  const avatarUrl = me?.profile?.avatar_url || null;

  const handleSignOut = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Trigger Button: 32px Avatar (+ name on desktop) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full p-0.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 transition-colors"
        title="Open user settings & profile"
      >
        <Avatar src={avatarUrl} name={displayName} size={32} />
        <span className="hidden xl:inline-block text-xs font-medium text-ink max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown size={12} className="hidden xl:inline-block text-ink-muted" />
      </button>

      {/* 280px User Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-line bg-surface p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
          {/* Mini Profile Card Header */}
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50/70 border border-line">
            <Avatar src={avatarUrl} name={displayName} size={40} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold leading-tight text-ink truncate m-0">
                {displayName}
              </h4>
              <p className="mt-0.5 text-xs text-ink-muted truncate m-0" title={email}>
                {email}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-slate-200 text-slate-800">
                  {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-ink-muted truncate max-w-[120px]">
                  <Building2 size={10} className="shrink-0" />
                  <span className="truncate">{institutionName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="mt-1.5 space-y-0.5 border-t border-line pt-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/account/profile');
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-ink hover:bg-surface-muted transition-colors text-left"
            >
              <User size={15} className="text-slate-500 shrink-0" />
              <span>View profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/account/security');
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-ink hover:bg-surface-muted transition-colors text-left"
            >
              <Settings size={15} className="text-slate-500 shrink-0" />
              <span>Account settings</span>
            </button>

            {onOpenShortcuts && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenShortcuts();
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-ink hover:bg-surface-muted transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Keyboard size={15} className="text-slate-500 shrink-0" />
                  <span>Keyboard shortcuts</span>
                </div>
                <kbd className="rounded border border-line bg-slate-50 px-1.5 py-0.5 text-xs font-mono text-ink-muted">
                  ?
                </kbd>
              </button>
            )}
          </div>

          {/* Sign Out Action */}
          <div className="mt-1.5 border-t border-line pt-1.5">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-rose-700 hover:bg-rose-50 transition-colors text-xs font-medium text-left"
            >
              <LogOut size={15} className="text-rose-600 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
