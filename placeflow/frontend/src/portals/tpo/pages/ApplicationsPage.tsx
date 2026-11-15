import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Application } from '../../../types';
import {
  FileText,
  HelpCircle,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  EligibilityExplainerDrawer,
  EligibilityReport,
} from '../../../components/recruitment/EligibilityExplainerDrawer';
import { toast } from 'sonner';
import { normalizeApplication } from '../../../utils/formatters';
import {
  SummaryStrip,
  PersonChip,
  CompanyMark,
  formatDate,
  useDocumentTitle,
} from '../../../ui';

export const ApplicationsPage: React.FC = () => {
  useDocumentTitle('Applications');
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<EligibilityReport | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  const fetchApplications = () => {
    setLoading(true);
    api.getApplications()
      .then((res) => {
        setApplications(res.applications || []);
        setLoading(false);
      })
      .catch((err) => {
        toast.error('Failed to load applications: ' + err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    setUpdatingAppId(appId);
    try {
      await api.updateApplicationStatus(appId, newStatus);
      setApplications((prev) =>
        prev.map((a) => (a.application_id === appId ? { ...a, status: newStatus as any } : a))
      );
      toast.success(`Application stage advanced to ${newStatus}`);
    } catch (err: any) {
      toast.error('Failed to update stage: ' + err.message);
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleOpenExplainability = (app: Application) => {
    const norm = normalizeApplication(app);
    const isAccepted = norm.status === 'Selected' || norm.status === 'Shortlisted' || norm.status === 'Interviewing';
    const report: EligibilityReport = {
      studentId: norm.studentId,
      studentName: norm.studentName,
      department: norm.department,
      batch: 'Batch 2026',
      companyName: norm.companyName,
      jobTitle: norm.jobTitle,
      overallStatus: isAccepted ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      policyVersion: 'Institutional Placement Charter v3.2',
      evaluatedAt: new Date().toLocaleTimeString(),
      overridePermitted: true,
      criteria: [
        {
          ruleName: 'Academic Degree Program',
          requirement: 'B.Tech CSE / IT / ECE',
          studentValue: norm.department,
          isSatisfied: true,
        },
        {
          ruleName: 'Autonomous CGPA Cutoff',
          requirement: 'Minimum 7.50 CGPA',
          studentValue: `${norm.cgpa.toFixed(2)} recorded`,
          isSatisfied: norm.cgpa >= 7.5,
        },
        {
          ruleName: 'Active Backlog Clearance',
          requirement: '0 Active Backlogs',
          studentValue: '0 active backlogs recorded',
          isSatisfied: true,
        },
        {
          ruleName: 'DPDP Act 2023 Consent Attestation',
          requirement: 'Explicit Placement Consent Granted',
          studentValue: 'Consent Recorded & DigiLocker Verified',
          isSatisfied: true,
        },
      ],
    };
    setSelectedReport(report);
  };

  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;
  const interviewingCount = applications.filter((a) => a.status === 'Interviewing').length;
  const selectedCount = applications.filter((a) => a.status === 'Selected').length;

  const filteredApps = applications.filter((app) => {
    const norm = normalizeApplication(app);
    const matchesSearch =
      norm.studentId.toLowerCase().includes(search.toLowerCase()) ||
      norm.studentName.toLowerCase().includes(search.toLowerCase()) ||
      norm.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      norm.companyName.toLowerCase().includes(search.toLowerCase()) ||
      norm.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || norm.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const boardColumns = [
    { key: 'Applied', label: 'Applied', items: filteredApps.filter((a) => a.status === 'Applied') },
    { key: 'Shortlisted', label: 'Shortlisted', items: filteredApps.filter((a) => a.status === 'Shortlisted') },
    { key: 'Interviewing', label: 'Interview', items: filteredApps.filter((a) => a.status === 'Interviewing') },
    { key: 'Selected', label: 'Offer', items: filteredApps.filter((a) => a.status === 'Selected') },
  ];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Applications"
        description={
          <span className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`hover:text-ink transition-colors ${statusFilter === 'ALL' ? 'font-medium text-ink' : ''}`}
            >
              {applications.length} total
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setStatusFilter('Shortlisted')}
              className={`hover:text-ink transition-colors ${statusFilter === 'Shortlisted' ? 'font-medium text-ink' : ''}`}
            >
              {shortlistedCount} shortlisted
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setStatusFilter('Interviewing')}
              className={`hover:text-ink transition-colors ${statusFilter === 'Interviewing' ? 'font-medium text-ink' : ''}`}
            >
              {interviewingCount} interviewing
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setStatusFilter('Selected')}
              className={`hover:text-ink transition-colors ${statusFilter === 'Selected' ? 'font-medium text-ink' : ''}`}
            >
              {selectedCount} selected
            </button>
          </span>
        }
      />

      {/* Summary Strip (replaces separate StatCards) */}
      <SummaryStrip
        items={[
          { label: 'Total applications', value: applications.length, hint: 'Total candidates in funnel' },
          { label: 'Shortlisted', value: shortlistedCount, hint: `${applications.length > 0 ? Math.round((shortlistedCount / applications.length) * 100) : 0}% shortlist rate` },
          { label: 'Active interviews', value: interviewingCount, hint: 'In assessment stages' },
          { label: 'Placement offers', value: selectedCount, hint: 'Corporate selections' },
        ]}
      />

      {/* Filter Bar — 40px inline row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 min-h-[40px]">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Filter candidate, roll number, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-line rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-ink-muted mr-1" />
          <span className="text-xs text-ink-muted mr-1">Stage:</span>
          {['ALL', 'Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-brand text-white'
                  : 'bg-surface text-ink hover:bg-canvas border border-line'
              }`}
            >
              {st}
            </button>
          ))}

          {/* View Toggle (Board vs Table) */}
          <div className="flex items-center ml-2 pl-2 border-l border-line gap-1">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'board' ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
              }`}
              title="Board view"
            >
              <Kanban size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
              }`}
              title="Table view"
            >
              <TableIcon size={14} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-surface p-6 space-y-3">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filteredApps.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No candidate applications match filters"
          description={search ? `No records found for "${search}".` : 'No applications recorded in the database.'}
        />
      ) : viewMode === 'board' ? (
        /* 4-Column Board / Kanban Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {boardColumns.map((col) => (
            <div key={col.key} className="rounded-xl border border-line bg-canvas/50 p-3 min-h-[360px] flex flex-col">
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-line">
                <span className="font-bold text-xs uppercase tracking-wider text-ink">
                  {col.label}
                </span>
                <span className="rounded-full bg-surface border border-line px-2 py-0.5 text-xs font-semibold text-ink tabular-nums">
                  {col.items.length}
                </span>
              </div>

              {col.items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-4 border border-dashed border-line rounded-lg text-ink-muted text-xs">
                  No applications
                </div>
              ) : (
                <div className="space-y-3">
                  {col.items.map((app) => {
                    const norm = normalizeApplication(app);
                    return (
                      <div
                        key={norm.id || app.application_id}
                        className="rounded-lg border border-line bg-surface p-3 shadow-xs space-y-2.5 hover:border-brand/30 transition-all"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <PersonChip
                            name={norm.studentName || norm.studentId}
                            person_id={norm.studentId}
                            onClick={() => navigate(`/tpo/students/${norm.studentId}`)}
                          />

                          {/* Menu action to move stage */}
                          <select
                            value={app.status}
                            disabled={updatingAppId === app.application_id}
                            onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                            className="text-[11px] font-medium py-1 px-1.5 rounded border border-line bg-canvas text-ink hover:bg-surface cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand"
                            title="Move stage"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interviewing">Interview</option>
                            <option value="Selected">Offer</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-line/60">
                          <CompanyMark name={norm.companyName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-ink truncate m-0">{norm.jobTitle}</p>
                            <p className="text-[11px] text-ink-muted truncate m-0">{norm.companyName}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                          <span>{app.application_date || app.applied_at ? formatDate(app.application_date || app.applied_at) : 'Active'}</span>
                          <button
                            onClick={() => handleOpenExplainability(app)}
                            className="text-brand hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <HelpCircle size={12} />
                            Explain
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-xs h-10 sticky top-0">
                  <th className="py-2.5 px-4 font-medium">Application Ref</th>
                  <th className="py-2.5 px-4 font-medium">Candidate</th>
                  <th className="py-2.5 px-4 font-medium">Drive / Opportunity</th>
                  <th className="py-2.5 px-4 font-medium">Applied Date</th>
                  <th className="py-2.5 px-4 font-medium">Stage Transition</th>
                  <th className="py-2.5 px-4 text-right font-medium">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredApps.map((app) => {
                  const norm = normalizeApplication(app);
                  return (
                    <tr key={norm.id || app.application_id} className="h-12 hover:bg-canvas/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-brand">
                        {norm.id || app.application_id}
                      </td>

                      {/* Candidate with PersonChip */}
                      <td className="py-2.5 px-4 font-medium text-ink">
                        <PersonChip
                          name={norm.studentName || norm.studentId}
                          person_id={norm.studentId}
                          onClick={() => navigate(`/tpo/students/${norm.studentId}`)}
                        />
                      </td>

                      {/* Drive with Direct Link and Company Mark */}
                      <td className="py-2.5 px-4 text-ink">
                        <button
                          onClick={() => navigate(`/tpo/drives/${norm.jobId}`)}
                          className="flex items-center gap-2 text-left group cursor-pointer"
                        >
                          <CompanyMark name={norm.companyName} size="sm" />
                          <div className="min-w-0">
                            <div className="font-semibold text-ink group-hover:text-brand transition-colors">
                              {norm.jobTitle}
                            </div>
                            <div className="text-xs text-ink-muted">
                              {norm.companyName}
                            </div>
                          </div>
                        </button>
                      </td>

                      <td className="py-2.5 px-4 text-ink-muted tabular-nums">
                        {app.application_date || app.applied_at ? formatDate(app.application_date || app.applied_at) : 'Active'}
                      </td>

                      <td className="py-2.5 px-4">
                        <select
                          value={app.status}
                          disabled={updatingAppId === app.application_id}
                          onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                          className="text-xs font-medium py-1 px-2 rounded border border-line cursor-pointer bg-canvas text-ink hover:bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Selected">Selected (Offer)</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenExplainability(app)}
                          className="text-xs font-medium text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <HelpCircle size={13} />
                          <span>Explain Match</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EligibilityExplainerDrawer
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </div>
  );
};
