/**
 * PlaceFlow / Meridian — Student Portal Navigation (Phase 4).
 *
 * Scoped strictly to student self-service capabilities.
 */

import {
  Compass,
  Briefcase,
  Bell,
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
    id: 'student-journey',
    label: 'Journey',
    path: '/student/home',
    icon: Compass,
  },
  {
    id: 'student-drives',
    label: 'Drives',
    path: '/student/opportunities',
    icon: Briefcase,
    permission: 'placement.application.create',
  },
  {
    id: 'student-inbox',
    label: 'Inbox',
    path: '/student/inbox',
    icon: Bell,
  },
  {
    id: 'student-me',
    label: 'Me',
    path: '/student/profile',
    icon: UserCircle,
    permission: 'student.profile.update_self',
  },
];

