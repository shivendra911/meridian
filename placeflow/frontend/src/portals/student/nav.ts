/**
 * PlaceFlow / Meridian — Student Portal Navigation (Phase 4).
 *
 * Scoped strictly to student self-service capabilities.
 */

import {
  LayoutDashboard,
  Compass,
  FileText,
  GraduationCap,
  UserCircle,
  LucideIcon,
} from 'lucide-react';

export interface StudentNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
}

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  {
    id: 'student-home',
    label: 'Home',
    path: '/student/home',
    icon: LayoutDashboard,
  },
  {
    id: 'student-opportunities',
    label: 'Opportunities',
    path: '/student/opportunities',
    icon: Compass,
    permission: 'placement.application.create',
  },
  {
    id: 'student-applications',
    label: 'My Applications',
    path: '/student/applications',
    icon: FileText,
    permission: 'placement.application.create',
  },
  {
    id: 'student-academics',
    label: 'Academics',
    path: '/student/academics',
    icon: GraduationCap,
  },
  {
    id: 'student-profile',
    label: 'Profile & Privacy',
    path: '/student/profile',
    icon: UserCircle,
    permission: 'student.profile.update_self',
  },
];

