/**
 * PlaceFlow / Meridian — HOD Department Approvals Queue (Phase 6).
 */

import React from 'react';
import { PageHeader, Card, EmptyState, useDocumentTitle } from '../../../ui';

export const HodApprovalsPage: React.FC = () => {
  useDocumentTitle('Department Approvals Queue');

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Department Sign-Offs &amp; Approvals"
        description="Formal departmental authorization for faculty travel, student event on-duty permissions, and budget requests."
      />

      <Card title="Pending Department Approvals" subtitle="Digital attestations by Head of Department">
        <EmptyState
          title="Not available yet"
          description="Formal departmental sign-offs, faculty conference grants, and batch on-duty requests will appear here once connected."
        />
      </Card>
    </div>
  );
};
