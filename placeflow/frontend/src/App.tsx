import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Masthead } from './components/layout/Masthead';

// Import All Page Modules
import { OverviewPage } from './pages/OverviewPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentDossierPage } from './pages/StudentDossierPage';
import { WhatIfPage } from './pages/WhatIfPage';
import { RecruitmentPage } from './pages/RecruitmentPage';
import { SuperdayPage } from './pages/SuperdayPage';
import { RenegeRadarPage } from './pages/RenegeRadarPage';
import { NirfPage } from './pages/NirfPage';
import { ConsentPage } from './pages/ConsentPage';
import { CopilotPage } from './pages/CopilotPage';
import { AgentRunsPage } from './pages/AgentRunsPage';
import { FairnessPage } from './pages/FairnessPage';
import { ReportsPage } from './pages/ReportsPage';
import { InstitutionalArchitecturePage } from './pages/InstitutionalArchitecturePage';
import { IdentityAccessPage } from './pages/IdentityAccessPage';
import { AcademicLifecyclePage } from './pages/AcademicLifecyclePage';
import { TenantProvider } from './context/TenantContext';
import { PersonaProvider, usePersona } from './context/PersonaContext';
import { ChevronRight, Sparkles } from 'lucide-react';
import { CampusCopilotDrawer } from './components/ai/CampusCopilotDrawer';
import { CommandPalette } from './components/navigation/CommandPalette';
import { UnifiedTaskInbox } from './components/navigation/UnifiedTaskInbox';
import { StudentWorkspace } from './pages/workspaces/StudentWorkspace';
import { FacultyWorkspace } from './pages/workspaces/FacultyWorkspace';
import { HodWorkspace } from './pages/workspaces/HodWorkspace';
import { ManagementWorkspace } from './pages/workspaces/ManagementWorkspace';

