/**
 * PlaceFlow / Meridian — Student Portal Home (Phase 5).
 *
 * Implements authoritative candidate dashboard:
 * - Eligibility summary & VTI tier entitlement
 * - Next interview / drive deadline alert
 * - Recruitment pipeline stepper
 * - Recommended opportunities with server-computed eligibility explanation
 * - 5 states: loading, empty, error, forbidden, populated.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  FileText,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { studentApi, StudentProfile, StudentOpportunity, StudentInterview, StudentApplication } from '../api';
import { PageHeader, StatCard, Card, Badge, Skeleton, Button } from '../../../ui';
import { ErrorState } from '../../../ui/ErrorState';

export const StudentHomePage: React.FC = () => {
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
    <div className="space-y-6 font-sans">
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

      {/* KPI Cards */}
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

      {/* Next Milestone Banner */}
      {nextInterview ? (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-950">
                Upcoming Interview: Round {nextInterview.round} ({nextInterview.mode})
              </div>
              <div className="text-[11px] text-blue-700">
                Scheduled for {new Date(nextInterview.scheduled_start).toLocaleString()} &bull; Venue: {nextInterview.venue || 'Online Portal'}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/applications')}
          >
            View Pipeline
          </Button>
        </div>
      ) : null}

      {/* Pipeline Stepper Card */}
      <Card title="Recruitment Pipeline Progression" subtitle="Stage-by-stage status of your placement journey">
        <div className="py-2">
          <div className="flex items-center justify-between text-xs font-semibold text-ink mb-2">
            <span className={applications.length > 0 ? 'text-brand' : 'text-ink-muted'}>1. Applied ({applications.length})</span>
            <span className="text-slate-300">&rarr;</span>
            <span className={applications.some((a) => a.status === 'Shortlisted') ? 'text-brand' : 'text-ink-muted'}>
              2. Shortlisted ({applications.filter((a) => a.status === 'Shortlisted').length})
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span className={interviews.length > 0 ? 'text-brand' : 'text-ink-muted'}>3. Interviews ({interviews.length})</span>
            <span className="text-slate-300">&rarr;</span>
            <span className={offeredCount > 0 ? 'text-emerald-600 font-bold' : 'text-ink-muted'}>4. Offered ({offeredCount})</span>
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

      {/* Recommended Drives with Server-Computed Reasons */}
      <div className="space-y-3">
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
            <ArrowRight size={13} />
          </Button>
        </div>

        {opportunities.length === 0 ? (
          <div className="p-8 border border-line bg-surface rounded-xl text-center text-xs text-ink-muted">
            No campus placement drives are currently open. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.slice(0, 4).map((job) => (
              <div
                key={job.job_id}
                onClick={() => navigate('/student/opportunities')}
                className="p-4 rounded-xl border border-line bg-surface hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="text-xs font-semibold text-ink line-clamp-1">{job.title}</div>
                      <div className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                        <Building2 size={12} className="shrink-0" />
                        <span>{job.company_name}</span>
                      </div>
                    </div>
                    <Badge variant={job.eligible ? 'success' : 'neutral'} size="xs">
                      {job.eligible ? 'Eligible' : 'Not Eligible'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs mt-2">
                    <span className="font-semibold text-success font-mono">₹{job.package_lpa} LPA</span>
                    <span className="text-ink-muted">&bull;</span>
                    <span className="text-ink-muted font-mono">{job.tier}</span>
                    <span className="text-ink-muted">&bull;</span>
                    <span className="text-ink-muted">{job.vacancies} vacancies</span>
                  </div>

                  {/* Server-computed eligibility reason */}
                  {!job.eligible && job.reasons && job.reasons.length > 0 && (
                    <div className="mt-2.5 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                      <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-600" />
                      <span>{job.reasons[0]}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                  <span className="text-[11px] text-ink-muted">
                    {job.has_applied ? 'Applied' : 'Not yet applied'}
                  </span>
                  <span className="text-brand font-medium inline-flex items-center gap-1 group-hover:underline">
                    <span>Inspect</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
