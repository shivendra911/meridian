/**
 * PlaceFlow / Meridian — Management Portal Navigation (Phase 4).
 */

import { LayoutDashboard, Award, ShieldAlert, BarChart2, LucideIcon } from 'lucide-react';

export interface ManagementNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
}

export const MANAGEMENT_NAV_ITEMS: ManagementNavItem[] = [
  { id: 'mgmt-home', label: 'Decision Centre', path: '/management/home', icon: LayoutDashboard },
  { id: 'mgmt-placements', label: 'Placements', path: '/management/placements', icon: Award },
  { id: 'mgmt-accreditation', label: 'NIRF & Accreditation', path: '/management/accreditation', icon: BarChart2, permission: 'nirf.report.view' },
  { id: 'mgmt-compliance', label: 'Compliance & AI Audit', path: '/management/compliance', icon: ShieldAlert, permission: 'agent.trace.view' },
];

