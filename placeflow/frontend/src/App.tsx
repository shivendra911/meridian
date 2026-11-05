import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Sidebar } from './components/layout/Sidebar';
import { Masthead } from './components/layout/Masthead';

// Context Providers
import { TenantProvider } from './context/TenantContext';
import { PersonaProvider, usePersona } from './context/PersonaContext';

// Navigation Overlays
import { CampusCopilotDrawer } from './components/ai/CampusCopilotDrawer';
import { CommandPalette } from './components/navigation/CommandPalette';
import { UnifiedTaskInbox } from './components/navigation/UnifiedTaskInbox';

// Core Role Workspaces
import { OverviewPage } from './pages/OverviewPage';
import { StudentWorkspace } from './pages/workspaces/StudentWorkspace';
import { FacultyWorkspace } from './pages/workspaces/FacultyWorkspace';
import { HodWorkspace } from './pages/workspaces/HodWorkspace';
import { ManagementWorkspace } from './pages/workspaces/ManagementWorkspace';

// Split Placement Pages (TPO Flow)
import { DrivesPage } from './pages/placement/DrivesPage';
import { DriveDetailPage } from './pages/placement/DriveDetailPage';
import { CompaniesPage } from './pages/placement/CompaniesPage';
import { CompanyDetailPage } from './pages/placement/CompanyDetailPage';
import { ApplicationsPage } from './pages/placement/ApplicationsPage';
import { InterviewsPage } from './pages/placement/InterviewsPage';
import { OffersPage } from './pages/placement/OffersPage';

// Dedicated Student Pages (Student Flow)
import { StudentOpportunitiesPage } from './pages/student/StudentOpportunitiesPage';
import { StudentApplicationsPage } from './pages/student/StudentApplicationsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// People & Student Directory (TPO / Admin)
import { StudentsPage } from './pages/StudentsPage';
import { StudentDetailPage } from './pages/students/StudentDetailPage';

// Insights & Governance Pages
import { RenegeRadarPage } from './pages/RenegeRadarPage';
import { FairnessPage } from './pages/FairnessPage';
import { ReportsPage } from './pages/ReportsPage';
import { NirfPage } from './pages/NirfPage';
import { ConsentPage } from './pages/ConsentPage';
import { AgentRunsPage } from './pages/AgentRunsPage';

// Institutional Architecture & Academic Setup (CAMP-01/02/03)
import { InstitutionalArchitecturePage } from './pages/InstitutionalArchitecturePage';
import { IdentityAccessPage } from './pages/IdentityAccessPage';
import { AcademicLifecyclePage } from './pages/AcademicLifecyclePage';

const RoleHome: React.FC<{
  onNavigate: (path: string) => void;
  onOpenCopilot: () => void;
}> = ({ onNavigate, onOpenCopilot }) => {
  const { activePersona } = usePersona();

  switch (activePersona) {
    case 'STUDENT':
      return <StudentWorkspace onNavigateTab={onNavigate} onOpenCopilot={onOpenCopilot} />;
    case 'FACULTY':
      return <FacultyWorkspace onNavigateTab={onNavigate} onOpenCopilot={onOpenCopilot} />;
    case 'HOD':
      return <HodWorkspace onNavigateTab={onNavigate} onOpenCopilot={onOpenCopilot} />;
    case 'MANAGEMENT':
      return <ManagementWorkspace onNavigateTab={onNavigate} />;
    case 'ADMIN':
      return <InstitutionalArchitecturePage />;
    case 'TPO':
    default:
      return <OverviewPage onNavigateTab={onNavigate} />;
  }
};

