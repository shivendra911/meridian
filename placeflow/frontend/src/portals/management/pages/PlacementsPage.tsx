/**
 * PlaceFlow / Meridian — Management Placements Console (Phase 6).
 */

import React from 'react';
import { Award, TrendingUp, Building2, Layers } from 'lucide-react';
import { PageHeader, StatCard, Card, Badge, EmptyState, useDocumentTitle } from '../../../ui';

export const ManagementPlacementsPage: React.FC = () => {
  useDocumentTitle('Multi-Campus Placements');

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Multi-Campus Placement Outcomes"
        description="Comprehensive placement statistics across all constituent university colleges and schools."
        badge={<Badge variant="institutional" size="xs">Executive Analytics</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Multi-Campus Scope" value="Active" hint="Constituent Colleges" icon={TrendingUp} />
        <StatCard label="Recruitment Tiers" value="Tiered" hint="Super Dream / Dream / Regular" icon={Award} />
        <StatCard label="NIRF Compliance" value="Monitored" hint="Statutory GPH Metric" icon={Layers} />
        <StatCard label="Corporate Outreach" value="Connected" hint="Campus Drive Network" icon={Building2} />
      </div>

      <Card title="Recruiter Intake Tier Distribution" subtitle="Placement outcome segments by compensation band">
        <EmptyState
          title="Not available yet"
          description="Multi-campus placement tier distributions and salary breakdowns will appear here once final institutional records are certified."
        />
      </Card>
    </div>
  );
};
