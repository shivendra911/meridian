import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlacementDriveWizard } from '../../../pages/workspaces/PlacementDriveWizard';
import { api } from '../api';
import { OverviewData } from '../../../types';
import { useTenant } from '../../../context/TenantContext';
import {
  Award,
  Briefcase,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useDocumentTitle, ErrorState } from '../../../ui';
import { formatApiError } from '../../../core/api/errors';

interface OverviewPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = () => {
  useDocumentTitle('TPO Today — Operations Command');
  const navigate = useNavigate();
  const { activeTenant, activeCampus } = useTenant();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(formatApiError(err));
        setLoading(false);
      });
  }, [activeTenant]);

  if (loading) {
    return (
      <div className="space-y-6 font-sans max-w-6xl mx-auto">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Failed to Load Placement Overview"
        message={error || 'Unable to load overview data.'}
        onRetry={() => {
          setLoading(true);
          setError(null);
          api
            .getOverview()
            .then((res) => {
              setData(res);
              setLoading(false);
            })
            .catch((err) => {
              setError(formatApiError(err));
              setLoading(false);
            });
        }}
      />
    );
  }

  const { kpis } = data;

  const totalInterviews = 3;
  const roomClashes = 1;
  const pendingOffers = 2;

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto">
      {/* 1. The One-Sentence Answer Headline & Actions */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[11px] font-bold tracking-widest uppercase text-now flex items-center gap-1.5">
              <Calendar size={13} /> PLACEMENT OPERATIONS · {activeCampus?.campus_name || 'MAIN CAMPUS'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1 mb-0 font-display">
              Today: {totalInterviews} interviews, {roomClashes} room clash, {pendingOffers} offers waiting for a reply.
            </h1>
            <p className="text-xs text-ink-muted mt-1 m-0">
              Season momentum is high: {kpis?.offers_selected || 142} candidates placed of {kpis?.total_students || 500} registered.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="now"
              pill
              size="md"
              onClick={() => navigate('/tpo/insights/superday')}
              leftIcon={<AlertTriangle size={15} />}
            >
              Resolve Clash
            </Button>
            <Button
              variant="primary"
              pill
              size="md"
              onClick={() => navigate('/tpo/interviews')}
              leftIcon={<Clock size={15} />}
            >
              Open Today's Interviews
            </Button>
            <Button
              variant="outline"
              pill
              size="md"
              onClick={() => setIsWizardOpen(true)}
              leftIcon={<Briefcase size={15} />}
            >
              New Drive
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Today's Urgent Focus Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Clash Alert Box */}
        <div className="rounded-2xl border border-danger/30 bg-danger-bg/50 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-danger flex items-center gap-1.5">
              <AlertTriangle size={15} /> Room Conflict
            </span>
            <span className="text-[11px] font-mono font-bold bg-danger/10 text-danger px-2 py-0.5 rounded-full">
              Seminar Hall B
            </span>
          </div>
          <h3 className="text-sm font-bold text-ink m-0">
            Cognizant & Razorpay Interview Clashes
          </h3>
          <p className="text-xs text-ink-secondary m-0">
            2 panels scheduled simultaneously at 11:30 AM in Seminar Hall B.
          </p>
          <div className="pt-1">
            <Button
              variant="destructive"
              size="xs"
              pill
              onClick={() => navigate('/tpo/insights/superday')}
              rightIcon={<ArrowRight size={13} />}
            >
              Resolve in Superday
            </Button>
          </div>
        </div>

        {/* Offers Waiting & Renege Risk */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand flex items-center gap-1.5">
              <Award size={15} /> Offers at Risk
            </span>
            <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
              2 Pending
            </span>
          </div>
          <h3 className="text-sm font-bold text-ink m-0">
            Zoho (₹12 LPA) · 2 Shortlisted Candidates
          </h3>
          <p className="text-xs text-ink-muted m-0">
            Response deadline in 48 hours. At-risk score: High probability of overlapping offer.
          </p>
          <div className="pt-1 flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              pill
              onClick={() => navigate('/tpo/offers')}
              rightIcon={<ArrowRight size={13} />}
            >
              Inspect Offers
            </Button>
            <Button
              variant="ghost"
              size="xs"
              pill
              onClick={() => navigate('/tpo/insights/renege')}
              className="text-amber-800 hover:text-amber-950 font-semibold text-[11px]"
            >
              Renege Radar &rarr;
            </Button>
          </div>
        </div>

        {/* Live Drives Closing */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Briefcase size={15} /> Drives Closing
            </span>
            <span className="text-[11px] font-bold bg-line text-ink px-2 py-0.5 rounded-full">
              4 Open
            </span>
          </div>
          <h3 className="text-sm font-bold text-ink m-0">
            Cognizant Registration Closes in 2 Days
          </h3>
          <p className="text-xs text-ink-muted m-0">
            84 candidates applied so far, 34 eligible remaining unapplied.
          </p>
          <div className="pt-1">
            <Button
              variant="outline"
              size="xs"
              pill
              onClick={() => navigate('/tpo/drives')}
              rightIcon={<ArrowRight size={13} />}
            >
              Manage Drives
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Season Operations Key Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-muted m-0">Total Placement Velocity</p>
          <p className="text-2xl font-bold text-ink tabular-nums mt-1 m-0">
            {kpis?.placement_pct || '42.6'}%
          </p>
          <p className="text-[11px] text-success mt-1 m-0 font-medium">
            +5.2% vs previous cohort
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-muted m-0">Placed Students</p>
          <p className="text-2xl font-bold text-ink tabular-nums mt-1 m-0">
            {kpis?.offers_selected || 142}
          </p>
          <p className="text-[11px] text-ink-muted mt-1 m-0">
            of {kpis?.total_students || 500} registered candidates
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-muted m-0">Active Corporate Drives</p>
          <p className="text-2xl font-bold text-ink tabular-nums mt-1 m-0">
            {kpis?.open_jobs || 12}
          </p>
          <p className="text-[11px] text-ink-muted mt-1 m-0">
            Across Super Dream, Dream & Core
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-muted m-0">Average Package (CTC)</p>
          <p className="text-2xl font-bold text-ink tabular-nums mt-1 m-0">
            ₹{kpis?.average_package_lpa || '14.2'} LPA
          </p>
          <p className="text-[11px] text-ink-muted mt-1 m-0">
            Highest: ₹44.0 LPA
          </p>
        </div>
      </div>

      {/* 4. Season Planning Quick Access */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink m-0">Season Schedule & Clash Board</h3>
            <p className="text-xs text-ink-muted m-0">
              Interactive timeline of all recruitment drives across weeks with conflict resolution.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          pill
          size="sm"
          onClick={() => navigate('/tpo/season')}
          rightIcon={<ArrowRight size={14} />}
        >
          Open Season Board
        </Button>
      </div>

      {/* New Drive Wizard Modal */}
      {isWizardOpen && (
        <PlacementDriveWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={() => {
            setIsWizardOpen(false);
            api.getOverview().then(setData);
          }}
        />
      )}
    </div>
  );
};

export const TodayPage = OverviewPage;
export default OverviewPage;
