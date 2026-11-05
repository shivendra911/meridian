import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  Building2,
  Inbox,
  Sparkles,
  Command,
  Check,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePersona } from '../../context/PersonaContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

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
  const { activePersona, personaConfig } = usePersona();
  const { activeTenant, activeCampus, institutions, switchTenant } = useTenant();
  const [showTenantMenu, setShowTenantMenu] = useState(false);

  return (
    <header className="h-14 border-b border-line bg-surface px-8 flex items-center justify-between select-none z-30 font-sans">
      {/* 1. Ctrl+K Search Trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-line bg-canvas text-xs text-ink-muted hover:text-ink hover:border-slate-300 transition-colors duration-150 w-64 sm:w-72 md:w-80 cursor-pointer"
        >
          <Search size={14} className="text-ink-muted shrink-0" />
          <span className="flex-1 text-left truncate">Search candidate, drive, or rule...</span>
          <kbd className="text-[10px] bg-surface px-1.5 py-0.5 rounded border border-line font-mono font-medium text-ink-muted shrink-0">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* 2. Institutional Context, Notifications, AI & User Profile */}
      <div className="flex items-center gap-3">
        {/* Institution / Campus Selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowTenantMenu(!showTenantMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line bg-surface hover:bg-canvas text-xs text-ink transition-colors duration-150"
          >
            <Building2 size={14} className="text-brand shrink-0" />
            <span className="font-medium truncate max-w-[140px]">
              {activeTenant?.name || 'Apex University'}
            </span>
            <ChevronDown size={12} className="text-ink-muted" />
          </button>

          {showTenantMenu && (
            <div className="absolute right-0 mt-1 w-56 rounded-lg bg-surface border border-line shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted border-b border-line">
                Active Institution
              </div>
              <button
                onClick={() => {
                  switchTenant('apex-group');
                  setShowTenantMenu(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-canvas transition-colors"
              >
                <div>
                  <div className="font-medium text-ink">Apex University</div>
                  <div className="text-[11px] text-ink-muted">Main Campus &bull; Delhi NCR</div>
                </div>
                <Check size={14} className="text-brand" />
              </button>
            </div>
          )}
        </div>

        {/* Notifications / Inbox ("My Work") */}
        <button
          onClick={onOpenInbox}
          className="relative p-2 rounded-lg border border-line bg-surface hover:bg-canvas text-ink-muted hover:text-ink transition-colors duration-150 cursor-pointer"
          title="Unified Task Inbox"
        >
          <Inbox size={16} />
          {inboxCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
              {inboxCount}
            </span>
          )}
        </button>

        {/* Copilot Trigger Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCopilot}
          leftIcon={<Sparkles size={14} className="text-accent" />}
          className="hidden sm:inline-flex"
        >
          <span>Copilot</span>
        </Button>

        {/* User Persona Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-line">
          <div className="w-8 h-8 rounded-lg bg-brand text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {personaConfig.avatarInitials}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-ink leading-tight truncate max-w-[120px]">
              {personaConfig.badgeLabel}
            </div>
            <div className="text-[10px] text-ink-muted leading-tight truncate max-w-[120px]">
              {activePersona === 'STUDENT' ? 'Rohan Sharma' : 'Officer V. Iyer'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
