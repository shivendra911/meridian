/**
 * Meridian navigation map: ONE source of truth for sidebar, routes, breadcrumbs and permissions.
 * Put at: placeflow/frontend/src/app/navigation.ts
 *
 * status:
 *   'live'    -> page is backed by a real API endpoint
 *   'preview' -> UI exists but runs on hardcoded data (show a "Preview" chip)
 *   'planned' -> not built yet (hide in production, show in dev)
 */
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  FileText,
  CalendarClock,
  Award,
  BarChart3,
  ShieldCheck,
  GraduationCap,
  Network,
  Radar,
  Scale,
  History,
  Landmark,
  ClipboardCheck,
  BookOpen,
  UserCheck,
  KeyRound,
  Settings,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react';

export type Persona = 'STUDENT' | 'FACULTY' | 'HOD' | 'TPO' | 'MANAGEMENT' | 'ADMIN';
export type Status = 'live' | 'preview' | 'planned';

export interface NavItem {
  label: string;
  path: string; // route (react-router)
  icon: LucideIcon;
  status: Status;
  /** IAM permission that must pass /v4/iam/authorize/ (until then, persona gating only) */
  permission?: string;
  /** child tabs rendered INSIDE the page, never in the sidebar */
  tabs?: string[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV: Record<Persona, NavSection[]> = {
  /* ---------- Placement officer: the flagship, fully API-backed ---------- */
  TPO: [
    { items: [{ label: 'Home', path: '/home', icon: LayoutDashboard, status: 'live' }] },
    {
      title: 'Placement',
      items: [
        {
          label: 'Drives',
          path: '/placement/drives',
          icon: Briefcase,
          status: 'live',
          tabs: ['Overview', 'Eligibility', 'Applicants', 'Interviews', 'Offers'],
        },
        {
          label: 'Companies',
          path: '/placement/companies',
          icon: Building2,
          status: 'live',
          tabs: ['Overview', 'Drives', 'Contacts', 'History'],
        },
        { label: 'Applications', path: '/placement/applications', icon: FileText, status: 'live' },
        {
          label: 'Interviews',
          path: '/placement/interviews',
          icon: CalendarClock,
          status: 'live',
          tabs: ['Schedule', 'Resolve clashes'], // Superday solver lives here
        },
        {
          label: 'Offers',
          path: '/placement/offers',
          icon: Award,
          status: 'live',
          tabs: ['Register', 'At-risk offers'], // Renege radar surfaces here
        },
      ],
    },
    {
      title: 'People',
      items: [
        {
          label: 'Students',
          path: '/students',
          icon: Users,
          status: 'live',
          tabs: ['Profile', 'Applications', 'Eligibility', 'Simulate', 'Consent'], // What-if + consent live here
        },
      ],
    },
    {
      title: 'Insights',
      items: [
        { label: 'Analytics', path: '/insights/analytics', icon: BarChart3, status: 'live' },
        { label: 'Retention risk', path: '/insights/retention', icon: Radar, status: 'live' },
        { label: 'Fairness audit', path: '/insights/fairness', icon: Scale, status: 'live' },
        { label: 'Reports', path: '/insights/reports', icon: FileText, status: 'live' },
      ],
    },
  ],

  /* ---------- Student: every page is "mine", never a ledger of everyone ---------- */
  STUDENT: [
    { items: [{ label: 'Home', path: '/home', icon: LayoutDashboard, status: 'live' }] },
    {
      title: 'Career',
      items: [
        {
          label: 'Opportunities',
          path: '/opportunities',
          icon: Target,
          status: 'live',
          tabs: ['Eligible', 'Not eligible (why)'],
        },
        {
          label: 'My applications',
          path: '/me/applications',
          icon: FileText,
          status: 'live',
          tabs: ['Applications', 'Interviews', 'Offers'],
        },
      ],
    },
    {
      title: 'Academics',
      items: [
        {
          label: 'Courses & registration',
          path: '/me/academics',
          icon: BookOpen,
          status: 'preview',
          tabs: ['Registration', 'Results & credits', 'Degree progress'],
        },
      ],
    },
    {
      title: 'Me',
      items: [
        {
          label: 'Profile & documents',
          path: '/me/profile',
          icon: UserCheck,
          status: 'live',
          tabs: ['Details', 'Resume & skills', 'Documents', 'Privacy & consent'],
        },
      ],
    },
  ],

  /* ---------- Faculty ---------- */
  FACULTY: [
    { items: [{ label: 'Home', path: '/home', icon: LayoutDashboard, status: 'preview' }] },
    {
      title: 'Teaching',
      items: [
        {
          label: 'My courses',
          path: '/teaching/courses',
          icon: BookOpen,
          status: 'planned',
          tabs: ['Roster', 'Attendance', 'Gradebook (CIE)', 'Materials'],
        },
        {
          label: 'Advising',
          path: '/advising',
          icon: UserCheck,
          status: 'planned',
          tabs: ['Mentees', 'At-risk', 'Notes'],
        },
      ],
    },
    { title: 'Work', items: [{ label: 'Approvals', path: '/work', icon: ClipboardCheck, status: 'planned' }] },
  ],

  /* ---------- HOD / Dean ---------- */
  HOD: [
    { items: [{ label: 'Home', path: '/home', icon: LayoutDashboard, status: 'preview' }] },
    {
      title: 'Department',
      items: [
        { label: 'Students & progression', path: '/department/students', icon: Users, status: 'planned' },
        { label: 'Faculty & workload', path: '/department/faculty', icon: UserCheck, status: 'planned' },
        {
          label: 'Curriculum',
          path: '/department/curriculum',
          icon: GraduationCap,
          status: 'preview',
          tabs: ['Versions', 'Approval queue', 'Prerequisite graph'],
        },
        { label: 'Placement outcomes', path: '/department/placements', icon: Award, status: 'live' },
      ],
    },
    { title: 'Work', items: [{ label: 'Approvals', path: '/work', icon: ClipboardCheck, status: 'planned' }] },
  ],

  /* ---------- Management ---------- */
  MANAGEMENT: [
    { items: [{ label: 'Decision centre', path: '/home', icon: LayoutDashboard, status: 'preview' }] },
    {
      title: 'Outcomes',
      items: [
        { label: 'Placements', path: '/outcomes/placements', icon: Award, status: 'live' },
        { label: 'Accreditation (NIRF)', path: '/outcomes/accreditation', icon: Landmark, status: 'live' },
      ],
    },
    {
      title: 'Compliance',
      items: [
        { label: 'Consent ledger', path: '/compliance/consent', icon: ShieldCheck, status: 'live' },
        { label: 'Fairness audit', path: '/compliance/fairness', icon: Scale, status: 'live' },
        { label: 'AI audit trail', path: '/compliance/ai', icon: History, status: 'live' },
      ],
    },
  ],

  /* ---------- Institution admin: NEW persona. All CAMP-01/02/03 setup lives here ---------- */
  ADMIN: [
    { items: [{ label: 'Home', path: '/home', icon: LayoutDashboard, status: 'preview' }] },
    {
      title: 'Organisation',
      items: [
        { label: 'Institutions & campuses', path: '/admin/organisation', icon: Building2, status: 'live' },
        { label: 'Hierarchy', path: '/admin/hierarchy', icon: Network, status: 'live' },
        { label: 'Onboarding', path: '/admin/onboarding', icon: Sparkles, status: 'live' },
      ],
    },
    {
      title: 'People & access',
      items: [
        { label: 'Identities', path: '/admin/people', icon: Users, status: 'live' },
        { label: 'Roles & assignments', path: '/admin/roles', icon: KeyRound, status: 'live' },
        { label: 'Sessions & delegation', path: '/admin/sessions', icon: ShieldCheck, status: 'live' },
      ],
    },
    {
      title: 'Academic setup',
      items: [
        { label: 'Programs & courses', path: '/admin/academics', icon: GraduationCap, status: 'planned' },
        { label: 'Calendars', path: '/admin/calendars', icon: CalendarClock, status: 'planned' },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Policies & config', path: '/admin/config', icon: Settings, status: 'planned' },
        { label: 'AI governance', path: '/admin/ai', icon: History, status: 'live' },
      ],
    },
  ],
};

/** Breadcrumbs come from this, never from a hand-written switch. */
export function findNavItem(persona: Persona, pathname: string) {
  const sections = NAV[persona] || NAV.TPO;
  for (const s of sections) {
    for (const i of s.items) {
      if (pathname === i.path || pathname.startsWith(i.path + '/')) {
        return { section: s.title, item: i };
      }
    }
  }
  return null;
}

