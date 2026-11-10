/**
 * PlaceFlow / Meridian — Management Placements Console (Phase 6).
 */

import React from 'react';
import { Award, TrendingUp, Building2 } from 'lucide-react';
import { PageHeader, StatCard, Card, Badge } from '../../../ui';

export const ManagementPlacementsPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Multi-Campus Placement Outcomes"
        description="Comprehensive placement statistics across all constituent university colleges and schools."
        badge={<Badge variant="institutional" size="xs">Executive Analytics</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Overall Placement" value="88.4%" hint="1,714 Placed / 1,940 Total" icon={TrendingUp} />
        <StatCard label="Highest Package" value="₹48.0 LPA" hint="International / Domestic Lead" icon={Award} />
        <StatCard label="Median Package" value="₹9.5 LPA" hint="Statutory NIRF median" icon={Award} />
        <StatCard label="Corporate Recruiters" value={142} hint="Active campus partners" icon={Building2} />
      </div>

      <Card title="Recruiter Intake Tier Distribution" subtitle="Placement outcome segments by compensation band">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-ink mb-1">
              <span>Super Dream (&gt;10 LPA)</span>
              <span className="font-mono text-brand">428 candidates (25%)</span>
            </div>
            <div className="w-full bg-line rounded-full h-2 overflow-hidden">
              <div className="bg-brand h-full rounded-full" style={{ width: '25%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-ink mb-1">
              <span>Dream (6-10 LPA)</span>
              <span className="font-mono text-emerald-600">892 candidates (52%)</span>
            </div>
            <div className="w-full bg-line rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: '52%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-ink mb-1">
              <span>Regular (&lt;6 LPA)</span>
              <span className="font-mono text-slate-600">394 candidates (23%)</span>
            </div>
            <div className="w-full bg-line rounded-full h-2 overflow-hidden">
              <div className="bg-slate-500 h-full rounded-full" style={{ width: '23%' }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

