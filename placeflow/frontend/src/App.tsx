import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Masthead } from './components/layout/Masthead';

// Import Page Modules
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
        // Default TPO Placement Overview
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

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-canvas text-ink antialiased">
      {/* 240px Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen min-w-0">
        <Masthead
          onSearchStudent={handleSearchStudent}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenInbox={() => setIsInboxOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />

        <main className="flex-1 px-8 py-8 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl">
            {renderActiveView()}
          </div>
        </main>
      </div>

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
