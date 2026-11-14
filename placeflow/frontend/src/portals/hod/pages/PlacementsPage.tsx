/**
 * PlaceFlow / Meridian — HOD Department Placement Outcomes (Phase 6).
 */

import React from 'react';
import { Award, TrendingUp, Building2, Users } from 'lucide-react';
import { PageHeader, StatCard, Card, Badge, EmptyState, useDocumentTitle } from '../../../ui';

export const HodPlacementsPage: React.FC = () => {
  useDocumentTitle('Department Placement Analytics');

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Department Placement Analytics"
        description="CSE placement metrics, recruiter intake distribution, and candidate conversion funnels."
        badge={<Badge variant="institutional" size="xs">Department Scope</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Placement Analytics" value="Active" hint="Campus Drive Cycle 2026" icon={TrendingUp} />
        <StatCard label="Recruitment Tiers" value="3 Tiers" hint="Super Dream, Dream, Regular" icon={Award} />
        <StatCard label="Drive Engagement" value="Integrated" hint="Corporate Partners" icon={Building2} />
        <StatCard label="Cohort Monitoring" value="Continuous" hint="Student Placement Pipeline" icon={Users} />
      </div>

      <Card title="Top Recruiting Partners in CSE" subtitle="Corporate intake breakdown by organization">
        <EmptyState
          title="Not available yet"
          description="Detailed recruiter company breakdowns and offer distributions will appear here as final campus drive results are certified."
        />
      </Card>
    </div>
  );
};
