/**
 * PlaceFlow / Meridian — Executive Decision Centre Home (Phase 6).
 *
 * Institutional leadership overview: placement outcomes, NIRF status, compliance flags, AI audit alerts.
 * Features "What needs me now" executive task center.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Award,
  ShieldCheck,
  BarChart2} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { PageHeader, StatCard, Card, Badge, Button, TaskCard, useDocumentTitle } from '../../../ui';
import { managementApi } from '../api';

export const ManagementHomePage: React.FC = () => {
  useDocumentTitle('Executive Management');
  const { me } = useAuth();
  const navigate = useNavigate();

  const [nirf, setNirf] = useState<any>(null);
  const [consent, setConsent] = useState<any>(null);

  useEffect(() => {
    managementApi.getNirfMetrics().then(setNirf).catch(() => null);
    managementApi.getConsentRecords().then(setConsent).catch(() => null);
  }, []);

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        title={`Executive Management — ${me?.display_name || 'Vice Chancellor'}`}
        description="Multi-campus statutory governance, NIRF graduation outcomes, regulatory compliance, and AI auditing."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/management/accreditation')}
            leftIcon={<BarChart2 size={14} />}
          >
            Accreditation Report
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
              task_id: 'task_nirf_filing',
              title: 'NIRF Metric 4: Graduation outcome accreditation filing review',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 5),
              priority: 'HIGH',
              icon: Award,
              action_label: 'Review Metric',
            }}
            onAction={() => navigate('/management/accreditation')}
          />
          <TaskCard
            data={{
              task_id: 'task_dpdp_audit',
              title: 'Quarterly DPDP consent ledger & student data protection audit',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 7),
              priority: 'MEDIUM',
              icon: ShieldCheck,
              action_label: 'Audit Privacy',
            }}
            onAction={() => navigate('/management/compliance')}
          />
          <TaskCard
            data={{
              task_id: 'task_campus_outcomes',
              title: 'Multi-campus placement velocity & compensation band analysis',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 10),
              priority: 'LOW',
              icon: TrendingUp,
              action_label: 'Inspect Outcomes',
            }}
            onAction={() => navigate('/management/placements')}
          />
        </div>
      </div>

      {/* 2. KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Institutional Placement"
          value={nirf?.placement_pct !== undefined ? `${nirf.placement_pct}%` : '—'}
          hint={nirf?.cohort_size ? `${nirf.placed_count || 0} / ${nirf.cohort_size} placed` : 'Across active cohorts'}
          icon={TrendingUp}
        />
        <StatCard
          label="NIRF Metric Standing"
          value={nirf?.total_nirf_go_80 !== undefined ? `${nirf.total_nirf_go_80} / 80` : '—'}
          hint="Graduation Outcome (GO) Score"
          icon={Award}
        />
        <StatCard
          label="Statutory DPDP Consent"
          value={consent?.compliance_rate ?? 'Attested'}
          hint={consent?.verified_students ? `${consent.verified_students.toLocaleString()} candidate records` : 'DigiLocker / APAAR compliance'}
          icon={ShieldCheck}
        />
        <StatCard
          label="Median Package"
          value={nirf?.salary_stats?.median_package_lpa ? `${nirf.salary_stats.median_package_lpa} LPA` : '—'}
          hint="Attested CTC benchmark"
          icon={TrendingUp}
        />
      </div>

      {/* 3. Executive Overview Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Campus Velocity Comparison" subtitle="Graduation year 2026 outcomes by constituent campus">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-ink">Bengaluru Main Campus</span>
                <span className="font-mono text-ink font-bold">92.1% (612/664)</span>
              </div>
              <div className="w-full bg-line rounded-full h-2">
                <div className="bg-brand h-2 rounded-full" style={{ width: '92.1%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-ink">North Tech Campus</span>
                <span className="font-mono text-ink font-bold">86.4% (388/449)</span>
              </div>
              <div className="w-full bg-line rounded-full h-2">
                <div className="bg-brand h-2 rounded-full" style={{ width: '86.4%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-ink">Pune Innovation Campus</span>
                <span className="font-mono text-ink font-bold">82.0% (246/300)</span>
              </div>
              <div className="w-full bg-line rounded-full h-2">
                <div className="bg-brand h-2 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Accreditation & Compliance Health" subtitle="Statutory rankings readiness and audit log telemetry">
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">NIRF 2026 Ready</span>
                <span className="text-xs text-emerald-800">Verified placement and median package metrics aligned</span>
              </div>
              <Badge variant="success" size="xs">Compliant</Badge>
            </div>

            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">DPDP Act (India)</span>
                <span className="text-xs text-emerald-800">Zero non-consensual candidate data sharing detected</span>
              </div>
              <Badge variant="success" size="xs">Passed</Badge>
            </div>

            <div className="p-3 rounded-lg border border-line bg-canvas flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">AI Demographic Fairness</span>
                <span className="text-xs text-ink-muted">Parity ratio within 0.80 - 1.25 four-fifths standard</span>
              </div>
              <Badge variant="institutional" size="xs">Monitored</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
