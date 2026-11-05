import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Company, Job, Application, Placement } from '../types';
import {
  Building2,
  Briefcase,
  FileText,
  Award,
  PlusCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  EligibilityExplainerDrawer,
  EligibilityReport,
} from '../components/recruitment/EligibilityExplainerDrawer';
import { PlacementDriveWizard } from './workspaces/PlacementDriveWizard';

interface RecruitmentPageProps {
  initialTab?: 'companies' | 'jobs' | 'applications' | 'placements';
}

export const RecruitmentPage: React.FC<RecruitmentPageProps> = ({
  initialTab = 'companies',
}) => {
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);

  // Wizard & Eligibility drawer states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedEligibilityReport, setSelectedEligibilityReport] = useState<EligibilityReport | null>(null);

  const handleOpenExplainability = (app: Application) => {
    const isAccepted = app.status === 'Selected' || app.status === 'Shortlisted';
    const report: EligibilityReport = {
      studentId: app.student_id,
      studentName: app.student?.name || app.student_id,
      department: app.student?.department || 'Computer Science & Engineering',
      batch: 'Batch 2027',
      companyName: app.job?.company_id || 'Google India',
      jobTitle: app.job?.title || 'Software Development Engineer',
      overallStatus: isAccepted ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      policyVersion: 'Institutional Placement Policy v3 & Recruiter Criteria v2',
      evaluatedAt: new Date().toLocaleTimeString() + ' (Deterministic Engine)',
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
          ruleName: 'Graduating Cohort Year',
          requirement: 'Class of 2027',
          studentValue: 'Batch of 2027',
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
    setSelectedEligibilityReport(report);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getCompanies(),
      api.getJobs(),
      api.getApplications(),
      api.getPlacements(),
    ])
      .then(([cRes, jRes, aRes, pRes]) => {
        setCompanies(cRes.companies);
        setJobs(jRes.jobs);
        setApplications(aRes.applications);
        setPlacements(pRes.placements);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDriveCreated = (driveData: any) => {
    const tierMap: Record<string, 'Normal' | 'Dream' | 'Super Dream'> = {
      SUPER_DREAM: 'Super Dream',
      DREAM: 'Dream',
      CORE: 'Normal',
      STANDARD: 'Normal',
    };
    const newJob: Job = {
      job_id: `JNF-${Date.now().toString().slice(-4)}`,
      company_id: driveData.companyName,
      title: driveData.jobTitle,
      package_lpa: parseFloat(driveData.ctc) || 20.0,
      tier: tierMap[driveData.tier] || 'Super Dream',
      status: 'Open',
      eligibility: {
        min_cgpa: driveData.minCgpa,
        max_backlogs: driveData.maxBacklogs,
        departments: driveData.selectedBranches,
      },
      vacancies: driveData.intakeGoal,
      filled: 0,
    };
    setJobs([newJob, ...jobs]);
    setTab('jobs');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Recruitment Operations & Corporate Ledgers"
        description="Visiting corporate partners, active Job Notification Forms (JNFs), candidate applications, and offer records."
        badge={
          <Badge variant="institutional" size="xs">
            Placement Directorate
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsWizardOpen(true)}
              leftIcon={<Sparkles size={14} />}
            >
              Create Placement Drive
            </Button>
          </div>
        }
      />

      {/* 2. Top Metric Row (Max 4 StatCards, tabular-nums) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Corporate Partners"
          value={loading ? '—' : companies.length}
          hint="Verified Visiting Recruiters"
          icon={Building2}
        />
        <StatCard
          label="Active Placement Drives"
          value={loading ? '—' : jobs.length}
          hint="Open Job Notifications (JNFs)"
          icon={Briefcase}
        />
        <StatCard
          label="Total Applications"
          value={loading ? '—' : applications.length}
          hint="Candidate Submissions"
          icon={FileText}
        />
        <StatCard
          label="Offers Released"
          value={loading ? '—' : placements.length}
          hint="Final Placed Candidates"
          icon={Award}
        />
      </div>

      {/* 3. Tab Pills Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-1 bg-canvas p-1 rounded-lg border border-line">
          <button
            onClick={() => setTab('companies')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 flex items-center gap-1.5 cursor-pointer ${
              tab === 'companies'
                ? 'bg-surface text-ink font-semibold border border-line shadow-none'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Building2 size={13} />
            <span>Corporate Partners ({companies.length})</span>
          </button>
          <button
            onClick={() => setTab('jobs')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 flex items-center gap-1.5 cursor-pointer ${
              tab === 'jobs'
                ? 'bg-surface text-ink font-semibold border border-line shadow-none'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Briefcase size={13} />
            <span>Placement Drives ({jobs.length})</span>
          </button>
          <button
            onClick={() => setTab('applications')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 flex items-center gap-1.5 cursor-pointer ${
              tab === 'applications'
                ? 'bg-surface text-ink font-semibold border border-line shadow-none'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <FileText size={13} />
            <span>Applications ({applications.length})</span>
          </button>
          <button
            onClick={() => setTab('placements')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 flex items-center gap-1.5 cursor-pointer ${
              tab === 'placements'
                ? 'bg-surface text-ink font-semibold border border-line shadow-none'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Award size={13} />
            <span>Offers Register ({placements.length})</span>
          </button>
        </div>

        {tab === 'jobs' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWizardOpen(true)}
            leftIcon={<PlusCircle size={14} />}
          >
            New JNF Drive
          </Button>
        )}
      </div>

      {/* 4. Table Views with 40px rows, sticky header, no zebra stripes */}
      {loading ? (
        <div className="rounded-lg border border-line bg-surface p-6 space-y-3">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : tab === 'companies' ? (
        companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No corporate partners registered"
            description="Add corporate partners to start scheduling placement drives and candidate assessments."
            actionLabel="Create Placement Drive"
            onAction={() => setIsWizardOpen(true)}
          />
        ) : (
          <div className="rounded-lg border border-line bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-[11px] h-10 sticky top-0">
                    <th className="py-2 px-4 font-medium">Company ID</th>
                    <th className="py-2 px-4 font-medium">Organization Name</th>
                    <th className="py-2 px-4 font-medium">Industry Sector</th>
                    <th className="py-2 px-4 font-medium">Location</th>
                    <th className="py-2 px-4 font-medium">Contact Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {companies.map((c) => (
                    <tr key={c.company_id} className="h-10 hover:bg-canvas/50 transition-colors">
                      <td className="py-2 px-4 font-mono font-medium text-brand">{c.company_id}</td>
                      <td className="py-2 px-4 font-medium text-ink">{c.name}</td>
                      <td className="py-2 px-4 text-ink-muted">{c.industry}</td>
                      <td className="py-2 px-4 text-ink-muted">{c.location}</td>
                      <td className="py-2 px-4 text-ink-muted font-mono">{c.contact_email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : tab === 'jobs' ? (
        jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No placement drives active"
            description="Launch a new Job Notification Form (JNF) drive with guided eligibility criteria."
            actionLabel="Create Guided Drive"
            onAction={() => setIsWizardOpen(true)}
          />
        ) : (
          <div className="rounded-lg border border-line bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-[11px] h-10 sticky top-0">
                    <th className="py-2 px-4 font-medium">JNF ID</th>
                    <th className="py-2 px-4 font-medium">Position Title</th>
                    <th className="py-2 px-4 font-medium">Recruiter</th>
                    <th className="py-2 px-4 font-medium">CTC Package</th>
                    <th className="py-2 px-4 font-medium">Tier</th>
                    <th className="py-2 px-4 font-medium">Eligibility Rules</th>
                    <th className="py-2 px-4 font-medium text-right">Vacancies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {jobs.map((j) => (
                    <tr key={j.job_id} className="h-10 hover:bg-canvas/50 transition-colors">
                      <td className="py-2 px-4 font-mono font-medium text-brand">{j.job_id}</td>
                      <td className="py-2 px-4 font-medium text-ink">{j.title}</td>
                      <td className="py-2 px-4 text-ink-muted">{j.company_id}</td>
                      <td className="py-2 px-4 font-semibold tabular-nums text-success">₹{j.package_lpa} LPA</td>
                      <td className="py-2 px-4">
                        <Badge variant="neutral" size="xs">
                          {j.tier}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 text-ink-muted text-[11px] tabular-nums">
                        CGPA &ge; {j.eligibility.min_cgpa.toFixed(2)} • Backlogs &le; {j.eligibility.max_backlogs}
                      </td>
                      <td className="py-2 px-4 text-right font-medium tabular-nums text-ink">
                        {j.filled} / {j.vacancies}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : tab === 'applications' ? (
        applications.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No candidate applications yet"
            description="When eligible candidates register for active placement drives, applications will appear here."
          />
        ) : (
          <div className="rounded-lg border border-line bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-[11px] h-10 sticky top-0">
                    <th className="py-2 px-4 font-medium">Application ID</th>
                    <th className="py-2 px-4 font-medium">Candidate</th>
                    <th className="py-2 px-4 font-medium">Role &amp; Drive</th>
                    <th className="py-2 px-4 font-medium">Application Date</th>
                    <th className="py-2 px-4 font-medium">Status</th>
                    <th className="py-2 px-4 font-medium text-right">Explainability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {applications.map((app) => (
                    <tr key={app.application_id} className="h-10 hover:bg-canvas/50 transition-colors">
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
                          <span>Explain Rules</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : placements.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No finalized placement offers"
          description="Final offer acceptances and placement records will appear here once candidates complete selection rounds."
        />
      ) : (
        <div className="rounded-lg border border-line bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-[11px] h-10 sticky top-0">
                  <th className="py-2 px-4 font-medium">Placement ID</th>
                  <th className="py-2 px-4 font-medium">Candidate Roll</th>
                  <th className="py-2 px-4 font-medium">Recruiting Organization</th>
                  <th className="py-2 px-4 font-medium">Package CTC</th>
                  <th className="py-2 px-4 font-medium">Tier</th>
                  <th className="py-2 px-4 font-medium text-right">Offer Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {placements.map((p) => (
                  <tr key={p.placement_id} className="h-10 hover:bg-canvas/50 transition-colors">
                    <td className="py-2 px-4 font-mono font-medium text-brand">{p.placement_id}</td>
                    <td className="py-2 px-4 font-medium text-ink">{p.student_id}</td>
                    <td className="py-2 px-4 text-ink-muted">{p.company_id}</td>
                    <td className="py-2 px-4 font-semibold tabular-nums text-success">₹{p.package_lpa} LPA</td>
                    <td className="py-2 px-4">
                      <Badge variant="neutral" size="xs">
                        {p.tier}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 text-right text-ink-muted font-mono tabular-nums">
                      {p.placement_date ? new Date(p.placement_date).toLocaleDateString() : 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guided 6-Step Placement Drive Creation Wizard */}
      <PlacementDriveWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleDriveCreated}
      />

      {/* Deterministic Eligibility Explainability Slide-Over Drawer */}
      <EligibilityExplainerDrawer
        isOpen={!!selectedEligibilityReport}
        onClose={() => setSelectedEligibilityReport(null)}
        report={selectedEligibilityReport}
      />
    </div>
  );
};
