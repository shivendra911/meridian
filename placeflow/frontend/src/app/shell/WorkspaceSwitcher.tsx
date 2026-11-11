import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';
import { PORTAL_METAS } from './types';

export interface WorkspaceSwitcherProps {
  currentPortal: string;
  className?: string;
  compact?: boolean;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  currentPortal,
  className = '',
  compact = false,
}) => {
  const { me, switchPortal } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const portals = me?.portals || [currentPortal];
  const activeMeta = PORTAL_METAS[currentPortal] || {
    name: 'Workspace',
    shortName: currentPortal.toUpperCase(),
    icon: PORTAL_METAS.student.icon,
    homePath: `/${currentPortal}/home`,
  };
  const ActiveIcon = activeMeta.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Only render switcher if the user has more than 1 portal assigned
  if (portals.length <= 1) {
    if (compact) return null;
    return (
      <div className={`flex items-center gap-2 text-xs text-slate-300 ${className}`}>
        <span className="font-medium text-white truncate">{activeMeta.shortName}</span>
      </div>
    );
  }

  const handleSelect = (portalCode: string) => {
    setIsOpen(false);
    if (portalCode === currentPortal) return;
    switchPortal(portalCode);
    const targetMeta = PORTAL_METAS[portalCode];
    navigate(targetMeta?.homePath || `/${portalCode}/home`);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        title="Switch institutional workspace"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ActiveIcon size={14} className="text-slate-300 shrink-0" />
          <span className="font-medium truncate">{activeMeta.shortName}</span>
        </div>
        <ChevronDown size={13} className="text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Available Workspaces
          </div>
          <div className="space-y-0.5 mt-1">
            {portals.map((pCode) => {
              const meta = PORTAL_METAS[pCode];
              if (!meta) return null;
              const Icon = meta.icon;
              const isCurrent = pCode === currentPortal;

              return (
                <button
                  key={pCode}
                  type="button"
                  onClick={() => handleSelect(pCode)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                    isCurrent
                      ? 'bg-brand/10 font-semibold text-brand'
                      : 'text-ink hover:bg-surface-muted'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon size={16} className={isCurrent ? 'text-brand' : 'text-slate-500'} />
                    <div className="min-w-0">
                      <p className="truncate font-medium m-0">{meta.name}</p>
                      <p className="text-[10px] text-ink-muted truncate m-0">{meta.shortName}</p>
                    </div>
                  </div>
                  {isCurrent && <Check size={14} className="text-brand shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
