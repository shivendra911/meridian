import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  Calendar,
  Zap,
  Award,
  Radar,
  Bot,
  GraduationCap,
  ShieldCheck,
  ChevronDown,
  History,
  Calculator,
  Network,
  BarChart3,
} from 'lucide-react';
import { usePersona, UserPersona } from '../../context/PersonaContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { activePersona, switchPersona } = usePersona();
  const [showOtherRoles, setShowOtherRoles] = useState(false);

  // Sections tailored to the active role
  const getNavSections = () => {
    if (activePersona === 'STUDENT') {
      return [
        {
          title: 'Student Hub',
          items: [
            { id: 'overview', label: 'My Workbench', icon: LayoutDashboard },
            { id: 'academic', label: 'Course Basket', icon: GraduationCap },
            { id: 'whatif', label: 'Degree Progression', icon: Calculator },
          ],
        },
        {
          title: 'Career & Drives',
          items: [
            { id: 'jobs', label: 'Active Placement Drives', icon: Briefcase },
            { id: 'applications', label: 'My Applications', icon: FileText },
            { id: 'interviews', label: 'Interview Schedule', icon: Calendar },
            { id: 'placements', label: 'Offers & Registry', icon: Award },
          ],
        },
        {
          title: 'Profile & Privacy',
          items: [
            { id: 'students', label: 'Verified Dossier', icon: Users },
            { id: 'consent', label: 'DPDP Consents', icon: ShieldCheck },
          ],
        },
      ];
    }

    if (activePersona === 'FACULTY') {
      return [
        {
          title: 'Faculty Workbench',
          items: [
            { id: 'overview', label: 'Teaching Center', icon: LayoutDashboard },
            { id: 'academic', label: 'Curriculum DAG', icon: GraduationCap },
            { id: 'students', label: 'Course Rosters', icon: Users },
            { id: 'reports', label: 'Gradebook & CIE', icon: BarChart3 },
          ],
        },
        {
          title: 'Corporate & Mentoring',
          items: [
            { id: 'companies', label: 'Corporate Partners', icon: Building2 },
            { id: 'jobs', label: 'Placement Drives', icon: Briefcase },
            { id: 'renege', label: 'Retention Radar', icon: Radar },
          ],
        },
      ];
    }

    if (activePersona === 'HOD_DEAN') {
      return [
        {
          title: 'Department Leadership',
          items: [
            { id: 'overview', label: 'Department Hub', icon: LayoutDashboard },
            { id: 'architecture', label: 'Hierarchy Graph', icon: Network },
            { id: 'academic', label: 'Curriculum Approval', icon: GraduationCap },
            { id: 'reports', label: 'Department Reports', icon: BarChart3 },
          ],
        },
        {
          title: 'Governance',
          items: [
            { id: 'iam', label: 'Faculty Roles', icon: ShieldCheck },
            { id: 'nirf', label: 'NIRF Metrics', icon: Calculator },
          ],
        },
      ];
    }

    if (activePersona === 'MANAGEMENT') {
      return [
        {
          title: 'Executive Oversight',
          items: [
            { id: 'overview', label: 'Command Hub', icon: LayoutDashboard },
            { id: 'architecture', label: 'Multi-Campus Graph', icon: Network },
            { id: 'nirf', label: 'NIRF Outcomes', icon: Calculator },
            { id: 'reports', label: 'Statutory Audits', icon: BarChart3 },
          ],
        },
        {
          title: 'Risk & Audit',
          items: [
            { id: 'iam', label: 'Access Governance', icon: ShieldCheck },
            { id: 'consent', label: 'DPDP Consent Ledger', icon: ShieldCheck },
            { id: 'agent-runs', label: 'AI Trace Ledger', icon: History },
          ],
        },
      ];
    }

    // Default: TPO_PLACEMENT (Primary Flagship Flow)
    return [
      {
        title: 'Placement Directorate',
        items: [
          { id: 'overview', label: 'Command Overview', icon: LayoutDashboard },
          { id: 'jobs', label: 'Placement Drives (JNFs)', icon: Briefcase },
          { id: 'companies', label: 'Corporate Partners', icon: Building2 },
          { id: 'applications', label: 'Application Ledger', icon: FileText },
          { id: 'superday', label: 'Superday Clash Solver', icon: Zap },
          { id: 'placements', label: 'Placement Register', icon: Award },
          { id: 'students', label: 'Candidate Registry', icon: Users },
        ],
      },
      {
        title: 'Governance & Campus AI',
        items: [
          { id: 'renege', label: 'Retention & Renege Radar', icon: Radar },
          { id: 'nirf', label: 'NIRF Accreditation', icon: Calculator },
          { id: 'consent', label: 'DPDP Consent Ledger', icon: ShieldCheck },
          { id: 'agent-runs', label: 'Campus AI Trace', icon: History },
        ],
      },
      {
        title: 'Campus Architecture',
        items: [
          { id: 'academic', label: 'Curricula & Lifecycle', icon: GraduationCap },
          { id: 'architecture', label: 'Campus Hierarchy', icon: Network },
          { id: 'iam', label: 'Access Governance', icon: ShieldCheck },
        ],
      },
    ];
  };

  const navSections = getNavSections();

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
            onClick={() => {
              switchPersona('TPO_PLACEMENT');
              onSelectTab('overview');
            }}
            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150 text-center truncate ${
              activePersona === 'TPO_PLACEMENT'
                ? 'bg-surface text-ink font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            TPO Officer
          </button>
          <button
            onClick={() => {
              switchPersona('STUDENT');
              onSelectTab('overview');
            }}
            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150 text-center truncate ${
              activePersona === 'STUDENT'
                ? 'bg-surface text-ink font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Student
          </button>
        </div>

        {/* Flagged Collapsible for Secondary Roles */}
        <div className="mt-1.5">
          <button
            onClick={() => setShowOtherRoles(!showOtherRoles)}
            className="w-full flex items-center justify-between px-1.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>Additional Roles (Preview)</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-150 ${showOtherRoles ? 'rotate-180' : ''}`}
            />
          </button>
          {showOtherRoles && (
            <div className="mt-1 space-y-0.5 pl-1 pr-1 pb-1">
              {(['FACULTY', 'HOD_DEAN', 'MANAGEMENT'] as UserPersona[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    switchPersona(role);
                    onSelectTab('overview');
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors ${
                    activePersona === role
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {role === 'FACULTY' ? 'Faculty Portal' : role === 'HOD_DEAN' ? 'HOD / Dean' : 'Executive Management'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="px-2 mb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors duration-150 text-left ${
                      isActive
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={isActive ? 'text-white' : 'text-slate-400'}
                    />
                    <span className="truncate">{item.label}</span>
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
