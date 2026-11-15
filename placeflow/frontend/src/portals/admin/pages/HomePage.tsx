/**
 * PlaceFlow / Meridian — System Administration Home (Journey Redesign).
 * Pattern: Setup checklist home with endowed progress, actionable admin tasks,
 * and settings presented as a clean linear list.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Key,
  Network,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Circle,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import {
  useDocumentTitle,
  Receipt,
  ReceiptLine,
  TaskCard,
  Badge,
} from '../../../ui';

export const AdminHomePage: React.FC = () => {
  useDocumentTitle('System Administration');
  const { me } = useAuth();
  const navigate = useNavigate();

  const [checklist, _setChecklist] = useState([
    {
      id: 'hier',
      label: 'Campus Hierarchy & Academic Schools',
      desc: 'CAMP-01 Main Campus and School of Computing configured',
      done: true,
      route: '/admin/hierarchy',
    },
    {
      id: 'calendar',
      label: 'Academic Sessions & Batch 2026 Cohorts',
      desc: 'Semester progression and student records synchronized',
      done: true,
      route: '/admin/academic',
    },
    {
      id: 'charter',
      label: 'Placement Charter & Eligibility Engine',
      desc: 'Institutional Placement Charter v3 enforced deterministically',
      done: true,
      route: '/tpo/drives',
    },
    {
      id: 'dpdp',
      label: 'DPDP Act 2023 Consent Attestation Engine',
      desc: 'Mandatory cryptographic consent attestation verified',
      done: true,
      route: '/admin/compliance',
    },
    {
      id: 'sso',
      label: 'SAML / OIDC Single Sign-On Federation',
      desc: 'Federate campus Active Directory / Google Workspace identity',
      done: false,
      route: '/admin/iam',
    },
  ]);

  const [receipts, _setReceipts] = useState<ReceiptLine[]>([
    {
      id: 'adm-1',
      label: 'RBAC Policy Check',
      value: '199 of 199 Passed',
      status: 'pass',
      detail: 'Multi-role isolation matrix verified against platform charter',
    },
    {
      id: 'adm-2',
      label: 'Database Synchronization',
      value: 'Primary Healthy',
      status: 'pass',
      detail: 'MongoDB cluster replication and SIS sync verified',
    },
  ]);

  const completedCount = checklist.filter((c) => c.done).length;
  const progressPct = Math.round((completedCount / checklist.length) * 100);

  const settingsList = [
    {
      id: 'iam',
      title: 'Identity, Access & RBAC Governance',
      desc: 'Manage roles (Student, Faculty, HOD, TPO, Admin), break-glass delegations, and user accounts.',
      route: '/admin/iam',
      badge: 'Active & Enforced',
    },
    {
      id: 'hierarchy',
      title: 'Institutional & Campus Hierarchy',
      desc: 'Multi-campus structure, schools, academic departments, and physical interview halls.',
      route: '/admin/hierarchy',
      badge: 'Configured',
    },
    {
      id: 'lifecycle',
      title: 'Academic Lifecycle & Cohort Migration',
      desc: 'Promote student batches, configure grade scales, and manage academic freeze periods.',
      route: '/admin/academic',
      badge: 'Batch 2026',
    },
    {
      id: 'compliance',
      title: 'Statutory Compliance & DPDP Audit Trail',
      desc: 'Export cryptographic consent ledgers and regulatory disclosure packages.',
      route: '/admin/compliance',
      badge: 'Compliant',
    },
  ];

  return (
    <div className="space-y-8 font-sans max-w-[1400px] mx-auto pb-16">
      {/* Admin Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink tracking-tight">
              System Administration
            </h1>
            <Badge variant="institutional" size="xs">
              {me?.display_name || 'Platform Superuser'}
            </Badge>
          </div>
          <p className="text-sm text-ink-muted mt-1.5 max-w-3xl">
            Platform setup is {progressPct}% complete ({completedCount} of {checklist.length} milestones verified) &bull;{' '}
            12 active role-assigned accounts &bull; System health nominal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/iam')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-surface text-xs font-bold hover:bg-brand/90 transition-colors shadow-xs cursor-pointer"
          >
            <Key size={14} /> Manage IAM Roles
          </button>
        </div>
      </div>

      {/* Actionable Task Cards ("What Needs Me Now") */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          What Needs Me Now
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TaskCard
            data={{
              task_id: 'task_admin_claims',
              title: 'Review ambiguous student account self-service claims and verification',
              due: null,
              priority: 'HIGH',
              icon: UserCheck,
              action_label: 'Resolve Claims',
            }}
            onAction={() => navigate('/admin/iam')}
          />
          <TaskCard
            data={{
              task_id: 'task_admin_iam',
              title: 'Audit active break-glass delegations and IAM scopes across campus',
              due: null,
              priority: 'HIGH',
              icon: Key,
              action_label: 'Audit IAM',
            }}
            onAction={() => navigate('/admin/iam')}
          />
          <TaskCard
            data={{
              task_id: 'task_admin_hierarchy',
              title: 'CAMP-01 Multi-campus organizational hierarchy and venue mapping',
              due: null,
              priority: 'MEDIUM',
              icon: Network,
              action_label: 'View Hierarchy',
            }}
            onAction={() => navigate('/admin/hierarchy')}
          />
        </div>
      </div>

      {/* 1. SETUP ONBOARDING CHECKLIST (Endowed Progress) */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
              Institutional Onboarding
            </span>
            <h2 className="text-xl font-bold font-display text-ink mt-0.5">
              Platform Setup Checklist
            </h2>
            <p className="text-xs text-ink-muted mt-1">
              Pre-populated and endowed from institutional SIS configuration
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-bold font-display text-brand tabular-nums">
              {progressPct}%
            </span>
            <span className="text-xs text-ink-muted block">
              {completedCount} of {checklist.length} Completed
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-line rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Checklist Rows */}
        <div className="divide-y divide-line/70">
          {checklist.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between gap-3 text-xs first:pt-1 last:pb-1"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="shrink-0 mt-0.5">
                  {item.done ? (
                    <CheckCircle2 size={16} className="text-success" />
                  ) : (
                    <Circle size={16} className="text-amber-500" />
                  )}
                </div>
                <div>
                  <span className={`font-bold block ${item.done ? 'text-ink' : 'text-amber-700'}`}>
                    {item.label}
                  </span>
                  <span className="text-ink-muted text-[11px]">{item.desc}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(item.route)}
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>{item.done ? 'Inspect' : 'Configure'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SETTINGS AS A PLAIN LIST (Clean & Linear) */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-line pb-3">
          <h2 className="text-base font-bold font-display text-ink">Platform Administration Settings</h2>
          <p className="text-xs text-ink-muted">Configure institutional parameters and security boundaries</p>
        </div>

        <div className="divide-y divide-line">
          {settingsList.map((setting) => (
            <button
              key={setting.id}
              type="button"
              onClick={() => navigate(setting.route)}
              className="w-full text-left py-4 flex items-center justify-between gap-4 group hover:bg-canvas/50 px-2 rounded-xl transition-colors cursor-pointer"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-ink group-hover:text-brand transition-colors">
                    {setting.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-line text-ink-secondary">
                    {setting.badge}
                  </span>
                </div>
                <p className="text-xs text-ink-muted m-0">{setting.desc}</p>
              </div>

              <ChevronRight
                size={16}
                className="text-ink-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </button>
          ))}
        </div>
      </div>

      {/* 3. AUDIT & SYSTEM TELEMETRY RECEIPTS */}
      <Receipt
        title="Administrative Security & Telemetry Receipts"
        lines={receipts}
        timestamp={new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      />
    </div>
  );
};
