import React, { useState, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Shield,
  Sparkles,
  Activity,
  History,
  CheckCircle2,
  Lock,
  BookOpen,
  Cpu,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  GraduationCap,
  Briefcase,
  Users,
  Building2,
  Landmark,
} from 'lucide-react';
import { client } from '../../core/api/client';
import { useAuth } from '../../core/auth/useAuth';

export interface CampusCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  portal?: string;
}

type CopilotMode = 'rag' | 'agents' | 'traces';

export type RoleLens = 'student' | 'tpo' | 'faculty' | 'hod' | 'management' | 'admin';

interface PersonaConfig {
  id: RoleLens;
  name: string;
  badge: string;
  icon: React.ElementType;
  tagline: string;
  sampleQueries: string[];
  allowedAgents: string[];
}

const ROLE_PERSONAS: Record<RoleLens, PersonaConfig> = {
  student: {
    id: 'student',
    name: 'Candidate Career Copilot',
    badge: 'Student Member',
    icon: GraduationCap,
    tagline: 'Placement eligibility, interview preparation, NEP 2020 exit credits & DPDP consent',
    sampleQueries: [
      'Am I eligible for upcoming Tier-1 Super Dream drives?',
      'Check my NEP 2020 completed credits for graduation',
      'How do I withdraw recruiter data consent under DPDP Act?',
      'What happens if I turn down an on-campus placement offer?',
    ],
    allowedAgents: ['AcademicAdvisorAgent', 'SuperdayClashSolverAgent'],
  },
  tpo: {
    id: 'tpo',
    name: 'Placement Operations Copilot',
    badge: 'Placement Officer',
    icon: Briefcase,
    tagline: 'JNF tier compliance, Superday slot clash solver & disparate impact telemetry',
    sampleQueries: [
      'Classify Microsoft JNF (₹26.5 LPA, 7.5 CGPA) against tier policy',
      'Solve Superday clashes for overlapping student interview slots',
      'Compute post-offer renege risk telemetry across active cohorts',
      'Audit Section 9.3 fairness & demographic disparate impact ratios',
    ],
    allowedAgents: ['JNFIntelligenceAgent', 'SuperdayClashSolverAgent'],
  },
  faculty: {
    id: 'faculty',
    name: 'Academic Mentorship Copilot',
    badge: 'Faculty Advisor',
    icon: Users,
    tagline: 'Mentee academic tracking, course prerequisites & placement leave approvals',
    sampleQueries: [
      'Advise student on NEP 2020 prerequisite credits fulfillment',
      'What is the minimum attendance criteria for placement NOC endorsement?',
      'Summarize student academic standing for employer recommendation',
      'Regulations for credit waivers during final-semester corporate internships',
    ],
    allowedAgents: ['AcademicAdvisorAgent'],
  },
  hod: {
    id: 'hod',
    name: 'Department Executive Copilot',
    badge: 'Head of Department',
    icon: Building2,
    tagline: 'Curriculum gap analysis, placement conversion trends & mentor allocations',
    sampleQueries: [
      'What are the department placement conversion rates vs target benchmarks?',
      'Evaluate curriculum transition diffs from v1.0 to v2.0',
      'Check faculty mentor allocation balance across department',
      'Review batch verification requirements for upcoming placement drives',
    ],
    allowedAgents: ['AcademicAdvisorAgent'],
  },
  management: {
    id: 'management',
    name: 'Institutional Strategy Copilot',
    badge: 'Executive Leader',
    icon: Landmark,
    tagline: 'NIRF Table 5.1 outcome audits, NBA Criterion 4 & cross-campus parity',
    sampleQueries: [
      'Audit NIRF 2025-26 graduation outcomes and median salary KPIs',
      'Generate NBA Criterion 4 placement and higher studies digest',
      'Analyze cross-campus compensation parity and hiring partner ROI',
      'Statutory governance requirements for student career telemetry',
    ],
    allowedAgents: ['NIRFStatutoryAuditAgent'],
  },
  admin: {
    id: 'admin',
    name: 'Campus AI Governance Hub',
    badge: 'CAMP-AI Live',
    icon: Shield,
    tagline: 'Institutional Policy RAG • Autonomous Multi-Agent Hub',
    sampleQueries: [
      'Can a student with a Dream offer apply for Super Dream roles?',
      'What is the minimum CGPA required for Tier-1 engineering drives?',
      'How does the Superday conflict arbitrator resolve overlapping interview slots?',
      'What are the mandatory DPDP Act 2023 purpose consent disclosures?',
    ],
    allowedAgents: [
      'JNFIntelligenceAgent',
      'SuperdayClashSolverAgent',
      'AcademicAdvisorAgent',
      'NIRFStatutoryAuditAgent',
    ],
  },
};

