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

import React, { useState, useEffect } from 'react';
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
  useDocumentTitle} from '../../../ui';
import { ErrorState } from '../../../ui/ErrorState';

export const StudentHomePage: React.FC = () => {
  useDocumentTitle('Student Workspace');
  const navigate = useNavigate();

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
      const [profData, oppData, intData, appData, conData, offData] = await Promise.all([
        studentApi.getMe(),
        studentApi.getOpportunities(),
        studentApi.getInterviews(),
        studentApi.getApplications(),
        studentApi.getConsents().catch(() => []),
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

      {/* 1. "What Needs Me Now" Actionable Task Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} className="text-brand" />
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
            What Needs Me Now
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actionableTasks.slice(0, 3).map((task) => (
            <TaskCard
              key={task.task_id}
              data={{
                task_id: task.task_id,
                title: task.title,
                due: task.due,
                priority: task.priority,
                icon: task.icon,
                action_label: task.action_label,
              }}
              onAction={task.action}
            />
          ))}
        </div>
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
