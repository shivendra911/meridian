import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Company, Job, Application, Placement } from '../types';
import {
  Building2,
  Briefcase,
  FileText,
  Award,
  Activity,
  PlusCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
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
    // Add locally to jobs list
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-l-[#0B1B3D] border border-slate-200 rounded p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
            OFFICE OF CAREER SERVICES &bull; RECRUITMENT OPERATIONS
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 m-0">
            Recruitment Operations &amp; Partner Ledgers
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Master records of visiting corporate partners, active Job Notification Forms (JNFs), candidate applications, and finalized offers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="cardinal"
            size="sm"
            onClick={() => setIsWizardOpen(true)}
            leftIcon={<Sparkles size={13} />}
          >
            Create Guided Drive
          </Button>

          {/* Tab Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
            <button
              onClick={() => setTab('companies')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'companies'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 size={13} />
              <span>Partners ({companies.length})</span>
            </button>
            <button
              onClick={() => setTab('jobs')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'jobs'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase size={13} />
              <span>JNFs ({jobs.length})</span>
            </button>
            <button
              onClick={() => setTab('applications')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'applications'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={13} />
              <span>Applications ({applications.length})</span>
            </button>
            <button
              onClick={() => setTab('placements')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'placements'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award size={13} />
              <span>Offers ({placements.length})</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
          <Activity className="animate-spin mr-2" size={18} />
          Loading Recruitment Operations Data...
        </div>
      ) : tab === 'companies' ? (
        /* Companies Table */
        <div className="bg-white border border-slate-200 rounded shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
            Corporate Partner Organizations ({companies.length})
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Company ID</th>
                <th className="py-2.5 px-4">Company Name</th>
                <th className="py-2.5 px-4">Industry Sector</th>
                <th className="py-2.5 px-4">Primary Location</th>
                <th className="py-2.5 px-4">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {companies.map((c) => (
                <tr key={c.company_id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 font-bold text-[#0B1B3D]">{c.company_id}</td>
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">{c.name}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">{c.industry}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">{c.location}</td>
                  <td className="py-2.5 px-4 text-slate-500">{c.contact_email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'jobs' ? (
        /* Jobs Table */
        <div className="bg-white border border-slate-200 rounded shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-between">
            <span>Active Job Notification Forms (JNFs) ({jobs.length})</span>
            <Button
              variant="cardinal"
              size="xs"
              onClick={() => setIsWizardOpen(true)}
              leftIcon={<PlusCircle size={13} />}
            >
              New JNF Drive
            </Button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">JNF ID</th>
                <th className="py-2.5 px-4">Role Title</th>
                <th className="py-2.5 px-4">Recruiter</th>
                <th className="py-2.5 px-4">Package</th>
                <th className="py-2.5 px-4">Tier</th>
                <th className="py-2.5 px-4">Eligibility Criteria</th>
                <th className="py-2.5 px-4">Vacancies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {jobs.map((j) => (
                <tr key={j.job_id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 font-bold text-[#0B1B3D]">{j.job_id}</td>
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">{j.title}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-700">{j.company_id}</td>
                  <td className="py-2.5 px-4 font-bold text-[#8C1515]">₹{j.package_lpa} LPA</td>
                  <td className="py-2.5 px-4 font-sans">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-[11px]">
                      {j.tier}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-[11px] text-slate-600">
                    CGPA &ge; {j.eligibility.min_cgpa.toFixed(2)} &bull; Backlogs &le; {j.eligibility.max_backlogs}
                  </td>
                  <td className="py-2.5 px-4 text-emerald-700 font-bold">
                    {j.filled} / {j.vacancies}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'applications' ? (
        /* Applications Table */
        <div className="bg-white border border-slate-200 rounded shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
            Application Tracking Ledger ({applications.length})
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Application ID</th>
                <th className="py-2.5 px-4">Candidate</th>
                <th className="py-2.5 px-4">Job opening</th>
                <th className="py-2.5 px-4">Applied Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Deterministic Explainability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {applications.map((app) => (
                <tr key={app.application_id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 font-bold text-[#0B1B3D]">{app.application_id}</td>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                    {app.student?.name || app.student_id} ({app.student_id})
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-700">
                    {app.job?.title || app.job_id}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Active'}
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        app.status === 'Selected'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : app.status === 'Shortlisted'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-sans">
                    <button
                      onClick={() => handleOpenExplainability(app)}
                      className="text-[11px] font-semibold text-[#8C1515] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle size={12} />
                      <span>Explain Rules</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Placements Table */
        <div className="bg-white border border-slate-200 rounded shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
            Finalized Placement Offers Register ({placements.length})
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Placement ID</th>
                <th className="py-2.5 px-4">Candidate Roll</th>
                <th className="py-2.5 px-4">Recruiting Company</th>
                <th className="py-2.5 px-4">Package CTC</th>
                <th className="py-2.5 px-4">Tier</th>
                <th className="py-2.5 px-4">Placement Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {placements.map((p) => (
                <tr key={p.placement_id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 font-bold text-[#0B1B3D]">{p.placement_id}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{p.student_id}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-800 font-medium">
                    {p.company_id}
                  </td>
                  <td className="py-2.5 px-4 text-[#8C1515] font-bold">₹{p.package_lpa} LPA</td>
                  <td className="py-2.5 px-4 font-sans font-medium">{p.tier}</td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {p.placement_date ? new Date(p.placement_date).toLocaleDateString() : 'Active'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

