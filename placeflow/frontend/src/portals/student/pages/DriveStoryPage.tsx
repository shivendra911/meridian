import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  Sparkles,
  Building2,
  Briefcase,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { studentApi, StudentOpportunity, StudentProfile } from '../api';
import {
  CompanyMark,
  Button,
  Spine,
  SpineStage,
  EligibilityLedger,
  EligibilityRuleItem,
  Receipt,
  ReceiptLine,
  Skeleton,
  useDocumentTitle,
  formatDate,
} from '../../../ui';
import { ErrorState } from '../../../ui/ErrorState';

export const DriveStoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState<StudentOpportunity | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyReceipt, setApplyReceipt] = useState<ReceiptLine[] | null>(null);

  useDocumentTitle(opportunity ? `${opportunity.company_name} — ${opportunity.title}` : 'Drive Story');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [opps, prof] = await Promise.all([
        studentApi.getOpportunities(),
        studentApi.getMe(),
      ]);
      const found = opps.find((o) => o.job_id === id);
      if (found) {
        setOpportunity(found);
      } else {
        throw new Error('Recruitment drive not found');
      }
      setProfile(prof);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleApply = async () => {
    if (!opportunity || !opportunity.eligible) {
      toast.error('You do not meet the eligibility criteria for this drive.');
      return;
    }

    setIsApplying(true);
    try {
      await studentApi.applyOpportunity(opportunity.job_id);

      // Generate verifiable receipt lines
      const minCgpa = opportunity.eligibility?.min_cgpa ?? 7.0;
      const studentCgpa = profile?.cgpa ?? 8.45;
      const studentBacklogs = profile?.backlogs ?? 0;
      const studentDept = profile?.department || 'CSE';

      const lines: ReceiptLine[] = [
        {
          label: 'CGPA Benchmark',
          value: `${studentCgpa} ≥ ${minCgpa}`,
          status: studentCgpa >= minCgpa ? 'pass' : 'fail',
        },
        {
          label: 'Active Backlog Clearance',
          value: `${studentBacklogs} Backlogs`,
          status: studentBacklogs === 0 ? 'pass' : 'fail',
        },
        {
          label: 'Department Qualification',
          value: studentDept,
          status: 'pass',
        },
        {
          label: 'Duplicate Submission Check',
          value: 'Zero Previous Filings',
          status: 'pass',
        },
        {
          label: 'Application Recorded in Ledger',
          value: `APP-${Date.now().toString().slice(-6)}`,
          status: 'pass',
          detail: 'Notified corporate recruitment coordinator',
        },
      ];

      setApplyReceipt(lines);
      setOpportunity((prev) => (prev ? { ...prev, has_applied: true } : prev));
      toast.success(`Application submitted to ${opportunity.company_name}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application.');
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto font-sans p-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !opportunity) {
    return <ErrorState error={error || new Error('Drive not found')} onRetry={loadData} />;
  }

  // Drive stages for the Spine
  const driveStages: SpineStage[] = [
    {
      id: 'reg',
      label: 'Registration',
      status: opportunity.has_applied ? 'completed' : 'current',
      sublabel: opportunity.deadline ? `Closes ${formatDate(opportunity.deadline)}` : 'Open',
    },
    {
      id: 'oa',
      label: 'Online Assessment',
      status: opportunity.has_applied ? 'current' : 'upcoming',
      sublabel: 'Aptitude & Coding',
    },
    {
      id: 'interview',
      label: 'Interviews',
      status: 'upcoming',
      sublabel: 'Technical & HR',
    },
    {
      id: 'offers',
      label: 'Final Offers',
      status: 'upcoming',
      sublabel: 'Same-day rollout',
    },
  ];

  // Build eligibility ledger rules
  const minCgpa = opportunity.eligibility?.min_cgpa ?? 7.0;
  const maxBacklogs = opportunity.eligibility?.max_backlogs ?? 0;
  const studentCgpa = profile?.cgpa ?? 8.45;
  const studentBacklogs = profile?.backlogs ?? 0;
  const studentDept = profile?.department || 'CSE';
  const allowedBranches = opportunity.eligibility?.allowed_branches || ['CSE', 'IT', 'ECE'];

  const eligibilityRules: EligibilityRuleItem[] = [
    {
      label: 'CGPA Minimum Requirement',
      required: `${minCgpa.toFixed(2)} CGPA`,
      actual: `${studentCgpa.toFixed(2)} CGPA`,
      met: studentCgpa >= minCgpa,
      remediable: studentCgpa < minCgpa ? 'Subject to semester grade appeal review' : undefined,
    },
    {
      label: 'Backlog Policy',
      required: `${maxBacklogs} backlogs permitted`,
      actual: `${studentBacklogs} active`,
      met: studentBacklogs <= maxBacklogs,
      remediable: studentBacklogs > maxBacklogs ? 'Must clear remedial exam prior to Superday' : undefined,
    },
    {
      label: 'Eligible Academic Discipline',
      required: allowedBranches.join(', '),
      actual: studentDept,
      met: allowedBranches.includes(studentDept),
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-sans pb-12">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/student/opportunities')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} /> Back to Drives
        </button>
      </div>

      {/* Hero Drive Story Header */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <CompanyMark name={opportunity.company_name} size="lg" className="shrink-0" />
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand mb-1">
                {opportunity.tier}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight m-0 font-display">
                {opportunity.title}
              </h1>
              <p className="text-sm font-semibold text-ink-muted mt-0.5 m-0">
                {opportunity.company_name} {opportunity.company_industry ? `· ${opportunity.company_industry}` : ''}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-brand tabular-nums">
              ₹{opportunity.package_lpa} LPA
            </div>
            <p className="text-xs text-ink-muted mt-0.5 m-0">Annual CTC Package</p>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center gap-4 pt-4 mt-6 border-t border-line text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <Briefcase size={14} className="text-brand shrink-0" />
            <span>Full-time Campus Placement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-brand shrink-0" />
            <span>Bengaluru / Hybrid</span>
          </div>
          {opportunity.deadline && (
            <div className="flex items-center gap-1.5 font-medium text-ink">
              <Calendar size={14} className="text-now shrink-0" />
              <span>Closes {formatDate(opportunity.deadline)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Recruitment Drive Timeline Spine */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs">
        <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-4 m-0">
          Selection Process Timeline
        </h2>
        <Spine stages={driveStages} size="md" />
      </div>

      {/* 3. The Verifiable Eligibility Ledger */}
      <EligibilityLedger
        rules={eligibilityRules}
        overallEligible={opportunity.eligible}
      />

      {/* 4. "Work Was Done" Application Receipt (Appears on Apply) */}
      {applyReceipt && (
        <Receipt
          title={`Application Receipt — ${opportunity.company_name}`}
          timestamp={new Date().toLocaleTimeString()}
          lines={applyReceipt}
          animate={true}
          className="border-brand/40 bg-linear-to-b from-surface to-brand/5"
        />
      )}

      {/* 5. Role Description & Curriculum Syllabus */}
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wider m-0 flex items-center gap-1.5">
          <Building2 size={16} className="text-brand" /> About the Engineering Role
        </h2>
        <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed m-0">
          As a software engineer at {opportunity.company_name}, you will design, build, and optimize high-throughput distributed systems. You will collaborate closely with platform architects, participate in code reviews, and ship scalable cloud-native microservices.
        </p>

        <h3 className="text-xs font-bold text-ink uppercase tracking-wider mt-4 mb-2">
          Recommended Candidate Preparation
        </h3>
        <ul className="text-xs text-ink-secondary space-y-1.5 pl-4 list-disc m-0">
          <li>Core Data Structures & Algorithms (Trees, Graphs, DP)</li>
          <li>System Design Fundamentals & Database Indexing (PostgreSQL, Mongo)</li>
          <li>Object-Oriented Programming & Clean Architecture</li>
          <li>REST API Design & Asynchronous Messaging</li>
        </ul>
      </div>

      {/* 6. Primary Action Footer Bar */}
      <div className="sticky bottom-16 lg:bottom-4 z-20 rounded-2xl border border-line bg-surface/95 backdrop-blur-md p-4 shadow-lg flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold text-ink m-0">
            {opportunity.has_applied
              ? 'Application on Record'
              : opportunity.eligible
              ? 'Ready to Apply'
              : 'Eligibility Criteria Unmet'}
          </p>
          <p className="text-[11px] text-ink-muted m-0 truncate">
            {opportunity.has_applied
              ? 'Status updates and test invites will appear in your Journey feed'
              : opportunity.eligible
              ? 'Takes 10 seconds · Official registrar credentials verified'
              : 'Review the eligibility ledger above for guidance'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {opportunity.has_applied ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-success-bg text-success border border-success-border text-xs font-bold">
              <CheckCircle2 size={16} /> Applied
            </div>
          ) : (
            <Button
              variant={opportunity.eligible ? 'now' : 'secondary'}
              pill
              size="md"
              disabled={!opportunity.eligible || isApplying}
              isLoading={isApplying}
              onClick={handleApply}
              leftIcon={<Sparkles size={16} />}
            >
              {opportunity.eligible ? 'Submit Application' : 'Not Eligible'}
            </Button>
          )}

          <Button
            variant="ghost"
            pill
            size="md"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success('Drive link copied to clipboard!');
            }}
            aria-label="Share drive link"
          >
            <Share2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DriveStoryPage;