interface RagCitation {
  doc_title: string;
  version: string;
  section_heading: string;
  source_authority: string;
}

interface RagResult {
  answer: string;
  citations: RagCitation[];
  groundedness_score: number;
  trace_id: string;
  total_tokens: number;
  suggested_followups?: string[];
  persona?: {
    role_code: string;
    role_label: string;
    portal: string;
    display_name: string;
    department: string;
  };
}

interface AgentToolResult {
  tool_name: string;
  risk_tier: string;
  status: string;
  requires_human_approval: boolean;
  approval_token?: string;
}

interface AgentResult {
  agent_name: string;
  status: string;
  summary: string;
  recommendation?: Record<string, any>;
  tool_results?: AgentToolResult[];
  trace_id?: string;
  total_tokens?: number;
  latency_ms?: number;
  governance_level?: string;
}

interface TraceRecord {
  trace_id: string;
  task_type: string;
  created_at: string;
  prompt_snippet: string;
  model_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  pip_passed: boolean;
  pii_masked_count: number;
  latency_ms?: number;
}

interface QuotaResponse {
  tenant_id: string;
  metrics?: {
    total_traces: number;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    avg_latency_ms: number;
  };
}

export const CampusCopilotDrawer: React.FC<CampusCopilotDrawerProps> = ({
  isOpen,
  onClose,
  portal: propPortal,
}) => {
  const { me } = useAuth();

  // Determine initial role lens from propPortal or authenticated user
  const initialLens: RoleLens = ((): RoleLens => {
    if (propPortal && propPortal in ROLE_PERSONAS) {
      return propPortal as RoleLens;
    }
    const userPortal = me?.default_portal || (me?.portals && me.portals[0]);
    if (userPortal && userPortal in ROLE_PERSONAS) {
      return userPortal as RoleLens;
    }
    const roleCode = me?.assignments?.[0]?.role_code;
    if (roleCode === 'INSTITUTION_ADMIN' || me?.subject?.type === 'admin') return 'admin';
    if (roleCode === 'TPO_OFFICER' || roleCode === 'PLACEMENT_COORDINATOR') return 'tpo';
    if (roleCode === 'FACULTY_MENTOR') return 'faculty';
    if (roleCode === 'HOD') return 'hod';
    if (roleCode === 'EXECUTIVE_LEADER') return 'management';
    return 'student';
  })();

  const [activeLens, setActiveLens] = useState<RoleLens>(initialLens);
  const [lensDropdownOpen, setLensDropdownOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<CopilotMode>('rag');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ragResult, setRagResult] = useState<RagResult | null>(null);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [copied, setCopied] = useState(false);

  const persona = ROLE_PERSONAS[activeLens];
  const PersonaIcon = persona.icon;

  // Selected agent restricted to active lens
  const [selectedAgent, setSelectedAgent] = useState<string>(persona.allowedAgents[0]);

  // Update selected agent if active lens changes and current agent is not allowed
  useEffect(() => {
    if (!persona.allowedAgents.includes(selectedAgent)) {
      setSelectedAgent(persona.allowedAgents[0]);
    }
    setAgentResult(null);
  }, [activeLens, persona.allowedAgents, selectedAgent]);

  const [traces, setTraces] = useState<TraceRecord[]>([]);
  const [quotaInfo, setQuotaInfo] = useState<QuotaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User-specific context pre-fills
  const displayName = me?.profile?.display_name || me?.display_name || 'Member';
  const candidateId = me?.subject?.id || me?.person_id || me?.account_id || 'STU001';
  const department = me?.profile?.department || 'Computer Science & Engineering';
  const institutionName = me?.profile?.institution_name || 'Meridian Campus';

  // Agent form parameters
  const [jnfCompany, setJnfCompany] = useState('Microsoft India');
  const [jnfCtc, setJnfCtc] = useState('26.5');
  const [jnfCgpa, setJnfCgpa] = useState('7.5');
  const [clashCandidate, setClashCandidate] = useState(candidateId);
  const [advisorCandidate, setAdvisorCandidate] = useState(candidateId);
  const [advisorCredits, setAdvisorCredits] = useState('135');
  const [nirfYear, setNirfYear] = useState('2025-26');
  const [nirfGraduated, setNirfGraduated] = useState('520');
  const [nirfPlaced, setNirfPlaced] = useState('468');
  const [nirfMedian, setNirfMedian] = useState('9.1');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load telemetry when switching to traces mode
  const loadTraces = async () => {
    try {
      const [tRes, qRes] = await Promise.all([
        client.get<{ traces: TraceRecord[] }>('/v4/ai/traces/?limit=20'),
        client.get<QuotaResponse>('/v4/ai/quotas/'),
      ]);
      setTraces(tRes?.traces || []);
      setQuotaInfo(qRes || null);
    } catch {
      // Fail silent on audit traces fetch
    }
  };

  useEffect(() => {
    if (isOpen && activeMode === 'traces') {
      loadTraces();
    }
  }, [isOpen, activeMode]);

  const handleCopyAnswer = () => {
    if (!ragResult?.answer) return;
    navigator.clipboard.writeText(ragResult.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunRAG = async (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const query = (directQuery ?? queryInput).trim();
    if (!query || loading) return;

    if (directQuery) {
      setQueryInput(directQuery);
    }

    setLoading(true);
    setError(null);
    setRagResult(null);

    try {
      // For admin personas (matching unit tests & admin privileges), query /v4/ai/rag/
      // For role-scoped personas, query role-grounded /copilot/query/
      const isAdminPersona = activeLens === 'admin' || me?.subject?.type === 'admin';
      let res: RagResult;

      if (isAdminPersona) {
        res = await client.post<RagResult>('/v4/ai/rag/', { query });
      } else {
        try {
          res = await client.post<RagResult>('/copilot/query/', {
            query,
            context: { portal: activeLens },
          });
        } catch {
          // Fallback to standard RAG if /copilot/ not available
          res = await client.post<RagResult>('/v4/ai/rag/', { query });
        }
      }
      setRagResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete policy reasoning query.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgent = async (agentName: string) => {
    setSelectedAgent(agentName);
    setLoading(true);
    setError(null);
    setAgentResult(null);

    let payload: Record<string, any> = {};
    if (agentName === 'JNFIntelligenceAgent') {
      payload = {
        company_name: jnfCompany.trim() || 'Microsoft India',
        offered_ctc_lpa: parseFloat(jnfCtc) || 26.5,
        min_cgpa: parseFloat(jnfCgpa) || 7.5,
      };
    } else if (agentName === 'SuperdayClashSolverAgent') {
      payload = {
        student_id: clashCandidate.trim() || candidateId,
        slots: [
          { company: 'Google India', start_time: '11:00 AM' },
          { company: 'Uber Technologies', start_time: '11:00 AM' },
        ],
      };
    } else if (agentName === 'AcademicAdvisorAgent') {
      payload = {
        student_id: advisorCandidate.trim() || candidateId,
        completed_credits: parseInt(advisorCredits, 10) || 135,
      };
    } else if (agentName === 'NIRFStatutoryAuditAgent') {
      payload = {
        academic_year: nirfYear.trim() || '2025-26',
        graduated_count: parseInt(nirfGraduated, 10) || 520,
        placed_count: parseInt(nirfPlaced, 10) || 468,
        median_salary_lpa: parseFloat(nirfMedian) || 9.1,
      };
    }

    try {
      const isAdminPersona = activeLens === 'admin' || me?.subject?.type === 'admin';
      let res: AgentResult;

      if (isAdminPersona) {
        res = await client.post<AgentResult>('/v4/ai/agent/execute/', {
          agent_name: agentName,
          payload,
        });
      } else {
        try {
          res = await client.post<AgentResult>('/copilot/agent/execute/', {
            agent_name: agentName,
            payload,
          });
        } catch {
          res = await client.post<AgentResult>('/v4/ai/agent/execute/', {
            agent_name: agentName,
            payload,
          });
        }
      }
      setAgentResult(res);
    } catch (err: any) {
      setError(err?.message || 'Agent execution failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Campus AI Copilot"
        className="relative z-50 flex h-full w-full max-w-xl flex-col bg-surface shadow-2xl border-l border-line/80 font-sans macos-drawer-enter"
      >
        {/* Masthead */}
        <div className="flex flex-col border-b border-white/10 bg-brand p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-red text-white shadow-xs">
                <PersonaIcon size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-white m-0 truncate">
                    Campus AI Copilot
                  </h2>
                  <span className="text-xs text-white/80 font-normal">
                    &bull; {persona.name}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-800 shrink-0">
                    {persona.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 m-0 truncate">
                  {displayName} &bull; {department} &bull; {institutionName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Persona Lens Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLensDropdownOpen((prev) => !prev)}
                  className="macos-press-sm inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-medium border border-white/15 transition-colors cursor-pointer"
                  title="Switch Persona Lens"
                >
                  <span className="capitalize">{activeLens} Lens</span>
                  <ChevronDown size={12} className={`transition-transform duration-150 ${lensDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {lensDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-line/80 bg-surface text-ink shadow-macos-popover macos-menu-pop p-1 z-50">
                    {(Object.keys(ROLE_PERSONAS) as RoleLens[]).map((r) => {
                      const cfg = ROLE_PERSONAS[r];
                      const Icon = cfg.icon;
                      const isSel = r === activeLens;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setActiveLens(r);
                            setLensDropdownOpen(false);
                            setRagResult(null);
                            setAgentResult(null);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer transition-colors ${
                            isSel ? 'bg-brand text-white font-semibold' : 'text-ink hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon size={13} className={isSel ? 'text-white' : 'text-slate-500'} />
                            <span className="capitalize">{r}</span>
                          </div>
                          {isSel && <Check size={12} className="text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors macos-press-sm cursor-pointer"
                aria-label="Close copilot"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <p className="text-[11.5px] text-slate-300 mt-2 m-0 line-clamp-1">
            {persona.tagline}
          </p>
        </div>

        {/* Safety & Governance Bar */}
        <div className="flex items-center justify-between border-b border-line bg-slate-50 px-4 py-2 text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-emerald-600" />
            <span>PIP Defense: Active (Zero-Injection)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock size={13} className="text-brand-red" />
            <span>DPDP 2023 Masking: Active</span>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex border-b border-line bg-canvas">
          <button
            type="button"
            onClick={() => { setActiveMode('rag'); setError(null); }}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeMode === 'rag'
                ? 'border-brand-red bg-surface font-semibold text-brand-red'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <BookOpen size={14} />
            <span>Policy RAG</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveMode('agents'); setError(null); }}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeMode === 'agents'
                ? 'border-brand-red bg-surface font-semibold text-brand-red'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Cpu size={14} />
            <span>Autonomous Agents</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveMode('traces'); setError(null); }}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeMode === 'traces'
                ? 'border-brand-red bg-surface font-semibold text-brand-red'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <History size={14} />
            <span>Audit Ledger</span>
          </button>
        </div>

        {/* Drawer Body Viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* MODE 1: Policy RAG */}
          {activeMode === 'rag' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="copilot-rag-query" className="block text-xs font-semibold text-ink mb-1.5">
                  {persona.name} &bull; Policy &amp; Regulatory Inquiry
                </label>
                <form onSubmit={handleRunRAG} className="space-y-2">
                  <textarea
                    id="copilot-rag-query"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="Ask about placement policy, eligibility tiers, attendance bars, or conflict resolution..."
                    rows={3}
                    className="w-full rounded-lg border border-line bg-canvas p-3 text-xs text-ink placeholder-slate-400 focus:border-brand focus:bg-surface focus:outline-hidden focus:ring-1 focus:ring-brand"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-muted">Grounded strictly in tenant regulations</span>
                    <button
                      type="submit"
                      disabled={loading || !queryInput.trim()}
                      className="macos-press-sm inline-flex items-center gap-1.5 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-dark disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {loading ? <Activity size={13} className="animate-spin" /> : <Send size={13} />}
                      <span>{loading ? 'Evaluating...' : 'Ask Copilot'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Persona-Specific Quick Questions */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                  Suggested {persona.badge} Queries
                </span>
                <div className="flex flex-col gap-1.5">
                  {persona.sampleQueries.map((sq, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleRunRAG(undefined, sq)}
                      disabled={loading}
                      className="macos-press-sm text-left rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink hover:border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      &rarr; {sq}
                    </button>
                  ))}
                </div>
              </div>

              {/* RAG Answer Display */}
              {ragResult && (
                <div className="space-y-3 rounded-xl border border-line bg-surface p-4 shadow-sm animate-in fade-in macos-elevation-dissolve">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span className="text-xs font-bold text-ink">Grounded Regulatory Answer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        Groundedness: {Math.round(ragResult.groundedness_score * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAnswer}
                        className="macos-press-sm inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-ink p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Copy answer"
                      >
                        {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-ink m-0 whitespace-pre-wrap">
                    {ragResult.answer}
                  </p>

                  {/* Follow-up Chips if available */}
                  {ragResult.suggested_followups && ragResult.suggested_followups.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-line">
                      <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                        Suggested Follow-Ups
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ragResult.suggested_followups.map((fu, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleRunRAG(undefined, fu)}
                            disabled={loading}
                            className="macos-press-sm inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-brand/20 bg-brand/5 text-[11.5px] font-medium text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                          >
                            <Sparkles size={11} />
                            <span>{fu}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Citations */}
                  {ragResult.citations && ragResult.citations.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-line">
                      <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                        Official Citations &amp; Regulatory References ({ragResult.citations.length})
                      </span>
                      <div className="space-y-1.5">
                        {ragResult.citations.map((c, idx) => (
                          <div key={idx} className="rounded-lg border border-line bg-canvas p-2.5 text-xs space-y-0.5">
                            <div className="font-semibold text-ink flex items-center justify-between">
                              <span>{c.doc_title} ({c.version})</span>
                              <span className="text-xs text-slate-500 font-normal">{c.source_authority}</span>
                            </div>
                            <div className="text-xs text-ink-muted">
                              Section: <span className="font-mono text-ink">{c.section_heading}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-line text-xs text-ink-muted font-mono">
                    <span>Trace: {ragResult.trace_id.substring(0, 16)}...</span>
                    <span>Tokens: {ragResult.total_tokens}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: Autonomous Agents */}
          {activeMode === 'agents' && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                {persona.name} &bull; Authorized Autonomous Agents
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'JNFIntelligenceAgent', name: 'JNF Intelligence', desc: 'Tier & CTC Classifier', level: 'L1' },
                  { id: 'SuperdayClashSolverAgent', name: 'Superday Solver', desc: 'Interview Slot Arbitrator', level: 'L2' },
                  { id: 'AcademicAdvisorAgent', name: 'Academic Advisor', desc: 'NEP 2020 Progression Audit', level: 'L1' },
                  { id: 'NIRFStatutoryAuditAgent', name: 'NIRF Audit', desc: 'Graduation Metrics Audit', level: 'L0' },
                ]
                  .filter((ag) => persona.allowedAgents.includes(ag.id))
                  .map((ag) => (
                    <button
                      key={ag.id}
                      type="button"
                      onClick={() => { setSelectedAgent(ag.id); setAgentResult(null); }}
                      className={`rounded-lg border p-3 text-left transition-all cursor-pointer ${
                        selectedAgent === ag.id
                          ? 'border-brand-red bg-red-50/50 ring-1 ring-brand-red'
                          : 'border-line bg-canvas hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-ink">{ag.name}</span>
                        <span className="rounded bg-slate-200 px-1.5 py-0.2 text-xs font-mono font-semibold text-slate-700">
                          {ag.level}
                        </span>
                      </div>
                      <div className="text-xs text-ink-muted truncate">{ag.desc}</div>
                    </button>
                  ))}
              </div>

              {/* Dynamic Agent Parameter Configuration */}
              <div className="rounded-xl border border-line bg-canvas p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <span className="text-xs font-bold text-ink">
                    Agent Payload Parameters ({selectedAgent})
                  </span>
                  <span className="text-xs text-ink-muted font-mono">Governed Sandbox</span>
                </div>

                {selectedAgent === 'JNFIntelligenceAgent' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className="block text-ink-muted mb-1 font-medium">Company Name</label>
                      <input
                        type="text"
                        value={jnfCompany}
                        onChange={(e) => setJnfCompany(e.target.value)}
                        className="w-full rounded border border-line bg-surface p-1.5 text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-ink-muted mb-1 font-medium">CTC Offered (LPA)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={jnfCtc}
                        onChange={(e) => setJnfCtc(e.target.value)}
                        className="w-full rounded border border-line bg-surface p-1.5 text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-ink-muted mb-1 font-medium">Min CGPA</label>
                      <input
                        type="number"
                        step="0.1"
                        value={jnfCgpa}
                        onChange={(e) => setJnfCgpa(e.target.value)}
                        className="w-full rounded border border-line bg-surface p-1.5 text-xs text-ink"
                      />
                    </div>
                  </div>
                )}

                {selectedAgent === 'SuperdayClashSolverAgent' && (
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-ink-muted mb-1 font-medium">Student / Candidate ID</label>
                      <input
                        type="text"
                        value={clashCandidate}
                        onChange={(e) => setClashCandidate(e.target.value)}
                        className="w-full rounded border border-line bg-surface p-1.5 text-xs text-ink font-mono"
                      />
                    </div>
                    <div className="text-xs text-ink-muted">
                      Simulates simultaneous interview invitations from Google and Uber at 11:00 AM.
                    </div>
                  </div>
                )}

                {selectedAgent === 'AcademicAdvisorAgent' && (
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block text-ink-muted mb-1 font-medium">Student / Candidate ID</label>
                      <input
                        type="text"
                        value={advisorCandidate}
                        onChange={(e) => setAdvisorCandidate(e.target.value)}
                        className="w-full rounded border border-line bg-surface p-1.5 text-xs text-ink font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-ink-muted mb-1 font-medium">Completed Credits</label>
                      <input
                        type="number"
                        value={advisorCredits}
                        onChange={(e) => setAdvisorCredits(e.target.value)}
                        className="w-full rounded border border-line bg-surface p-1.5 text-xs text-ink"
                      />
                    </div>
                  </div>
                )}

                {selectedAgent === 'NIRFStatutoryAuditAgent' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="block text-ink-muted mb-1 font-medium">Academic Year</label>
                      <input
                        type="text"
                        value={nirfYear}
                        onChange={(e) => setNirfYear(e.target.value)}
                        className="w-full rounded border border-line bg-surface p-1.5 text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-ink-muted mb-1 font-medium">Graduated</label>
                      <input
                        type="number"
                        value={nirfGraduated}
                        onChange={(e) => setNirfGraduated(e.target.value)}
                        className="w-full rounded border border-line bg-surface p-1.5 text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-ink-muted mb-1 font-medium">Placed</label>
                      <input
                        type="number"
                        value={nirfPlaced}
                        onChange={(e) => setNirfPlaced(e.target.value)}
                        className="w-full rounded border border-line bg-surface p-1.5 text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-ink-muted mb-1 font-medium">Median (LPA)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={nirfMedian}
                        onChange={(e) => setNirfMedian(e.target.value)}
                        className="w-full rounded border border-line bg-surface p-1.5 text-xs text-ink"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRunAgent(selectedAgent)}
                  disabled={loading}
                  className="macos-press w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red py-2 text-xs font-semibold text-white hover:bg-brand-red-dark disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading ? <Activity size={14} className="animate-spin" /> : <Bot size={14} />}
                  <span>{loading ? 'Executing Sandbox Tools...' : `Execute ${selectedAgent}`}</span>
                </button>
              </div>

              {/* Agent Result Display */}
              {agentResult && (
                <div className="space-y-3 rounded-xl border border-line bg-surface p-4 shadow-sm animate-in fade-in macos-elevation-dissolve">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-brand-red" />
                      <span className="text-xs font-bold text-ink">{agentResult.agent_name} Execution</span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold font-mono ${
                        agentResult.status === 'REQUIRES_APPROVAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {agentResult.status}
                    </span>
                  </div>

                  <div className="rounded-lg border border-line bg-canvas p-3 text-xs text-ink leading-relaxed">
                    {agentResult.summary}
                  </div>

                  {/* Tool Invocations */}
                  {agentResult.tool_results && agentResult.tool_results.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-line">
                      <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                        Scoped MCP Tool Executions ({agentResult.tool_results.length})
                      </span>
                      <div className="space-y-1.5">
                        {agentResult.tool_results.map((tr, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border border-line bg-canvas p-2.5 text-xs"
                          >
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-bold text-ink">{tr.tool_name}</span>
                              <span className="rounded bg-slate-200 px-1.5 py-0.2 text-xs font-semibold text-slate-700">
                                {tr.risk_tier}
                              </span>
                            </div>
                            {tr.requires_human_approval && (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                Human Sign-Off Staged
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {agentResult.trace_id && (
                    <div className="flex items-center justify-between pt-2 border-t border-line text-xs text-ink-muted font-mono">
                      <span>Trace: {agentResult.trace_id.substring(0, 16)}...</span>
                      <span>Level: {agentResult.governance_level || 'L1'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE 3: Audit Trace Ledger */}
          {activeMode === 'traces' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Tenant AI Execution Telemetry
                </span>
                <button
                  type="button"
                  onClick={loadTraces}
                  className="macos-press-sm inline-flex items-center gap-1 rounded border border-line bg-canvas px-2 py-1 text-xs text-ink hover:bg-slate-100 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Refresh</span>
                </button>
              </div>

              {quotaInfo?.metrics && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-line bg-canvas p-2.5">
                    <div className="text-ink-muted text-xs">Total Traces</div>
                    <div className="font-bold text-sm text-ink mt-0.5">{quotaInfo.metrics.total_traces}</div>
                  </div>
                  <div className="rounded-lg border border-line bg-canvas p-2.5">
                    <div className="text-ink-muted text-xs">Tokens Used</div>
                    <div className="font-bold text-sm text-ink mt-0.5">
                      {quotaInfo.metrics.total_prompt_tokens + quotaInfo.metrics.total_completion_tokens}
                    </div>
                  </div>
                  <div className="rounded-lg border border-line bg-canvas p-2.5">
                    <div className="text-ink-muted text-xs">Avg Latency</div>
                    <div className="font-bold text-sm text-emerald-700 mt-0.5">
                      {Math.round(quotaInfo.metrics.avg_latency_ms)}ms
                    </div>
                  </div>
                </div>
              )}

              {/* Traces List */}
              <div className="space-y-2">
                {traces.length === 0 ? (
                  <div className="rounded-xl border border-line bg-canvas p-8 text-center text-xs text-ink-muted">
                    No interaction traces recorded for this tenant yet. Execute a RAG query or agent above.
                  </div>
                ) : (
                  traces.map((tr) => (
                    <div
                      key={tr.trace_id}
                      className="rounded-lg border border-line bg-surface p-3 text-xs space-y-1.5 shadow-2xs font-mono"
                    >
                      <div className="flex items-center justify-between text-ink-muted">
                        <span className="font-bold text-ink">{tr.task_type}</span>
                        <span>{new Date(tr.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-xs text-ink truncate font-sans">
                        {tr.prompt_snippet}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-muted pt-1 border-t border-line">
                        <span>Model: {tr.model_id}</span>
                        <span>Tokens: {tr.total_tokens || tr.prompt_tokens + tr.completion_tokens}</span>
                        <span className={tr.pip_passed ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>
                          {tr.pip_passed ? 'PIP Safe' : 'PIP Blocked'}
                        </span>
                        <span>Masked: {tr.pii_masked_count}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampusCopilotDrawer;