export const AppContent: React.FC = () => {
  const navigate = useNavigate();
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

  const handleNavigate = (pathOrTab: string) => {
    const tabMap: Record<string, string> = {
      overview: '/home',
      jobs: '/placement/drives',
      companies: '/placement/companies',
      applications: '/placement/applications',
      interviews: '/placement/interviews',
      superday: '/placement/interviews',
      placements: '/placement/offers',
      renege: '/insights/retention',
      students: '/students',
      academic: '/me/academics',
      architecture: '/admin/organisation',
      iam: '/admin/roles',
      nirf: '/outcomes/accreditation',
      reports: '/insights/reports',
      consent: '/compliance/consent',
      'agent-runs': '/compliance/ai',
      fairness: '/compliance/fairness',
    };
    const target = tabMap[pathOrTab] || pathOrTab;
    navigate(target);
  };

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-canvas text-ink antialiased font-sans">
      {/* 240px App Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen min-w-0">
        <Masthead
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenInbox={() => setIsInboxOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />

        <main className="flex-1 px-8 py-8 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl">
            <Routes>
              {/* Home / Role-Scoped Dashboard */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route
                path="/home"
                element={
                  <RoleHome
                    onNavigate={handleNavigate}
                    onOpenCopilot={() => setIsCopilotOpen(true)}
                  />
                }
              />

              {/* Placement Directorate (TPO Flagship Flow) */}
              <Route path="/placement/drives" element={<DrivesPage />} />
              <Route path="/placement/drives/:id" element={<DriveDetailPage />} />
              <Route path="/placement/companies" element={<CompaniesPage />} />
              <Route path="/placement/companies/:id" element={<CompanyDetailPage />} />
              <Route path="/placement/applications" element={<ApplicationsPage />} />
              <Route path="/placement/interviews" element={<InterviewsPage />} />
              <Route path="/placement/offers" element={<OffersPage />} />

              {/* People & Student Directory (TPO Perspective) */}
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />

              {/* Insights & Governance Pages */}
              <Route path="/insights/analytics" element={<OverviewPage onNavigateTab={handleNavigate} />} />
              <Route path="/insights/retention" element={<RenegeRadarPage />} />
              <Route path="/insights/fairness" element={<FairnessPage />} />
              <Route path="/insights/reports" element={<ReportsPage />} />

              {/* Dedicated Student Persona Scoped Routes */}
              <Route path="/opportunities" element={<StudentOpportunitiesPage />} />
              <Route path="/me/applications" element={<StudentApplicationsPage />} />
              <Route path="/me/academics" element={<AcademicLifecyclePage />} />
              <Route path="/me/profile" element={<StudentProfilePage />} />

              {/* Faculty Persona Routes */}
              <Route path="/teaching/courses" element={<AcademicLifecyclePage />} />
              <Route path="/advising" element={<StudentsPage />} />

              {/* Department Persona Routes */}
              <Route path="/department/students" element={<StudentsPage />} />
              <Route path="/department/faculty" element={<IdentityAccessPage />} />
              <Route path="/department/curriculum" element={<AcademicLifecyclePage />} />
              <Route path="/department/placements" element={<OffersPage />} />

              {/* Management Persona Routes */}
              <Route path="/outcomes/placements" element={<OffersPage />} />
              <Route path="/outcomes/accreditation" element={<NirfPage />} />
              <Route path="/compliance/consent" element={<ConsentPage />} />
              <Route path="/compliance/fairness" element={<FairnessPage />} />
              <Route path="/compliance/ai" element={<AgentRunsPage onOpenCopilot={() => setIsCopilotOpen(true)} />} />

              {/* Admin Persona Routes (CAMP-01, 02, 03) */}
              <Route path="/admin/organisation" element={<InstitutionalArchitecturePage />} />
              <Route path="/admin/hierarchy" element={<InstitutionalArchitecturePage />} />
              <Route path="/admin/onboarding" element={<InstitutionalArchitecturePage />} />
              <Route path="/admin/people" element={<IdentityAccessPage />} />
              <Route path="/admin/roles" element={<IdentityAccessPage />} />
              <Route path="/admin/sessions" element={<IdentityAccessPage />} />
              <Route path="/admin/academics" element={<AcademicLifecyclePage />} />
              <Route path="/admin/calendars" element={<AcademicLifecyclePage />} />
              <Route path="/admin/config" element={<InstitutionalArchitecturePage />} />
              <Route path="/admin/ai" element={<AgentRunsPage onOpenCopilot={() => setIsCopilotOpen(true)} />} />

              {/* Backward Compatibility Redirects */}
              <Route path="/jobs" element={<Navigate to="/placement/drives" replace />} />
              <Route path="/companies" element={<Navigate to="/placement/companies" replace />} />
              <Route path="/applications" element={<Navigate to="/placement/applications" replace />} />
              <Route path="/interviews" element={<Navigate to="/placement/interviews" replace />} />
              <Route path="/placements" element={<Navigate to="/placement/offers" replace />} />

              {/* Catch-All */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={handleNavigate}
        onOpenCopilot={() => {
          setIsCommandPaletteOpen(false);
          setIsCopilotOpen(true);
        }}
      />

      {/* Unified Task Inbox ("My Work") */}
      <UnifiedTaskInbox
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onNavigateTab={handleNavigate}
      />

      {/* Global Campus AI Copilot Drawer */}
      <CampusCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* Crisp Toast Notification Container */}
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <TenantProvider>
        <PersonaProvider>
          <AppContent />
        </PersonaProvider>
      </TenantProvider>
    </BrowserRouter>
  );
};

export default App;
