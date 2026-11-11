/**
 * PlaceFlow / Meridian — System Administration Home (Phase 6).
 *
 * Core administration: onboarding checklist, pending access requests, role changes, system health.
 * Features "What needs me now" admin operational tasks.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Key,
  Layers,
  Network,
  Cpu,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Activity,
  Server,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { PageHeader, StatCard, Card, Badge, Button, TaskCard, useDocumentTitle } from '../../../ui';

export const AdminHomePage: React.FC = () => {
  useDocumentTitle('System Administration');
  const { me } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        title={`System Administration — ${me?.display_name || 'Administrator'}`}
        description="Platform tenancy setup, multi-campus hierarchy, IAM access governance, and SIS configuration."
        badge={<Badge variant="institutional" size="xs">Platform Superuser</Badge>}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/iam')}
            leftIcon={<Key size={14} />}
          >
            Manage IAM Roles
          </Button>
        }
      />

      {/* 1. What Needs Me Now — Actionable TaskCards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          What Needs Me Now
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TaskCard
            data={{
              task_id: 'task_admin_claims',
              title: 'Review ambiguous student account self-service claims',
              due: new Date(Date.now() + 24 * 3600 * 1000),
              priority: 'HIGH',
              icon: UserCheck,
              action_label: 'Resolve Claims',
            }}
            onAction={() => navigate('/admin/iam')}
          />
          <TaskCard
            data={{
              task_id: 'task_admin_iam',
              title: 'Audit active break-glass delegations and IAM scopes',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 2),
              priority: 'HIGH',
              icon: Key,
              action_label: 'Audit IAM',
            }}
            onAction={() => navigate('/admin/iam')}
          />
          <TaskCard
            data={{
              task_id: 'task_admin_hierarchy',
              title: 'CAMP-01 Multi-campus organizational hierarchy sync',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 4),
              priority: 'MEDIUM',
              icon: Network,
              action_label: 'View Hierarchy',
            }}
            onAction={() => navigate('/admin/hierarchy')}
          />
        </div>
      </div>

      {/* 2. KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="System Health"
          value="Healthy"
          hint="All database replicas active"
          icon={Server}
        />
        <StatCard
          label="Active Users"
          value={12}
          hint="Role-assigned accounts"
          icon={Key}
        />
        <StatCard
          label="Campuses"
          value={3}
          hint="CAMP-01 Multi-tenancy enabled"
          icon={Network}
        />
        <StatCard
          label="IAM Roles Defined"
          value={8}
          hint="CAMP-02 RBAC model"
          icon={Shield}
        />
      </div>

      {/* 3. Core Administrative Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/admin/hierarchy')}
          className="p-5 rounded-xl border border-line bg-surface hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Network size={20} />
            </div>
            <h3 className="text-sm font-bold text-ink">Campus Hierarchy (CAMP-01)</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Configure multi-campus structures, schools, academic departments, and organizational units.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-brand font-medium">
            <span>Manage Structure</span>
            <ArrowRight size={13} />
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/iam')}
          className="p-5 rounded-xl border border-line bg-surface hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Key size={20} />
            </div>
            <h3 className="text-sm font-bold text-ink">IAM Access &amp; Roles (CAMP-02)</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Grant scoped portal roles, review audit logs, and manage delegations and break-glass emergencies.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-brand font-medium">
            <span>Manage IAM</span>
            <ArrowRight size={13} />
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/academic')}
          className="p-5 rounded-xl border border-line bg-surface hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers size={20} />
            </div>
            <h3 className="text-sm font-bold text-ink">Academic Structure (CAMP-03)</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Maintain academic calendars, degree qualifications, NEP programs, and course catalogs.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-brand font-medium">
            <span>Configure SIS</span>
            <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </div>
  );
};
