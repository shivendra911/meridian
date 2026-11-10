/**
 * PlaceFlow / Meridian — Faculty Portal Navigation (Phase 4).
 */

import { LayoutDashboard, BookOpen, Users, CheckSquare, LucideIcon } from 'lucide-react';

export interface FacultyNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
}

export const FACULTY_NAV_ITEMS: FacultyNavItem[] = [
  { id: 'faculty-home', label: 'Home', path: '/faculty/home', icon: LayoutDashboard },
  { id: 'faculty-courses', label: 'My Courses', path: '/faculty/courses', icon: BookOpen },
  { id: 'faculty-mentees', label: 'Mentees', path: '/faculty/mentees', icon: Users, permission: 'student.profile.read' },
  { id: 'faculty-approvals', label: 'Approvals', path: '/faculty/approvals', icon: CheckSquare },
];

