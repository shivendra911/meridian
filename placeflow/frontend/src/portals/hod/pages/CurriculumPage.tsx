/**
 * PlaceFlow / Meridian — HOD Curriculum Approvals (Phase 6).
 *
 * Board of Studies (BoS) curriculum proposal review and syllabus sign-off.
 * Replaces misplaced administrative setup console with an authoritative HOD approval queue.
 */

import React, { useState } from 'react';
import { Check, X} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, Card, Badge, Button, EmptyState } from '../../../ui';

interface CurriculumProposal {
  id: string;
  courseCode: string;
  courseTitle: string;
  proposedBy: string;
  type: string;
  summary: string;
  submittedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const INITIAL_PROPOSALS: CurriculumProposal[] = [
  {
    id: 'CURR-2025-01',
    courseCode: 'CS502',
    courseTitle: 'Cloud Native Infrastructure & Kubernetes',
    proposedBy: 'Dr. Janpreet Singh',
    type: 'New Elective Offering (NEP Basket)',
    summary: 'Proposing a 4-credit professional elective on container orchestration, cloud patterns, and microservices.',
    submittedDate: 'Oct 28, 2026',
    status: 'Pending',
  },
  {
    id: 'CURR-2025-02',
    courseCode: 'CS401',
    courseTitle: 'Artificial Intelligence Ethics & DPDP Act',
    proposedBy: 'Prof. Swathy Reghu',
    type: 'Syllabus Revision (Core)',
    summary: 'Updated syllabus to integrate DPDP Act 2023 compliance, differential privacy, and AI safety guidelines.',
    submittedDate: 'Nov 02, 2026',
    status: 'Pending',
  },
];

export const HodCurriculumPage: React.FC = () => {
  const [proposals, setProposals] = useState<CurriculumProposal[]>(INITIAL_PROPOSALS);

  const handleDecision = (id: string, action: 'Approved' | 'Rejected') => {
    setProposals(proposals.map((p) => (p.id === id ? { ...p, status: action } : p)));
    toast.success(`Curriculum proposal ${id} has been ${action.toLowerCase()}.`);
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Curriculum Approvals &amp; BoS Oversight"
        description="Board of Studies review of proposed course additions, syllabus updates, and prerequisite rule changes."
        badge={<Badge variant="institutional" size="xs">Department of CSE</Badge>}
      />

      <Card title="Pending Board of Studies Proposals" subtitle="Requires HOD authoritative sign-off before Academic Council tabling">
        {proposals.length === 0 ? (
          <EmptyState title="No Proposals Pending" description="All departmental curriculum proposals have been reviewed." />
        ) : (
          <div className="space-y-4">
            {proposals.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-xl border border-line bg-surface flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand">{p.courseCode}</span>
                    <h4 className="text-sm font-bold text-ink">{p.courseTitle}</h4>
                    <Badge variant={p.status === 'Approved' ? 'success' : p.status === 'Rejected' ? 'danger' : 'neutral'} size="xs">
                      {p.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-ink-muted">
                    Proposed by: <span className="font-semibold text-ink">{p.proposedBy}</span> &bull; {p.type} &bull; {p.submittedDate}
                  </div>

                  <p className="text-xs text-ink pt-1 max-w-2xl">{p.summary}</p>
                </div>

                {p.status === 'Pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDecision(p.id, 'Approved')}
                      leftIcon={<Check size={14} />}
                    >
                      Approve Syllabus
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecision(p.id, 'Rejected')}
                      leftIcon={<X size={14} className="text-red-500" />}
                    >
                      Request Revisions
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