export const AppContent: React.FC = () => {
  const { activePersona } = usePersona();
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('STU001');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Global Ctrl+K / Cmd+K key listener for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Breadcrumb resolver
  const getBreadcrumbs = () => {
    switch (currentTab) {
      case 'overview':
        return ['Campus OS', 'Institutional Command Hub'];
      case 'architecture':
        return ['Campus OS (CAMP-01)', 'Topology & Hierarchy Graph'];
      case 'iam':
        return ['Campus OS (CAMP-02)', 'Identity & Access Management'];
      case 'academic':
        return ['Campus OS (CAMP-03)', 'Academic Structure & Student Lifecycle'];
      case 'reports':
        return ['Campus OS (CAMP-01)', 'Institutional Audits & Reports'];
      case 'students':
        return ['Registries & Archives', 'Candidate Registry'];
      case 'dossier':
        return ['Registries & Archives', 'Candidate Registry', `${selectedStudentId} Dossier`];
      case 'whatif':
        return ['Registries & Archives', `${selectedStudentId} Dossier`, 'What-If Simulation'];
      case 'companies':
        return ['Registries & Archives', 'Corporate Partners'];
      case 'jobs':
        return ['Registries & Archives', 'Job Openings (JNFs)'];
      case 'applications':
        return ['Recruitment Operations', 'Application Ledger'];
      case 'interviews':
        return ['Recruitment Operations', 'Interview Schedule'];
      case 'superday':
        return ['Recruitment Operations', 'Superday Conflict Solver'];
      case 'placements':
        return ['Recruitment Operations', 'Placement Register'];
      case 'renege':
        return ['Governance & Telemetry', 'Retention & Renege Radar'];
      case 'nirf':
        return ['Governance & Telemetry', 'NIRF Graduation Outcome Accreditation'];
      case 'consent':
        return ['Governance & Telemetry', 'DPDP Act 2023 Consent Ledger'];
      case 'copilot':
        return ['Autonomous Multi-Agent AI', 'Autonomous Copilot Hub'];
      case 'agent-runs':
        return ['Autonomous Multi-Agent AI', 'Agent Execution Trace Ledger'];
      case 'fairness':
        return ['Autonomous Multi-Agent AI', 'Demographic Fairness & Bias Audit'];
      default:
        return ['Directorate', currentTab];
    }
  };

  const handleSearchStudent = (query: string) => {
    setSelectedStudentId(query);
    setCurrentTab('dossier');
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'overview': {
        if (activePersona === 'STUDENT') {
          return (
            <StudentWorkspace
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenCopilot={() => setIsCopilotOpen(true)}
            />
          );
        }
        if (activePersona === 'FACULTY') {
          return (
            <FacultyWorkspace
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenCopilot={() => setIsCopilotOpen(true)}
            />
          );
        }
        if (activePersona === 'HOD_DEAN') {
          return (
            <HodWorkspace
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenCopilot={() => setIsCopilotOpen(true)}
            />
          );
        }
        if (activePersona === 'MANAGEMENT') {
          return <ManagementWorkspace onNavigateTab={(tab) => setCurrentTab(tab)} />;
        }
        return <OverviewPage onNavigateTab={(tab) => setCurrentTab(tab)} />;
      }
      case 'architecture':
        return <InstitutionalArchitecturePage />;
      case 'iam':
        return <IdentityAccessPage />;
      case 'academic':
        return <AcademicLifecyclePage />;
      case 'reports':
        return <ReportsPage />;
      case 'students':
        return (
          <StudentsPage
            onSelectStudent={(id) => {
              setSelectedStudentId(id);
              setCurrentTab('dossier');
            }}
            onOpenWhatIf={(id) => {
              setSelectedStudentId(id);
              setCurrentTab('whatif');
            }}
            onOpenConsent={(id) => {
              setSelectedStudentId(id);
              setCurrentTab('consent');
            }}
          />
        );
      case 'dossier':
        return (
          <StudentDossierPage
            studentId={selectedStudentId}
            onBack={() => setCurrentTab('students')}
            onOpenWhatIf={(id) => {
              setSelectedStudentId(id);
              setCurrentTab('whatif');
            }}
            onOpenConsent={(id) => {
              setSelectedStudentId(id);
              setCurrentTab('consent');
            }}
          />
        );
      case 'whatif':
        return (
          <WhatIfPage
            studentId={selectedStudentId}
            onBack={() => setCurrentTab('dossier')}
          />
        );
      case 'companies':
        return <RecruitmentPage initialTab="companies" />;
      case 'jobs':
        return <RecruitmentPage initialTab="jobs" />;
      case 'applications':
      case 'interviews':
        return <RecruitmentPage initialTab="applications" />;
      case 'placements':
        return <RecruitmentPage initialTab="placements" />;
      case 'superday':
        return <SuperdayPage />;
      case 'renege':
        return <RenegeRadarPage />;
      case 'nirf':
        return <NirfPage />;
      case 'consent':
        return <ConsentPage initialStudentId={selectedStudentId} />;
      case 'copilot':
        return <CopilotPage />;
      case 'agent-runs':
        return <AgentRunsPage onOpenCopilot={() => setCurrentTab('copilot')} />;
      case 'fairness':
        return <FairnessPage />;
      default:
        return <OverviewPage />;
    }
  };

  const crumbs = getBreadcrumbs();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Institutional Left Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Institutional Masthead */}
        <Masthead
          onSearchStudent={handleSearchStudent}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenInbox={() => setIsInboxOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />

        {/* Institutional Breadcrumb Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center text-xs text-slate-500 font-sans">
          <span className="font-semibold text-slate-700">Office of Career Services</span>
          {crumbs.map((crumb, idx) => (
            <React.Fragment key={crumb}>
              <ChevronRight size={12} className="mx-1.5 text-slate-400" />
              <span
                className={`${
                  idx === crumbs.length - 1
                    ? 'font-medium text-[#8C1515]'
                    : 'hover:text-slate-700 cursor-pointer'
                }`}
                onClick={() => {
                  if (idx === 1 && currentTab === 'whatif') {
                    setCurrentTab('dossier');
                  } else if (idx === 1 && currentTab === 'dossier') {
                    setCurrentTab('students');
                  }
                }}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>

      {/* Floating Campus Copilot Trigger */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#8C1515] hover:bg-[#701010] text-white px-4 py-2.5 rounded-full shadow-lg border border-red-700 flex items-center gap-2 text-xs font-semibold tracking-wide transition-transform hover:scale-105 cursor-pointer font-sans"
      >
        <Sparkles size={16} className="text-amber-300" />
        <span>Campus AI Copilot</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
      </button>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onOpenCopilot={() => {
          setIsCommandPaletteOpen(false);
          setIsCopilotOpen(true);
        }}
      />

      {/* Unified Task Inbox ("My Work") */}
      <UnifiedTaskInbox
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Global Campus AI Copilot Drawer */}
      <CampusCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TenantProvider>
      <PersonaProvider>
        <AppContent />
      </PersonaProvider>
    </TenantProvider>
  );
};

export default App;
