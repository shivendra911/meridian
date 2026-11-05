import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Users,
  ShieldCheck,
  Building2,
  Bot,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { usePersona, UserPersona } from '../../context/PersonaContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onOpenCopilot: () => void;
}

interface CommandItem {
  id: string;
  category: string;
  label: string;
  description?: string;
  icon: any;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenCopilot,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { switchPersona } = usePersona();

  const commands: CommandItem[] = [
    // Workspaces
    {
      id: 'sw_student',
      category: 'Switch Persona',
      label: 'Switch to Student Workspace',
      description: 'Academics, registration, timetable & placements',
      icon: GraduationCap,
      action: () => {
        switchPersona('STUDENT');
        onNavigateTab('overview');
      },
      shortcut: 'P 1',
    },
    {
      id: 'sw_faculty',
      category: 'Switch Persona',
      label: 'Switch to Faculty Workspace',
      description: 'Course delivery, attendance & gradebook',
      icon: Users,
      action: () => {
        switchPersona('FACULTY');
        onNavigateTab('overview');
      },
      shortcut: 'P 2',
    },
    {
      id: 'sw_hod',
      category: 'Switch Persona',
      label: 'Switch to HOD / Dean Workspace',
      description: 'Departmental command, approvals & workload',
      icon: Building2,
      action: () => {
        switchPersona('HOD_DEAN');
        onNavigateTab('overview');
      },
      shortcut: 'P 3',
    },
    {
      id: 'sw_tpo',
      category: 'Switch Persona',
      label: 'Switch to TPO Placement Workspace',
      description: 'Recruitment campaigns, drives & Superdays',
      icon: Briefcase,
      action: () => {
        switchPersona('TPO_PLACEMENT');
        onNavigateTab('overview');
      },
      shortcut: 'P 4',
    },
    {
      id: 'sw_mgmt',
      category: 'Switch Persona',
      label: 'Switch to Executive Management',
      description: 'Multi-campus oversight & statutory telemetry',
      icon: ShieldCheck,
      action: () => {
        switchPersona('MANAGEMENT');
        onNavigateTab('overview');
      },
      shortcut: 'P 5',
    },

    // Guided Actions
    {
      id: 'act_academic',
      category: 'Academic Life',
      label: 'Open Curriculum & Prerequisite Designer',
      description: 'CAMP-03 NEP 2020 course baskets & DAG',
      icon: GraduationCap,
      action: () => onNavigateTab('academic'),
      shortcut: 'G A',
    },
    {
      id: 'act_iam',
      category: 'Governance',
      label: 'Identity & Access Management (IAM)',
      description: 'CAMP-02 RBAC roles, delegations & sessions',
      icon: ShieldCheck,
      action: () => onNavigateTab('iam'),
      shortcut: 'G I',
    },
    {
      id: 'act_topo',
      category: 'Governance',
      label: 'Institutional Topology & Hierarchy Graph',
      description: 'CAMP-01 Organization units & campuses',
      icon: Building2,
      action: () => onNavigateTab('architecture'),
      shortcut: 'G T',
    },
    {
      id: 'act_superday',
      category: 'Recruitment',
      label: 'Superday Interview Clash Solver',
      description: 'Resolve candidate scheduling overlaps',
      icon: Zap,
      action: () => onNavigateTab('superday'),
      shortcut: 'G S',
    },
    {
      id: 'act_copilot',
      category: 'Campus AI',
      label: 'Launch Campus AI Copilot',
      description: 'Policy RAG, Domain Agents & Traces',
      icon: Bot,
      action: () => onOpenCopilot(),
      shortcut: 'Ctrl + /',
    },
  ];

  const filteredCommands = commands.filter((c) =>
    `${c.category} ${c.label} ${c.description || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length)
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto pt-[12vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative mx-auto max-w-xl bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden transform transition-all font-sans select-none">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-200 bg-slate-50/50">
          <Search size={18} className="text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type a command or search workspace... (Esc to exit)"
            className="w-full py-3.5 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
          />
          <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-red-50/80 text-[#8C1515]' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-[#8C1515] text-white border-red-700'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                        <span>{cmd.label}</span>
                        <span className="text-[9px] font-mono font-normal uppercase text-slate-400">
                          &bull; {cmd.category}
                        </span>
                      </div>
                      {cmd.description && (
                        <div className="text-[11px] text-slate-500 truncate">
                          {cmd.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && <ArrowRight size={13} className="text-[#8C1515]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <span>&uarr;&darr; to navigate</span>
            <span>&bull;</span>
            <span>&crarr; to select</span>
          </div>
          <span>PlaceFlow OS v4.2</span>
        </div>
      </div>
    </div>
  );
};

