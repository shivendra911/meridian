/**
 * PlaceFlow / Meridian — HOD Portal Navigation (Phase 4).
 */

import { LayoutDashboard, Users, UserCheck, BookOpen, Award, CheckSquare, LucideIcon } from 'lucide-react';

export interface HodNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
}

export const HOD_NAV_ITEMS: HodNavItem[] = [
  { id: 'hod-home', label: 'Home', path: '/hod/home', icon: LayoutDashboard },
  { id: 'hod-students', label: 'Department Students', path: '/hod/students', icon: Users, permission: 'student.profile.read' },
  { id: 'hod-faculty', label: 'Faculty Roster', path: '/hod/faculty', icon: UserCheck },
  { id: 'hod-curriculum', label: 'Curriculum', path: '/hod/curriculum', icon: BookOpen, permission: 'academic.curriculum.approve' },
  { id: 'hod-placements', label: 'Placement Outcomes', path: '/hod/placements', icon: Award },
  { id: 'hod-approvals', label: 'Approvals', path: '/hod/approvals', icon: CheckSquare },
];

