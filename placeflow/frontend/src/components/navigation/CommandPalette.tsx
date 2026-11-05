import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  User,
  Sparkles,
  Award,
  Radar,
  Scale,
  FileText,
} from 'lucide-react';
import { usePersona } from '../../context/PersonaContext';
import { api } from '../../api';

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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { switchPersona } = usePersona();

  // Dynamic entity registries loaded from real backend
  const [students, setStudents] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([api.getStudents(), api.getJobs(), api.getCompanies()])
        .then(([sRes, jRes, cRes]) => {
          setStudents(sRes.students || []);
          setJobs(jRes.jobs || []);
          setCompanies(cRes.companies || []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const baseCommands: CommandItem[] = [
    // Persona Switchers
    {
      id: 'sw_tpo',
      category: 'Switch Persona',
      label: 'Switch to TPO Placement Officer',
      description: 'Institutional placement drives, recruiter CRM & Superday',
      icon: Briefcase,
      action: () => {
        switchPersona('TPO');
        navigate('/home');
      },
      shortcut: 'P 1',
    },
    {
      id: 'sw_student',
      category: 'Switch Persona',
      label: 'Switch to Student Portal',
      description: 'Candidate opportunities feed, application tracker & VTI profile',
      icon: GraduationCap,
      action: () => {
        switchPersona('STUDENT');
        navigate('/home');
      },
      shortcut: 'P 2',
    },
    {
      id: 'sw_faculty',
      category: 'Switch Persona',
      label: 'Switch to Faculty Teaching Workspace',
      description: 'Course roster delivery, attendance & CIE gradebook',
      icon: Users,
      action: () => {
        switchPersona('FACULTY');
        navigate('/home');
      },
      shortcut: 'P 3',
    },
    {
      id: 'sw_hod',
      category: 'Switch Persona',
      label: 'Switch to HOD / Dean Command',
      description: 'Department leadership, curriculum approvals & workload',
      icon: Building2,
      action: () => {
        switchPersona('HOD');
        navigate('/home');
      },
      shortcut: 'P 4',
    },
    {
      id: 'sw_mgmt',
      category: 'Switch Persona',
      label: 'Switch to Executive Management',
      description: 'Multi-campus statutory oversight & NIRF accreditation',
      icon: ShieldCheck,
      action: () => {
        switchPersona('MANAGEMENT');
        navigate('/home');
      },
      shortcut: 'P 5',
    },

    // Fast Action Workflows
    {
      id: 'act_drives',
      category: 'Placement Directorate',
      label: 'Manage Placement Drives (JNFs)',
      description: 'Create & inspect active recruitment campaigns',
      icon: Briefcase,
      action: () => navigate('/placement/drives'),
      shortcut: 'G D',
    },
    {
      id: 'act_superday',
      category: 'Placement Directorate',
      label: 'Superday Interview Clash Solver',
      description: 'Arbitrate conflicting candidate evaluation slots',
      icon: Zap,
      action: () => navigate('/placement/interviews'),
      shortcut: 'G S',
    },
    {
      id: 'act_renege',
      category: 'Placement Directorate',
      label: 'Retention & Renege Radar',
      description: 'Post-offer flight risk telemetry & predictive early warning',
      icon: Radar,
      action: () => navigate('/placement/offers'),
      shortcut: 'G R',
    },
    {
      id: 'act_opps',
      category: 'Student Portal',
      label: 'Candidate Opportunities Feed',
      description: 'Explore matching placement drives & submit applications',
      icon: Sparkles,
      action: () => navigate('/opportunities'),
      shortcut: 'G O',
    },
    {
      id: 'act_apps',
      category: 'Student Portal',
      label: 'My Application Progression Stepper',
      description: 'Track candidate status from Applied to Selected',
      icon: FileText,
      action: () => navigate('/me/applications'),
      shortcut: 'G A',
    },
    {
      id: 'act_consent',
      category: 'Compliance & Legal',
      label: 'DPDP Act 2023 Consent Ledger',
      description: 'Manage verifiable candidate privacy consents',
      icon: ShieldCheck,
      action: () => navigate('/compliance/consent'),
      shortcut: 'G C',
    },
    {
      id: 'act_copilot',
      category: 'Campus AI',
      label: 'Launch Campus AI Copilot Console',
      description: 'Policy RAG, autonomous agents & tamper-evident traces',
      icon: Bot,
      action: () => onOpenCopilot(),
      shortcut: 'Ctrl + /',
    },
  ];

  // Dynamic Entity Search Results
  const dynamicCommands: CommandItem[] = [
    ...students.map((s) => ({
      id: `stu_${s.student_id}`,
      category: 'Verified Candidates',
      label: `${s.name} (${s.student_id})`,
      description: `${s.department} Engineering • CGPA ${s.cgpa?.toFixed(2)} • ${s.placement_status}`,
      icon: User,
      action: () => navigate(`/students/${s.student_id}`),
    })),
    ...jobs.map((j) => ({
      id: `job_${j.job_id}`,
      category: 'Placement Drives',
      label: `${j.title} • ${j.company_id}`,
      description: `₹${j.package_lpa} LPA • ${j.tier} • ${j.status} Drive`,
      icon: Briefcase,
      action: () => navigate(`/placement/drives/${j.job_id}`),
    })),
    ...companies.map((c) => ({
      id: `cmp_${c.company_id}`,
      category: 'Corporate Partners',
      label: c.name,
      description: `${c.industry} • ${c.location} • ID: ${c.company_id}`,
      icon: Building2,
      action: () => navigate(`/placement/companies/${c.company_id}`),
    })),
  ];

  const allCommands = [...baseCommands, ...dynamicCommands];

  const filteredCommands = allCommands.filter((c) =>
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
        onClose();
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
    <div className="fixed inset-0 z-50 overflow-y-auto pt-[12vh] px-4 font-sans select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative mx-auto max-w-xl bg-surface rounded-xl shadow-2xl border border-line overflow-hidden transform transition-all">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-line bg-canvas/50">
          <Search size={18} className="text-ink-muted mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, company, drive, or command... (Esc to exit)"
            className="w-full py-3.5 bg-transparent text-sm text-ink placeholder-ink-muted focus:outline-hidden font-sans"
          />
          <kbd className="text-[10px] font-mono text-ink-muted bg-surface border border-line px-1.5 py-0.5 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Command & Entity Results List */}
        <div className="max-h-84 overflow-y-auto p-2 divide-y divide-line/40">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-muted">
              No matching commands, candidates, or drives found for "{searchTerm}".
            </div>
          ) : (
            filteredCommands.slice(0, 40).map((cmd, idx) => {
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
                    isSelected ? 'bg-brand text-white' : 'hover:bg-canvas text-ink'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-canvas text-ink-muted border-line'
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                        <span>{cmd.label}</span>
                        <span
                          className={`text-[9px] font-mono font-normal uppercase ${
                            isSelected ? 'text-white/70' : 'text-ink-muted'
                          }`}
                        >
                          &bull; {cmd.category}
                        </span>
                      </div>
                      {cmd.description && (
                        <div
                          className={`text-[11px] truncate ${
                            isSelected ? 'text-white/80' : 'text-ink-muted'
                          }`}
                        >
                          {cmd.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <kbd
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-canvas text-ink-muted border-line'
                        }`}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && <ArrowRight size={13} className="text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 border-t border-line bg-canvas/80 text-[10px] text-ink-muted flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <span>&uarr;&darr; navigate</span>
            <span>&bull;</span>
            <span>&crarr; select</span>
            <span>&bull;</span>
            <span>esc exit</span>
          </div>
          <span>Meridian Campus OS</span>
        </div>
      </div>
    </div>
  );
};
