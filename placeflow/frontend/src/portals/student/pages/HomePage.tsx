/**
 * PlaceFlow / Meridian — Student Portal Home (Phase 6).
 *
 * Implements "What needs me now" candidate command center:
 * - Actionable TaskCards (verification, interviews, deadlines)
 * - Authoritative KPIs with StatCard
 * - InterviewCard for scheduled rounds
 * - DriveCards for recommended campus drives
 * - Completely eliminates ad-hoc markup.
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  FileText,
  Clock,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Award,
} from 'lucide-react';
import {
  studentApi,
  StudentProfile,
  StudentOpportunity,
  StudentInterview,
  StudentApplication,
  StudentConsent,
  StudentOffer,
} from '../api';
import {
  PageHeader,
  StatCard,
  Card,
  Skeleton,
  Button,
  DriveCard,
  InterviewCard,
  TaskCard,
  CompanyMark,
  formatDate,
  formatDateTime,
  formatRelative,
  useDocumentTitle} from '../../../ui';
import { ErrorState } from '../../../ui/ErrorState';
import { AuthContext } from '../../../core/auth/AuthProvider';

export const StudentHomePage: React.FC = () => {
  useDocumentTitle('Student Workspace');
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const canConsent = auth ? (auth.can('consent.grant.record') || auth.can('consent.withdraw.process')) : true;

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [opportunities, setOpportunities] = useState<StudentOpportunity[]>([]);
  const [interviews, setInterviews] = useState<StudentInterview[]>([]);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [offers, setOffers] = useState<StudentOffer[]>([]);
  const [consents, setConsents] = useState<StudentConsent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const conPromise = canConsent ? studentApi.getConsents().catch(() => []) : Promise.resolve([]);
      const [profData, oppData, intData, appData, conData, offData] = await Promise.all([
        studentApi.getMe(),
        studentApi.getOpportunities(),
        studentApi.getInterviews(),
        studentApi.getApplications(),
        conPromise,
        studentApi.getOffers().catch(() => []),
      ]);
      setProfile(profData);
      setOpportunities(oppData || []);
      setInterviews(intData || []);
      setApplications(appData || []);
      setConsents(conData || []);
      setOffers(offData || []);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadDashboard} />;
  }

  const eligibleJobs = opportunities.filter((j) => j.eligible);
  const nextInterview = interviews.find((i) => i.status !== 'Completed' && i.status !== 'Cancelled');
  const offeredCount = applications.filter((a) => a.status === 'Offered' || a.status === 'Accepted').length;

  // Derive actionable tasks directly from student's live records
  const pendingOffer = offers.find((o) => !o.response_status || o.response_status === null);
  const pendingConsent = consents.find((c) => c.status === 'PENDING');
  const needsProfileUpdate = !profile?.skills || profile.skills.length === 0;
  const unappliedEligible = eligibleJobs.filter((j) => !j.has_applied);

  const actionableTasks: Array<{
    task_id: string;
    title: string;
    due?: string | Date | null;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    icon: any;
    action_label: string;
    action: () => void;
  }> = [];

  if (pendingOffer) {
    actionableTasks.push({
      task_id: `offer_${pendingOffer.placement_id}`,
      title: `Respond to placement offer from ${pendingOffer.role || 'Corporate Partner'} (${pendingOffer.package_lpa} LPA)`,
      due: null,
      priority: 'HIGH',
      icon: Award,
      action_label: 'Review Offer',
      action: () => navigate('/student/applications'),
    });
  }

  if (nextInterview) {
    actionableTasks.push({
      task_id: `interview_${nextInterview.interview_id}`,
      title: `Prepare for Round ${nextInterview.round}: ${nextInterview.company_name ? `${nextInterview.company_name} (${nextInterview.role || 'Interview'})` : nextInterview.role || 'Interview Round'}`,
      due: nextInterview.scheduled_start,
      priority: 'HIGH',
      icon: Clock,
      action_label: 'View Slot Details',
      action: () => {
        const el = document.getElementById('upcoming-interview-slot');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    });
  }

  if (unappliedEligible.length > 0) {
    actionableTasks.push({
      task_id: `eligible_${unappliedEligible[0].job_id}`,
      title: `Apply to ${unappliedEligible[0].company_name} — ${unappliedEligible[0].title}`,
      due: unappliedEligible[0].deadline || null,
      priority: unappliedEligible[0].tier === 'SUPER_DREAM' || unappliedEligible[0].tier === 'DREAM' ? 'HIGH' : 'MEDIUM',
      icon: Compass,
      action_label: 'Inspect Drive',
      action: () => navigate('/student/opportunities'),
    });
  }

  if (needsProfileUpdate) {
    actionableTasks.push({
      task_id: 'task_profile_skills',
      title: 'Complete candidate dossier: add verified technical skills & projects',
      due: null,
      priority: 'MEDIUM',
      icon: ShieldCheck,
      action_label: 'Update Skills',
      action: () => navigate('/student/profile'),
    });
  }

  if (pendingConsent) {
    actionableTasks.push({
      task_id: `consent_${pendingConsent.purpose}`,
      title: `Review pending data privacy disclosure consent (${pendingConsent.purpose_title || pendingConsent.purpose})`,
      due: null,
      priority: 'LOW',
      icon: FileText,
      action_label: 'Review Consents',
      action: () => navigate('/student/profile'),
    });
  }

  if (actionableTasks.length === 0) {
    actionableTasks.push({
      task_id: 'task_all_clear',
      title: 'All recruitment actions up to date. Explore active campus drives.',
      due: null,
      priority: 'LOW',
      icon: CheckCircle2,
      action_label: 'Browse Catalog',
      action: () => navigate('/student/opportunities'),
    });
  }

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        title={`Welcome back, ${profile?.name || 'Candidate'}`}
        description="Your personal campus-to-career hub. Track job notifications, eligibility, and interviews."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/student/opportunities')}
            leftIcon={<Compass size={14} />}
          >
            Explore Opportunities
          </Button>
        }
      />

      {/* 0. Lead with "Next Step" Focal Card */}
      <div className="rounded-xl border border-brand/20 bg-linear-to-r from-surface to-brand/5 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {nextInterview ? (
              <div className="h-10 w-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            ) : unappliedEligible[0] ? (
              <CompanyMark name={unappliedEligible[0].company_name} size="md" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                  Next Step
                </span>
                {nextInterview && nextInterview.scheduled_start && (
                  <span className="rounded-full bg-brand/10 text-brand px-2 py-0.5 text-[11px] font-semibold">
                    {formatRelative(nextInterview.scheduled_start)}
                  </span>
                )}
              </div>

              {nextInterview ? (
                <>
                  <h3 className="text-base font-bold text-ink mt-0.5 m-0">
                    {nextInterview.company_name} · Round {nextInterview.round} ({nextInterview.role || 'Interview'})
                  </h3>
                  <p className="text-xs text-ink-muted mt-1 m-0">
                    {formatDateTime(nextInterview.scheduled_start)}
                    {nextInterview.venue_or_link ? ` · ${nextInterview.venue_or_link}` : ` · ${nextInterview.mode}`}
                  </p>
                </>
              ) : unappliedEligible[0] ? (
                <>
                  <h3 className="text-base font-bold text-ink mt-0.5 m-0">
                    Apply to {unappliedEligible[0].company_name} — {unappliedEligible[0].title}
                  </h3>
                  <p className="text-xs text-ink-muted mt-1 m-0">
                    ₹{unappliedEligible[0].package_lpa} LPA · {unappliedEligible[0].tier}
                    {unappliedEligible[0].deadline ? ` · Closes ${formatDate(unappliedEligible[0].deadline)}` : ''}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-base font-bold text-ink mt-0.5 m-0">
                    All caught up! Profile & applications in good standing.
                  </h3>
                  <p className="text-xs text-ink-muted mt-1 m-0">
                    Check back regularly for new campus drive postings.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {nextInterview ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const el = document.getElementById('upcoming-interview-slot');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigate('/student/applications');
                }}
              >
                View slot details
              </Button>
            ) : unappliedEligible[0] ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/student/opportunities')}
              >
                Apply now
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/student/opportunities')}
              >
                Explore drives
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 1. "What Needs Me Now" Actionable Task Cards — Focal First Card */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} className="text-brand" />
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
            What Needs Me Now
          </h2>
        </div>

        {actionableTasks.length > 0 && (
          <div className="space-y-3">
            {/* Focal item: First TaskCard spans full width */}
            <TaskCard
              data={actionableTasks[0]}
              onAction={actionableTasks[0].action}
              className="w-full shadow-xs"
            />
            {actionableTasks.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {actionableTasks.slice(1, 3).map((task) => (
                  <TaskCard
                    key={task.task_id}
                    data={task}
                    onAction={task.action}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Placement Standing"
          value={profile?.placement_status || 'Eligible'}
          hint={`Tier: ${profile?.tier_entitlement || 'All Tiers'}`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Eligible Drives"
          value={eligibleJobs.length}
          hint={`${opportunities.length} total active drives`}
          icon={Compass}
        />
        <StatCard
          label="Active Applications"
          value={applications.length}
          hint={`${offeredCount} offers received`}
          icon={FileText}
        />
        <StatCard
          label="Upcoming Interviews"
          value={interviews.length}
          hint={nextInterview ? 'Next round scheduled' : 'None scheduled'}
          icon={Clock}
        />
      </div>

      {/* 3. Upcoming Interview Slot Card */}
      {nextInterview && (
        <div id="upcoming-interview-slot" className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-brand" />
            <h3 className="text-sm font-bold text-ink">Upcoming Scheduled Interview</h3>
          </div>
          <div className="max-w-xl">
            <InterviewCard
              data={{
                interview_id: nextInterview.interview_id,
                role: nextInterview.role || '',
                company_name: nextInterview.company_name || '',
                round_name: `Round ${nextInterview.round}`,
                scheduled_start: nextInterview.scheduled_start,
                scheduled_end: nextInterview.scheduled_end,
                mode: nextInterview.mode,
                venue_or_link: nextInterview.venue_or_link,
                interviewer_name: nextInterview.interviewer,
              }}
              onJoin={
                nextInterview.venue_or_link?.startsWith('http')
                  ? () => window.open(nextInterview.venue_or_link, '_blank')
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {/* 4. Recruitment Pipeline Progress Stepper */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Recruitment Journey Pipeline</h3>
            <span className="text-xs text-ink-muted">
              {applications.length} active process{applications.length === 1 ? '' : 'es'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-medium">
            <span className={applications.length > 0 ? 'text-brand font-bold' : 'text-ink-muted'}>
              1. Applied ({applications.length})
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span className={applications.some((a) => a.status === 'Shortlisted') ? 'text-brand font-bold' : 'text-ink-muted'}>
              2. Shortlisted ({applications.filter((a) => a.status === 'Shortlisted').length})
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span className={interviews.length > 0 ? 'text-brand font-bold' : 'text-ink-muted'}>
              3. Interviews ({interviews.length})
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span className={offeredCount > 0 ? 'text-emerald-600 font-bold' : 'text-ink-muted'}>
              4. Offered ({offeredCount})
            </span>
          </div>
          <div className="w-full bg-line rounded-full h-2 overflow-hidden">
            <div
              className="bg-brand h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  offeredCount > 0 ? 100 : interviews.length > 0 ? 75 : applications.length > 0 ? 35 : 10
                }%`,
              }}
            />
          </div>
        </div>
      </Card>

      {/* 5. Recommended Drives Built with DriveCard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand" />
              Recommended Campus Opportunities
            </h3>
            <p className="text-xs text-ink-muted">
              Live recruitment drives matching your academic criteria and discipline.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 whitespace-nowrap flex items-center gap-1"
            rightIcon={<Compass size={13} />}
            onClick={() => navigate('/student/opportunities')}
          >
            View All ({opportunities.length})
          </Button>
        </div>

        {opportunities.length === 0 ? (
          <div className="p-8 border border-line bg-surface rounded-xl text-center text-xs text-ink-muted">
            No campus placement drives are currently open. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.slice(0, 4).map((job) => (
              <DriveCard
                key={job.job_id}
                data={{
                  drive_id: job.job_id,
                  job_id: job.job_id,
                  company_name: job.company_name,
                  role: job.title,
                  tier: job.tier,
                  package_lpa: job.package_lpa,
                  deadline: job.deadline,
                  eligible: job.eligible,
                  ineligibility_reason: !job.eligible && job.reasons?.length ? job.reasons[0] : null,
                  applied: job.has_applied,
                }}
                onClick={() => navigate('/student/opportunities')}
                onApply={() => navigate('/student/opportunities')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
