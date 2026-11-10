/**
 * PlaceFlow / Meridian — System Administration Home (Phase 6).
 *
 * Core administration: onboarding checklist, pending access requests, role changes, system health.
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
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { PageHeader, StatCard, Card, Badge, Button } from '../../../ui';

export const AdminHomePage: React.FC = () => {
  const { me } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 font-sans">
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

      {/* KPI Row */}
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
          label="Tenants &amp; Campuses"
          value="1 / 3"
          hint="Active multi-campus tree"
          icon={Network}
        />
        <StatCard
          label="Security Audits"
          value="Enforced"
          hint="Default-deny RBAC active"
          icon={Shield}
        />
      </div>

      {/* Admin Quick Action Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Card title="Multi-Campus Architecture" subtitle="Constituent institutions and campuses">
          <p className="text-xs text-ink-muted mb-4">
            Provision new university campuses, configure MoE identifiers, and define institutional structures.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/architecture')}>
            <span>Open Architecture</span>
            <ArrowRight size={13} />
          </Button>
        </Card>

        <Card title="Organizational Hierarchy" subtitle="Schools, departments, and leadership">
          <p className="text-xs text-ink-muted mb-4">
            Manage Dean and HOD appointments, department topologies, and cross-campus reporting trees.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/hierarchy')}>
            <span>View Hierarchy</span>
            <ArrowRight size={13} />
          </Button>
        </Card>

        <Card title="Identity &amp; Access (IAM)" subtitle="Authoritative role assignments &amp; delegations">
          <p className="text-xs text-ink-muted mb-4">
            Assign platform roles, time-box temporary delegations, configure break-glass emergency access.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/iam')}>
            <span>Open IAM Console</span>
            <ArrowRight size={13} />
          </Button>
        </Card>

        <Card title="Academic Setup &amp; Regulations" subtitle="NEP 2020 curriculum framework">
          <p className="text-xs text-ink-muted mb-4">
            Define term calendars, qualification pathways, credit frameworks, and progression rules.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/academic')}>
            <span>Academic Setup</span>
            <ArrowRight size={13} />
          </Button>
        </Card>

        <Card title="AI Copilot Governance" subtitle="Telemetry, token limits, and agent traces">
          <p className="text-xs text-ink-muted mb-4">
            Inspect live agent runs, monitor token consumption quotas, and enforce model guardrails.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/ai-governance')}>
            <span>Inspect AI Traces</span>
            <ArrowRight size={13} />
          </Button>
        </Card>
      </div>
    </div>
  );
};

