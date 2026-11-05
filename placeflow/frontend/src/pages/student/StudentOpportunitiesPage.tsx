import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { Job, Student } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  EligibilityExplainerDrawer,
  EligibilityReport,
} from '../../components/recruitment/EligibilityExplainerDrawer';
import {
  Target,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  Calendar,
  Sparkles,
  Search,
  Filter,
  Check,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { resolveCompanyName } from '../../utils/formatters';

export const StudentOpportunitiesPage: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [eligibleJobs, setEligibleJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'eligible' | 'all'>('eligible');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<EligibilityReport | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getStudent('STU001'), api.getJobs()])
      .then(([stuRes, jobsRes]) => {
        setStudent(stuRes.student);
        setEligibleJobs(stuRes.eligible_jobs || []);
        setAllJobs(jobsRes.jobs || []);
        const appliedSet = new Set((stuRes.applications || []).map((a) => a.job_id));
        setAppliedJobIds(appliedSet);
        setLoading(false);
      })
      .catch((err) => {
        toast.error('Failed to load opportunities: ' + err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async (job: Job) => {
    if (!student) return;
    setApplyingJobId(job.job_id);
    try {
      await api.applyForJob(student.student_id, job.job_id);
      setAppliedJobIds((prev) => new Set([...prev, job.job_id]));
      toast.success(`Application submitted for ${job.title} at ${resolveCompanyName(job.company_id)}!`, {
        description: 'Your profile has been forwarded to the campus recruiter.',
      });
    } catch (err: any) {
      toast.error('Unable to submit application: ' + err.message);
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleExplain = (job: Job) => {
    const isEligible = eligibleJobs.some((j) => j.job_id === job.job_id);
    const minCgpa = job.eligibility?.min_cgpa ?? 7.0;
    const maxBacklogs = job.eligibility?.max_backlogs ?? 0;
    const cgpaMet = (student?.cgpa ?? 0) >= minCgpa;
    const backlogsMet = (student?.backlogs ?? 0) <= maxBacklogs;

    const report: EligibilityReport = {
      studentId: student?.student_id || 'STU001',
      studentName: student?.name || 'Aarav Sharma',
      department: student?.department || 'Computer Science & Engineering',
      batch: 'Class of 2026',
      companyName: resolveCompanyName(job.company_id),
      jobTitle: job.title,
      overallStatus: isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      policyVersion: 'Autonomous Placement Charter v3.2',
      evaluatedAt: new Date().toLocaleTimeString(),
      overridePermitted: false,
      criteria: [
        {
          ruleName: 'Minimum Cumulative GPA',
          requirement: `CGPA >= ${minCgpa.toFixed(2)}`,
          studentValue: `Your CGPA: ${student?.cgpa?.toFixed(2) || '0.00'}`,
          isSatisfied: cgpaMet,
        },
        {
          ruleName: 'Active Backlog Clearance',
          requirement: `Backlogs <= ${maxBacklogs}`,
          studentValue: `Your Backlogs: ${student?.backlogs ?? 0}`,
          isSatisfied: backlogsMet,
        },
        {
          ruleName: 'Discipline / Branch Match',
          requirement: 'Engineering & Computing Cohort',
          studentValue: student?.department || 'CSE',
          isSatisfied: true,
        },
        {
          ruleName: 'DPDP Act Consent Attestation',
          requirement: 'Candidate Placement Data Sharing Consent',
          studentValue: 'Consent Granted & Cryptographically Verified',
          isSatisfied: true,
        },
      ],
    };
    setSelectedReport(report);
  };

  const displayList = activeTab === 'eligible' ? eligibleJobs : allJobs;
  const filteredJobs = displayList.filter((j) => {
    const compName = resolveCompanyName(j.company_id);
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company_id.toLowerCase().includes(search.toLowerCase()) ||
      compName.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || j.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const highestCtc = eligibleJobs.length > 0
    ? Math.max(...eligibleJobs.map((j) => j.package_lpa || 0)).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Campus Opportunities Feed"
        description="Recruitment drives curated for your academic profile, skill match, and verified credentials."
        badge={
          <Badge variant="success" size="xs">
            Profile Verified &bull; {student?.name || 'Aarav Sharma'} ({student?.student_id || 'STU001'})
          </Badge>
        }
      />

      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Eligible Drives"
          value={loading ? '—' : eligibleJobs.length}
          hint="Matching your CGPA & discipline"
          icon={CheckCircle2}
        />
        <StatCard
          label="Highest Opportunity"
          value={loading ? '—' : `₹${highestCtc} LPA`}
          hint="Super Dream marquee tier"
          icon={Sparkles}
        />
        <StatCard
          label="Applications Sent"
          value={loading ? '—' : appliedJobIds.size}
          hint="Active in recruiter pipeline"
          icon={Briefcase}
        />
        <StatCard
          label="Academic Standing"
          value={loading ? '—' : `${student?.cgpa?.toFixed(2)} CGPA`}
          hint={student?.backlogs === 0 ? 'Zero active backlogs' : `${student?.backlogs} backlogs`}
          icon={Target}
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'eligible', label: `Eligible for Me (${eligibleJobs.length})` },
          { id: 'all', label: `All Campus Drives (${allJobs.length})` },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* Filter / Search Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by role or company..."
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
          </div>
        </div>
      </Card>

      {/* Opportunities List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No opportunities found"
          description={
            search
              ? `No openings matched "${search}".`
              : activeTab === 'eligible'
              ? 'You do not meet current criteria for open drives. Check "All Campus Drives" tab for details.'
              : 'No active recruitment drives currently scheduled.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => {
            const isEligible = eligibleJobs.some((j) => j.job_id === job.job_id);
            const isApplied = appliedJobIds.has(job.job_id);
            const isApplying = applyingJobId === job.job_id;

            return (
              <Card
                key={job.job_id}
                className="p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-150"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-brand font-medium">
                          {resolveCompanyName(job.company_id)}
                        </span>
                        <Badge
                          variant={
                            job.tier === 'Super Dream'
                              ? 'danger'
                              : job.tier === 'Dream'
                              ? 'institutional'
                              : 'neutral'
                          }
                          size="xs"
                        >
                          {job.tier}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-ink text-sm mt-1">{job.title}</h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-success font-mono block tabular-nums">
                        ₹{job.package_lpa} LPA
                      </span>
                      <span className="text-[10px] text-ink-muted">Annual CTC</span>
                    </div>
                  </div>

                  {/* Requirements Pill Strip */}
                  <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                    <span className="flex items-center gap-1 bg-canvas px-2 py-0.5 rounded border border-line">
                      <span>Cutoff:</span>
                      <strong className="text-ink font-mono">
                        &ge; {job.eligibility?.min_cgpa?.toFixed(2) || '7.00'}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1 bg-canvas px-2 py-0.5 rounded border border-line">
                      <span>Max Backlogs:</span>
                      <strong className="text-ink font-mono">
                        {job.eligibility?.max_backlogs ?? 0}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1 bg-canvas px-2 py-0.5 rounded border border-line">
                      <span>Vacancies:</span>
                      <strong className="text-ink font-mono">{job.vacancies}</strong>
                    </span>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="mt-5 pt-3 border-t border-line flex items-center justify-between">
                  <button
                    onClick={() => handleExplain(job)}
                    className="text-[11px] font-medium text-ink-muted hover:text-brand inline-flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle size={13} />
                    <span>Eligibility Audit</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isApplied ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                        <Check size={13} className="text-emerald-600" />
                        Application Submitted
                      </span>
                    ) : isEligible ? (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isApplying}
                        onClick={() => handleApply(job)}
                      >
                        {isApplying ? 'Submitting...' : 'Apply Now'}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                        <AlertCircle size={12} className="text-amber-600" />
                        Criteria Not Met
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Explainer Drawer */}
      <EligibilityExplainerDrawer
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </div>
  );
};

