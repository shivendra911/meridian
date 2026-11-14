/**
 * PlaceFlow / Meridian — Faculty Approvals Queue (Phase 6).
 */

import React, { useState } from 'react';
import { Check, X} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, Card, Badge, Button, EmptyState } from '../../../ui';

interface ApprovalRequest {
  id: string;
  studentName: string;
  studentId: string;
  type: string;
  reason: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const INITIAL_REQUESTS: ApprovalRequest[] = [
  {
    id: 'REQ-01',
    studentName: 'Rohan Verma',
    studentId: 'STU014',
    type: 'Medical Leave Condonation (Attendance)',
    reason: 'Hospitalized for 5 days due to viral fever. Medical certificate attached.',
    submittedAt: 'Yesterday',
    status: 'Pending',
  },
  {
    id: 'REQ-02',
    studentName: 'Diya Patel',
    studentId: 'STU002',
    type: 'Placement Drive On-Duty (OD) Leave',
    reason: 'Final round technical interview with Accenture on Campus Day 1.',
    submittedAt: '2 days ago',
    status: 'Pending',
  },
];

export const FacultyApprovalsPage: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>(INITIAL_REQUESTS);

  const handleAction = (id: string, action: 'Approved' | 'Rejected') => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: action } : r)));
    toast.success(`Request ${id} has been marked as ${action}.`);
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Verification &amp; Approval Queue"
        description="Review and sign off on student attendance condonations, on-duty requests, and course waivers."
        badge={<Badge variant="institutional" size="xs">Attestation</Badge>}
      />

      <Card title="Pending Mentee Requests" subtitle="Authoritative faculty digital signatures">
        {requests.length === 0 ? (
          <EmptyState title="Queue Clean" description="There are no pending student requests requiring your review." />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-line bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-ink">{req.type}</span>
                    <Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'neutral'} size="xs">
                      {req.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-ink-muted">
                    Candidate: <span className="font-semibold text-ink">{req.studentName}</span> ({req.studentId}) &bull; {req.submittedAt}
                  </div>
                  <p className="text-xs text-ink pt-1 max-w-xl">{req.reason}</p>
                </div>

                {req.status === 'Pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAction(req.id, 'Approved')}
                      leftIcon={<Check size={14} />}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(req.id, 'Rejected')}
                      leftIcon={<X size={14} className="text-red-500" />}
                    >
                      Reject
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

