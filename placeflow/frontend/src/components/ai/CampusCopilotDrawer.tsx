import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Terminal,
  Shield,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  X,
  Send,
  Copy,
  Check,
  CheckCircle2,
  Lock,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  BookOpen,
  Briefcase,
  Users,
  Building2,
  Landmark,
  AlertTriangle,
} from 'lucide-react';
import { client } from '../../core/api/client';
import { useAuth } from '../../core/auth/useAuth';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';

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
    tagline: 'Placement eligibility, interview preparation, NEP 2020 exit credits & DPDP consent rights',
    sampleQueries: [
      'Am I eligible for upcoming Tier-1 Super Dream drives with my CGPA?',
      'Check my NEP 2020 completed credits for graduation',
      'How do I withdraw recruiter data consent under DPDP Act 2023?',
      'What happens if I turn down an on-campus placement offer?',
    ],
    allowedAgents: ['AcademicAdvisorAgent', 'SuperdayClashSolverAgent'],
  },
  tpo: {
    id: 'tpo',
    name: 'Placement Operations Copilot',
    badge: 'Placement Officer',
    icon: Briefcase,
    tagline: 'JNF tier compliance, Superday slot clash solver & Section 9.3 disparate impact telemetry',
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
    name: 'Academic Mentorship & Endorsement Copilot',
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
    name: 'Department Executive Intelligence',
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
    name: 'Institutional Strategy Hub',
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
    name: 'Campus AI Governance & Sandbox Hub',
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

interface RoleThemeConfig {
  gradient: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accentText: string;
  accentBg: string;
  cardBorder: string;
}

const ROLE_THEMES: Record<RoleLens, RoleThemeConfig> = {
  student: {
    gradient: 'from-indigo-950 via-purple-950 to-slate-900',
    badgeBg: 'bg-indigo-950/80',
    badgeBorder: 'border-indigo-700/60',
    badgeText: 'text-indigo-300',
    accentText: 'text-indigo-400',
    accentBg: 'bg-indigo-500/10',
    cardBorder: 'border-indigo-900/30',
  },
  faculty: {
    gradient: 'from-emerald-950 via-teal-950 to-slate-900',
    badgeBg: 'bg-emerald-950/80',
    badgeBorder: 'border-emerald-700/60',
    badgeText: 'text-emerald-300',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    cardBorder: 'border-emerald-900/30',
  },
  tpo: {
    gradient: 'from-blue-950 via-slate-950 to-cyan-950',
    badgeBg: 'bg-blue-950/80',
    badgeBorder: 'border-blue-700/60',
    badgeText: 'text-blue-300',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    cardBorder: 'border-blue-900/30',
  },
  hod: {
    gradient: 'from-amber-950 via-orange-950 to-slate-900',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-700/60',
    badgeText: 'text-amber-300',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    cardBorder: 'border-amber-900/30',
  },
  management: {
    gradient: 'from-fuchsia-950 via-purple-950 to-slate-900',
    badgeBg: 'bg-fuchsia-950/80',
    badgeBorder: 'border-fuchsia-700/60',
    badgeText: 'text-fuchsia-300',
    accentText: 'text-fuchsia-400',
    accentBg: 'bg-fuchsia-500/10',
    cardBorder: 'border-fuchsia-900/30',
  },
  admin: {
    gradient: 'from-zinc-950 via-slate-900 to-black',
    badgeBg: 'bg-slate-900/80',
    badgeBorder: 'border-cyan-800/60',
    badgeText: 'text-cyan-300',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    cardBorder: 'border-slate-800/40',
  },
};

interface ShareableAttribute {
  key: string;
  label: string;
  description: string;
  category: string;
  default_enabled: boolean;
  data_payload: Record<string, any>;
}

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
  shared_data_applied?: string[];
  withheld_attributes?: string[];
  privacy_shield?: {
    shared_count: number;
    total_count: number;
    consent_mode: string;
    dpdp_status: string;
  };
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

  // Profile data & granular consent states
  const [profileSummary, setProfileSummary] = useState<Record<string, any>>({});
  const [shareableAttributes, setShareableAttributes] = useState<ShareableAttribute[]>([]);
  const [sharedKeys, setSharedKeys] = useState<string[]>([]);
  const [privacyControlsOpen, setPrivacyControlsOpen] = useState(false);
  const [contextPreviewOpen, setContextPreviewOpen] = useState(false);

  const persona = ROLE_PERSONAS[activeLens];
  const theme = ROLE_THEMES[activeLens];
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

  // Load context, profile summary, and shareable attributes when activeLens changes
  useEffect(() => {
    let isCancelled = false;
    const fetchContext = async () => {
      try {
        const data = await client.get<{ persona: any; safety_status: any }>(
          `/copilot/context/${activeLens ? `?lens=${activeLens}` : ''}`
        );
        if (!isCancelled && data?.persona) {
          const summary = data.persona.profile_summary || {};
          const attrs = data.persona.shareable_attributes || [];
          setProfileSummary(summary);
          setShareableAttributes(attrs);
          // Default to enabled attributes
          const defaultEnabled = attrs
            .filter((a: ShareableAttribute) => a.default_enabled)
            .map((a: ShareableAttribute) => a.key);
          setSharedKeys(defaultEnabled);
        }
      } catch {
        // Fallback to static mock attributes if offline
        setSharedKeys(['academic_records', 'applications_pipeline', 'skills_and_resume', 'nep_progression']);
      }
    };
    fetchContext();
    return () => {
      isCancelled = true;
    };
  }, [activeLens]);

  const [traces, setTraces] = useState<TraceRecord[]>([]);
  const [quotaInfo, setQuotaInfo] = useState<QuotaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User-specific identity pre-fills
  const displayName = me?.profile?.display_name || me?.display_name || 'Aarav Sharma';
  const candidateId = me?.subject?.id || me?.person_id || me?.account_id || '221CS104';
  const department = me?.profile?.department || 'Computer Science & Engineering';
  const institutionName = me?.profile?.institution_name || 'National Institute of Technology';

  // Agent form parameters
  const [jnfCompany, setJnfCompany] = useState('Microsoft India');
  const [jnfCtc, setJnfCtc] = useState('26.5');
  const [jnfCgpa, setJnfCgpa] = useState('7.5');
  const [clashCandidate, setClashCandidate] = useState(candidateId);
  const [advisorCandidate, setAdvisorCandidate] = useState(candidateId);
  const [advisorCredits, setAdvisorCredits] = useState('128');
  const [nirfYear, setNirfYear] = useState('2025-26');

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

  const handleModeChange = (mode: CopilotMode) => {
    setActiveMode(mode);
    if (mode === 'traces') {
      loadTraces();
    }
  };

  const isShared = (key: string) => sharedKeys.includes(key);

  const toggleAttributeSharing = (key: string) => {
    setSharedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllAttributes = () => {
    setSharedKeys(shareableAttributes.map((a) => a.key));
  };

  const handleDeselectAllAttributes = () => {
    setSharedKeys([]);
  };

  const handleSubmitRag = async (e?: React.FormEvent, overridePrompt?: string) => {
    if (e) e.preventDefault();
    const q = overridePrompt || queryInput;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setRagResult(null);

    try {
      if (me?.subject?.type === 'admin') {
        const legacyRes = await client.post<RagResult>('/v4/ai/rag/', {
          query: q,
        });
        setRagResult(legacyRes);
        setQueryInput('');
        return;
      }
      // Query role-based endpoint with granular shared profile attributes
      const res = await client.post<RagResult>('/copilot/query/', {
        query: q,
        lens: activeLens,
        shared_attributes: sharedKeys,
        context: { portal: activeLens },
      });
      setRagResult(res);
      setQueryInput('');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to query Copilot');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAgent = async () => {
    setLoading(true);
    setError(null);
    setAgentResult(null);

    let payload: Record<string, any> = {};
    if (selectedAgent === 'JNFIntelligenceAgent') {
      payload = {
        company_name: jnfCompany,
        role_title: 'Software Development Engineer',
        ctc_lpa: parseFloat(jnfCtc) || 26.5,
        stipend_monthly: 85000,
        min_cgpa: parseFloat(jnfCgpa) || 7.5,
        eligible_branches: ['CSE', 'IT', 'ECE'],
      };
    } else if (selectedAgent === 'SuperdayClashSolverAgent') {
      payload = {
        candidate_id: clashCandidate,
        interview_slots: [
          { company: 'Google', slot: '10:00-11:00', candidate_id: clashCandidate },
          { company: 'Goldman Sachs', slot: '10:30-11:30', candidate_id: clashCandidate },
        ],
      };
    } else if (selectedAgent === 'AcademicAdvisorAgent') {
      payload = {
        student_id: advisorCandidate,
        completed_credits: parseInt(advisorCredits, 10) || 128,
      };
    } else if (selectedAgent === 'NIRFStatutoryAuditAgent') {
      payload = {
        academic_year: nirfYear,
      };
    }

    try {
      if (me?.subject?.type === 'admin') {
        const legacyRes = await client.post<AgentResult>('/v4/ai/agent/execute/', {
          agent_name: selectedAgent,
          payload,
        });
        setAgentResult(legacyRes);
        return;
      }
      const res = await client.post<AgentResult>('/copilot/agent/execute/', {
        agent_name: selectedAgent,
        payload,
        lens: activeLens,
      });
      setAgentResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to execute agent');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnswer = () => {
    if (ragResult?.answer) {
      navigator.clipboard.writeText(ragResult.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-canvas border-l border-line shadow-2xl flex flex-col font-sans transition-all duration-300 ease-out"
      aria-labelledby="copilot-drawer-title"
      role="dialog"
      aria-modal="true"
    >
      {/* 1. Masthead: Role-Specific Gradient Banner & Identity Bar */}
      <div className={`p-4 text-white bg-gradient-to-r ${theme.gradient} border-b border-line/40`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`rounded-lg p-2 ${theme.badgeBg} border ${theme.badgeBorder} shrink-0`}>
              <PersonaIcon size={20} className={theme.accentText} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
                Campus AI Copilot
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="copilot-drawer-title"
                  className="text-sm font-semibold text-white tracking-tight truncate m-0"
                >
                  {persona.name}
                </h2>
                <span className={`inline-flex items-center rounded-full ${theme.badgeBg} px-2 py-0.5 text-[11px] font-semibold ${theme.badgeText} border ${theme.badgeBorder} shrink-0`}>
                  {persona.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 m-0 truncate">
                {displayName} &bull; {department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Interactive Persona Lens Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLensDropdownOpen((prev) => !prev)}
                className="macos-press-sm inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-medium border border-white/15 transition-colors cursor-pointer"
                title="Switch Persona Lens"
                aria-haspopup="listbox"
                aria-expanded={lensDropdownOpen}
              >
                <span className="capitalize">{activeLens} Lens</span>
                <ChevronDown size={12} className={`transition-transform duration-150 ${lensDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {lensDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-line/80 bg-surface text-ink shadow-macos-popover macos-menu-pop p-1 z-50"
                >
                  {(Object.keys(ROLE_PERSONAS) as RoleLens[]).map((r) => {
                    const cfg = ROLE_PERSONAS[r];
                    const Icon = cfg.icon;
                    const isSel = r === activeLens;
                    return (
                      <button
                        key={r}
                        type="button"
                        role="option"
                        aria-selected={isSel}
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
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors macos-press-sm cursor-pointer"
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

      {/* 2. Privacy & Statutory Compliance Bar */}
      <div className="flex items-center justify-between border-b border-line bg-slate-50 px-4 py-2 text-xs text-ink-muted">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span className="font-medium text-ink">DPDP Act 2023 Consent Guard</span>
        </div>
        <button
          type="button"
          onClick={() => setPrivacyControlsOpen((prev) => !prev)}
          className="macos-press-sm inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline cursor-pointer"
        >
          <SlidersHorizontal size={11} />
          <span>
            {sharedKeys.length} of {shareableAttributes.length || 5} Records Shared
          </span>
          <ChevronDown
            size={11}
            className={`transition-transform duration-150 ${privacyControlsOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* 3. Granular Profile Data Sharing Drawer / Controls */}
      {privacyControlsOpen && (
        <div className="border-b border-line bg-slate-100/70 p-3.5 text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-semibold text-ink block">
                Granular Profile Data Sharing
              </span>
              <span className="text-[11px] text-ink-muted">
                Control specifically what profile metrics Copilot can reason over.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllAttributes}
                className="text-[11px] font-medium text-brand hover:underline cursor-pointer"
              >
                Share All
              </button>
              <span className="text-slate-300">&bull;</span>
              <button
                type="button"
                onClick={handleDeselectAllAttributes}
                className="text-[11px] font-medium text-slate-600 hover:underline cursor-pointer"
              >
                Strict Privacy
              </button>
            </div>
          </div>

          <div className="space-y-2 mt-2.5 max-h-48 overflow-y-auto pr-1">
            {shareableAttributes.map((attr) => {
              const checked = isShared(attr.key);
              return (
                <div
                  key={attr.key}
                  className={`flex items-center justify-between gap-3 p-2 rounded-lg border transition-colors ${
                    checked
                      ? 'bg-surface border-line shadow-2xs'
                      : 'bg-slate-50 border-slate-200/60 opacity-70'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-ink truncate text-xs">
                        {attr.label}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                        {attr.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted truncate m-0">
                      {checked ? attr.description : '🔒 Withheld from Copilot prompt context'}
                    </p>
                  </div>
                  <Switch
                    checked={checked}
                    onChange={() => toggleAttributeSharing(attr.key)}
                    size="sm"
                    aria-label={`Toggle sharing ${attr.label}`}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-line/60 flex justify-between items-center text-[11px] text-ink-muted">
            <span className="flex items-center gap-1">
              <Lock size={11} className="text-emerald-600" />
              <span>Unshared data is never sent to LLMs or logged in traces.</span>
            </span>
            <button
              type="button"
              onClick={() => setContextPreviewOpen(true)}
              className="text-brand hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              <Eye size={11} />
              <span>Inspect Prompt Payload</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Context Window Inspector Modal */}
      {contextPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-2xl border border-line p-4 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-ink m-0">
                  Authoritative AI Context Window
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setContextPreviewOpen(false)}
                className="text-slate-400 hover:text-ink cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-3 rounded-xl max-h-72 overflow-y-auto whitespace-pre-wrap">
              {`=== USER IDENTITY CONTEXT ===\n`}
              {`Display Name: ${displayName}\n`}
              {`Department: ${department}\n`}
              {`Institution: ${institutionName}\n`}
              {`Active Role Lens: ${activeLens.toUpperCase()}\n\n`}
              {`=== GRANTED PROFILE DATA (DPDP Act 2023 Consent) ===\n`}
              {shareableAttributes
                .filter((a) => isShared(a.key))
                .map((a) => `[SHARED] ${a.label}:\n  ${JSON.stringify(a.data_payload, null, 2)}`)
                .join('\n\n') || 'No profile records granted.'}
              {`\n\n=== EXCLUDED & WITHHELD ATTRIBUTES ===\n`}
              {shareableAttributes
                .filter((a) => !isShared(a.key))
                .map((a) => `[WITHHELD] ${a.label} (${a.key})`)
                .join('\n') || 'None.'}
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => setContextPreviewOpen(false)}
                className="macos-press px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Role-Specific Profile Snapshot Card */}
      <div className="p-3.5 border-b border-line bg-surface/50">
        {activeLens === 'student' && (
          <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-ink truncate block">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-ink-muted font-mono truncate block">
                    Roll: {isShared('personal_identity') ? profileSummary.roll_no || '221CS104' : '••••••••'} &bull; Batch 2026
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 border border-indigo-200 px-2 py-0.5 rounded-full shrink-0">
                {profileSummary.degree || 'B.Tech CSE'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2.5">
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Current CGPA
                </span>
                <span
                  className={`font-semibold ${
                    isShared('academic_records') ? 'text-emerald-700 font-mono text-xs' : 'text-slate-400 italic text-[11px]'
                  }`}
                >
                  {isShared('academic_records') ? `${profileSummary.cgpa || 8.42} / 10.0` : '🔒 Withheld'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Backlogs
                </span>
                <span
                  className={`font-semibold ${
                    isShared('academic_records') ? 'text-ink font-mono text-xs' : 'text-slate-400 italic text-[11px]'
                  }`}
                >
                  {isShared('academic_records') ? `${profileSummary.backlogs || 0} Active` : '🔒 Withheld'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Active Drives
                </span>
                <span
                  className={`font-semibold ${
                    isShared('applications_pipeline') ? 'text-indigo-700 font-mono text-xs' : 'text-slate-400 italic text-[11px]'
                  }`}
                >
                  {isShared('applications_pipeline') ? `${profileSummary.active_applications || 2} Drives` : '🔒 Withheld'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  NEP Credits
                </span>
                <span
                  className={`font-semibold ${
                    isShared('nep_progression') ? 'text-purple-700 font-mono text-xs' : 'text-slate-400 italic text-[11px]'
                  }`}
                >
                  {isShared('nep_progression') ? `${profileSummary.completed_credits || 128} / 160` : '🔒 Withheld'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeLens === 'faculty' && (
          <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-ink truncate block">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-ink-muted font-mono truncate block">
                    Faculty ID: {isShared('faculty_identity') ? profileSummary.faculty_id || 'FAC-CSE-042' : 'FAC-••••'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                {profileSummary.designation || 'Associate Professor'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mt-2.5">
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Assigned Advisees
                </span>
                <span
                  className={`font-semibold ${
                    isShared('mentee_roster') ? 'text-emerald-700 font-mono text-xs' : 'text-slate-400 italic text-[11px]'
                  }`}
                >
                  {isShared('mentee_roster') ? `${profileSummary.advisees_count || 18} Students` : '🔒 Withheld'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Attendance &lt;75%
                </span>
                <span
                  className={`font-semibold ${
                    isShared('attendance_alerts') ? 'text-amber-700 font-mono text-xs' : 'text-slate-400 italic text-[11px]'
                  }`}
                >
                  {isShared('attendance_alerts') ? `${profileSummary.attendance_alerts_count || 3} At-Risk` : '🔒 Withheld'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Pending NOCs
                </span>
                <span
                  className={`font-semibold ${
                    isShared('noc_requests') ? 'text-teal-700 font-mono text-xs' : 'text-slate-400 italic text-[11px]'
                  }`}
                >
                  {isShared('noc_requests') ? `${profileSummary.pending_nocs || 4} Requests` : '🔒 Withheld'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeLens === 'tpo' && (
          <div className="rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-slate-50 to-cyan-50/40 p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink">
                Placement Cell Telemetry Command
              </span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 border border-blue-200 px-2 py-0.5 rounded-full">
                Active Cycle 2025-26
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Active Drives
                </span>
                <span className="text-blue-700 font-mono font-semibold text-xs">
                  {profileSummary.active_drives_count || 14} Drives
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Superday Slots
                </span>
                <span className="text-purple-700 font-mono font-semibold text-xs">
                  {profileSummary.superday_slots || 6} Slots
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Renege Alerts
                </span>
                <span className="text-amber-700 font-mono font-semibold text-xs">
                  {profileSummary.renege_alerts_count || 2} Flagged
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Fairness Ratio
                </span>
                <span className="text-emerald-700 font-mono font-semibold text-xs">
                  88% (4/5ths OK)
                </span>
              </div>
            </div>
          </div>
        )}

        {activeLens === 'hod' && (
          <div className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-slate-50 p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink">
                Department Executive Performance
              </span>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-full">
                Curriculum v2.0 Active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Placement Rate
                </span>
                <span className="text-emerald-700 font-mono font-semibold text-xs">
                  86.4% Placed
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Active Mentors
                </span>
                <span className="text-amber-700 font-mono font-semibold text-xs">
                  12 Mentors
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Load Variance
                </span>
                <span className="text-blue-700 font-mono font-semibold text-xs">
                  Avg 15.8 / Mentor
                </span>
              </div>
            </div>
          </div>
        )}

        {activeLens === 'management' && (
          <div className="rounded-xl border border-fuchsia-200/80 bg-gradient-to-r from-fuchsia-50/70 via-purple-50/40 to-slate-50 p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink">
                Institutional Strategy & Accreditation Hub
              </span>
              <span className="text-[11px] font-semibold text-fuchsia-800 bg-fuchsia-100/80 border border-fuchsia-200 px-2 py-0.5 rounded-full">
                Tier-1 Autonomous
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  NIRF Table 5.1
                </span>
                <span className="text-purple-700 font-mono font-semibold text-xs">
                  84.6 / 100
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  NBA Criterion 4
                </span>
                <span className="text-emerald-700 font-mono font-semibold text-xs">
                  92.0 / 100
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Median CTC
                </span>
                <span className="text-fuchsia-700 font-mono font-semibold text-xs">
                  ₹14.8 LPA
                </span>
              </div>
            </div>
          </div>
        )}

        {activeLens === 'admin' && (
          <div className="rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-800 to-black p-3 text-white shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Shield size={13} className="text-cyan-400" />
                Campus AI Governance Hub
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                PIP Defense Strict
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                  Token Quota
                </span>
                <span className="text-cyan-300 font-mono font-semibold text-xs">
                  16.8% Used
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                  Trace Ledger
                </span>
                <span className="text-emerald-400 font-mono font-semibold text-xs">
                  1,248 Traces
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                  Blocked PIP
                </span>
                <span className="text-rose-400 font-mono font-semibold text-xs">
                  14 Threats
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Mode Switcher Tabs */}
      <div className="flex border-b border-line bg-surface px-4 py-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => handleModeChange('rag')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer macos-press-sm ${
            activeMode === 'rag'
              ? 'bg-brand text-white shadow-xs font-semibold'
              : 'text-ink-muted hover:bg-slate-100 hover:text-ink'
          }`}
        >
          <Sparkles size={14} />
          <span>Policy RAG</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('agents')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer macos-press-sm ${
            activeMode === 'agents'
              ? 'bg-brand text-white shadow-xs font-semibold'
              : 'text-ink-muted hover:bg-slate-100 hover:text-ink'
          }`}
        >
          <Bot size={14} />
          <span>Autonomous Agents</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('traces')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer macos-press-sm ${
            activeMode === 'traces'
              ? 'bg-brand text-white shadow-xs font-semibold'
              : 'text-ink-muted hover:bg-slate-100 hover:text-ink'
          }`}
        >
          <Terminal size={14} />
          <span>Audit Ledger</span>
        </button>
      </div>

      {/* 7. Drawer Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold block">Copilot Alert</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-800 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tab A: Role Policy RAG Reasoning */}
        {activeMode === 'rag' && (
          <div className="space-y-4">
            {/* Quick Action Prompt Chips */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-2">
                Suggested {persona.badge} Queries
              </span>
              <div className="flex flex-wrap gap-1.5">
                {persona.sampleQueries.map((sq, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setQueryInput(sq);
                      handleSubmitRag(undefined, sq);
                    }}
                    className="macos-press-sm inline-flex items-center rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink hover:border-brand/40 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <span>{sq}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Input Form */}
            <form onSubmit={handleSubmitRag} className="space-y-2">
              <label htmlFor="copilot-query-input" className="block text-xs font-medium text-ink">
                Ask a Policy or Workflow Question
              </label>
              <div className="relative">
                <textarea
                  id="copilot-query-input"
                  rows={3}
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Ask about placement policy, interview preparation, or workflow..."
                  className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-xs text-ink placeholder:text-ink-muted focus:border-brand focus:outline-hidden focus:ring-1 focus:ring-brand shadow-2xs"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-muted">
                  Grounding with {sharedKeys.length} authorized profile records
                </span>
                <button
                  type="submit"
                  disabled={loading || !queryInput.trim()}
                  className="macos-press inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-hover transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Reasoning...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Ask Copilot</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Answer Display Card with Grounded Data Provenance */}
            {ragResult && (
              <div className="rounded-xl border border-line bg-surface p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-ink">
                      Authoritative Grounded Response
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                      Groundedness: {Math.round(ragResult.groundedness_score * 100)}%
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAnswer}
                    className="macos-press-sm inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-ink cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Profile Data Provenance Banner */}
                {ragResult.shared_data_applied && ragResult.shared_data_applied.length > 0 && (
                  <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/60 p-2 text-[11px]">
                    <span className="font-semibold text-emerald-900 block mb-0.5">
                      ✓ Profile Records Ingested into Context:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ragResult.shared_data_applied.map((field, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-medium"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Withheld Profile Data Banner */}
                {ragResult.withheld_attributes && ragResult.withheld_attributes.length > 0 && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2 text-[11px]">
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      🔒 Withheld by Your Privacy Configuration:
                    </span>
                    <span className="text-ink-muted text-[10px]">
                      {ragResult.withheld_attributes.join(', ')}
                    </span>
                  </div>
                )}

                <div className="text-xs leading-relaxed text-ink whitespace-pre-wrap">
                  {ragResult.answer}
                </div>

                {/* Statutory Citations */}
                {ragResult.citations && ragResult.citations.length > 0 && (
                  <div className="border-t border-line pt-2.5">
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
                      Official Document Citations
                    </span>
                    <div className="space-y-1.5">
                      {ragResult.citations.map((c, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-line/60 bg-slate-50 p-2 text-xs flex items-start gap-2"
                        >
                          <BookOpen size={13} className="text-brand shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-ink block truncate">
                              {c.doc_title} ({c.version})
                            </span>
                            <span className="text-[11px] text-ink-muted block truncate">
                              {c.section_heading} &bull; Authority: {c.source_authority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Follow-ups */}
                {ragResult.suggested_followups && ragResult.suggested_followups.length > 0 && (
                  <div className="border-t border-line pt-2.5">
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
                      Suggested Follow-ups
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ragResult.suggested_followups.map((fu, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setQueryInput(fu);
                            handleSubmitRag(undefined, fu);
                          }}
                          className="macos-press-sm px-2.5 py-1 rounded-lg border border-line bg-slate-50 text-[11px] text-brand hover:border-brand/40 font-medium cursor-pointer"
                        >
                          {fu}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab B: Domain Autonomous Agents */}
        {activeMode === 'agents' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="copilot-agent-selector" className="block text-xs font-semibold text-ink mb-1">
                Select Authorized Domain Agent
              </label>
              <Select
                id="copilot-agent-selector"
                value={selectedAgent}
                onChange={(val) => setSelectedAgent(val)}
                options={persona.allowedAgents.map((ag) => {
                  const labelMap: Record<string, string> = {
                    AcademicAdvisorAgent: 'Academic Advisor (NEP 2020)',
                    SuperdayClashSolverAgent: 'Superday Solver (Interview Clash)',
                    JNFIntelligenceAgent: 'JNF Intelligence (CTC & Tier)',
                    NIRFStatutoryAuditAgent: 'NIRF Audit (Statutory Outcome)',
                  };
                  return {
                    value: ag,
                    label: labelMap[ag] || ag,
                  };
                })}
              />
            </div>

            {/* Agent Parameter Forms */}
            {selectedAgent === 'JNFIntelligenceAgent' && (
              <div className="space-y-2 rounded-xl border border-line bg-surface p-3 text-xs">
                <span className="font-semibold text-ink block">
                  Agent Payload Parameters ({selectedAgent})
                </span>
                <div>
                  <label htmlFor="jnf-company-input" className="text-[11px] text-ink-muted block">Company Name</label>
                  <input
                    id="jnf-company-input"
                    type="text"
                    value={jnfCompany}
                    onChange={(e) => setJnfCompany(e.target.value)}
                    className="w-full rounded-md border border-line p-1.5 text-xs text-ink"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="jnf-ctc-input" className="text-[11px] text-ink-muted block">Offered CTC (LPA)</label>
                    <input
                      id="jnf-ctc-input"
                      type="number"
                      step="0.5"
                      value={jnfCtc}
                      onChange={(e) => setJnfCtc(e.target.value)}
                      className="w-full rounded-md border border-line p-1.5 text-xs text-ink"
                    />
                  </div>
                  <div>
                    <label htmlFor="jnf-cgpa-input" className="text-[11px] text-ink-muted block">Minimum CGPA</label>
                    <input
                      id="jnf-cgpa-input"
                      type="number"
                      step="0.1"
                      value={jnfCgpa}
                      onChange={(e) => setJnfCgpa(e.target.value)}
                      className="w-full rounded-md border border-line p-1.5 text-xs text-ink"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedAgent === 'SuperdayClashSolverAgent' && (
              <div className="space-y-2 rounded-xl border border-line bg-surface p-3 text-xs">
                <span className="font-semibold text-ink block">
                  Superday Clash Solver Parameters
                </span>
                <div>
                  <label htmlFor="clash-candidate-input" className="text-[11px] text-ink-muted block">Target Candidate ID</label>
                  <input
                    id="clash-candidate-input"
                    type="text"
                    value={clashCandidate}
                    onChange={(e) => setClashCandidate(e.target.value)}
                    className="w-full rounded-md border border-line p-1.5 text-xs text-ink"
                  />
                </div>
                <p className="text-[11px] text-ink-muted m-0">
                  Will simulate slot overlap resolution between Goldman Sachs and Google Superday slots.
                </p>
              </div>
            )}

            {selectedAgent === 'AcademicAdvisorAgent' && (
              <div className="space-y-2 rounded-xl border border-line bg-surface p-3 text-xs">
                <span className="font-semibold text-ink block">
                  Academic Advisor Agent Parameters
                </span>
                <div>
                  <label htmlFor="advisor-candidate-input" className="text-[11px] text-ink-muted block">Student ID</label>
                  <input
                    id="advisor-candidate-input"
                    type="text"
                    value={advisorCandidate}
                    onChange={(e) => setAdvisorCandidate(e.target.value)}
                    className="w-full rounded-md border border-line p-1.5 text-xs text-ink"
                  />
                </div>
                <div>
                  <label htmlFor="advisor-credits-input" className="text-[11px] text-ink-muted block">Completed NEP Credits</label>
                  <input
                    id="advisor-credits-input"
                    type="number"
                    value={advisorCredits}
                    onChange={(e) => setAdvisorCredits(e.target.value)}
                    className="w-full rounded-md border border-line p-1.5 text-xs text-ink"
                  />
                </div>
              </div>
            )}

            {selectedAgent === 'NIRFStatutoryAuditAgent' && (
              <div className="space-y-2 rounded-xl border border-line bg-surface p-3 text-xs">
                <span className="font-semibold text-ink block">
                  NIRF Statutory Audit Parameters
                </span>
                <div>
                  <label htmlFor="nirf-year-input" className="text-[11px] text-ink-muted block">Academic Year</label>
                  <input
                    id="nirf-year-input"
                    type="text"
                    value={nirfYear}
                    onChange={(e) => setNirfYear(e.target.value)}
                    className="w-full rounded-md border border-line p-1.5 text-xs text-ink"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleExecuteAgent}
              disabled={loading}
              className="macos-press w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Executing {selectedAgent}...</span>
                </>
              ) : (
                <>
                  <Bot size={14} />
                  <span>Execute {selectedAgent}</span>
                </>
              )}
            </button>

            {/* Agent Result Card */}
            {agentResult && (
              <div className="rounded-xl border border-line bg-surface p-3.5 space-y-2.5 text-xs shadow-xs">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span className="font-semibold text-ink">
                      {agentResult.agent_name} Execution Complete
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {agentResult.status}
                  </span>
                </div>

                <p className="text-xs text-ink m-0">{agentResult.summary}</p>

                {agentResult.tool_results && agentResult.tool_results.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-line">
                    <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block">
                      Tool Executions
                    </span>
                    {agentResult.tool_results.map((tr, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-line/60">
                        <span className="font-mono text-[11px] text-ink font-medium">{tr.tool_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                          {tr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {agentResult.recommendation && (
                  <div className="rounded-lg bg-slate-900 text-slate-100 p-2.5 font-mono text-[11px] overflow-x-auto">
                    <pre className="m-0 whitespace-pre-wrap">
                      {JSON.stringify(agentResult.recommendation, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab C: Audit Traces */}
        {activeMode === 'traces' && (
          <div className="space-y-3">
            {quotaInfo?.metrics && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-line bg-surface p-2.5">
                  <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                    Total Executions
                  </span>
                  <span className="text-sm font-bold text-ink font-mono">
                    {quotaInfo.metrics.total_traces}
                  </span>
                </div>
                <div className="rounded-lg border border-line bg-surface p-2.5">
                  <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
                    Avg Latency
                  </span>
                  <span className="text-sm font-bold text-brand font-mono">
                    {Math.round(quotaInfo.metrics.avg_latency_ms)}ms
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Recent Audit Ledger Traces</span>
              <button
                type="button"
                onClick={loadTraces}
                className="text-[11px] text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={11} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-2">
              {traces.length === 0 ? (
                <div className="text-center py-6 text-xs text-ink-muted">
                  No traces recorded in active tenant yet.
                </div>
              ) : (
                traces.map((tr) => (
                  <div
                    key={tr.trace_id}
                    className="rounded-lg border border-line bg-surface p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-brand font-medium">
                        {tr.task_type}
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        {new Date(tr.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink line-clamp-1 m-0">
                      {tr.prompt_snippet}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-ink-muted font-mono">
                      <span>{tr.total_tokens} tokens</span>
                      <span>&bull;</span>
                      <span>PIP: {tr.pip_passed ? '✓ Clean' : '⚠ Blocked'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 8. Bottom Footer Status */}
      <div className="border-t border-line bg-surface px-4 py-2 text-[11px] text-ink-muted flex items-center justify-between">
        <span className="truncate">
          Grounded with role persona &bull; {displayName} ({activeLens})
        </span>
        <span className="text-emerald-700 font-medium shrink-0">
          DPDP 2023 Shield: Active
        </span>
      </div>
    </aside>
  );
};

export default CampusCopilotDrawer;
