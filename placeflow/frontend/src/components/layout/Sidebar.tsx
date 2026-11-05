import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { usePersona } from '../../context/PersonaContext';
import { NAV, Persona, NavItem } from '../../app/navigation';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  currentTab?: string;
  onSelectTab?: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { activePersona, switchPersona } = usePersona();
  const [showOtherRoles, setShowOtherRoles] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navSections = NAV[activePersona] || NAV.TPO;

  const handleSwitchPersona = (role: Persona) => {
    switchPersona(role);
    navigate('/home');
  };

  const isItemActive = (item: NavItem) => {
    if (item.path === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <aside className="w-[240px] bg-brand text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-brand-hover select-none font-sans">
      {/* 1. Brand Header with Cardinal Accent on Logo Mark Only */}
      <div className="p-4 border-b border-white/10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-xs">
          M
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm text-white tracking-tight truncate leading-tight">
            Meridian
          </div>
          <div className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
            Campus to Career OS
          </div>
        </div>
      </div>

      {/* 2. Flagship Persona Switcher (Student & TPO Front and Center) */}
      <div className="px-3 pt-3 pb-2 border-b border-white/10">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
          Active Workspace
        </div>
        <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => handleSwitchPersona('TPO')}
            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150 text-center truncate ${
              activePersona === 'TPO'
                ? 'bg-surface text-ink font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            TPO Officer
          </button>
          <button
            onClick={() => handleSwitchPersona('STUDENT')}
            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150 text-center truncate ${
              activePersona === 'STUDENT'
                ? 'bg-surface text-ink font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Student
          </button>
        </div>

        {/* Secondary Roles Collapsible */}
        <div className="mt-1.5">
          <button
            onClick={() => setShowOtherRoles(!showOtherRoles)}
            className="w-full flex items-center justify-between px-1.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>Additional Personas ({activePersona !== 'TPO' && activePersona !== 'STUDENT' ? activePersona : 'Switch'})</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-150 ${showOtherRoles ? 'rotate-180' : ''}`}
            />
          </button>
          {showOtherRoles && (
            <div className="mt-1 space-y-0.5 pl-1 pr-1 pb-1">
              {(
                [
                  { id: 'FACULTY', label: 'Faculty Portal' },
                  { id: 'HOD', label: 'HOD / Dean' },
                  { id: 'MANAGEMENT', label: 'Executive Management' },
                  { id: 'ADMIN', label: 'Campus Admin (CAMP Setup)' },
                ] as const
              ).map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    handleSwitchPersona(role.id);
                    setShowOtherRoles(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center justify-between ${
                    activePersona === role.id
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{role.label}</span>
                  {role.id !== 'ADMIN' && (
                    <span className="text-[9px] px-1 py-0.2 bg-white/10 text-slate-400 rounded">
                      Preview
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Navigation List from NAV Map */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={section.title || `sec_${sIdx}`}>
            {section.title && (
              <div className="px-2 mb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors duration-150 text-left cursor-pointer ${
                      active
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={active ? 'text-white shrink-0' : 'text-slate-400 shrink-0'}
                    />
                    <span className="truncate flex-1">{item.label}</span>
                    {item.status === 'preview' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-medium tracking-normal shrink-0">
                        Preview
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 4. Footer System Badge */}
      <div className="p-3 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="truncate">Apex University &bull; Main</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Connected"></span>
      </div>
    </aside>
  );
};
