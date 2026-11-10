/**
 * PlaceFlow / Meridian — Admin Portal Navigation (Phase 4).
 */

import { LayoutDashboard, Building2, Network, Key, Layers, Shield, Cpu, LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: 'admin-home', label: 'Home', path: '/admin/home', icon: LayoutDashboard },
  { id: 'admin-org', label: 'Organisation', path: '/admin/architecture', icon: Building2, permission: 'organization.unit.create' },
  { id: 'admin-hierarchy', label: 'Hierarchy', path: '/admin/hierarchy', icon: Network },
  { id: 'admin-iam', label: 'People & Access', path: '/admin/iam', icon: Key, permission: 'iam.role.assign' },
  { id: 'admin-academic', label: 'Academic Setup', path: '/admin/academic', icon: Layers, permission: 'configuration.version.create' },
  { id: 'admin-ai', label: 'AI Governance', path: '/admin/ai-governance', icon: Cpu, permission: 'agent.trace.view' },
];

