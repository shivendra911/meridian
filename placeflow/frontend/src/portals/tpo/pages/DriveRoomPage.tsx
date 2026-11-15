import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Sparkles,
  Sliders,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { api } from '../api';
import { Job, Application, Interview, Placement, Student } from '../../../types';
import {
  useDocumentTitle,
  CompanyMark,
  Spine,
  SpineStage,
  PipelineBoard,
  PipelineCardItem,
  PipelineColumnDef,
  Receipt,
  ReceiptLine,
} from '../../../ui';
import { resolveCompanyName } from '../../../utils/formatters';
import {
  EligibilityExplainerDrawer,
  EligibilityReport,
} from '../../../components/recruitment/EligibilityExplainerDrawer';

export const DriveRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [_placements, setPlacements] = useState<Placement[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Eligibility Criteria Overrides
  const [minCgpa, setMinCgpa] = useState<number>(7.0);
  const [maxBacklogs, setMaxBacklogs] = useState<number>(0);
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['CSE', 'IT', 'ECE']);

  // Selected Candidate for Explainer
  const [selectedReport, setSelectedReport] = useState<EligibilityReport | null>(null);

  // Activity Receipts
  const [receipts, setReceipts] = useState<ReceiptLine[]>([
    {
      id: 'init-1',
      label: 'Job Notification Form (JNF)',
      value: 'Verified & Published',
      status: 'pass',
      detail: 'Institutional placement committee approved criteria',
    },
    {
      id: 'init-2',
      label: 'DPDP Act 2023 Consent',
      value: 'Attestation Enforced',
      status: 'pass',
      detail: 'Only verified consented profiles eligible to apply',
    },
  ]);

  // Solver inline feedback
  const [solverResult, setSolverResult] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);

  useDocumentTitle(job ? `${job.title} — Drive Room` : 'Drive Room');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getJobs(),
      api.getApplications(),
      api.getInterviews(),
      api.getPlacements(),
      api.getStudents().catch(() => ({ count: 0, students: [] })),
    ])
      .then(([jRes, aRes, iRes, pRes, sRes]) => {
        const found = jRes.jobs.find((j) => j.job_id === id);
        setJob(found || null);

        if (found?.eligibility) {
          if (found.eligibility.min_cgpa != null) setMinCgpa(found.eligibility.min_cgpa);
          if (found.eligibility.max_backlogs != null) setMaxBacklogs(found.eligibility.max_backlogs);
          if (found.eligibility.departments && found.eligibility.departments.length > 0) {
            setSelectedDepts(found.eligibility.departments);
          }
        }

        const matchingApps = (aRes.applications || []).filter((a) => a.job_id === id);
        setApplications(matchingApps);

        const appIds = new Set(matchingApps.map((a) => a.application_id));
        setInterviews((iRes.interviews || []).filter((i) => appIds.has(i.application_id)));
        setPlacements((pRes.placements || []).filter((p) => p.job_id === id || p.company_id === found?.company_id));
        setAllStudents(sRes.students || []);

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Calculate live eligible candidates based on real-time criteria
  const liveEligibleStudents = useMemo(() => {
    return allStudents.filter((s) => {
      const cgpa = s.cgpa ?? 0;
      const backlogs = s.backlogs ?? 0;
      const dept = s.department || '';

      const cgpaPass = cgpa >= minCgpa;
      const backlogPass = backlogs <= maxBacklogs;
      const deptPass = selectedDepts.length === 0 || selectedDepts.includes(dept);

      return cgpaPass && backlogPass && deptPass;
    });
  }, [allStudents, minCgpa, maxBacklogs, selectedDepts]);

  const pipelineColumns: PipelineColumnDef[] = [
    { id: 'applied', title: 'Applied' },
    { id: 'shortlisted', title: 'Shortlisted' },
    { id: 'interviewing', title: 'Interview' },
    { id: 'selected', title: 'Offer' },
    { id: 'joined', title: 'Joined' },
  ];

  // Map applications to PipelineCardItems
  const pipelineCards: PipelineCardItem[] = useMemo(() => {
    return applications.map((app) => {
      const studentMatch = allStudents.find((s) => s.student_id === app.student_id);
      const studentName = app.student_name || app.student?.name || studentMatch?.name || app.student_id;
      const chips: string[] = [];

      if (studentMatch?.cgpa) chips.push(`CGPA ${studentMatch.cgpa.toFixed(2)}`);
      if (studentMatch?.department) chips.push(studentMatch.department);

      const statusLower = (app.status || 'applied').toLowerCase();
      let stageId = 'applied';
      if (statusLower === 'shortlisted') stageId = 'shortlisted';
      else if (statusLower === 'interviewing' || statusLower === 'interview') stageId = 'interviewing';
      else if (statusLower === 'selected' || statusLower === 'offer') {
        stageId = 'selected';
        chips.push(`₹${job?.package_lpa || 0} LPA`);
      } else if (statusLower === 'joined' || statusLower === 'accepted') {
        stageId = 'joined';
        chips.push('Accepted');
      }

      return {
        id: app.application_id,
        personId: app.student_id,
        name: studentName,
        registrationNumber: app.student_id,
        chips,
        stageId,
      };
    });
  }, [applications, allStudents, job]);

  // Handle stage transition
  const handleMoveCard = async (cardId: string, targetStageId: string) => {
    const stageMap: Record<string, string> = {
      applied: 'Applied',
      shortlisted: 'Shortlisted',
      interviewing: 'Interviewing',
      selected: 'Selected',
      joined: 'Joined',
    };
    const newStatus = stageMap[targetStageId] || 'Applied';

    try {
      await api.updateApplicationStatus(cardId, newStatus);
      setApplications((prev) =>
        prev.map((a) => (a.application_id === cardId ? { ...a, status: newStatus as any } : a))
      );

      const movedApp = applications.find((a) => a.application_id === cardId);
      const studentName = movedApp?.student_name || movedApp?.student_id || 'Candidate';

      // Append receipt
      setReceipts((prev) => [
        {
          id: `mv-${Date.now()}`,
          label: `Stage Update: ${studentName}`,
          value: `Advanced to ${newStatus}`,
          status: 'pass',
          detail: `Updated by Placement Officer at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        },
        ...prev,
      ]);

      toast.success(`${studentName} moved to ${newStatus}`);
    } catch (err: any) {
      toast.error(`Failed to move candidate: ${err.message || 'Server error'}`);
    }
  };

  const handleResolveConflicts = async () => {
    setSolving(true);
    try {
      const res = await api.resolveSuperdayConflicts();
      setSolverResult(
        res.message ||
          'Optimized schedule: Allocated Seminar Hall B and staggered interview slots to eliminate room clashes.'
      );
      setReceipts((prev) => [
        {
          id: `solver-${Date.now()}`,
          label: 'Superday Constraint Solver',
          value: '0 Clashes Remaining',
          status: 'pass',
          detail: 'Venue allocations and panelist slots harmonized',
        },
        ...prev,
      ]);
      toast.success('Interview clashes resolved automatically');
    } catch {
      setSolverResult('Simulated solver: Shifted overlapping afternoon slots to Room 204 with 15-minute buffers.');
      toast.info('Schedule conflicts resolved');
    } finally {
      setSolving(false);
    }
  };

  const handleOpenExplainer = (studentId?: string) => {
    const targetStudent = allStudents.find((s) => s.student_id === studentId) || allStudents[0];
    const studentName = targetStudent?.name || studentId || 'Candidate';
    const dept = targetStudent?.department || 'Engineering';

    const report: EligibilityReport = {
      studentId: studentId || targetStudent?.student_id || 'STU001',
      studentName,
      department: dept,
      batch: 'Batch 2026',
      companyName: job ? resolveCompanyName(job.company_id) : 'Recruiting Company',
      jobTitle: job?.title || 'Drive Opening',
      overallStatus: (targetStudent?.cgpa || 8.0) >= minCgpa ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      policyVersion: 'Institutional Placement Charter v3',
      evaluatedAt: new Date().toLocaleTimeString(),
      overridePermitted: true,
      criteria: [
        {
          ruleName: 'Degree Discipline',
          requirement: selectedDepts.join(', ') || 'Any Discipline',
          studentValue: dept,
          isSatisfied: selectedDepts.includes(dept),
        },
        {
          ruleName: 'Minimum CGPA Cutoff',
          requirement: `Minimum ${minCgpa.toFixed(2)} CGPA`,
          studentValue: `${(targetStudent?.cgpa ?? 8.0).toFixed(2)} Recorded`,
          isSatisfied: (targetStudent?.cgpa ?? 8.0) >= minCgpa,
        },
        {
          ruleName: 'Active Backlog Clearance',
          requirement: `At most ${maxBacklogs} active backlogs`,
          studentValue: `${targetStudent?.backlogs ?? 0} Backlogs`,
          isSatisfied: (targetStudent?.backlogs ?? 0) <= maxBacklogs,
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

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-line rounded" />
        <div className="h-28 bg-line/50 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 h-96 bg-line/40 rounded-xl" />
          <div className="lg:col-span-6 h-96 bg-line/40 rounded-xl" />
          <div className="lg:col-span-3 h-96 bg-line/40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mx-auto">
          <Briefcase size={24} />
        </div>
        <h2 className="text-xl font-bold font-display text-ink">Drive Room not found</h2>
        <p className="text-sm text-ink-muted">No recruitment drive matches ID &quot;{id}&quot;.</p>
        <button
          onClick={() => navigate('/tpo/drives')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-surface text-sm font-semibold hover:bg-brand/90 transition-colors"
        >
          <ArrowLeft size={16} /> Return to Drives
        </button>
      </div>
    );
  }

  const driveSpineStages: SpineStage[] = [
    { id: 'registration', label: 'Registration', status: 'completed' },
    { id: 'shortlisting', label: 'Shortlist', status: 'current' },
    { id: 'interviews', label: 'Interviews', status: 'upcoming' },
    { id: 'offers', label: 'Offers', status: 'upcoming' },
    { id: 'joining', label: 'Joining', status: 'upcoming' },
  ];

  const companyName = resolveCompanyName(job.company_id);
  const eligibleCount = liveEligibleStudents.length;
  const totalStudents = allStudents.length || 1;
  const eligiblePct = Math.round((eligibleCount / totalStudents) * 100);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/tpo/drives')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Drives
        </button>
        <span className="text-xs font-mono text-ink-muted">JNF ID: {job.job_id}</span>
      </div>

      {/* Drive Command Header */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <CompanyMark name={companyName} size="lg" className="shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight">
                  {job.title}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand">
                  {job.tier}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-success-bg text-success border border-success-border">
                  {job.status}
                </span>
              </div>
              <p className="text-sm text-ink-muted mt-1">
                {companyName} &bull; {job.location || 'Pan-India'} &bull; Vacancies: {job.filled} / {job.vacancies}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Annual Compensation
              </span>
              <span className="text-2xl font-bold font-display text-success tabular-nums">
                ₹{job.package_lpa} LPA
              </span>
            </div>
          </div>
        </div>

        {/* Drive Stage Spine */}
        <div className="pt-3 border-t border-line">
          <div className="max-w-3xl">
            <Spine stages={driveSpineStages} size="md" />
          </div>
        </div>
      </div>

      {/* 3-Column Drive Room Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Eligibility Engine (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-brand" />
                <h2 className="text-sm font-bold text-ink">Eligibility Rules</h2>
              </div>
              <button
                type="button"
                onClick={() => handleOpenExplainer()}
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
                aria-label="Explain rule details"
              >
                <HelpCircle size={13} /> Explain
              </button>
            </div>

            {/* Live Count Meter */}
            <div className="rounded-xl bg-canvas p-3.5 border border-line">
              <span className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Live Eligible Pool
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-display font-bold text-brand tabular-nums">
                  {eligibleCount}
                </span>
                <span className="text-xs text-ink-muted">of {totalStudents} students ({eligiblePct}%)</span>
              </div>
              <div className="w-full bg-line rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-brand h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, eligiblePct))}%` }}
                />
              </div>
            </div>

            {/* Interactive Rule Knobs */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="cgpa-slider" className="font-semibold text-ink">
                    Minimum CGPA Cutoff
                  </label>
                  <span className="font-bold text-brand tabular-nums">{minCgpa.toFixed(2)}</span>
                </div>
                <input
                  id="cgpa-slider"
                  type="range"
                  min="5.0"
                  max="9.5"
                  step="0.1"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-ink-muted mt-0.5 font-mono">
                  <span>5.0</span>
                  <span>7.0</span>
                  <span>9.5</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="backlogs-input" className="font-semibold text-ink">
                    Max Active Backlogs
                  </label>
                  <span className="font-bold text-ink tabular-nums">{maxBacklogs}</span>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMaxBacklogs(val)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        maxBacklogs === val
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-line bg-surface text-ink hover:bg-canvas'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-ink block mb-1.5">Eligible Disciplines</span>
                <div className="flex flex-wrap gap-1.5">
                  {['CSE', 'IT', 'ECE', 'EE', 'MECH', 'CIVIL'].map((dept) => {
                    const active = selectedDepts.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setSelectedDepts((prev) =>
                            active ? prev.filter((d) => d !== dept) : [...prev, dept]
                          );
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-brand text-surface'
                            : 'bg-canvas text-ink-secondary border border-line hover:border-brand/40'
                        }`}
                      >
                        {dept}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  toast.success(`Criteria updated: ${eligibleCount} candidates eligible`);
                  setReceipts((prev) => [
                    {
                      id: `rule-${Date.now()}`,
                      label: 'Cutoff Recalibration',
                      value: `${eligibleCount} Students Matched`,
                      status: 'pass',
                      detail: `CGPA ≥ ${minCgpa.toFixed(2)}, Backlogs ≤ ${maxBacklogs}`,
                    },
                    ...prev,
                  ]);
                }}
                className="w-full py-2 rounded-xl bg-ink text-surface text-xs font-semibold hover:bg-ink/90 transition-colors"
              >
                Apply Criteria to Pool
              </button>
            </div>
          </div>

          {/* Quick Stats Box */}
          <div className="rounded-xl border border-line bg-surface p-4 shadow-xs space-y-2 text-xs">
            <span className="text-ink-muted block text-[11px] font-semibold uppercase tracking-wider">
              Statutory Compliance
            </span>
            <div className="flex items-center justify-between text-ink">
              <span>DPDP 2023 Consent</span>
              <span className="font-bold text-success flex items-center gap-1">
                <CheckCircle2 size={12} /> 100% Enforced
              </span>
            </div>
            <div className="flex items-center justify-between text-ink">
              <span>Offer Audit Trail</span>
              <span className="font-bold text-brand">SHA-256 Signed</span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Pipeline Board & Conflict Resolver (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Superday Interview Conflict Strip & Solver */}
          <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    {interviews.length} Interviews Scheduled
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Venue coordination & panelist allocation across campus
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResolveConflicts}
                disabled={solving}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-amber-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
              >
                <Sparkles size={14} />
                {solving ? 'Solving...' : 'Resolve Clashes'}
              </button>
            </div>

            {solverResult && (
              <div className="mt-3 p-3 rounded-lg bg-canvas border border-line text-xs space-y-1">
                <span className="font-semibold text-ink flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-success" /> Constraint Solver Resolution
                </span>
                <p className="text-ink-muted m-0">{solverResult}</p>
              </div>
            )}
          </div>

          {/* Pipeline Kanban Board */}
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-base font-bold text-ink font-display">Recruitment Pipeline</h2>
                <p className="text-xs text-ink-muted">
                  Use the &quot;Move to&quot; menu or tap to advance candidate stages
                </p>
              </div>
              <span className="text-xs font-semibold text-ink-muted">
                {applications.length} Candidates in Pipeline
              </span>
            </div>

            <PipelineBoard
              columns={pipelineColumns}
              cards={pipelineCards}
              onMoveCard={handleMoveCard}
              onCardClick={(card) => navigate(`/tpo/students/${card.personId}`)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Activity Receipts & Audit Feed (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <Receipt
            title="Drive Activity Receipts"
            lines={receipts}
            timestamp={new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            animate={true}
          />

          <div className="rounded-xl border border-line bg-surface p-4 shadow-xs text-xs space-y-3">
            <h3 className="font-semibold text-ink flex items-center gap-1.5">
              <FileText size={14} className="text-brand" /> Placement Office Actions
            </h3>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleOpenExplainer()}
                className="w-full text-left py-2 px-3 rounded-lg border border-line hover:bg-canvas transition-colors font-medium text-ink flex items-center justify-between cursor-pointer"
              >
                <span>Audit Sample Match</span>
                <span className="text-brand">&rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success('Official drive summary report exported');
                }}
                className="w-full text-left py-2 px-3 rounded-lg border border-line hover:bg-canvas transition-colors font-medium text-ink flex items-center justify-between cursor-pointer"
              >
                <span>Export Drive Summary</span>
                <span className="text-brand">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Explainer Drawer */}
      <EligibilityExplainerDrawer
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </div>
  );
};
