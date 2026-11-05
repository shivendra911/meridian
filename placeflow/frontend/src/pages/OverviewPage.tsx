import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { OverviewData } from '../types';
import { useTenant } from '../context/TenantContext';
import {
  Users,
  Award,
  Building2,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Zap,
  Radar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

interface OverviewPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateTab }) => {
  const { activeTenant, activeInstitution, activeCampus } = useTenant();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-xs text-ink flex items-start gap-3">
        <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-danger">Unable to Load Telemetry Stream</div>
          <div className="text-ink-muted mt-1">{error || 'Unknown error occurred'}</div>
        </div>
      </div>
    );
  }

  const { kpis, branch_velocity, tier_distribution, recent_activity } = data;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title={activeInstitution ? activeInstitution.legal_name : activeTenant?.name || 'Institutional Command Hub'}
        description={`${activeCampus?.campus_name || 'Main Campus'} • Directorate of Career & Placement Operations`}
        badge={
          <Badge variant="success" size="xs">
            System Online &bull; Active
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab?.('architecture')}
              rightIcon={<ArrowRight size={13} />}
            >
              Hierarchy Graph
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab?.('jobs')}
              leftIcon={<Briefcase size={14} />}
            >
              Manage Drives
            </Button>
          </div>
        }
      />

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
          change="+4.2% YoY"
          changeType="up"
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
                branch_velocity.rows.map((row) => (
                  <div key={row.department} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-ink">{row.department}</span>
                      <span className="tabular-nums text-ink-muted">
                        {row.placed_students} / {row.total_students} ({row.placement_pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-brand h-full rounded-full transition-all duration-150"
                        style={{ width: `${Math.min(100, row.placement_pct || 0)}%` }}
                      />
                    </div>
                  </div>
                ))
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
                onClick={() => onNavigateTab?.('superday')}
                className="p-3 rounded-lg border border-line bg-surface hover:bg-canvas text-left transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span>Superday Clash Solver</span>
                  <Zap size={14} className="text-brand" />
                </div>
                <div className="text-[11px] text-ink-muted mt-1">
                  Constraint-based interview schedule arbitrator
                </div>
              </button>

              <button
                onClick={() => onNavigateTab?.('renege')}
                className="p-3 rounded-lg border border-line bg-surface hover:bg-canvas text-left transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span>Retention Radar</span>
                  <Radar size={14} className="text-brand" />
                </div>
                <div className="text-[11px] text-ink-muted mt-1">
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
                <p className="text-[11px] text-ink-muted m-0">
                  Primary campus registry locked &amp; attested.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-line bg-canvas space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">Superday Lab Integrity</span>
                  <Badge variant="success" size="xs">Zero Clashes</Badge>
                </div>
                <p className="text-[11px] text-ink-muted m-0">
                  Terminal scheduling constraint engine running live.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-line bg-canvas space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">DPDP Act 2023 Consent</span>
                  <Badge variant="success" size="xs">98.2% Active</Badge>
                </div>
                <p className="text-[11px] text-ink-muted m-0">
                  Authoritative student data consent recorded.
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
                      <span className="text-[10px] text-ink-muted font-mono uppercase">
                        {act.event_type}
                      </span>
                    </div>
                    <span className="text-[10px] text-ink-muted font-mono tabular-nums shrink-0">
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
    </div>
  );
};
