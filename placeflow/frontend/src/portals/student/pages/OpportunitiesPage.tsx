/**
 * PlaceFlow / Meridian — Student Opportunities Page (Phase 5).
 *
 * Scoped recruitment drive catalog consuming /api/student/opportunities/.
 * Completely eliminates STU001 and derives candidate context strictly from session.
 */

import React, { useState, useEffect } from 'react';
import {
  Search} from 'lucide-react';
import { toast } from 'sonner';
import { studentApi, StudentOpportunity } from '../api';
import { PageHeader, Skeleton, EmptyState, DriveCard, useDocumentTitle } from '../../../ui';
import { ErrorState } from '../../../ui/ErrorState';

export const StudentOpportunitiesPage: React.FC = () => {
  useDocumentTitle('Opportunities');
  const [opportunities, setOpportunities] = useState<StudentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [_applyingJobId, setApplyingJobId] = useState<string | null>(null);

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
        title="Opportunities"
        description={
          <span className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`hover:text-ink transition-colors ${activeTab === 'all' ? 'font-medium text-ink' : ''}`}
            >
              {opportunities.length} open
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveTab('eligible')}
              className={`hover:text-ink transition-colors ${activeTab === 'eligible' ? 'font-medium text-ink' : ''}`}
            >
              {eligibleJobs.length} eligible
            </button>
            <span>·</span>
            <span>{appliedJobs.length} applied</span>
          </span>
        }
      />

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
                ineligibility_reason:
                  !job.eligible && job.reasons?.length ? job.reasons.join(', ') : null,
                applied: job.has_applied,
              }}
              onApply={() => handleApply(job)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

