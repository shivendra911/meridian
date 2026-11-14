/**
 * PlaceFlow / Meridian — Student Applications & Offers Ledger (Phase 6).
 *
 * Implements candidate application tracking, interview schedules, and offer response actions.
 * Built with design-system ApplicationCard, InterviewCard, and OfferCard.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Award} from 'lucide-react';
import { toast } from 'sonner';
import {
  studentApi,
  StudentApplication,
  StudentInterview,
  StudentOffer} from '../api';
import {
  PageHeader,
  StatCard,
  Button,
  Skeleton,
  EmptyState,
  ApplicationCard,
  InterviewCard,
  OfferCard,
  useDocumentTitle} from '../../../ui';
import { ErrorState } from '../../../ui/ErrorState';

export const StudentApplicationsPage: React.FC = () => {
  useDocumentTitle('My Applications & Offers');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'applications' | 'interviews' | 'offers'>('applications');

  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [interviews, setInterviews] = useState<StudentInterview[]>([]);
  const [offers, setOffers] = useState<StudentOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [_respondingOfferId, setRespondingOfferId] = useState<string | null>(null);

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

  const handleOfferResponse = async (placementId: string, action: 'ACCEPT' | 'DECLINE') => {
    setRespondingOfferId(placementId);
    try {
      await studentApi.respondOffer(placementId, action);
      toast.success(
        action === 'ACCEPT'
          ? 'Congratulations! Placement offer officially accepted.'
          : 'Placement offer declined.'
      );
      await loadPipeline();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit response.');
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
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadPipeline} />;
  }

  const activeInterviews = interviews.filter((i) => i.status !== 'Completed');

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Application & Decision Ledger"
        description="Status of active drive applications, evaluation stages, and employment offers."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/opportunities')}
          >
            Explore Open Drives
          </Button>
        }
      />

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Submitted Applications"
          value={applications.length}
          hint="Total drive submissions"
          icon={FileText}
        />
        <StatCard
          label="Active Interview Rounds"
          value={activeInterviews.length}
          hint={`${interviews.length} total scheduled`}
          icon={Calendar}
        />
        <StatCard
          label="Placement Offers"
          value={offers.length}
          hint={offers.length > 0 ? 'Action required' : 'Awaiting decisions'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.map((app) => (
                <ApplicationCard
                  key={app.application_id}
                  data={{
                    application_id: app.application_id,
                    role: app.job_title,
                    company_name: app.company_name,
                    stage: app.status,
                    applied_at: app.application_date,
                    last_update: app.application_date ? new Date(app.application_date).toLocaleDateString() : 'Active',
                  }}
                />
              ))}
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
                <InterviewCard
                  key={intv.interview_id}
                  data={{
                    interview_id: intv.interview_id,
                    role: intv.role || 'Software Engineering Evaluation',
                    company_name: intv.company_name || 'Campus Recruiter',
                    round_name: `Round ${intv.round}`,
                    scheduled_start: intv.scheduled_start,
                    scheduled_end: intv.scheduled_end,
                    mode: intv.mode,
                    venue_or_link: intv.venue_or_link || intv.venue,
                    interviewer_name: intv.interviewer,
                  }}
                  onJoin={
                    (intv.venue_or_link || intv.venue)?.startsWith('http')
                      ? () => window.open(intv.venue_or_link || intv.venue, '_blank')
                      : undefined
                  }
                />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((off) => (
                <OfferCard
                  key={off.placement_id}
                  data={{
                    offer_id: off.placement_id,
                    role: off.role || 'Campus Placement Offer',
                    company_name: off.job_id || 'Recruiting Partner',
                    package_lpa: off.package_lpa,
                    respond_by: new Date(Date.now() + 24 * 3600 * 1000 * 7),
                    status: off.response_status ? off.response_status.toUpperCase() : 'PENDING',
                  }}
                  onAccept={() => handleOfferResponse(off.placement_id, 'ACCEPT')}
                  onDecline={() => handleOfferResponse(off.placement_id, 'DECLINE')}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
