/**
 * PlaceFlow / Meridian — TPO Portal Navigation Schema (Phase 4).
 *
 * At most 7-8 top-level items with coarse permission gating.
 */

import {
  LayoutDashboard,
  Briefcase,
  Building2,
  FileText,
  Calendar,
  Award,
  Users,
  BarChart3,
  LucideIcon,
} from 'lucide-react';

export interface TpoNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
}

export const TPO_NAV_ITEMS: TpoNavItem[] = [
  {
    id: 'tpo-home',
    label: 'Home',
    path: '/tpo/home',
    icon: LayoutDashboard,
  },
  {
    id: 'tpo-drives',
    label: 'Drives',
    path: '/tpo/drives',
    icon: Briefcase,
    permission: 'placement.drive.manage',
  },
  {
    id: 'tpo-companies',
    label: 'Companies',
    path: '/tpo/companies',
    icon: Building2,
    permission: 'placement.drive.manage',
  },
  {
    id: 'tpo-applications',
    label: 'Applications',
    path: '/tpo/applications',
    icon: FileText,
    permission: 'placement.application.view',
  },
  {
    id: 'tpo-interviews',
    label: 'Interviews',
    path: '/tpo/interviews',
    icon: Calendar,
    permission: 'placement.interview.schedule',
  },
  {
    id: 'tpo-offers',
    label: 'Offers',
    path: '/tpo/offers',
    icon: Award,
    permission: 'placement.offer.manage',
  },
  {
    id: 'tpo-students',
    label: 'Students',
    path: '/tpo/students',
    icon: Users,
    permission: 'student.profile.read',
  },
  {
    id: 'tpo-insights',
    label: 'Insights',
    path: '/tpo/insights/renege',
    icon: BarChart3,
    permission: 'placement.policy.view',
  },
];

