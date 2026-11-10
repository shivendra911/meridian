/**
 * PlaceFlow / Meridian — HOD Department Placement Outcomes (Phase 6).
 */

import React from 'react';
import { Award, TrendingUp, Building2, Users, CheckCircle2 } from 'lucide-react';
import { PageHeader, StatCard, Card, Badge } from '../../../ui';

export const HodPlacementsPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Department Placement Analytics"
        description="CSE placement metrics, recruiter intake distribution, and candidate conversion funnels."
        badge={<Badge variant="institutional" size="xs">Batch 2025</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Placement Rate" value="84.6%" hint="Target: 90%" icon={TrendingUp} />
        <StatCard label="Average CTC" value="₹11.2 LPA" hint="Super Dream: ₹28.5 LPA" icon={Award} />
        <StatCard label="Offers Generated" value={214} hint="Across 34 recruiters" icon={CheckCircle2} />
        <StatCard label="Unplaced Target" value={39} hint="Active intervention cohort" icon={Users} />
      </div>

      <Card title="Top Recruiting Partners in CSE" subtitle="Corporate intake breakdown by organization">
        <div className="space-y-3">
          {[
            { comp: 'Accenture', count: 42, avgPkg: '10.5 LPA' },
            { comp: 'Google', count: 8, avgPkg: '32.0 LPA' },
            { comp: 'Microsoft', count: 12, avgPkg: '28.0 LPA' },
            { comp: 'TCS Digital', count: 35, avgPkg: '7.5 LPA' },
          ].map((r, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-line bg-canvas flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-brand shrink-0" />
                <span className="font-semibold text-ink">{r.comp}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-ink-muted">{r.count} Offers</span>
                <span className="font-mono font-bold text-success">{r.avgPkg}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

