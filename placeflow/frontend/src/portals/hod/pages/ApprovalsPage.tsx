/**
 * PlaceFlow / Meridian — HOD Department Approvals Queue (Phase 6).
 */

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, Card, Badge, Button, EmptyState } from '../../../ui';

interface HodApproval {
  id: string;
  requester: string;
  type: string;
  details: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const HOD_REQUESTS: HodApproval[] = [
  {
    id: 'HOD-APP-01',
    requester: 'Dr. Janpreet Singh',
    type: 'Conference Travel Grant Sign-Off',
    details: 'Paper presentation at IEEE Cloud 2026. Institutional funding approval required.',
    status: 'Pending',
  },
  {
    id: 'HOD-APP-02',
    requester: 'Prof. Swathy Reghu',
    type: 'Placement On-Duty Batch Exemption',
    details: 'Exemption for 14 CSE students appearing for Amazon off-campus superday.',
    status: 'Pending',
  },
];

export const HodApprovalsPage: React.FC = () => {
  const [requests, setRequests] = useState<HodApproval[]>(HOD_REQUESTS);

  const handleAction = (id: string, action: 'Approved' | 'Rejected') => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: action } : r)));
    toast.success(`Department approval ${id} marked as ${action}.`);
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Department Sign-Offs & Approvals"
        description="Formal departmental authorization for faculty travel, student event on-duty permissions, and budget requests."
      />

      <Card title="Pending Department Approvals" subtitle="Digital attestations by Head of Department">
        {requests.length === 0 ? (
          <EmptyState title="Queue Clean" description="No department-level approval requests pending." />
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-line bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-ink">{r.type}</span>
                    <Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'danger' : 'neutral'} size="xs">
                      {r.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-ink-muted">Requester: <span className="font-semibold text-ink">{r.requester}</span></div>
                  <p className="text-xs text-ink pt-1 max-w-xl">{r.details}</p>
                </div>

                {r.status === 'Pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="primary" size="sm" onClick={() => handleAction(r.id, 'Approved')} leftIcon={<Check size={14} />}>
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleAction(r.id, 'Rejected')} leftIcon={<X size={14} className="text-red-500" />}>
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

