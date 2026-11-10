/**
 * PlaceFlow / Meridian — Executive Decision Centre Home (Phase 6).
 *
 * Institutional leadership overview: placement outcomes, NIRF status, compliance flags, AI audit alerts.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Award,
  ShieldCheck,
  ShieldAlert,
  BarChart2,
  Building2,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { PageHeader, StatCard, Card, Badge, Button } from '../../../ui';

export const ManagementHomePage: React.FC = () => {
  const { me } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title={`Executive Directorate — ${me?.display_name || 'Vice Chancellor'}`}
        description="Multi-campus statutory governance, NIRF graduation outcomes, regulatory compliance, and AI auditing."
        badge={<Badge variant="institutional" size="xs">Apex University System</Badge>}
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

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Institutional Placement"
          value="88.4%"
          hint="Across all campuses"
          icon={TrendingUp}
        />
        <StatCard
          label="NIRF Metric Standing"
          value="74.2 / 100"
          hint="Graduation Outcome (GO) Score"
          icon={Award}
        />
        <StatCard
          label="Statutory DPDP Consent"
          value="98.2%"
          hint="Active candidate grants"
          icon={ShieldCheck}
        />
        <StatCard
          label="AI Model Audit Status"
          value="Clean"
          hint="Zero disparate impact breaches"
          icon={Cpu}
        />
      </div>

      {/* Institutional Governance Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Multi-Campus Placement Performance" subtitle="Campus-wise intake and median package">
          <div className="space-y-3">
            {[
              { campus: 'Main Campus (Delhi NCR)', rate: '92.1%', median: '₹9.8 LPA', count: 840 },
              { campus: 'South Campus (Bengaluru)', rate: '86.4%', median: '₹11.2 LPA', count: 620 },
              { campus: 'West Campus (Pune)', rate: '81.5%', median: '₹8.4 LPA', count: 480 },
            ].map((c, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-line bg-canvas flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-ink">{c.campus}</div>
                  <div className="text-[11px] text-ink-muted">{c.count} eligible graduates</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-success font-mono">{c.rate} Placed</div>
                  <div className="text-[11px] text-ink-muted font-mono">Median: {c.median}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Statutory Compliance &amp; AI Safety Alerts" subtitle="Continuous algorithmic audit & regulatory telemetry">
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-ink">Equal Opportunity &amp; Disparate Impact</div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Demographic parity ratio: 0.94 (&gt; 0.80 Four-Fifths Rule). Zero algorithmic discrimination detected.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-line bg-canvas flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-brand shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-ink">DPDP Act 2023 Statutory Audit</div>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  1,894 active affirmative consent receipts locked in append-only database audit collection.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Direct Nav Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/management/placements')}>
          <span>System-Wide Placements</span>
          <ArrowRight size={13} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/management/accreditation')}>
          <span>NIRF Outcomes Console</span>
          <ArrowRight size={13} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/management/compliance')}>
          <span>Compliance &amp; AI Audit</span>
          <ArrowRight size={13} />
        </Button>
      </div>
    </div>
  );
};

