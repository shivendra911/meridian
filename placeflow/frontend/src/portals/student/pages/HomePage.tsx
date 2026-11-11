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
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckSquare,
} from 'lucide-react';
import { studentApi, StudentProfile, StudentOpportunity, StudentInterview, StudentApplication } from '../api';
import {
  PageHeader,
  StatCard,
  Card,
  Badge,
  Skeleton,
  Button,
  DriveCard,
  InterviewCard,
  TaskCard,
  useDocumentTitle,
} from '../../../ui';
import { ErrorState } from '../../../ui/ErrorState';

export const StudentHomePage: React.FC = () => {
  useDocumentTitle('Student Workspace');
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [opportunities, setOpportunities] = useState<StudentOpportunity[]>([]);
  const [interviews, setInterviews] = useState<StudentInterview[]>([]);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profData, oppData, intData, appData] = await Promise.all([
        studentApi.getMe(),
        studentApi.getOpportunities(),
        studentApi.getInterviews(),
        studentApi.getApplications(),
      ]);
      setProfile(profData);
      setOpportunities(oppData || []);
      setInterviews(intData || []);
      setApplications(appData || []);
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

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        title={`Welcome back, ${profile?.name || 'Candidate'}`}
        description="Your personal campus-to-career hub. Track job notifications, eligibility, and interviews."
        badge={<Badge variant="institutional" size="xs">Live Registry</Badge>}
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
          <TaskCard
            data={{
              task_id: 'task_profile',
              title: 'Review verified academic profile & add skills',
              due: new Date(Date.now() + 24 * 3600 * 1000 * 3),
              priority: 'MEDIUM',
              icon: ShieldCheck,
              action_label: 'Review Profile',
            }}
            onAction={() => navigate('/account/profile')}
          />

          {nextInterview ? (
            <TaskCard
              data={{
                task_id: 'task_interview',
                title: `Prepare for Round ${nextInterview.round}: ${nextInterview.company_name || 'Partner Company'}`,
                due: nextInterview.scheduled_start,
                priority: 'HIGH',
                icon: Clock,
                action_label: 'View Slot Details',
              }}
              onAction={() => {
                const el = document.getElementById('upcoming-interview-slot');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          ) : eligibleJobs.length > 0 ? (
            <TaskCard
              data={{
                task_id: 'task_eligible',
                title: `Apply to ${eligibleJobs[0].company_name} - ${eligibleJobs[0].title}`,
                due: eligibleJobs[0].deadline || new Date(Date.now() + 24 * 3600 * 1000 * 2),
                priority: 'HIGH',
                icon: Compass,
                action_label: 'Inspect Drive',
              }}
              onAction={() => navigate('/student/opportunities')}
            />
          ) : (
            <TaskCard
              data={{
                task_id: 'task_all_clear',
                title: 'All recruitment actions up to date',
                due: null,
                priority: 'LOW',
                icon: CheckCircle2,
                action_label: 'Browse Catalog',
              }}
              onAction={() => navigate('/student/opportunities')}
            />
          )}

          <TaskCard
            data={{
              task_id: 'task_dpdp',
              title: 'Verify recruiter visibility and DPDP consents',
              due: null,
              priority: 'LOW',
              icon: FileText,
              action_label: 'Privacy Settings',
            }}
            onAction={() => navigate('/account/privacy')}
          />
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
                role: nextInterview.role || 'Software Engineering Candidate',
                company_name: nextInterview.company_name || 'Partner Recruiter',
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand" />
              Recommended Campus Opportunities
            </h3>
            <p className="text-xs text-ink-muted">
              Live recruitment drives matching your academic criteria and discipline.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/opportunities')}>
            <span>View All ({opportunities.length})</span>
            <Compass size={13} className="ml-1" />
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
