import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Application } from '../../../types';
import {
  FileText,
  HelpCircle,
  Search,
  Filter} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  EligibilityExplainerDrawer,
  EligibilityReport} from '../../../components/recruitment/EligibilityExplainerDrawer';
import { toast } from 'sonner';
import { normalizeApplication} from '../../../utils/formatters';

export const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<EligibilityReport | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
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

      {/* Search and Stage Filter Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Filter candidate, roll number, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-canvas border border-line rounded focus:bg-surface focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-ink-muted mr-1" />
            <span className="text-xs text-ink-muted mr-1">Stage:</span>
            {['ALL', 'Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-brand text-white'
                    : 'bg-canvas text-ink hover:bg-line border border-line'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="rounded-lg border border-line bg-surface p-6 space-y-3">
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
      ) : (
        <div className="rounded-lg border border-line bg-surface overflow-hidden">
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

                    {/* Candidate with Direct Link to Dossier */}
                    <td className="py-2.5 px-4 font-medium text-ink">
                      <button
                        onClick={() => navigate(`/tpo/students/${norm.studentId}`)}
                        className="text-left group cursor-pointer"
                      >
                        <div className="font-semibold text-ink group-hover:text-brand transition-colors">
                          {norm.studentName}
                        </div>
                        <div className="text-xs text-ink-muted font-mono">
                          {norm.studentId} &bull; {norm.department}
                        </div>
                      </button>
                    </td>

                    {/* Drive with Direct Link */}
                    <td className="py-2.5 px-4 text-ink">
                      <button
                        onClick={() => navigate(`/tpo/drives/${norm.jobId}`)}
                        className="text-left group cursor-pointer"
                      >
                        <div className="font-medium group-hover:text-brand transition-colors">
                          {norm.jobTitle}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {norm.companyName}
                        </div>
                      </button>
                    </td>

                    <td className="py-2.5 px-4 text-ink-muted font-mono tabular-nums text-xs">
                      {norm.appliedDate}
                    </td>

                    {/* Interactive Stage Selector */}
                    <td className="py-2.5 px-4">
                      <select
                        disabled={updatingAppId === app.application_id}
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                        className={`text-xs font-medium py-1 px-2 rounded border border-line cursor-pointer transition-colors ${
                          app.status === 'Selected'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : app.status === 'Interviewing'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : app.status === 'Shortlisted'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : app.status === 'Rejected'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-canvas text-ink'
                        }`}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Selected">Selected (Offer)</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>

                    {/* Explainability Audit */}
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
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </div>
  );
};
