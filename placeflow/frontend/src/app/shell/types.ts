import { LucideIcon } from 'lucide-react';
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  Users,
  BarChart3,
  Shield,
} from 'lucide-react';

export interface PortalNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
}

export interface PortalMeta {
  code: string;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  homePath: string;
}

export const PORTAL_METAS: Record<string, PortalMeta> = {
  student: {
    code: 'student',
    name: 'Student Career Workspace',
    shortName: 'Student',
    description: 'Career opportunities, applications, and profile',
    icon: GraduationCap,
    homePath: '/student/home',
  },
  tpo: {
    code: 'tpo',
    name: 'Training & Placement Office',
    shortName: 'TPO Operations',
    description: 'Drive management, applicant screening, and NIRF tracking',
    icon: Briefcase,
    homePath: '/tpo/home',
  },
  faculty: {
    code: 'faculty',
    name: 'Faculty Mentorship',
    shortName: 'Faculty',
    description: 'Student academic mentoring, verification, and course tracking',
    icon: BookOpen,
    homePath: '/faculty/home',
  },
  hod: {
    code: 'hod',
    name: 'Department Head (HOD)',
    shortName: 'HOD Executive',
    description: 'Departmental placement analytics, curriculum, and faculty allocations',
    icon: Users,
    homePath: '/hod/home',
  },
  management: {
    code: 'management',
    name: 'Executive Leadership & NIRF',
    shortName: 'Management',
    description: 'Institutional metrics, statutory compliance, and outcome audits',
    icon: BarChart3,
    homePath: '/management/home',
  },
  admin: {
    code: 'admin',
    name: 'Institutional Administration',
    shortName: 'Admin',
    description: 'Identity lifecycle, roles, memberships, and system configuration',
    icon: Shield,
    homePath: '/admin/home',
  },
};
