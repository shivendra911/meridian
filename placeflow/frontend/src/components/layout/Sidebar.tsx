import React from 'react';
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
  Calculator,
  ShieldCheck,
  History,
  Database,
  BarChart3,
  Network,
  Landmark,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePersona } from '../../context/PersonaContext';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { activeTenant, activeInstitution } = useTenant();
  const { activePersona, personaConfig } = usePersona();

  // Dynamically resolve navigation sections based on the active operating persona
  const getSectionsForPersona = () => {
    if (activePersona === 'STUDENT') {
      return [
        {
          title: 'Student Academic Portal',
          items: [
            { id: 'overview', label: 'My Workbench & Actions', icon: LayoutDashboard },
            { id: 'academic', label: 'Course Registration & Curricula', icon: GraduationCap },
            { id: 'whatif', label: 'Degree Progression Simulator', icon: Calculator },
          ],
        },
        {
          title: 'Career & Placements',
          items: [
            { id: 'jobs', label: 'Active Placement Drives (JNFs)', icon: Briefcase },
            { id: 'applications', label: 'My Applications & Status', icon: FileText },
            { id: 'interviews', label: 'My Interview Schedule', icon: Calendar },
            { id: 'placements', label: 'Offers & Placement Register', icon: Award },
          ],
        },
        {
          title: 'Privacy & Profile',
          items: [
            { id: 'students', label: 'My Verified Dossier', icon: Users },
            { id: 'consent', label: 'DPDP Privacy Consents', icon: ShieldCheck },
          ],
        },
      ];
    }

    if (activePersona === 'FACULTY') {
      return [
        {
          title: 'Faculty Teaching Workbench',
          items: [
            { id: 'overview', label: 'Teaching Command Center', icon: LayoutDashboard },
            { id: 'academic', label: 'Curriculum & Prerequisite DAG', icon: GraduationCap },
            { id: 'students', label: 'Course Rosters & Advising', icon: Users },
            { id: 'reports', label: 'Gradebook & CIE Moderation', icon: BarChart3 },
          ],
        },
        {
          title: 'Recruitment & Student Mentoring',
          items: [
            { id: 'companies', label: 'Corporate Partners', icon: Building2 },
            { id: 'jobs', label: 'Job Openings (JNFs)', icon: Briefcase },
            { id: 'renege', label: 'Student Retention Radar', icon: Radar },
          ],
        },
      ];
    }

    if (activePersona === 'HOD_DEAN') {
      return [
        {
          title: 'Departmental Leadership',
          items: [
            { id: 'overview', label: 'Department Command Hub', icon: LayoutDashboard },
            { id: 'architecture', label: 'Organizational Structure & Hierarchy', icon: Network },
            { id: 'academic', label: 'Curriculum Approval & Accreditation', icon: GraduationCap },
            { id: 'reports', label: 'Departmental Standings & Reports', icon: BarChart3 },
          ],
        },
        {
          title: 'Departmental Governance',
          items: [
            { id: 'iam', label: 'Faculty Roles & Delegations', icon: ShieldCheck },
            { id: 'nirf', label: 'NIRF Departmental Metrics', icon: Calculator },
            { id: 'fairness', label: 'Demographic Fairness Audit', icon: Database },
          ],
        },
      ];
    }

    if (activePersona === 'MANAGEMENT') {
      return [
        {
          title: 'Executive Institutional Oversight',
          items: [
            { id: 'overview', label: 'Institutional Command Hub', icon: LayoutDashboard },
            { id: 'architecture', label: 'Multi-Campus Hierarchy Graph', icon: Network },
            { id: 'nirf', label: 'NIRF Graduation Outcomes', icon: Calculator },
            { id: 'reports', label: 'Statutory Audits & Pipeline Reports', icon: BarChart3 },
          ],
        },
        {
          title: 'Risk & Compliance',
          items: [
            { id: 'iam', label: 'Identity & Access Governance', icon: ShieldCheck },
            { id: 'consent', label: 'DPDP Consent Ledger', icon: ShieldCheck },
            { id: 'agent-runs', label: 'Campus AI Trace Ledger', icon: History },
          ],
        },
      ];
    }

    // Default: TPO_PLACEMENT (Full Operations Directorate)
    return [
      {
        title: 'Campus Operating System (CAMP-01/02)',
        items: [
          { id: 'overview', label: 'Institutional Command Hub', icon: LayoutDashboard },
          { id: 'architecture', label: 'Topology & Hierarchy Graph', icon: Network },
          { id: 'iam', label: 'Identity & Access Governance', icon: ShieldCheck },
          { id: 'academic', label: 'Academic Lifecycle & Curricula', icon: GraduationCap },
          { id: 'reports', label: 'Institutional Audits & Reports', icon: BarChart3 },
        ],
      },
      {
        title: 'Career & Placement Directorate',
        items: [
          { id: 'students', label: 'Candidate Registry (VTI)', icon: Users },
          { id: 'companies', label: 'Corporate Partners', icon: Building2 },
          { id: 'jobs', label: 'Job Openings (JNFs)', icon: Briefcase },
          { id: 'applications', label: 'Application Ledger', icon: FileText },
          { id: 'interviews', label: 'Interview Schedule', icon: Calendar },
          { id: 'superday', label: 'Superday Clash Solver', icon: Zap },
          { id: 'placements', label: 'Placement Register', icon: Award },
        ],
      },
      {
        title: 'Governance & Accreditation',
        items: [
          { id: 'renege', label: 'Retention & Renege Radar', icon: Radar },
          { id: 'nirf', label: 'NIRF GO Accreditation', icon: Calculator },
          { id: 'consent', label: 'DPDP Consent Ledger', icon: ShieldCheck },
        ],
      },
      {
        title: 'Autonomous Multi-Agent AI',
        items: [
          { id: 'copilot', label: 'Autonomous Copilot Hub', icon: Bot },
          { id: 'agent-runs', label: 'Agent Trace Ledger', icon: History },
          { id: 'fairness', label: 'Demographic Fairness', icon: Database },
        ],
      },
    ];
  };

  const navSections = getSectionsForPersona();

  return (
    <aside className="w-72 bg-[#090D16] text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 select-none z-20 font-sans">
      {/* Brand Directorate Crest */}
      <div className="p-4 border-b border-slate-800 bg-[#060A12]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#8C1515] text-white flex items-center justify-center font-serif font-bold text-lg shadow-md border border-red-700 shrink-0">
            P
          </div>
          <div className="min-w-0">
            <div className="font-serif font-bold text-base text-white tracking-wide truncate">
              PlaceFlow OS
            </div>
            <div className="text-[10px] text-amber-400 font-medium uppercase tracking-wider truncate">
              India Multi-Tenant Platform
            </div>
          </div>
        </div>

        {/* Current Active Persona Chip */}
        <div className="mt-3 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="text-white font-medium text-[11px] truncate">
              {personaConfig.title}
            </span>
          </div>
          <span className="text-[9px] bg-red-950 text-red-300 font-mono px-1 rounded uppercase">
            {personaConfig.badgeLabel}
          </span>
        </div>
      </div>

      {/* Navigation Scrollable Body */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="px-2 mb-1.5 text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
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
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors text-left cursor-pointer border-0 ${
                      isActive
                        ? 'bg-[#8C1515] text-white shadow-xs font-semibold'
                        : 'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon
                      size={15}
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

      {/* Footer System Architecture Info */}
      <div className="p-3 border-t border-slate-800 bg-[#060A12] text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>Engine:</span>
          <span className="text-emerald-400 font-mono font-medium">Django + MongoDB 7</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Campus AI:</span>
          <span className="text-amber-400 font-mono">Gateway Live</span>
        </div>
      </div>
    </aside>
  );
};
