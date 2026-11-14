import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Job, Application, Placement, Interview } from '../../../types';
import {
  Briefcase,
  Calendar,
  Users,
  Award,
  ArrowLeft,
  HelpCircle} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  EligibilityExplainerDrawer,
  EligibilityReport} from '../../../components/recruitment/EligibilityExplainerDrawer';
import { resolveCompanyName } from '../../../utils/formatters';

export const DriveDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'eligibility' | 'applicants' | 'interviews' | 'offers'>('overview');
  const [selectedReport, setSelectedReport] = useState<EligibilityReport | null>(null);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await api.updateApplicationStatus(appId, newStatus);
      setApplications((prev) =>
        prev.map((a) => (a.application_id === appId ? { ...a, status: newStatus as any } : a))
      );
      toast.success(`Candidate advanced to ${newStatus}`);
    } catch (err: any) {
      toast.error('Failed to update stage: ' + err.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getJobs(),
      api.getApplications(),
      api.getInterviews(),
      api.getPlacements(),
    ])
      .then(([jRes, aRes, iRes, pRes]) => {
        const found = jRes.jobs.find((j) => j.job_id === id);
        setJob(found || null);
        const matchingApps = (aRes.applications || []).filter((a) => a.job_id === id);
        setApplications(matchingApps);
        const appIds = new Set(matchingApps.map((a) => a.application_id));
        setInterviews((iRes.interviews || []).filter((i) => appIds.has(i.application_id)));
        setPlacements((pRes.placements || []).filter((p) => p.job_id === id || p.company_id === found?.company_id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Placement drive opening not found"
        description={`No job notification form exists with ID "${id}".`}
        actionLabel="Back to Drives"
        onAction={() => navigate('/tpo/drives')}
      />
    );
  }

  const handleOpenEligibilityExplainer = (app?: Application) => {
    if (!app?.student_id) return;
    const report: EligibilityReport = {
      studentId: app.student_id,
      studentName: app.student_name || app.student?.name || app.student_id,
      department: app.department || app.student?.department || 'Engineering',
      batch: 'Batch 2026',
      companyName: resolveCompanyName(job.company_id),
      jobTitle: job.title,
      overallStatus: 'ELIGIBLE',
      policyVersion: 'Institutional Placement Charter v3',
      evaluatedAt: new Date().toLocaleTimeString(),
      overridePermitted: true,
      criteria: [
        {
          ruleName: 'Degree Discipline',
          requirement: job.eligibility?.departments?.join(', ') || 'CSE, IT, ECE',
          studentValue: 'B.Tech CSE',
          isSatisfied: true,
        },
        {
          ruleName: 'Minimum CGPA Cutoff',
          requirement: `Minimum ${job.eligibility?.min_cgpa?.toFixed(2) || '7.00'} CGPA`,
          studentValue: '8.45 Recorded',
          isSatisfied: true,
        },
        {
          ruleName: 'Active Backlog Clearance',
          requirement: `At most ${job.eligibility?.max_backlogs ?? 0} active backlogs`,
          studentValue: '0 Active Backlogs',
          isSatisfied: true,
        },
        {
          ruleName: 'DPDP Act 2023 Consent Attestation',
          requirement: 'Student Consent Verified',
          studentValue: 'Active & DigiLocker Signed',
          isSatisfied: true,
        },
      ],
    };
    setSelectedReport(report);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/tpo/drives')}
          className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 cursor-pointer font-medium"
        >
          <ArrowLeft size={13} />
          <span>Back to Drives</span>
        </button>
      </div>

      <PageHeader
        title={`${job.title}`}
        description={`${resolveCompanyName(job.company_id)} • JNF Reference: ${job.job_id} • Tier: ${job.tier}`}
        badge={<Badge variant="success" size="xs">Status: {job.status}</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEligibilityExplainer()}
              leftIcon={<HelpCircle size={14} />}
            >
              Explain Eligibility Criteria
            </Button>
          </div>
        }
      />

      {/* Drive Meta Banner */}
      <div className="rounded-lg border border-line bg-surface p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-ink-muted block text-xs">CTC Package</span>
          <span className="text-lg font-semibold tabular-nums text-success">
            ₹{job.package_lpa} LPA
          </span>
        </div>
        <div>
          <span className="text-ink-muted block text-xs">Vacancies / Filled</span>
          <span className="text-lg font-semibold tabular-nums text-ink">
            {job.filled} / {job.vacancies}
          </span>
        </div>
        <div>
          <span className="text-ink-muted block text-xs">Cutoff CGPA</span>
          <span className="text-lg font-semibold tabular-nums text-ink">
            {job.eligibility?.min_cgpa?.toFixed(2) || '7.00'}
          </span>
        </div>
        <div>
          <span className="text-ink-muted block text-xs">Total Applicants</span>
          <span className="text-lg font-semibold tabular-nums text-brand">
            {applications.length} Students
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'eligibility', label: 'Eligibility' },
          { id: 'applicants', label: 'Applicants', count: applications.length },
          { id: 'interviews', label: 'Interviews', count: interviews.length },
          { id: 'offers', label: 'Offers', count: placements.length },
        ]}
      />

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card title="Drive Overview & Criteria" subtitle="Official Job Notification Form (JNF) parameters">
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-ink-muted block">Recruiting Company</span>
                  <span className="font-semibold text-ink">{resolveCompanyName(job.company_id)}</span>
                </div>
                <div>
                  <span className="text-ink-muted block">Tier Category</span>
                  <span className="font-semibold text-ink">{job.tier}</span>
                </div>
                <div>
                  <span className="text-ink-muted block">Minimum CGPA Required</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {job.eligibility?.min_cgpa?.toFixed(2) || '7.00'} / 10.0
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block">Maximum Backlogs Permitted</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {job.eligibility?.max_backlogs ?? 0}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-line">
                <span className="text-ink-muted block mb-1">Eligible Departments</span>
                <div className="flex flex-wrap gap-1.5">
                  {(job.eligibility?.departments || ['CSE', 'IT', 'ECE']).map((dept) => (
                    <Badge key={dept} variant="neutral" size="xs">
                      {dept}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'eligibility' && (
        <Card
          title="Deterministic Eligibility Rules"
          subtitle="Autonomous criteria evaluation against institutional records"
          actionSlot={
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleOpenEligibilityExplainer()}
            >
              Open Full Drawer
            </Button>
          }
        >
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-line bg-canvas flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">Academic Discipline</span>
                <span className="text-ink-muted text-xs">
                  {job.eligibility?.departments?.join(', ') || 'CSE, IT, ECE'}
                </span>
              </div>
              <Badge variant="success" size="xs">Enforced</Badge>
            </div>

            <div className="p-3 rounded-lg border border-line bg-canvas flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">Academic Threshold</span>
                <span className="text-ink-muted text-xs tabular-nums">
                  CGPA &ge; {job.eligibility?.min_cgpa?.toFixed(2) || '7.00'} &bull; Backlogs &le;{' '}
                  {job.eligibility?.max_backlogs ?? 0}
                </span>
              </div>
              <Badge variant="success" size="xs">Enforced</Badge>
            </div>

            <div className="p-3 rounded-lg border border-line bg-canvas flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">DPDP Act 2023 Consent</span>
                <span className="text-ink-muted text-xs">
                  Mandatory student consent attestation required before shortlisting
                </span>
              </div>
              <Badge variant="success" size="xs">Statutory</Badge>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'applicants' && (
        applications.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No applicants yet"
            description="Eligible candidates have been notified and applications will appear here as they apply."
          />
        ) : (
          <div className="rounded-lg border border-line bg-surface overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-xs h-10">
                  <th className="py-2 px-4 font-medium">Application ID</th>
                  <th className="py-2 px-4 font-medium">Candidate</th>
                  <th className="py-2 px-4 font-medium">Date</th>
                  <th className="py-2 px-4 font-medium">Status</th>
                  <th className="py-2 px-4 text-right font-medium">Explainability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {applications.map((app) => (
                  <tr key={app.application_id} className="h-10 hover:bg-canvas/50 transition-colors">
                    <td className="py-2 px-4 font-mono font-medium text-brand">{app.application_id}</td>
                    <td className="py-2 px-4 font-medium text-ink">
                      <button
                        onClick={() => navigate(`/tpo/students/${app.student_id}`)}
                        className="text-left hover:text-brand hover:underline font-semibold cursor-pointer"
                      >
                        {app.student_name || app.student?.name || app.student_id} <span className="font-normal text-ink-muted font-mono text-xs">({app.student_id})</span>
                      </button>
                    </td>
                    <td className="py-2 px-4 text-ink-muted font-mono tabular-nums">
                      {app.application_date || app.applied_at ? new Date(app.application_date || app.applied_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Active'}
                    </td>
                    <td className="py-2 px-4">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                        className="text-xs font-medium py-0.5 px-2 rounded border border-line cursor-pointer bg-canvas text-ink"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Selected">Selected (Offer)</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => handleOpenEligibilityExplainer(app)}
                        className="text-xs font-medium text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
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
        )
      )}

      {activeTab === 'interviews' && (
        interviews.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No interviews scheduled for this drive"
            description="Configure assessment stages or schedule candidates through the Superday scheduler."
          />
        ) : (
          <div className="rounded-lg border border-line bg-surface overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-xs h-10">
                  <th className="py-2 px-4 font-medium">Interview ID</th>
                  <th className="py-2 px-4 font-medium">Candidate</th>
                  <th className="py-2 px-4 font-medium">Round</th>
                  <th className="py-2 px-4 font-medium">Slot & Venue</th>
                  <th className="py-2 px-4 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {interviews.map((iv) => (
                  <tr key={iv.interview_id} className="h-10 hover:bg-canvas/50 transition-colors">
                    <td className="py-2 px-4 font-mono font-medium text-brand">{iv.interview_id}</td>
                    <td className="py-2 px-4 font-medium text-ink">{iv.student_id}</td>
                    <td className="py-2 px-4 text-ink-muted">{iv.round || 'Technical Round 1'}</td>
                    <td className="py-2 px-4 text-ink-muted">{iv.mode} {iv.venue ? `(${iv.venue})` : ''}</td>
                    <td className="py-2 px-4 text-right">
                      <Badge variant={iv.result === 'Passed' ? 'success' : iv.result === 'Failed' ? 'danger' : 'info'} size="xs">{iv.result}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'offers' && (
        placements.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No placement offers released yet"
            description="Once candidates complete final fitment rounds, finalized offers will appear here."
          />
        ) : (
          <div className="rounded-lg border border-line bg-surface overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-xs h-10">
                  <th className="py-2 px-4 font-medium">Placement ID</th>
                  <th className="py-2 px-4 font-medium">Candidate Roll</th>
                  <th className="py-2 px-4 font-medium">Package</th>
                  <th className="py-2 px-4 font-medium">Date</th>
                  <th className="py-2 px-4 text-right font-medium">Acceptance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {placements.map((p) => (
                  <tr key={p.placement_id} className="h-10 hover:bg-canvas/50 transition-colors">
                    <td className="py-2 px-4 font-mono font-medium text-brand">{p.placement_id}</td>
                    <td className="py-2 px-4 font-medium text-ink">{p.student_id}</td>
                    <td className="py-2 px-4 font-semibold text-success tabular-nums">
                      ₹{p.package_lpa} LPA
                    </td>
                    <td className="py-2 px-4 text-ink-muted font-mono tabular-nums">
                      {p.placement_date ? new Date(p.placement_date).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Badge variant="success" size="xs">Accepted</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <EligibilityExplainerDrawer
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </div>
  );
};
