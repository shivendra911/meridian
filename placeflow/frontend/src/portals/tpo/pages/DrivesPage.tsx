import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Job } from '../../../types';
import { Briefcase, ArrowRight, Sparkles, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PlacementDriveWizard } from '../../../pages/workspaces/PlacementDriveWizard';
import { resolveCompanyName } from '../../../utils/formatters';
import { DriveCard, useDocumentTitle } from '../../../ui';

export const DrivesPage: React.FC = () => {
  useDocumentTitle('Drives');
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const fetchJobs = () => {
    setLoading(true);
    api.getJobs()
      .then((res) => {
        setJobs(res.jobs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const totalVacancies = jobs.reduce((sum, j) => sum + (j.vacancies || 0), 0);

  const filteredJobs = jobs.filter((j) => {
    const compName = resolveCompanyName(j.company_id);
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.job_id.toLowerCase().includes(search.toLowerCase()) ||
      j.company_id.toLowerCase().includes(search.toLowerCase()) ||
      compName.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || j.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Drives"
        description={
          <span className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <button
              type="button"
              onClick={() => setTierFilter('ALL')}
              className={`hover:text-ink transition-colors ${tierFilter === 'ALL' ? 'font-medium text-ink' : ''}`}
            >
              {jobs.length} total
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setTierFilter('Normal')}
              className={`hover:text-ink transition-colors ${tierFilter === 'Normal' ? 'font-medium text-ink' : ''}`}
            >
              {jobs.filter((j) => j.tier === 'Normal').length} Normal
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setTierFilter('Dream')}
              className={`hover:text-ink transition-colors ${tierFilter === 'Dream' ? 'font-medium text-ink' : ''}`}
            >
              {jobs.filter((j) => j.tier === 'Dream').length} Dream
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setTierFilter('Super Dream')}
              className={`hover:text-ink transition-colors ${tierFilter === 'Super Dream' ? 'font-medium text-ink' : ''}`}
            >
              {jobs.filter((j) => j.tier === 'Super Dream').length} Super Dream
            </button>
            <span>·</span>
            <span>{totalVacancies} vacancies</span>
          </span>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsWizardOpen(true)}
            leftIcon={<Sparkles size={14} />}
          >
            New drive
          </Button>
        }
      />

      {/* Search and Tier Filter Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by role, company, or JNF ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-canvas border border-line rounded focus:bg-surface focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-ink-muted mr-1" />
            <span className="text-xs text-ink-muted mr-1">Tier:</span>
            {['ALL', 'Normal', 'Dream', 'Super Dream'].map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  tierFilter === tier
                    ? 'bg-brand text-white'
                    : 'bg-canvas text-ink hover:bg-line border border-line'
                }`}
              >
                {tier}
              </button>
            ))}

            {/* View Mode Switcher */}
            <div className="flex items-center ml-2 pl-2 border-l border-line gap-1">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'cards' ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
                }`}
                title="Cards view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
                }`}
                title="Table view"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="rounded-lg border border-line bg-surface p-6 space-y-3">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={search || tierFilter !== 'ALL' ? 'No drives match your filters' : 'No drives yet'}
          description={
            search || tierFilter !== 'ALL'
              ? `No openings matched "${search}" in tier "${tierFilter}".`
              : 'Create a guided recruitment drive to configure eligibility criteria and notify students.'
          }
          actionLabel={search || tierFilter !== 'ALL' ? undefined : 'New drive'}
          onAction={search || tierFilter !== 'ALL' ? undefined : () => setIsWizardOpen(true)}
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((j) => (
            <DriveCard
              key={j.job_id}
              data={{
                drive_id: j.job_id,
                job_id: j.job_id,
                company_name: resolveCompanyName(j.company_id),
                role: j.title,
                tier: j.tier,
                package_lpa: j.package_lpa,
                eligible: true,
              }}
              onClick={() => navigate(`/tpo/drives/${j.job_id}`)}
              onApply={() => navigate(`/tpo/drives/${j.job_id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-xs h-10 sticky top-0">
                  <th className="py-2 px-4 font-medium">JNF ID</th>
                  <th className="py-2 px-4 font-medium">Role Title</th>
                  <th className="py-2 px-4 font-medium">Recruiting Partner</th>
                  <th className="py-2 px-4 font-medium">Package</th>
                  <th className="py-2 px-4 font-medium">Tier</th>
                  <th className="py-2 px-4 font-medium">Cutoff Criteria</th>
                  <th className="py-2 px-4 font-medium">Progress</th>
                  <th className="py-2 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredJobs.map((j) => (
                  <tr
                    key={j.job_id}
                    onClick={() => navigate(`/tpo/drives/${j.job_id}`)}
                    className="h-11 hover:bg-canvas/50 transition-colors cursor-pointer"
                  >
                    <td className="py-2 px-4 font-mono font-medium text-brand">{j.job_id}</td>
                    <td className="py-2 px-4 font-medium text-ink">{j.title}</td>
                    <td className="py-2 px-4 text-ink font-medium">
                      {resolveCompanyName(j.company_id)}
                    </td>
                    <td className="py-2 px-4 font-semibold tabular-nums text-success">
                      ₹{j.package_lpa} LPA
                    </td>
                    <td className="py-2 px-4">
                      <Badge
                        variant={
                          j.tier === 'Super Dream'
                            ? 'danger'
                            : j.tier === 'Dream'
                            ? 'institutional'
                            : 'neutral'
                        }
                        size="xs"
                      >
                        {j.tier}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 text-ink-muted text-xs tabular-nums">
                      CGPA &ge; {j.eligibility?.min_cgpa?.toFixed(2) || '7.00'} • Backlogs &le;{' '}
                      {j.eligibility?.max_backlogs ?? 0}
                    </td>
                    <td className="py-2 px-4 tabular-nums text-ink">
                      {j.filled} / {j.vacancies}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tpo/drives/${j.job_id}`);
                        }}
                        className="text-brand hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <span>Inspect</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PlacementDriveWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={(data) => {
          fetchJobs();
          if (data?.job_id) {
            navigate(`/tpo/drives/${data.job_id}`);
          }
        }}
      />
    </div>
  );
};
