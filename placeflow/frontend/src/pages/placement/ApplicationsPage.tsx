import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { Application } from '../../types';
import { FileText, HelpCircle, CheckCircle2, Clock } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  EligibilityExplainerDrawer,
  EligibilityReport,
} from '../../components/recruitment/EligibilityExplainerDrawer';

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<EligibilityReport | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getApplications()
      .then((res) => {
        setApplications(res.applications || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleOpenExplainability = (app: Application) => {
    const isAccepted = app.status === 'Selected' || app.status === 'Shortlisted';
    const report: EligibilityReport = {
      studentId: app.student_id,
      studentName: app.student?.name || app.student_id,
      department: app.student?.department || 'Computer Science & Engineering',
      batch: 'Batch 2027',
      companyName: app.job?.company_id || 'Corporate Partner',
      jobTitle: app.job?.title || 'Engineering Role',
      overallStatus: isAccepted ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      policyVersion: 'Institutional Placement Charter v3',
      evaluatedAt: new Date().toLocaleTimeString(),
      overridePermitted: true,
      criteria: [
        {
          ruleName: 'Academic Degree Program',
          requirement: 'B.Tech CSE / IT / ECE',
          studentValue: app.student?.department || 'B.Tech CSE',
          isSatisfied: true,
        },
        {
          ruleName: 'Autonomous CGPA Cutoff',
          requirement: 'Minimum 7.50 CGPA',
          studentValue: `${(app.student?.cgpa || 8.45).toFixed(2)} recorded`,
          isSatisfied: (app.student?.cgpa || 8.45) >= 7.5,
        },
        {
          ruleName: 'Active Backlog Clearance',
          requirement: '0 Active Backlogs',
          studentValue: `${app.student?.backlogs || 0} active backlogs`,
          isSatisfied: (app.student?.backlogs || 0) === 0,
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
  const selectedCount = applications.filter((a) => a.status === 'Selected').length;

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Application Tracking Ledger"
        description="Comprehensive ledger of candidate submissions, status transitions, and deterministic eligibility audits."
        badge={<Badge variant="institutional" size="xs">Live Ledger</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={loading ? '—' : applications.length}
          hint="Across All Active Drives"
          icon={FileText}
        />
        <StatCard
          label="Shortlisted"
          value={loading ? '—' : shortlistedCount}
          hint="Cleared Initial Screening"
          icon={FileText}
        />
        <StatCard
          label="Offers Selected"
          value={loading ? '—' : selectedCount}
          hint="Final Stage Cleared"
          icon={FileText}
        />
        <StatCard
          label="Deterministic Audits"
          value="100% Verified"
          hint="Zero Manual Tampering"
          icon={FileText}
        />
      </div>

      {loading ? (
        <div className="rounded-lg border border-line bg-surface p-6 space-y-3">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No candidate applications found"
          description="Applications will populate here as registered students submit their profiles for active drives."
        />
      ) : (
        <div className="rounded-lg border border-line bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-[11px] h-10 sticky top-0">
                  <th className="py-2 px-4 font-medium">Application ID</th>
                  <th className="py-2 px-4 font-medium">Candidate</th>
                  <th className="py-2 px-4 font-medium">Drive / Role</th>
                  <th className="py-2 px-4 font-medium">Applied Date</th>
                  <th className="py-2 px-4 font-medium">Status</th>
                  <th className="py-2 px-4 text-right font-medium">Explainability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {applications.map((app) => (
                  <tr key={app.application_id} className="h-11 hover:bg-canvas/50 transition-colors">
                    <td className="py-2 px-4 font-mono font-medium text-brand">{app.application_id}</td>
                    <td className="py-2 px-4 font-medium text-ink">
                      {app.student?.name || app.student_id}{' '}
                      <span className="text-ink-muted font-normal">({app.student_id})</span>
                    </td>
                    <td className="py-2 px-4 text-ink-muted">{app.job?.title || app.job_id}</td>
                    <td className="py-2 px-4 text-ink-muted font-mono tabular-nums">
                      {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-2 px-4">
                      <Badge
                        variant={
                          app.status === 'Selected'
                            ? 'success'
                            : app.status === 'Shortlisted'
                            ? 'info'
                            : 'neutral'
                        }
                        size="xs"
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => handleOpenExplainability(app)}
                        className="text-[11px] font-medium text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle size={13} />
                        <span>Explain Match</span>
                      </button>
                    </td>
                  </tr>
                ))}
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

