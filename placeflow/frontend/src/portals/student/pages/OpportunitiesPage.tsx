/**
 * PlaceFlow / Meridian — Student Opportunities Page (Phase 5).
 *
 * Scoped recruitment drive catalog consuming /api/student/opportunities/.
 * Completely eliminates STU001 and derives candidate context strictly from session.
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Filter,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { studentApi, StudentOpportunity } from '../api';
import { PageHeader, StatCard, Badge, Button, Skeleton, EmptyState } from '../../../ui';
import { ErrorState } from '../../../ui/ErrorState';

export const StudentOpportunitiesPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<StudentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'eligible' | 'all'>('eligible');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const loadOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentApi.getOpportunities();
      setOpportunities(data || []);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const handleApply = async (job: StudentOpportunity) => {
    if (!job.eligible) {
      toast.error('You do not meet the eligibility criteria for this drive.');
      return;
    }

    setApplyingJobId(job.job_id);
    try {
      await studentApi.applyOpportunity(job.job_id);
      toast.success(`Successfully applied to ${job.company_name} — ${job.title}!`);
      // Update state locally
      setOpportunities((prev) =>
        prev.map((j) => (j.job_id === job.job_id ? { ...j, has_applied: true } : j))
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application.');
    } finally {
      setApplyingJobId(null);
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
    return <ErrorState error={error} onRetry={loadOpportunities} />;
  }

  const eligibleJobs = opportunities.filter((j) => j.eligible);
  const appliedJobs = opportunities.filter((j) => j.has_applied);

  // Filter pipeline
  const filtered = opportunities.filter((j) => {
    if (activeTab === 'eligible' && !j.eligible) return false;
    if (tierFilter !== 'ALL' && j.tier !== tierFilter) return false;
    if (search) {
      const query = search.toLowerCase();
      const matchTitle = j.title.toLowerCase().includes(query);
      const matchComp = j.company_name.toLowerCase().includes(query);
      const matchJobId = j.job_id.toLowerCase().includes(query);
      if (!matchTitle && !matchComp && !matchJobId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Campus Recruitment Drives"
        description="Explore active recruitment notices, review eligibility criteria, and submit applications."
        badge={<Badge variant="institutional" size="xs">Authoritative Feed</Badge>}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Open Drives"
          value={opportunities.length}
          hint="Active campus notices"
          icon={Compass}
        />
        <StatCard
          label="Eligible for Me"
          value={eligibleJobs.length}
          hint="Criteria satisfied"
          icon={CheckCircle2}
        />
        <StatCard
          label="Submitted Applications"
          value={appliedJobs.length}
          hint="In recruitment pipeline"
          icon={Sparkles}
        />
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 border border-line rounded-xl">
        <div className="flex items-center gap-1 bg-canvas p-1 rounded-lg border border-line">
          <button
            onClick={() => setActiveTab('eligible')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'eligible'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Eligible for Me ({eligibleJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            All Open Drives ({opportunities.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-ink-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search role, company..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-canvas border border-line rounded-lg text-ink placeholder-ink-muted focus:outline-none focus:border-brand"
            />
          </div>

          {/* Tier filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-brand cursor-pointer"
          >
            <option value="ALL">All Tiers</option>
            <option value="Super Dream">Super Dream (&gt;10 LPA)</option>
            <option value="Dream">Dream (6-10 LPA)</option>
            <option value="Regular">Regular (&lt;6 LPA)</option>
          </select>
        </div>
      </div>

      {/* Opportunities List View */}
      {filtered.length === 0 ? (
        <EmptyState
          title={search ? 'No Matching Opportunities' : 'No Drives Available'}
          description={
            search
              ? 'Try modifying your search or clearing tier filters.'
              : 'There are currently no placement drives meeting the active filter criteria.'
          }
          actionLabel={search || tierFilter !== 'ALL' ? 'Reset Filters' : undefined}
          onAction={
            search || tierFilter !== 'ALL'
              ? () => {
                  setSearch('');
                  setTierFilter('ALL');
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job) => (
            <div
              key={job.job_id}
              className={`p-5 rounded-xl border bg-surface flex flex-col justify-between transition-all ${
                job.has_applied
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : job.eligible
                  ? 'border-line hover:border-slate-300 hover:shadow-xs'
                  : 'border-line/70 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-sm font-bold text-ink">{job.title}</div>
                    <div className="text-xs text-ink-muted flex items-center gap-1.5 mt-0.5">
                      <Building2 size={13} className="text-brand shrink-0" />
                      <span className="font-medium text-ink">{job.company_name}</span>
                      {job.company_industry && <span>&bull; {job.company_industry}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant={
                        job.has_applied
                          ? 'success'
                          : job.eligible
                          ? 'institutional'
                          : 'neutral'
                      }
                      size="xs"
                    >
                      {job.has_applied ? 'Applied' : job.eligible ? 'Eligible' : 'Ineligible'}
                    </Badge>
                    <span className="text-[10px] font-mono text-ink-muted">{job.tier}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2 text-xs border-y border-line my-3">
                  <div>
                    <span className="text-[10px] text-ink-muted uppercase block">Package</span>
                    <span className="font-bold text-success font-mono text-sm">₹{job.package_lpa} LPA</span>
                  </div>
                  <div className="border-l border-line pl-3">
                    <span className="text-[10px] text-ink-muted uppercase block">Intake</span>
                    <span className="font-semibold text-ink font-mono">{job.vacancies} positions</span>
                  </div>
                  {job.eligibility?.min_cgpa !== undefined && (
                    <div className="border-l border-line pl-3">
                      <span className="text-[10px] text-ink-muted uppercase block">Min CGPA</span>
                      <span className="font-semibold text-ink font-mono">{job.eligibility.min_cgpa.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Server-computed eligibility reasons */}
                {!job.eligible && job.reasons && job.reasons.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-3 space-y-1">
                    <div className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-800">
                      <AlertCircle size={13} className="text-amber-600" />
                      Ineligibility Criteria
                    </div>
                    {job.reasons.map((r, idx) => (
                      <div key={idx} className="text-[11px] leading-tight text-amber-800 pl-4">
                        &bull; {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] font-mono text-ink-muted">JNF: {job.job_id}</span>

                {job.has_applied ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold">
                    <Check size={14} className="text-emerald-600" />
                    <span>Application Submitted</span>
                  </span>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!job.eligible || applyingJobId === job.job_id}
                    onClick={() => handleApply(job)}
                    leftIcon={
                      applyingJobId === job.job_id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight size={13} />
                      )
                    }
                  >
                    <span>{applyingJobId === job.job_id ? 'Applying...' : 'Apply Now'}</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

