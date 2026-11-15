import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Sliders,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  studentApi,
  StudentProfile,
  StudentOpportunity,
  StudentInterview,
  StudentApplication,
  StudentConsent,
  StudentOffer,
  PlacementReadiness,
} from '../api';
import {
  Skeleton,
  Button,
  Badge,
  Avatar,
  Spine,
  SpineStage,
  useDocumentTitle,
  CompanyMark,
} from '../../../ui';
import { ErrorState } from '../../../ui/ErrorState';
import { AuthContext } from '../../../core/auth/AuthProvider';
import { HeroInterview } from '../components/HeroInterview';
import { HeroOffer } from '../components/HeroOffer';
import { HeroPreparing } from '../components/HeroPreparing';
import { HeroEligible } from '../components/HeroEligible';
import { StateBlock } from '../../../ui/StateBlock';

export const StudentHomePage: React.FC = () => {
  useDocumentTitle('Candidate Journey');
  const navigate = useNavigate();
  const { onOpenCopilot } = useOutletContext<{ onOpenCopilot?: () => void }>() || {};
  const auth = useContext(AuthContext);
  const canConsent = auth ? (auth.can('consent.grant.record') || auth.can('consent.withdraw.process')) : true;

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [opportunities, setOpportunities] = useState<StudentOpportunity[]>([]);
  const [interviews, setInterviews] = useState<StudentInterview[]>([]);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [offers, setOffers] = useState<StudentOffer[]>([]);
  const [_consents, setConsents] = useState<StudentConsent[]>([]);
  const [readiness, setReadiness] = useState<PlacementReadiness | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadJourney = async () => {
    setLoading(true);
    setError(null);
    try {
      const conPromise = canConsent ? studentApi.getConsents().catch(() => []) : Promise.resolve([]);
      const [profData, oppData, intData, appData, conData, offData, readyData] = await Promise.all([
        studentApi.getMe(),
        studentApi.getOpportunities(),
        studentApi.getInterviews(),
        studentApi.getApplications(),
        conPromise,
        studentApi.getOffers().catch(() => []),
        studentApi.getReadinessInsights().catch(() => null),
      ]);
      setProfile(profData);
      setOpportunities(oppData || []);
      setInterviews(intData || []);
      setApplications(appData || []);
      setConsents(conData || []);
      setOffers(offData || []);
      setReadiness(readyData);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJourney();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 font-sans max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-[24px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadJourney} />;
  }

  const eligibleJobs = opportunities.filter((j) => j.eligible);
  const unappliedEligible = eligibleJobs.filter((j) => !j.has_applied);
  const nextInterview = interviews.find((i) => i.status !== 'Completed' && i.status !== 'Cancelled');
  const pendingOffer = offers.find((o) => !o.response_status || o.response_status === null);
  const acceptedOffer = offers.find((o) => o.response_status === 'Accepted');
  const needsProfileUpdate = !profile?.skills || profile.skills.length === 0;

  // Determine Overall Journey Stage for the Spine
  let currentStageId: 'eligible' | 'applied' | 'interview' | 'offer' | 'joined' = 'eligible';
  if (acceptedOffer) {
    currentStageId = 'joined';
  } else if (pendingOffer || offers.length > 0) {
    currentStageId = 'offer';
  } else if (nextInterview || interviews.length > 0) {
    currentStageId = 'interview';
  } else if (applications.length > 0) {
    currentStageId = 'applied';
  }

  const STAGE_KEYS = ['eligible', 'applied', 'interview', 'offer', 'joined'] as const;
  const currentStageIdx = STAGE_KEYS.indexOf(currentStageId);

  const mainJourneyStages: SpineStage[] = [
    { id: 'eligible', label: 'Eligible', status: currentStageIdx > 0 ? 'completed' : currentStageIdx === 0 ? 'current' : 'upcoming' },
    { id: 'applied', label: 'Applied', status: currentStageIdx > 1 ? 'completed' : currentStageIdx === 1 ? 'current' : 'upcoming' },
    { id: 'interview', label: 'Interview', status: currentStageIdx > 2 ? 'completed' : currentStageIdx === 2 ? 'current' : 'upcoming' },
    { id: 'offer', label: 'Offer', status: currentStageIdx > 3 ? 'completed' : currentStageIdx === 3 ? 'current' : 'upcoming' },
    { id: 'joined', label: 'Joined', status: currentStageIdx === 4 ? 'current' : 'upcoming' },
  ];

  const displayName = profile?.name || auth?.me?.display_name || 'Candidate';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto pb-6">
      {/* 1. Header Greeting Row: "Good morning, Aarav" + Avatar */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight m-0 font-display">
            Good morning, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-0.5 m-0">
            {currentStageId === 'joined'
              ? 'Congratulations on your campus placement offer!'
              : currentStageId === 'offer'
              ? 'You have an official placement offer awaiting response.'
              : currentStageId === 'interview'
              ? 'Your upcoming interview round is scheduled.'
              : currentStageId === 'applied'
              ? 'Recruitment shortlists are currently under evaluation.'
              : 'Explore active campus recruitment drives.'}
          </p>
        </div>

        <Avatar
          name={displayName}
          src={(profile as any)?.avatar_url || auth?.me?.profile?.avatar_url}
          size={40}
          className="shadow-xs cursor-pointer hover:ring-2 hover:ring-brand/30 transition-all"
          onClick={() => navigate('/student/profile')}
        />
      </div>

      {/* 2. The Universal Journey Spine device (Eligible - Applied - Interview - Offer - Joined) */}
      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="font-bold text-ink uppercase tracking-wider text-[11px]">
            Placement Season 2026 Journey
          </span>
          <span className="font-semibold text-brand">
            Stage {currentStageIdx + 1} of 5
          </span>
        </div>
        <Spine stages={mainJourneyStages} size="md" />
      </div>

      {/* 3. State-Aware Hero Block */}
      {nextInterview ? (
        <HeroInterview
          interview={nextInterview}
          onJoin={
            nextInterview.venue_or_link?.startsWith('http')
              ? () => window.open(nextInterview.venue_or_link, '_blank')
              : undefined
          }
          onOpenCopilot={onOpenCopilot}
        />
      ) : pendingOffer ? (
        <HeroOffer
          offer={pendingOffer}
          onAccept={() => navigate('/student/applications')}
          onDecline={() => navigate('/student/applications')}
          onOpenCopilot={onOpenCopilot}
        />
      ) : needsProfileUpdate ? (
        <HeroPreparing
          profile={profile}
          onCompleteProfile={() => navigate('/student/profile')}
          onOpenCopilot={onOpenCopilot}
        />
      ) : unappliedEligible.length > 0 ? (
        <HeroEligible
          topOpportunity={unappliedEligible[0]}
          eligibleCount={eligibleJobs.length}
          onExplore={() => navigate('/student/opportunities')}
          onApply={() => navigate('/student/opportunities')}
          onOpenCopilot={onOpenCopilot}
        />
      ) : (
        <StateBlock variant="paper" className="space-y-3">
          <div className="flex items-center gap-2 text-success font-semibold text-xs">
            <Sparkles size={15} /> All recruitment milestones up to date
          </div>
          <h2 className="text-xl font-bold text-ink m-0 font-display">
            You are fully prepared for upcoming campus drives
          </h2>
          <p className="text-xs text-ink-muted m-0">
            Keep revising foundational concepts and check back regularly as corporate recruiters publish schedules.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              pill
              size="sm"
              onClick={() => navigate('/student/opportunities')}
            >
              Browse Active Drives
            </Button>
          </div>
        </StateBlock>
      )}

      {/* 4. Compact Contextual Quick Jump Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => navigate('/student/opportunities')}
          className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-surface hover:bg-canvas text-left transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            <div>
              <p className="text-xs font-bold text-ink m-0 group-hover:text-brand">
                {opportunities.filter((o) => o.deadline).length} drives close this week
              </p>
              <p className="text-[11px] text-ink-muted m-0">
                Review deadlines & submit applications
              </p>
            </div>
          </div>
          <ArrowRight size={15} className="text-ink-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/student/opportunities')}
          className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-surface hover:bg-canvas text-left transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-ink m-0 group-hover:text-brand">
                You qualify for {eligibleJobs.length} drives
              </p>
              <p className="text-[11px] text-ink-muted m-0">
                Matched to your CGPA and branch
              </p>
            </div>
          </div>
          <ArrowRight size={15} className="text-ink-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* 4.5. Placement Predictive Intelligence & What-If Gateway (ML-01 & ML-05) */}
      {readiness?.opted_out ? (
        <div className="p-4 rounded-2xl border border-line bg-surface text-ink-muted flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-600 shrink-0" />
            <span>Automated ML profiling is opted out. Standard academic cutoffs apply.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/student/profile')}
            className="text-xs font-semibold text-brand hover:underline shrink-0"
          >
            Privacy Settings
          </button>
        </div>
      ) : readiness ? (
        <div className="p-5 rounded-2xl border border-line bg-surface shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold">
                <TrendingUp size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink m-0">
                  Career Readiness &amp; Indicative Package
                </h3>
                <p className="text-[11px] text-ink-muted m-0">
                  ML-01 statistical model • 80% conformal package band
                </p>
              </div>
            </div>

            <Button
              variant="now"
              pill
              size="sm"
              onClick={() => navigate('/student/what-if')}
              leftIcon={<Sliders size={13} />}
              rightIcon={<ArrowRight size={13} />}
            >
              What-If Simulator
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-canvas border border-line">
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-1">
                Placement Likelihood
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-brand font-display">
                  {readiness.placement_probability ?? 0}%
                </span>
                <Badge
                  variant={
                    readiness.readiness_band === 'READY'
                      ? 'success'
                      : readiness.readiness_band === 'MODERATE'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="xs"
                >
                  {readiness.readiness_band?.replace('_', ' ') || 'CALCULATING'}
                </Badge>
              </div>
              <div className="w-full bg-line rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-brand h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, readiness.placement_probability ?? 0))}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-canvas border border-line">
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-1">
                Indicative Package
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-ink font-display">
                  ₹{readiness.expected_package_lpa ?? '--'}
                </span>
                <span className="text-xs text-ink-muted font-medium">LPA</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-2 m-0">
                80% conformal prediction interval
              </p>
            </div>

            <div className="p-3 rounded-xl bg-canvas border border-line">
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-1">
                Qualified Drives
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-700 font-display">
                  {eligibleJobs.length}
                </span>
                <span className="text-xs text-ink-muted font-medium">of {opportunities.length} active</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-2 m-0">
                100% deterministic rule verification
              </p>
            </div>
          </div>

          {readiness.drivers && readiness.drivers.length > 0 && (
            <div className="pt-1">
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">
                Key Career Readiness Drivers
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {readiness.drivers.slice(0, 4).map((drv, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-canvas border border-line text-xs flex items-start gap-2"
                  >
                    {drv.impact === 'POSITIVE' ? (
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : drv.impact === 'NEGATIVE' ? (
                      <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Sparkles size={13} className="text-brand shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-ink">{drv.feature}: </span>
                      <span className="text-ink-muted">{drv.explanation || drv.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* 5. "Your applications" Section with Spine per application */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
            Your Applications ({applications.length})
          </h2>
          {applications.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/student/opportunities')}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Explore more drives
            </button>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="p-8 border border-line bg-surface rounded-2xl text-center">
            <Compass className="w-8 h-8 text-ink-muted mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-ink m-0">No active applications yet</h3>
            <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
              Explore open campus opportunities and apply before deadlines close.
            </p>
            <div className="mt-4">
              <Button
                variant="now"
                pill
                size="sm"
                onClick={() => navigate('/student/opportunities')}
              >
                Explore Opportunities
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const appStages: SpineStage[] = [
                {
                  id: 'applied',
                  label: 'Applied',
                  status:
                    app.status === 'Applied'
                      ? 'current'
                      : 'completed',
                },
                {
                  id: 'shortlisted',
                  label: 'Shortlisted',
                  status:
                    app.status === 'Shortlisted'
                      ? 'current'
                      : app.status === 'Interview' || app.status === 'Offered' || app.status === 'Accepted'
                      ? 'completed'
                      : 'upcoming',
                },
                {
                  id: 'interview',
                  label: 'Interview',
                  status:
                    app.status === 'Interview'
                      ? 'current'
                      : app.status === 'Offered' || app.status === 'Accepted'
                      ? 'completed'
                      : 'upcoming',
                },
                {
                  id: 'offer',
                  label: 'Offer',
                  status:
                    app.status === 'Offered' || app.status === 'Accepted'
                      ? 'current'
                      : 'upcoming',
                },
              ];

              return (
                <div
                  key={app.application_id}
                  onClick={() => navigate('/student/opportunities')}
                  className="p-4 sm:p-5 rounded-2xl border border-line bg-surface shadow-xs hover:border-brand/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <CompanyMark name={app.company_name} size="md" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-ink m-0 group-hover:text-brand truncate">
                          {app.company_name} · {app.job_title}
                        </h3>
                        <p className="text-xs text-ink-muted m-0">
                          {app.status === 'Shortlisted'
                            ? 'Shortlist published by the placement office, 2 h ago'
                            : app.status === 'Interview'
                            ? 'Interview round scheduled by coordinator'
                            : app.status === 'Offered'
                            ? 'Congratulations! Placement offer extended'
                            : 'Application received and under review'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                        app.status === 'Offered' || app.status === 'Accepted'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : app.status === 'Interview'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : app.status === 'Shortlisted'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-canvas text-ink-muted border border-line'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  {/* Stage Spine */}
                  <div className="pt-2 px-1 border-t border-line/40">
                    <Spine stages={appStages} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const StudentJourneyPage = StudentHomePage;
export default StudentHomePage;
