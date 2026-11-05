import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ChevronDown,
  Building2,
  ShieldCheck,
  Landmark,
  Inbox,
  Sparkles,
  Command,
  UserCheck,
  GraduationCap,
  Users,
  Briefcase,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePersona, PERSONA_CONFIGS, UserPersona } from '../../context/PersonaContext';
import { Badge } from '../ui/Badge';

interface MastheadProps {
  onSearchStudent: (studentId: string) => void;
  onOpenCommandPalette: () => void;
  onOpenInbox: () => void;
  onOpenCopilot: () => void;
  inboxCount?: number;
}

export const Masthead: React.FC<MastheadProps> = ({
  onSearchStudent,
  onOpenCommandPalette,
  onOpenInbox,
  onOpenCopilot,
  inboxCount = 5,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showCampusMenu, setShowCampusMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { activePersona, personaConfig, switchPersona } = usePersona();

  const {
    tenants,
    activeTenant,
    institutions,
    activeInstitution,
    campuses,
    activeCampus,
    switchTenant,
    switchCampus,
  } = useTenant();

  // Handle global "/" shortcut to focus search
  useEffect(() => {
    const handleGlobalSlash = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalSlash);
    return () => window.removeEventListener('keydown', handleGlobalSlash);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchStudent(searchInput.trim().toUpperCase());
      setSearchInput('');
    }
  };

  const personaIcons: Record<UserPersona, any> = {
    STUDENT: GraduationCap,
    FACULTY: Users,
    HOD_DEAN: Building2,
    TPO_PLACEMENT: Briefcase,
    MANAGEMENT: ShieldCheck,
  };

  const ActivePersonaIcon = personaIcons[activePersona] || UserCheck;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs font-sans">
      {/* Top Multi-Tenant Institutional Bar */}
      <div className="bg-[#0B1B3D] text-white px-6 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {/* Tenant Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTenantMenu(!showTenantMenu);
                setShowCampusMenu(false);
                setShowPersonaMenu(false);
              }}
              className="flex items-center gap-2 font-bold tracking-wider uppercase text-slate-100 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              <Landmark size={14} className="text-amber-400" />
              <span>{activeTenant ? activeTenant.name : 'Platform Workspace'}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {showTenantMenu && (
              <div className="absolute left-0 mt-1.5 w-72 bg-white text-slate-800 rounded-md shadow-xl border border-slate-200 py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Switch Active Institutional Tenant
                </div>
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      switchTenant(t.id);
                      setShowTenantMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      activeTenant?.id === t.id ? 'bg-red-50 text-[#8C1515] font-semibold' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        slug: {t.slug} &bull; {t.customer_type}
                      </div>
                    </div>
                    {activeTenant?.id === t.id && (
                      <span className="text-[10px] bg-red-100 text-[#8C1515] px-1.5 py-0.5 rounded font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-slate-500">&bull;</span>

          {/* Active Campus Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCampusMenu(!showCampusMenu);
                setShowTenantMenu(false);
                setShowPersonaMenu(false);
              }}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-800/60 px-2.5 py-1 rounded border border-slate-700 text-xs transition-colors cursor-pointer"
            >
              <Building2 size={13} className="text-emerald-400" />
              <span>{activeCampus ? activeCampus.campus_name : 'Primary Campus'}</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1 rounded uppercase tracking-wider font-mono">
                Primary
              </span>
              <ChevronDown size={11} className="text-slate-400 ml-0.5" />
            </button>

            {showCampusMenu && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white text-slate-800 rounded-md shadow-xl border border-slate-200 py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Campuses ({campuses.length})
                </div>
                {campuses.map((c) => (
                  <button
                    key={c.campus_id}
                    onClick={() => {
                      switchCampus(c.campus_id);
                      setShowCampusMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                      activeCampus?.campus_id === c.campus_id
                        ? 'bg-emerald-50 text-emerald-900 font-semibold'
                        : ''
                    }`}
                  >
                    <div>
                      <div className="text-slate-900">{c.campus_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {c.campus_code} &bull; {c.campus_kind}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Persona Switcher & Tool Triggers */}
        <div className="flex items-center gap-3">
          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPersonaMenu(!showPersonaMenu);
                setShowTenantMenu(false);
                setShowCampusMenu(false);
              }}
              className="flex items-center gap-2 bg-[#8C1515] hover:bg-[#701010] text-white px-2.5 py-1 rounded border border-red-700 transition-colors text-xs font-semibold cursor-pointer shadow-xs"
            >
              <ActivePersonaIcon size={13} className="text-amber-300" />
              <span>{personaConfig.badgeLabel}</span>
              <ChevronDown size={11} className="text-red-200" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white text-slate-800 rounded-md shadow-xl border border-slate-200 py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Switch Active Operating Persona
                </div>
                {(Object.keys(PERSONA_CONFIGS) as UserPersona[]).map((pKey) => {
                  const cfg = PERSONA_CONFIGS[pKey];
                  const PIcon = personaIcons[pKey];
                  const isActive = activePersona === pKey;
                  return (
                    <button
                      key={pKey}
                      onClick={() => {
                        switchPersona(pKey);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isActive ? 'bg-red-50 text-[#8C1515] font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
                            isActive
                              ? 'bg-[#8C1515] text-white border-red-700'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <PIcon size={13} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{cfg.title}</div>
                          <div className="text-[10px] text-slate-500">{cfg.roleDescription}</div>
                        </div>
                      </div>
                      {isActive && (
                        <span className="text-[9px] bg-red-100 text-[#8C1515] font-mono font-bold px-1 rounded">
                          ACTIVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unified Task Inbox Trigger */}
          <button
            onClick={onOpenInbox}
            title="My Work • Unified Task Inbox"
            className="relative p-1.5 text-slate-300 hover:text-white rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            <Inbox size={14} />
            {inboxCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8C1515] text-white text-[9px] font-mono font-bold flex items-center justify-center border border-white">
                {inboxCount}
              </span>
            )}
          </button>

          {/* AISHE Verified Gate Pill */}
          <div className="flex items-center gap-1.5 text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2.5 py-0.5 rounded font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>AISHE Verified</span>
          </div>
        </div>
      </div>

      {/* Sub-header Command & Search Toolbar */}
      <div className="px-6 py-2 flex items-center justify-between gap-4 bg-slate-50/70 border-b border-slate-200">
        <form onSubmit={handleSubmit} className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-2 text-slate-400" size={14} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search candidate roll (STU001), course, or partner company... [/]"
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#8C1515] focus:outline-hidden transition-all font-mono"
          />
          <span className="absolute right-2.5 top-1.5 text-[10px] bg-slate-100 text-slate-500 font-mono px-1 rounded border border-slate-200">
            /
          </span>
        </form>

        <div className="flex items-center gap-2.5">
          {/* Command Palette Trigger Button */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <Command size={13} className="text-slate-400" />
            <span>Command Palette</span>
            <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
              Ctrl K
            </kbd>
          </button>

          {/* Copilot Quick Launch Pill */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8C1515] bg-[#FDF2F2] hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
          >
            <Sparkles size={13} className="text-[#8C1515]" />
            <span>Campus AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
