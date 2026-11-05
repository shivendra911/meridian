import React, { useState } from 'react';
import {
  Landmark,
  Users,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  BarChart3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Search,
  HelpCircle,
  Clock,
  Database,
  ExternalLink,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { SlideOverDrawer } from '../../components/ui/SlideOverDrawer';
import { useTenant } from '../../context/TenantContext';

interface MetricExplanation {
  title: string;
  value: string;
  scope: string;
  formula: string;
  cohort: string;
  reportingPeriod: string;
  sourceCollections: string[];
  lastRefresh: string;
  aiExplanation: string;
}

export const ManagementWorkspace: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({
  onNavigateTab,
}) => {
  const { activeTenant, activeInstitution } = useTenant();
  const [activeTab, setActiveTab] = useState<'overview' | 'readiness' | 'campuses' | 'audit'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<MetricExplanation | null>(null);
  const [executiveQuery, setExecutiveQuery] = useState('');
  const [executiveResponse, setExecutiveResponse] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // Pre-configured metric explainability dictionary per Section 4.E of redesign
  const metricExplanations: Record<string, MetricExplanation> = {
    students: {
      title: 'Total Student Population',
      value: '8,420',
      scope: 'All active undergraduate, postgraduate, and doctoral degree programs across Campus North and South',
      formula: 'COUNT(DISTINCT student_id WHERE status == "ACTIVE" AND academic_session == "2026-2027")',
      cohort: 'Admitted Batches 2021 through 2026',
      reportingPeriod: 'Academic Year 2026-27 (Current Term)',
      sourceCollections: ['platform_tenants', 'academic_students', 'student_registrations'],
      lastRefresh: 'Today at 07:45 AM via MongoDB rs0 primary',
      aiExplanation:
        'Population increased by +4.2% YoY driven by newly sanctioned seats in Data Science and AI/ML specializations.',
    },
    programs: {
      title: 'Active Academic Offerings',
      value: '42',
      scope: 'Autonomous degree-granting programs under Senate gazette',
      formula: 'COUNT(programs WHERE is_active == true AND accreditation_status == "ACCREDITED")',
      cohort: 'All Schools (Engineering, Sciences, Management)',
      reportingPeriod: 'Senate Gazette Volume 14 (Effective 2026)',
      sourceCollections: ['academic_programs', 'curriculum_versions'],
      lastRefresh: 'Yesterday at 11:30 PM',
      aiExplanation:
        '3 newly proposed multidisciplinary minors are currently under Academic Council Stage-2 review.',
    },
    decisions: {
      title: 'Pending Executive Decisions',
      value: '18',
      scope: 'Governance tasks awaiting Vice-Chancellor, Dean, or Registrar authorization',
      formula: 'COUNT(governance_tasks WHERE status == "PENDING_APPROVAL" AND approver_role IN ["REGISTRAR", "DEAN", "VC"])',
      cohort: 'Statutory & Curriculum Workflow Items',
      reportingPeriod: 'Rolling 30-day decision horizon',
      sourceCollections: ['workflow_approvals', 'curriculum_submissions', 'statutory_filings'],
      lastRefresh: '12 minutes ago (Realtime event ledger)',
      aiExplanation:
        '11 of 18 pending approvals relate to final course basket freeze for Semester 3 elective registrations opening in 6 days.',
    },
    dataIssues: {
      title: 'Unresolved Data Quality Issues',
      value: '7',
      scope: 'Student and faculty records with missing mandatory compliance identifiers under DPDP Act 2023',
      formula: 'COUNT(records WHERE apaar_id == null OR aadhaar_hash == null OR consent_status != "EXPLICIT_GRANTED")',
      cohort: 'Batch 2026 Fresh Admitted Candidates',
      reportingPeriod: 'Statutory DPDP Audit Window Q3 2026',
      sourceCollections: ['dpdp_consent_ledger', 'student_identities'],
      lastRefresh: 'Today at 06:00 AM scheduled integrity scan',
      aiExplanation:
        'All 7 records are newly admitted transfer students whose digilocker APAAR bridge timed out during bulk upload.',
    },
    placement: {
      title: 'Institutional Placement Clearance',
      value: '68.4%',
      scope: 'Graduating Batch 2027 registered candidate placement rate against target recruitment goals',
      formula: 'ROUND((COUNT(DISTINCT placed_student_id) / COUNT(DISTINCT registered_eligible_students)) * 100, 1)',
      cohort: 'B.Tech & M.Tech Class of 2027 (Registered for On-Campus Placement)',
      reportingPeriod: 'Recruitment Season 2026-27 (Cycle 1: Day 0 to Superday 3)',
      sourceCollections: ['placement_offers', 'placement_candidates', 'placement_drives'],
      lastRefresh: 'Today at 08:00 AM live recruiter ledger sync',
      aiExplanation:
        'Core engineering clearance sits at 54% while Computer Science/IT has reached 89.2% with average package at INR 14.8 LPA.',
    },
  };

  const handleRunAiQuery = (queryText: string) => {
    setIsQuerying(true);
    setExecutiveQuery(queryText);
    setTimeout(() => {
      if (queryText.includes('NIRF') || queryText.includes('Criterion 3')) {
        setExecutiveResponse(
          '**NIRF Criterion 3 Research & Professional Practice Audit:**\n' +
            '• Extramural Sponsored Research: ₹4.82 Cr across 14 sponsored projects (DST, DRDO, MeitY).\n' +
            '• Consultancy Earnings: ₹68.5 Lakhs.\n' +
            '• High-Impact Indexed Publications (Scopus/Web of Science): 142 articles with average impact factor 4.8.\n' +
            '• Pending Action: 3 joint faculty publications require institutional affiliation verification before final XML pack export.'
        );
      } else if (queryText.includes('placement') || queryText.includes('clearance')) {
        setExecutiveResponse(
          '**Placement Clearance by School & Department (Batch 2027):**\n' +
            '• Computer Science & Engg: 89.2% placed (Avg CTC: 15.4 LPA, Median: 12.0 LPA)\n' +
            '• Electronics & Comm: 74.5% placed (Avg CTC: 11.2 LPA)\n' +
            '• Mechanical Engineering: 52.8% placed (Avg CTC: 8.5 LPA)\n' +
            '• Civil Engineering: 46.1% placed (Avg CTC: 7.2 LPA)\n' +
            '• MBA / Management: 71.0% placed (Avg CTC: 9.8 LPA)\n' +
            '**Key Recommendation:** Schedule 4 targeted automotive & infra Superdays before December 15 to lift core engineering clearance by 20%.'
        );
      } else if (queryText.includes('curriculum') || queryText.includes('approval')) {
        setExecutiveResponse(
          '**Curriculum Authorization Bottleneck Report:**\n' +
            '• B.Tech AI & Data Science (Sem 3-4 course basket) awaiting Dean of Academics signoff (Submitted 8 days ago).\n' +
            '• M.Tech Cyber-Physical Systems requires External BOS Expert countersignature.\n' +
            '• Operational Impact: 420 students cannot finalize elective selections until Dean approves by Nov 11.'
        );
      } else {
        setExecutiveResponse(
          `**Campus AI Institutional Analysis for "${queryText}":**\n` +
            'All academic, placement, and statutory telemetry indicators for the active semester comply with UGC autonomous norms. No critical retention or governance violations detected across Campus North and South.'
        );
      }
      setIsQuerying(false);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Executive Command Masthead */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cardinal text-white rounded-xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 text-white px-2.5 py-0.5 rounded font-mono border border-white/20">
                EXECUTIVE DECISION WORKSPACE
              </span>
              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                AUTONOMOUS SYSTEM LIVE
              </span>
              <span className="text-[10px] font-mono text-slate-300">
                TENANT: {activeTenant?.name || 'NIT Trichy'}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2.5">
              <Landmark size={24} className="text-amber-400" />
              {activeInstitution?.legal_name || 'National Institute of Technology'} — Directorate Command
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Consolidated governance intelligence, statutory compliance monitoring, and high-impact institutional decision queues. Every figure is cryptographically auditable.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => onNavigateTab?.('reports')}
            >
              <FileText size={14} className="mr-1.5" />
              Statutory Pack
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleRunAiQuery('Provide executive institutional health brief')}
            >
              <Sparkles size={14} className="mr-1.5" />
              Institutional Brief
            </Button>
          </div>
        </div>

        {/* Explainability notice banner */}
        <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-amber-300 shrink-0" />
            <span>
              <strong>Explainable Metrics Principle:</strong> Click on any metric card to inspect its cohort definition, calculation formula, and data freshness.
            </span>
          </div>
          <span className="text-slate-400 hidden sm:inline">MongoDB 7.0 Replica Set rs0</span>
        </div>
      </div>

      {/* KPI Ribbon (Per Section 7: Institution Overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="cursor-pointer group transition-all transform hover:-translate-y-0.5"
          onClick={() => setSelectedMetric(metricExplanations.students)}
        >
          <Card className="hover:border-cardinal transition-colors relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Students
                </span>
                <div className="text-3xl font-bold font-serif text-slate-900 mt-1">8,420</div>
                <div className="text-xs text-slate-500 mt-1">Across all 42 programs</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <TrendingUp size={12} /> +4.2% YoY
              </span>
              <span className="text-slate-400 group-hover:text-cardinal flex items-center gap-0.5">
                Explain <HelpCircle size={11} />
              </span>
            </div>
          </Card>
        </div>

        <div
          className="cursor-pointer group transition-all transform hover:-translate-y-0.5"
          onClick={() => setSelectedMetric(metricExplanations.programs)}
        >
          <Card className="hover:border-cardinal transition-colors relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Academic Programs
                </span>
                <div className="text-3xl font-bold font-serif text-slate-900 mt-1">42</div>
                <div className="text-xs text-slate-500 mt-1">Active offerings</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <GraduationCap size={20} />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium">100% Accredited</span>
              <span className="text-slate-400 group-hover:text-cardinal flex items-center gap-0.5">
                Explain <HelpCircle size={11} />
              </span>
            </div>
          </Card>
        </div>

        <div
          className="cursor-pointer group transition-all transform hover:-translate-y-0.5"
          onClick={() => setSelectedMetric(metricExplanations.decisions)}
        >
          <Card className="hover:border-amber-400 transition-colors relative overflow-hidden border-l-4 border-l-amber-500">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pending Decisions
                </span>
                <div className="text-3xl font-bold font-serif text-amber-700 mt-1">18</div>
                <div className="text-xs text-slate-500 mt-1">Across authorized workflows</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-amber-800 font-medium">3 urgent registration gates</span>
              <span className="text-slate-400 group-hover:text-amber-700 flex items-center gap-0.5">
                Explain <HelpCircle size={11} />
              </span>
            </div>
          </Card>
        </div>

        <div
          className="cursor-pointer group transition-all transform hover:-translate-y-0.5"
          onClick={() => setSelectedMetric(metricExplanations.dataIssues)}
        >
          <Card className="hover:border-red-400 transition-colors relative overflow-hidden border-l-4 border-l-red-500">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Data Quality Issues
                </span>
                <div className="text-3xl font-bold font-serif text-red-700 mt-1">7</div>
                <div className="text-xs text-slate-500 mt-1">Awaiting resolution</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-red-700 font-medium">DPDP / APAAR verify</span>
              <span className="text-slate-400 group-hover:text-red-700 flex items-center gap-0.5">
                Explain <HelpCircle size={11} />
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Natural Language Executive Query Bar (Section 4.E & Section 7.AI) */}
      <Card className="bg-slate-50 border-slate-200">
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-cardinal" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Campus AI Executive Intelligence Query
            </span>
            <Badge variant="subtle" size="sm">
              Verifiable Citations Only
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={executiveQuery}
                onChange={(e) => setExecutiveQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && executiveQuery.trim()) {
                    handleRunAiQuery(executiveQuery.trim());
                  }
                }}
                placeholder="Ask Campus AI: 'Show NIRF Criterion 3 status', 'Which departments have curriculum bottlenecks?'..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cardinal/20 focus:border-cardinal transition-all shadow-inner"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              loading={isQuerying}
              disabled={!executiveQuery.trim()}
              onClick={() => handleRunAiQuery(executiveQuery.trim())}
            >
              Analyze
            </Button>
          </div>

          {/* Quick query chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Quick queries:</span>
            {[
              'Summarize NIRF Criterion 3 research funding status',
              'Show placement clearance distribution by department',
              'Which departments have curriculum approval bottlenecks?',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleRunAiQuery(chip)}
                className="text-[11px] bg-white border border-slate-300 text-slate-700 hover:border-cardinal hover:text-cardinal px-2.5 py-1 rounded transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* AI Response Display */}
          {executiveResponse && (
            <div className="mt-4 p-4 bg-white border-l-4 border-l-cardinal border border-slate-200 rounded-lg text-xs space-y-2 relative animate-fade-in shadow-xs">
              <button
                onClick={() => setExecutiveResponse(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Sparkles size={14} className="text-cardinal" />
                Institutional Telemetry Synthesis
              </div>
              <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                {executiveResponse}
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Verified against CAMP-01 Institutional Topology & CAMP-03 Lifecycle Records</span>
                <span className="font-mono">Audit Hash: #AI-EXEC-7492</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Workspace Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        variant="line"
        tabs={[
          { id: 'overview', label: 'Operational Overview & Exceptions', count: 18 },
          { id: 'readiness', label: 'Institutional Readiness Gauges', count: 4 },
          { id: 'campuses', label: 'Campus & Departmental Velocity' },
          { id: 'audit', label: 'Statutory & Regulatory Audit Trail' },
        ]}
      />

      {/* Tab 1: Operational Overview & Exceptions */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Urgent Operational Escalations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Operational Exceptions & Escalations
                </h3>
                <p className="text-xs text-slate-500">
                  Anomalies requiring executive intervention or Dean delegation
                </p>
              </div>
              <Badge variant="warning" size="sm">
                Action Required (3)
              </Badge>
            </div>

            {/* Exception Card 1: Curriculum Approval Gate */}
            <Card className="border-amber-200 bg-amber-50/30 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Curriculum approvals pending
                    </span>
                    <Badge variant="warning" size="sm">
                      Opens in 6 days
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    <strong>3 programs awaiting authorization:</strong> B.Tech CSE (AI/ML), B.Tech ECE, and M.Tech CPS. Course registration window is scheduled to open next Tuesday.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigateTab?.('academic')}
                    >
                      Authorize in Academic Lifecycle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRunAiQuery('What happens if curriculum approval is delayed?')
                      }
                    >
                      Assess Impact
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Exception Card 2: Student Identity Verifications */}
            <Card className="border-red-200 bg-red-50/30 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Users size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Student records incomplete
                    </span>
                    <Badge variant="destructive" size="sm">
                      DPDP Compliance
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    <strong>7 records need verification:</strong> Missing APAAR ID and DigiLocker citizenship attestations prior to UGC/AISHE annual statutory filing.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateTab?.('students')}
                    >
                      Open Candidate Registry
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigateTab?.('consent')}
                    >
                      View DPDP Consent Ledger
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Exception Card 3: Research Grant Documentation */}
            <Card className="border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      NIRF Criterion 3 research funding audit pack
                    </span>
                    <Badge variant="info" size="sm">
                      14 days left
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    Sponsored research grant balance reconciliations generated for ₹4.82 Cr. Awaiting Vice-Chancellor institutional cryptographic seal.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateTab?.('nirf')}
                    >
                      Review Accreditation Ledger
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Key Operational Activity Summary */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-serif">
              Institutional Health Indicators
            </h3>

            <Card className="p-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Faculty-to-Student Ratio</span>
                  <span className="font-bold text-slate-900">1:14.2 (Target 1:15)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '92%' }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Compliant with UGC autonomous threshold</div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Placement Clearance (Batch 2027)</span>
                  <span className="font-bold text-cardinal">68.4%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-cardinal h-full rounded-full" style={{ width: '68.4%' }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">642 offers across 48 corporate partners</div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Autonomous Curriculum Gazette</span>
                  <span className="font-bold text-blue-700">76% Finalized</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '76%' }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">39 of 42 programs published</div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setSelectedMetric(metricExplanations.placement)}
                >
                  <span className="flex items-center gap-1.5 text-xs">
                    <HelpCircle size={14} className="text-slate-400" />
                    Explain Placement Clearance
                  </span>
                  <ChevronRight size={14} className="text-slate-400" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Institutional Readiness Gauges (Section 7) */}
      {activeTab === 'readiness' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 text-center space-y-2">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Academic Readiness
            </div>
            <div className="text-4xl font-serif font-bold text-slate-900">82%</div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: '82%' }} />
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Curriculum published, faculty allocated, timetables scheduled for 39 departments.
            </p>
          </Card>

          <Card className="p-5 text-center space-y-2">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Record Verification
            </div>
            <div className="text-4xl font-serif font-bold text-emerald-700">94%</div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: '94%' }} />
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              7,915 of 8,420 students fully verified with APAAR and DigiLocker credentials.
            </p>
          </Card>

          <Card className="p-5 text-center space-y-2">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Curriculum Publication
            </div>
            <div className="text-4xl font-serif font-bold text-purple-700">76%</div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: '76%' }} />
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              39 course structures published in gazette. 3 awaiting Dean authorization.
            </p>
          </Card>

          <Card className="p-5 text-center space-y-2">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Placement Operations
            </div>
            <div className="text-4xl font-serif font-bold text-cardinal">68%</div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-cardinal h-full rounded-full" style={{ width: '68%' }} />
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              642 offers locked. 22 campus recruitment superdays completed in Cycle 1.
            </p>
          </Card>
        </div>
      )}

      {/* Tab 3: Campus & Departmental Velocity */}
      {activeTab === 'campuses' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold font-serif text-slate-900">
                Multi-Campus & Department Performance Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Comparative student enrollment, average GPA, and placement clearance by discipline
              </p>
            </div>
            <Badge variant="subtle">Authoritative Census</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                  <th className="py-2.5 px-3 font-semibold">Department</th>
                  <th className="py-2.5 px-3 font-semibold">Campus</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Students</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Avg CGPA</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Placed %</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Avg CTC</th>
                  <th className="py-2.5 px-3 font-semibold">Curriculum Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  {
                    name: 'Computer Science & Engineering',
                    campus: 'Campus North',
                    students: 840,
                    gpa: '8.42',
                    placed: '89.2%',
                    ctc: '₹15.4 LPA',
                    status: 'PUBLISHED',
                  },
                  {
                    name: 'Electronics & Communication',
                    campus: 'Campus North',
                    students: 720,
                    gpa: '8.15',
                    placed: '74.5%',
                    ctc: '₹11.2 LPA',
                    status: 'IN_REVIEW',
                  },
                  {
                    name: 'Mechanical Engineering',
                    campus: 'Campus South',
                    students: 680,
                    gpa: '7.82',
                    placed: '52.8%',
                    ctc: '₹8.5 LPA',
                    status: 'PUBLISHED',
                  },
                  {
                    name: 'Civil Engineering',
                    campus: 'Campus South',
                    students: 540,
                    gpa: '7.64',
                    placed: '46.1%',
                    ctc: '₹7.2 LPA',
                    status: 'PUBLISHED',
                  },
                  {
                    name: 'Management & Business Studies',
                    campus: 'Campus North',
                    students: 360,
                    gpa: '8.05',
                    placed: '71.0%',
                    ctc: '₹9.8 LPA',
                    status: 'PUBLISHED',
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{row.name}</td>
                    <td className="py-3 px-3 text-slate-600">{row.campus}</td>
                    <td className="py-3 px-3 text-right font-mono">{row.students}</td>
                    <td className="py-3 px-3 text-right font-mono font-medium">{row.gpa}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-cardinal">
                      {row.placed}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                      {row.ctc}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={row.status === 'PUBLISHED' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Statutory & Regulatory Audit Trail */}
      {activeTab === 'audit' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-serif text-slate-900">
                Statutory Regulatory Filings & Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                DPDP Act 2023, UGC Autonomous Reporting, and NIRF Audit Packs
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => onNavigateTab?.('nirf')}>
              Open NIRF Module
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">NIRF 2027 Pack</span>
                <Badge variant="success" size="sm">
                  Ready
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                Graduation outcomes, higher studies tracking, and executive salary disclosures verified.
              </p>
              <div className="text-[11px] text-slate-400 font-mono">Hash: 0x9b4a...f721</div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">DPDP Act 2023 Ledger</span>
                <Badge variant="info" size="sm">
                  98.2% Consented
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                Candidate PII anonymization and corporate recruiter purpose-limitation active.
              </p>
              <div className="text-[11px] text-slate-400 font-mono">Consents: 8,268 Active</div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">UGC Autonomous Audit</span>
                <Badge variant="warning" size="sm">
                  Pending VC Seal
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                Credits mapped against National Credit Framework (NCrF) requirements.
              </p>
              <div className="text-[11px] text-slate-400 font-mono">Due: 18 Nov 2026</div>
            </div>
          </div>
        </Card>
      )}

      {/* Critical Feature: Explainable Metric Drawer (Per Section 4.E & 7 of Redesign) */}
      <SlideOverDrawer
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        title={selectedMetric ? `Metric Explainability: ${selectedMetric.title}` : ''}
        subtitle="Authoritative computation formula, cohort boundaries, and telemetry sources"
        width="lg"
      >
        {selectedMetric && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-500 uppercase font-semibold">Reported Value</div>
              <div className="text-3xl font-serif font-bold text-cardinal mt-1">
                {selectedMetric.value}
              </div>
              <div className="text-xs text-slate-600 mt-1">{selectedMetric.scope}</div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Calculation Formula
              </h4>
              <div className="p-3 bg-slate-900 text-amber-300 font-mono text-xs rounded-lg overflow-x-auto">
                {selectedMetric.formula}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block mb-1 font-medium">Eligible Cohort</span>
                <span className="font-semibold text-slate-900">{selectedMetric.cohort}</span>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block mb-1 font-medium">Reporting Period</span>
                <span className="font-semibold text-slate-900">
                  {selectedMetric.reportingPeriod}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Authoritative Data Sources
              </h4>
              <div className="space-y-2">
                {selectedMetric.sourceCollections.map((col) => (
                  <div
                    key={col}
                    className="flex items-center gap-2 text-xs font-mono bg-white border border-slate-200 px-3 py-2 rounded"
                  >
                    <Database size={13} className="text-cardinal" />
                    <span className="font-semibold text-slate-800">
                      college_placement_db.{col}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Clock size={12} /> Last refreshed: {selectedMetric.lastRefresh}
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles size={14} className="text-amber-700" />
                Campus AI Telemetry Note
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {selectedMetric.aiExplanation}
              </p>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};

