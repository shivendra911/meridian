import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Sparkles,
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
  Skeleton,
  Button,
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
  const auth = useContext(AuthContext);
  const canConsent = auth ? (auth.can('consent.grant.record') || auth.can('consent.withdraw.process')) : true;

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [opportunities, setOpportunities] = useState<StudentOpportunity[]>([]);
  const [interviews, setInterviews] = useState<StudentInterview[]>([]);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [offers, setOffers] = useState<StudentOffer[]>([]);
  const [_consents, setConsents] = useState<StudentConsent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadJourney = async () => {
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
        />
      ) : pendingOffer ? (
        <HeroOffer
          offer={pendingOffer}
          onAccept={() => navigate('/student/applications')}
          onDecline={() => navigate('/student/applications')}
        />
      ) : needsProfileUpdate ? (
        <HeroPreparing
          profile={profile}
          onCompleteProfile={() => navigate('/student/profile')}
        />
      ) : unappliedEligible.length > 0 ? (
        <HeroEligible
          topOpportunity={unappliedEligible[0]}
          eligibleCount={eligibleJobs.length}
          onExplore={() => navigate('/student/opportunities')}
          onApply={() => navigate('/student/opportunities')}
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
