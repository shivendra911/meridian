/**
 * PlaceFlow / Meridian — HOD Curriculum Approvals (Phase 6).
 *
 * Board of Studies (BoS) curriculum proposal review and syllabus sign-off.
 */

import React from 'react';
import { PageHeader, Card, Badge, EmptyState, useDocumentTitle } from '../../../ui';

export const HodCurriculumPage: React.FC = () => {
  useDocumentTitle('Curriculum Approvals');

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Curriculum Approvals &amp; BoS Oversight"
        description="Board of Studies review of proposed course additions, syllabus updates, and prerequisite rule changes."
        badge={<Badge variant="institutional" size="xs">Department of CSE</Badge>}
      />

      <Card title="Pending Board of Studies Proposals" subtitle="Requires HOD review and sign-off before Academic Council tabling">
        <EmptyState
          title="Not available yet"
          description="Curriculum proposals, syllabus updates, and Board of Studies recommendations will appear here once connected."
        />
      </Card>
    </div>
  );
};
