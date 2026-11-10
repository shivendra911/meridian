/**
 * PlaceFlow / Meridian — Student Applications & Offers Ledger (Phase 5).
 *
 * Implements candidate application tracking, interview schedules, and offer response actions.
 * Derives student identity strictly from session Principal with zero IDOR exposure.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Award,
  Clock,
  Building2,
  Check,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  studentApi,
  StudentApplication,
  StudentInterview,
  StudentOffer,
} from '../api';
import { PageHeader, StatCard, Badge, Button, Skeleton, EmptyState } from '../../../ui';
import { ErrorState } from '../../../ui/ErrorState';

export const StudentApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'applications' | 'interviews' | 'offers'>('applications');

  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [interviews, setInterviews] = useState<StudentInterview[]>([]);
  const [offers, setOffers] = useState<StudentOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [respondingOfferId, setRespondingOfferId] = useState<string | null>(null);

  const loadPipeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const [appData, intData, offData] = await Promise.all([
        studentApi.getApplications(),
        studentApi.getInterviews(),
        studentApi.getOffers(),
      ]);
      setApplications(appData || []);
      setInterviews(intData || []);
      setOffers(offData || []);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const handleOfferResponse = async (offerId: string, action: 'ACCEPT' | 'DECLINE') => {
    setRespondingOfferId(offerId);
    try {
      const res = await studentApi.respondOffer(offerId, action);
      const newStatus = action === 'ACCEPT' ? 'Accepted' : 'Declined';
      toast.success(`Placement offer marked as ${newStatus}!`);

      // Update offer in local state
      setOffers((prev) =>
        prev.map((o) =>
          o.placement_id === offerId
            ? { ...o, response_status: newStatus as any, responded_at: res.responded_at }
            : o
        )
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit response.');
    } finally {
      setRespondingOfferId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadPipeline} />;
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="My Recruitment Pipeline"
        description="Monitor submitted applications, review interview invitations, and respond to placement offers."
        badge={<Badge variant="institutional" size="xs">Self Service</Badge>}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/opportunities')}
            leftIcon={<ExternalLink size={13} />}
          >
            Explore More Drives
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Applications Submitted"
          value={applications.length}
          hint="Active candidate submissions"
          icon={FileText}
        />
        <StatCard
          label="Interviews Scheduled"
          value={interviews.length}
          hint="Across all hiring rounds"
          icon={Calendar}
        />
        <StatCard
          label="Formal Offers"
          value={offers.length}
          hint="Issued placement decisions"
          icon={Award}
        />
      </div>

      {/* Pipeline Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-px">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'applications'
              ? 'border-brand text-brand'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <FileText size={15} />
          <span>Applications ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interviews')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'interviews'
              ? 'border-brand text-brand'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Calendar size={15} />
          <span>Interviews ({interviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'offers'
              ? 'border-brand text-brand'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Award size={15} />
          <span>Offers ({offers.length})</span>
        </button>
      </div>

      {/* TAB 1: Applications */}
      {activeTab === 'applications' && (
        <>
          {applications.length === 0 ? (
            <EmptyState
              title="No Applications Submitted"
              description="You have not submitted applications to any campus placement drives yet."
              actionLabel="Explore Open Drives"
              onAction={() => navigate('/student/opportunities')}
            />
          ) : (
            <div className="rounded-xl border border-line bg-surface overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-canvas text-ink-muted uppercase tracking-wider text-[11px] h-10">
                    <th className="py-2.5 px-4 font-semibold">Position</th>
                    <th className="py-2.5 px-4 font-semibold">Recruiting Company</th>
                    <th className="py-2.5 px-4 font-semibold">Package</th>
                    <th className="py-2.5 px-4 font-semibold">Tier</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Applied Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {applications.map((app) => (
                    <tr key={app.application_id} className="h-12 hover:bg-canvas/50 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-ink">
                        <div className="font-semibold">{app.job_title}</div>
                        <div className="text-[10px] text-ink-muted font-mono">{app.job_id}</div>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-ink flex items-center gap-1.5 mt-3">
                        <Building2 size={13} className="text-brand shrink-0" />
                        <span>{app.company_name}</span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-success font-mono">
                        ₹{app.package_lpa} LPA
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge variant="neutral" size="xs">
                          {app.tier}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant={
                            app.status === 'Offered'
                              ? 'success'
                              : app.status === 'Shortlisted'
                              ? 'institutional'
                              : app.status === 'Rejected'
                              ? 'danger'
                              : 'neutral'
                          }
                          size="xs"
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-ink-muted font-mono text-[11px]">
                        {app.application_date
                          ? new Date(app.application_date).toLocaleDateString()
                          : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: Interviews */}
      {activeTab === 'interviews' && (
        <>
          {interviews.length === 0 ? (
            <EmptyState
              title="No Interviews Scheduled"
              description="You have no upcoming interview invitations at this time."
              actionLabel="Browse Open Drives"
              onAction={() => navigate('/student/opportunities')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviews.map((intv) => (
                <div
                  key={intv.interview_id}
                  className="p-5 rounded-xl border border-line bg-surface flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-sm font-bold text-ink">Round {intv.round} Evaluation</div>
                        <div className="text-xs text-ink-muted font-mono mt-0.5">JNF: {intv.job_id}</div>
                      </div>
                      <Badge
                        variant={intv.status === 'Completed' ? 'success' : 'institutional'}
                        size="xs"
                      >
                        {intv.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 py-3 border-y border-line my-2 text-xs">
                      <div className="flex items-center gap-2 text-ink">
                        <Clock size={14} className="text-brand shrink-0" />
                        <span className="font-medium">
                          {new Date(intv.scheduled_start).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-ink-muted text-[11px]">
                        <span className="font-semibold text-ink">Mode:</span> {intv.mode}
                      </div>
                      {intv.venue && (
                        <div className="flex items-center gap-2 text-ink-muted text-[11px]">
                          <span className="font-semibold text-ink">Venue:</span> {intv.venue}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
                    <span className="font-mono text-[10px]">ID: {intv.interview_id}</span>
                    <span className="text-[11px] font-medium text-brand">Institutional Schedule Locked</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 3: Placement Offers */}
      {activeTab === 'offers' && (
        <>
          {offers.length === 0 ? (
            <EmptyState
              title="No Placement Offers Yet"
              description="Final placement decisions and formal offer letters will appear here once released by recruiters."
            />
          ) : (
            <div className="space-y-4">
              {offers.map((off) => (
                <div
                  key={off.placement_id}
                  className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Award size={18} className="text-amber-500" />
                      <h4 className="text-sm font-bold text-ink">
                        {off.role || 'Campus Placement Offer'}
                      </h4>
                      <Badge
                        variant={
                          off.response_status === 'Accepted'
                            ? 'success'
                            : off.response_status === 'Declined'
                            ? 'danger'
                            : 'institutional'
                        }
                        size="xs"
                      >
                        {off.response_status || 'Decision Pending'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-bold text-success text-base">
                        ₹{off.package_lpa} LPA
                      </span>
                      <span className="text-ink-muted">&bull;</span>
                      <span className="text-ink-muted font-mono">Drive: {off.job_id}</span>
                      {off.placement_date && (
                        <>
                          <span className="text-ink-muted">&bull;</span>
                          <span className="text-ink-muted">
                            Issued: {new Date(off.placement_date).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Accept / Decline actions */}
                  <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                    {off.response_status ? (
                      <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface border border-line text-ink">
                        Status: <span className="text-brand">{off.response_status}</span>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={respondingOfferId === off.placement_id}
                          onClick={() => handleOfferResponse(off.placement_id, 'ACCEPT')}
                          leftIcon={<Check size={14} />}
                        >
                          <span>Accept Offer</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={respondingOfferId === off.placement_id}
                          onClick={() => handleOfferResponse(off.placement_id, 'DECLINE')}
                          leftIcon={<X size={14} className="text-red-500" />}
                        >
                          <span>Decline</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

