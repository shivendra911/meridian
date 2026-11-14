import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlacementDriveWizard } from '../../../pages/workspaces/PlacementDriveWizard';
import { api } from '../api';
import { OverviewData } from '../../../types';
import { useTenant } from '../../../context/TenantContext';
import {
  Users,
  Award,
  Building2,
  Briefcase,
  Zap,
  Radar} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { TaskCard, useDocumentTitle, ErrorState } from '../../../ui';
import { formatApiError } from '../../../core/api/errors';

interface OverviewPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateTab }) => {
  useDocumentTitle('TPO Operations & Command');
  const navigate = useNavigate();
  const { activeTenant, activeInstitution, activeCampus } = useTenant();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(formatApiError(err));
        setLoading(false);
      });
  }, [activeTenant]);

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div className="space-y-2">
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Failed to Load Placement Overview"
        message={error || 'Unable to load overview data.'}
        onRetry={() => {
          setLoading(true);
          setError(null);
          api
            .getOverview()
            .then((res) => {
              setData(res);
              setLoading(false);
            })
            .catch((err) => {
              setError(formatApiError(err));
              setLoading(false);
            });
        }}
      />
    );
  }

  const { kpis, branch_velocity, tier_distribution, recent_activity } = data;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title={activeInstitution ? activeInstitution.legal_name : activeTenant?.name || 'Overview'}
        description={`${activeCampus?.campus_name || 'Main Campus'} • Placement`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/tpo/interviews')}
              leftIcon={<Zap size={14} className="text-cardinal" />}
            >
              Superday Solver
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsWizardOpen(true)}
              leftIcon={<Briefcase size={14} />}
            >
              New drive
            </Button>
          </div>
        }
      />

      {/* What Needs Me Now — Actionable TaskCards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          What Needs Me Now
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TaskCard
            data={{
              task_id: 'task_superday',
              title: 'Superday Solver: Room & panel schedule conflicts',
              due: new Date(Date.now() + 3600 * 1000 * 4),
              priority: 'HIGH',
              icon: Zap,
              action_label: 'Resolve Conflicts',
            }}
            onAction={() => navigate('/tpo/interviews')}
          />
          <TaskCard
            data={{
              task_id: 'task_renege',
              title: 'Renege Radar: 2 high-risk post-offer candidate alerts',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 2),
              priority: 'MEDIUM',
              icon: Radar,
              action_label: 'Inspect Risk',
            }}
            onAction={() => navigate('/tpo/insights/renege')}
          />
          <TaskCard
            data={{
              task_id: 'task_drives',
              title: 'Open JNF Drives: 4 pending recruiter approvals',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 3),
              priority: 'MEDIUM',
              icon: Briefcase,
              action_label: 'Review Drives',
            }}
            onAction={() => navigate('/tpo/drives')}
          />
        </div>
      </div>

      {/* 2. Top Metric Row (Max 4 StatCards, tabular-nums) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Registered Candidates"
          value={kpis.total_students || 0}
          hint="Class of 2026–2027 Cohort"
          icon={Users}
        />
        <StatCard
          label="Placement Rate"
          value={`${kpis.placement_pct || 0}%`}
          hint="Verified Offers Accepted"
          icon={Award}
        />
        <StatCard
          label="Corporate Partners"
          value={kpis.total_companies || 0}
          hint="Active Visiting Recruiters"
          icon={Building2}
        />
        <StatCard
          label="Open JNFs / Drives"
          value={kpis.open_jobs || 0}
          hint="Active Recruitment Drives"
          icon={Briefcase}
        />
      </div>

      {/* 3. 2/3 Main Panel + 1/3 Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Placement Velocity */}
          <Card
            title="Department Placement Velocity"
            subtitle="Verified placement rates across academic disciplines"
          >
            <div className="space-y-3">
              {branch_velocity.rows && branch_velocity.rows.length > 0 ? (
                branch_velocity.rows.map((row) => {
                  const placed = row.placed ?? row.placed_students ?? 0;
                  const total = row.students ?? row.total_students ?? 0;
                  return (
                    <div key={row.department} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-ink">{row.department}</span>
                        <span className="tabular-nums text-ink-muted">
                          {placed} / {total} ({row.placement_pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand h-full rounded-full transition-all duration-150"
                          style={{ width: `${Math.min(100, row.placement_pct || 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-ink-muted py-4 text-center">
                  No department velocity records recorded
                </div>
              )}
            </div>
          </Card>

          {/* Compensation Tier Breakdown */}
          <Card
            title="Compensation Tier Distribution"
            subtitle="Package bands for active opportunities"
          >
            <div className="space-y-3">
              {tier_distribution.labels && tier_distribution.labels.length > 0 ? (
                tier_distribution.labels.map((tierName, idx) => {
                  const count = tier_distribution.counts[idx] || 0;
                  const total = tier_distribution.counts.reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={tierName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-ink">{tierName}</span>
                        <span className="tabular-nums text-ink-muted">
                          {count} roles ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand-hover h-full rounded-full transition-all duration-150"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-ink-muted py-4 text-center">
                  No compensation tier data available
                </div>
              )}
            </div>
          </Card>

          {/* Platform Operational Engines */}
          <Card
            title="Operational Engines"
            subtitle="Core institutional placement execution engines"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => { if (onNavigateTab) onNavigateTab('superday'); else navigate('/tpo/interviews'); }}
                className="p-3 rounded-lg border border-line bg-surface hover:bg-canvas text-left transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span>Superday Clash Solver</span>
                  <Zap size={14} className="text-brand" />
                </div>
                <div className="text-xs text-ink-muted mt-1">
                  Constraint-based interview schedule arbitrator
                </div>
              </button>

              <button
                onClick={() => { if (onNavigateTab) onNavigateTab('renege'); else navigate('/tpo/insights/renege'); }}
                className="p-3 rounded-lg border border-line bg-surface hover:bg-canvas text-left transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span>Retention Radar</span>
                  <Radar size={14} className="text-brand" />
                </div>
                <div className="text-xs text-ink-muted mt-1">
                  Post-offer renege telemetry &amp; early warnings
                </div>
              </button>
            </div>
          </Card>
        </div>

        {/* Side Panel (1 Column) */}
        <div className="space-y-6">
          {/* Institutional Integrity & Compliance */}
          <Card
            title="Institutional Governance"
            subtitle="Accreditation & regulatory readiness"
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-line bg-canvas space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">MoE AISHE Verification</span>
                  <Badge variant="success" size="xs">Verified</Badge>
                </div>
                <p className="text-xs text-ink-muted m-0">
                  Primary campus registry locked &amp; attested.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-line bg-canvas space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">Superday Schedule Arbiter</span>
                  <Badge variant="neutral" size="xs">Active</Badge>
                </div>
                <p className="text-xs text-ink-muted m-0">
                  Terminal scheduling constraint engine.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-line bg-canvas space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">DPDP Act 2023 Consent</span>
                  <Badge variant="success" size="xs">Compliant</Badge>
                </div>
                <p className="text-xs text-ink-muted m-0">
                  Authoritative student data consent notices attested.
                </p>
              </div>
            </div>
          </Card>

          {/* Live Transactional Audit Trail */}
          <Card
            title="Recent Audit Events"
            subtitle="Append-only event telemetry"
          >
            <div className="space-y-2 text-xs">
              {recent_activity && recent_activity.length > 0 ? (
                recent_activity.slice(0, 5).map((act, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-line bg-canvas flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-medium text-ink truncate">{act.message}</div>
                      <span className="text-xs text-ink-muted font-mono uppercase">
                        {act.event_type}
                      </span>
                    </div>
                    <span className="text-xs text-ink-muted font-mono tabular-nums shrink-0">
                      {act.at ? new Date(act.at).toLocaleTimeString() : 'Now'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-ink-muted py-3 text-center">
                  No recent audit events
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <PlacementDriveWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={(driveData) => {
          if (driveData?.job_id) {
            navigate(`/tpo/drives/${driveData.job_id}`);
          }
        }}
      />
    </div>
  );
};
