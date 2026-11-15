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
  TrendingUp,
  FileText,
  Play,
  ArrowRight,
  Calculator,
  Wallet,
  Award,
  CheckCheck,
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

  // Authoritative role lens attached strictly to active portal or authenticated profile (no user switching allowed)
  const activeLens: RoleLens = React.useMemo((): RoleLens => {
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
  }, [propPortal, me]);

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
  const [resumeToolOpen, setResumeToolOpen] = useState(false);
  const [resumeBulletInput, setResumeBulletInput] = useState('');
  const [studentToolTab, setStudentToolTab] = useState<'eligibility' | 'prep' | 'salary'>('eligibility');
  const [selectedCompanyPrep, setSelectedCompanyPrep] = useState('Google');
  const [ctcInput, setCtcInput] = useState('26.5');
  const [facultyToolTab, setFacultyToolTab] = useState<'attendance' | 'lor'>('attendance');
  const [lorStudent, setLorStudent] = useState('Aarav Sharma (221CS104)');
  const [tpoToolTab, setTpoToolTab] = useState<'superday' | 'shortlist'>('superday');
  const [shortlistCgpa, setShortlistCgpa] = useState('7.5');
  const [hodToolTab, setHodToolTab] = useState<'curriculum' | 'skillgap'>('curriculum');
  const [adminMerkleVerified, setAdminMerkleVerified] = useState(false);

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
      {/* 1. Masthead: Role-Specific Gradient Banner & Identity Bar with Ambient Halo */}
      <div className={`relative overflow-hidden p-4 text-white bg-gradient-to-r ${theme.gradient} border-b border-line/40`}>
        {/* Subtle Ambient Luminescence Glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-20 bg-white/30" />
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
            {/* Verified Profile Role Lock Pill (User Cannot Switch Role) */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs text-white font-medium border border-white/15 select-none shadow-2xs"
              title={`Role locked to verified ${activeLens} profile`}
            >
              <Lock size={11} className="text-white/80 shrink-0" />
              <span className="capitalize">{activeLens} Profile Attached</span>
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

      {/* 6. Mode Switcher Tabs (Apple-Style Fluid Segmented Control) */}
      <div className="border-b border-line bg-surface px-4 py-2.5">
        <div className="macos-segmented grid grid-cols-3 gap-1 p-1 text-xs">
          <button
            type="button"
            onClick={() => handleModeChange('rag')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition-all duration-150 cursor-pointer macos-press-sm ${
              activeMode === 'rag'
                ? 'bg-surface text-ink font-semibold shadow-xs border border-line/70'
                : 'text-ink-muted hover:text-ink hover:bg-white/40'
            }`}
          >
            <Sparkles size={13} className={activeMode === 'rag' ? 'text-brand' : ''} />
            <span>Policy RAG</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('agents')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition-all duration-150 cursor-pointer macos-press-sm ${
              activeMode === 'agents'
                ? 'bg-surface text-ink font-semibold shadow-xs border border-line/70'
                : 'text-ink-muted hover:text-ink hover:bg-white/40'
            }`}
          >
            <Bot size={13} className={activeMode === 'agents' ? 'text-brand' : ''} />
            <span>Autonomous Agents</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('traces')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition-all duration-150 cursor-pointer macos-press-sm ${
              activeMode === 'traces'
                ? 'bg-surface text-ink font-semibold shadow-xs border border-line/70'
                : 'text-ink-muted hover:text-ink hover:bg-white/40'
            }`}
          >
            <Terminal size={13} className={activeMode === 'traces' ? 'text-brand' : ''} />
            <span>Audit Ledger</span>
          </button>
        </div>
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
            {/* Role-Specific Interactive Diagnostic & Power Tools */}
            {activeLens === 'student' && (
              <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-surface p-3.5 space-y-3 shadow-2xs">
                {/* Student Sub-Tool Navigation Pills */}
                <div className="flex border-b border-indigo-100/80 pb-2 gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setStudentToolTab('eligibility')}
                    className={`macos-press-sm px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      studentToolTab === 'eligibility'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-indigo-900/70 hover:bg-indigo-100/60'
                    }`}
                  >
                    Eligibility &amp; Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentToolTab('prep')}
                    className={`macos-press-sm px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      studentToolTab === 'prep'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-indigo-900/70 hover:bg-indigo-100/60'
                    }`}
                  >
                    Recruiter Prep Blueprint
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentToolTab('salary')}
                    className={`macos-press-sm px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      studentToolTab === 'salary'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-indigo-900/70 hover:bg-indigo-100/60'
                    }`}
                  >
                    In-Hand Salary Calculator
                  </button>
                </div>

                {studentToolTab === 'eligibility' && (
                  <div className="space-y-3 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-indigo-600" />
                        Tier-1 Super Dream Eligibility Meter
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Eligible: Tier-1
                      </span>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <div>
                        <div className="flex justify-between text-ink-muted mb-1">
                          <span>CGPA Cut-Off Benchmark (7.50 Min)</span>
                          <span className="font-mono font-semibold text-indigo-950">8.42 / 10.0 (+0.92 Delta)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full copilot-gauge-fill" style={{ width: '84.2%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-ink-muted mb-1">
                          <span>NEP Degree Credits Completed (128 / 160)</span>
                          <span className="font-mono font-semibold text-purple-900">80% Level 8 Honours</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full copilot-gauge-fill" style={{ width: '80%' }} />
                        </div>
                      </div>
                    </div>

                    {/* 1-Click ATS Resume Bullet Optimizer Collapsible */}
                    <div className="pt-2 border-t border-indigo-100/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-ink flex items-center gap-1">
                          <FileText size={12} className="text-indigo-600" />
                          ATS Resume Bullet Improver
                        </span>
                        <button
                          type="button"
                          onClick={() => setResumeToolOpen((p) => !p)}
                          className="text-[11px] font-medium text-brand hover:underline cursor-pointer"
                        >
                          {resumeToolOpen ? 'Hide Tool' : 'Open ATS Rewriter'}
                        </button>
                      </div>
                      {resumeToolOpen && (
                        <div className="mt-2 space-y-2 animate-in slide-in-from-top-1 duration-150">
                          <input
                            type="text"
                            value={resumeBulletInput}
                            onChange={(e) => setResumeBulletInput(e.target.value)}
                            placeholder="Paste draft resume bullet (e.g. Built a full stack portal with React)..."
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-line bg-surface text-ink focus:outline-hidden focus:border-brand"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const query = `Optimize this resume bullet for ATS and Tier-1 engineering placement: "${resumeBulletInput || 'Developed web applications for campus placements'}"`;
                              setQueryInput(query);
                              handleSubmitRag(undefined, query);
                            }}
                            className="macos-press-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold cursor-pointer shadow-2xs"
                          >
                            <Sparkles size={12} />
                            <span>Optimize for Tier-1 ATS</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {studentToolTab === 'prep' && (
                  <div className="space-y-2.5 animate-in fade-in-50 duration-150 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-950 flex items-center gap-1">
                        <BookOpen size={13} className="text-indigo-600" />
                        Target Recruiter Interview Cheat Sheet
                      </span>
                      <div className="flex gap-1">
                        {['Google', 'Microsoft', 'Goldman Sachs'].map((co) => (
                          <button
                            key={co}
                            type="button"
                            onClick={() => setSelectedCompanyPrep(co)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                              selectedCompanyPrep === co
                                ? 'bg-indigo-700 text-white'
                                : 'bg-surface text-ink border border-line hover:bg-slate-100'
                            }`}
                          >
                            {co}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface border border-line space-y-1">
                      <span className="font-semibold text-ink block">{selectedCompanyPrep} Campus Hiring Blueprint</span>
                      <p className="text-[10px] text-ink-muted m-0">
                        {selectedCompanyPrep === 'Google' && 'Focus: Distributed Graph Algorithms, Binary Search on Answer, System Design (Rate Limiters).'}
                        {selectedCompanyPrep === 'Microsoft' && 'Focus: Dynamic Programming (Subsequences), Tree Traversal, REST API Concurrency.'}
                        {selectedCompanyPrep === 'Goldman Sachs' && 'Focus: Numerical Probability, Hash Table Inversion, Low-Latency Java/C++ Concurrency.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const q = `Generate comprehensive interview question bank and technical cheat sheet for ${selectedCompanyPrep} campus hiring`;
                        setQueryInput(q);
                        handleSubmitRag(undefined, q);
                      }}
                      className="macos-press-sm w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-center text-xs shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={12} />
                      <span>Generate {selectedCompanyPrep} Prep Blueprint</span>
                    </button>
                  </div>
                )}

                {studentToolTab === 'salary' && (
                  <div className="space-y-2.5 animate-in fade-in-50 duration-150 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-950 flex items-center gap-1">
                        <Wallet size={13} className="text-indigo-600" />
                        CTC to Net Monthly In-Hand Estimator
                      </span>
                      <span className="text-emerald-700 font-mono font-semibold">₹{ctcInput} LPA</span>
                    </div>
                    <div className="flex gap-1.5">
                      {['12.0', '26.5', '45.0'].map((bracket) => (
                        <button
                          key={bracket}
                          type="button"
                          onClick={() => setCtcInput(bracket)}
                          className={`flex-1 py-1 rounded text-center text-[10px] font-semibold transition-colors cursor-pointer border ${
                            ctcInput === bracket
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-surface text-ink border-line hover:bg-slate-50'
                          }`}
                        >
                          ₹{bracket} LPA
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="p-2 rounded bg-surface border border-line">
                        <span className="text-ink-muted block">Annual Base</span>
                        <span className="font-mono font-semibold text-ink">₹{(parseFloat(ctcInput) * 0.68).toFixed(1)} LPA</span>
                      </div>
                      <div className="p-2 rounded bg-surface border border-line">
                        <span className="text-ink-muted block">Estimated Monthly In-Hand</span>
                        <span className="font-mono font-semibold text-emerald-700">~₹{Math.round((parseFloat(ctcInput) * 68000) / 12).toLocaleString('en-IN')} /mo</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const q = `Provide comprehensive tax, base salary, and monthly in-hand take home breakdown for an offer of ₹${ctcInput} LPA CTC`;
                        setQueryInput(q);
                        handleSubmitRag(undefined, q);
                      }}
                      className="macos-press-sm w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-center text-xs shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Calculator size={12} />
                      <span>Get Detailed Compensation Analysis</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeLens === 'faculty' && (
              <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-surface p-3.5 space-y-3 shadow-2xs">
                {/* Faculty Sub-Tool Navigation */}
                <div className="flex border-b border-emerald-100/80 pb-2 gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFacultyToolTab('attendance')}
                    className={`macos-press-sm px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      facultyToolTab === 'attendance'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-emerald-900/70 hover:bg-emerald-100/60'
                    }`}
                  >
                    Attendance &amp; NOC Alerts
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacultyToolTab('lor')}
                    className={`macos-press-sm px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      facultyToolTab === 'lor'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-emerald-900/70 hover:bg-emerald-100/60'
                    }`}
                  >
                    1-Click LOR Drafter
                  </button>
                </div>

                {facultyToolTab === 'attendance' && (
                  <div className="space-y-2.5 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-amber-600" />
                        Advisee Attendance Intervention Radar
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        3 Students &lt; 75%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div className="p-2 rounded-lg bg-surface border border-line">
                        <span className="font-semibold text-ink block truncate">Diya Patel</span>
                        <span className="text-amber-700 font-mono text-[10px] block">71% Attendance</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface border border-line">
                        <span className="font-semibold text-ink block truncate">Rohan Verma</span>
                        <span className="text-rose-700 font-mono text-[10px] block">68% Attendance</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface border border-line">
                        <span className="font-semibold text-ink block truncate">Tanvi Shah</span>
                        <span className="text-amber-700 font-mono text-[10px] block">74% Attendance</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const q = 'Draft academic warning notices for advisees with attendance below 75% before placement NOC endorsement';
                          setQueryInput(q);
                          handleSubmitRag(undefined, q);
                        }}
                        className="macos-press-sm text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Draft Warning Notices</span>
                        <ArrowRight size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const q = 'Evaluate 4 pending NOC applications against semester credit fulfillment and attendance regulations';
                          setQueryInput(q);
                          handleSubmitRag(undefined, q);
                        }}
                        className="macos-press-sm text-[11px] font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
                      >
                        Evaluate Pending NOCs &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {facultyToolTab === 'lor' && (
                  <div className="space-y-2.5 animate-in fade-in-50 duration-150 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-950 flex items-center gap-1">
                        <Award size={13} className="text-emerald-600" />
                        Grounded Academic Letter of Recommendation
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface border border-line space-y-1.5">
                      <label className="text-[10px] font-semibold text-ink-muted uppercase block">Select Target Advisee</label>
                      <Select
                        value={lorStudent}
                        onChange={(val) => setLorStudent(val)}
                        size="sm"
                        options={[
                          { value: 'Aarav Sharma (221CS104)', label: 'Aarav Sharma (221CS104 · CGPA 8.42)' },
                          { value: 'Diya Patel (221CS118)', label: 'Diya Patel (221CS118 · CGPA 8.85)' },
                          { value: 'Rohan Verma (221CS142)', label: 'Rohan Verma (221CS142 · CGPA 7.92)' },
                        ]}
                      />
                      <p className="text-[10px] text-ink-muted m-0">Pre-populates verified course credits, research thesis, and capstone grades.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const q = `Draft an official institutional Letter of Recommendation (LOR) for ${lorStudent} highlighting coursework performance, projects, and ethical integrity`;
                        setQueryInput(q);
                        handleSubmitRag(undefined, q);
                      }}
                      className="macos-press-sm w-full py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-center text-xs shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Award size={12} />
                      <span>Generate Academic Recommendation Letter</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeLens === 'tpo' && (
              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-cyan-50/40 to-surface p-3.5 space-y-3 shadow-2xs">
                {/* TPO Sub-Tool Navigation */}
                <div className="flex border-b border-blue-100/80 pb-2 gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTpoToolTab('superday')}
                    className={`macos-press-sm px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      tpoToolTab === 'superday'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-blue-900/70 hover:bg-blue-100/60'
                    }`}
                  >
                    Superday Clashes
                  </button>
                  <button
                    type="button"
                    onClick={() => setTpoToolTab('shortlist')}
                    className={`macos-press-sm px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      tpoToolTab === 'shortlist'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-blue-900/70 hover:bg-blue-100/60'
                    }`}
                  >
                    Shortlist Engine
                  </button>
                </div>

                {tpoToolTab === 'superday' && (
                  <div className="space-y-2.5 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-950 flex items-center gap-1.5">
                        <Users size={13} className="text-blue-600" />
                        Superday Interview Conflict Arbitrator
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        2 Clashes Flagged
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-line text-[11px] space-y-1">
                      <div className="flex justify-between items-center text-ink">
                        <span className="font-medium">Google (10:00-11:00) vs Goldman Sachs (10:30-11:30)</span>
                        <span className="text-rose-600 font-mono text-[10px] font-semibold">30m Overlap</span>
                      </div>
                      <p className="text-[10px] text-ink-muted m-0">Candidate: STU_AARAV_001 · Technical Round 2 Overlap</p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAgent('SuperdayClashSolverAgent');
                          setActiveMode('agents');
                        }}
                        className="macos-press-sm inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold cursor-pointer shadow-2xs"
                      >
                        <Play size={11} />
                        <span>Solve Clashes via Superday Agent</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const q = 'Audit Section 9.3 fairness and four-fifths rule disparate impact telemetry across active recruitment drives';
                          setQueryInput(q);
                          handleSubmitRag(undefined, q);
                        }}
                        className="macos-press-sm text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                      >
                        4/5ths Fairness Audit &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {tpoToolTab === 'shortlist' && (
                  <div className="space-y-2.5 animate-in fade-in-50 duration-150 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-950 flex items-center gap-1">
                        <CheckCheck size={13} className="text-blue-600" />
                        Recruiter Cutoff Shortlist Simulator
                      </span>
                      <span className="text-emerald-700 font-mono font-semibold">184 / 240 Eligible</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="text-ink-muted block mb-0.5">Min CGPA Cutoff</label>
                        <input
                          type="text"
                          value={shortlistCgpa}
                          onChange={(e) => setShortlistCgpa(e.target.value)}
                          className="w-full px-2 py-1 border border-line rounded bg-surface font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-ink-muted block mb-0.5">Max Backlogs Allowed</label>
                        <input
                          type="text"
                          disabled
                          value="0 Backlogs"
                          className="w-full px-2 py-1 border border-line rounded bg-slate-100 text-ink-muted font-mono text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const q = `Run strict recruiter candidate shortlist audit for drives requiring CGPA >= ${shortlistCgpa} and zero active backlogs`;
                        setQueryInput(q);
                        handleSubmitRag(undefined, q);
                      }}
                      className="macos-press-sm w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center text-xs shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <CheckCheck size={12} />
                      <span>Verify Shortlist &amp; Generate Manifest</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeLens === 'hod' && (
              <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-surface p-3.5 space-y-3 shadow-2xs">
                {/* HOD Sub-Tool Navigation */}
                <div className="flex border-b border-amber-100/80 pb-2 gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setHodToolTab('curriculum')}
                    className={`macos-press-sm px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      hodToolTab === 'curriculum'
                        ? 'bg-amber-700 text-white shadow-2xs'
                        : 'text-amber-900/70 hover:bg-amber-100/60'
                    }`}
                  >
                    Curriculum v2.0
                  </button>
                  <button
                    type="button"
                    onClick={() => setHodToolTab('skillgap')}
                    className={`macos-press-sm px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      hodToolTab === 'skillgap'
                        ? 'bg-amber-700 text-white shadow-2xs'
                        : 'text-amber-900/70 hover:bg-amber-100/60'
                    }`}
                  >
                    Skill Deficits &amp; Targets
                  </button>
                </div>

                {hodToolTab === 'curriculum' && (
                  <div className="space-y-2.5 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                        <Building2 size={13} className="text-amber-600" />
                        Curriculum v2.0 Industry Gap Diagnostics
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        NEP 2020 Active
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div className="p-2 rounded-lg bg-surface border border-line">
                        <span className="text-[10px] text-ink-muted uppercase block font-semibold">Conversion</span>
                        <span className="font-mono font-semibold text-emerald-700">86.4%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface border border-line">
                        <span className="text-[10px] text-ink-muted uppercase block font-semibold">New AI Credits</span>
                        <span className="font-mono font-semibold text-amber-700">+8 Credits</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface border border-line">
                        <span className="text-[10px] text-ink-muted uppercase block font-semibold">Mentor Variance</span>
                        <span className="font-mono font-semibold text-slate-700">±0.04</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const q = 'Evaluate curriculum transition diffs from v1.0 to v2.0 and industry alignment';
                        setQueryInput(q);
                        handleSubmitRag(undefined, q);
                      }}
                      className="macos-press-sm text-[11px] font-semibold text-amber-900 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <span>Run Curriculum Diff Audit</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                )}

                {hodToolTab === 'skillgap' && (
                  <div className="space-y-2.5 animate-in fade-in-50 duration-150 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-950">Placement Benchmark: 86.4% (Target: 91.2%)</span>
                      <span className="text-amber-700 font-mono text-[10px] font-semibold">-4.8% Gap</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-line text-[10px] text-ink-muted">
                      <span>Primary rejection reasons in Technical Rounds: Distributed Systems Caching (42%) and Concurrent Transaction Locks (31%).</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const q = 'Identify department student technical skill deficits from placement rejections and recommend remedial elective workshops';
                        setQueryInput(q);
                        handleSubmitRag(undefined, q);
                      }}
                      className="macos-press-sm w-full py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-center text-xs shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <TrendingUp size={12} />
                      <span>Recommend Skill Deficit Workshops</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeLens === 'management' && (
              <div className="rounded-xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50/70 via-purple-50/40 to-surface p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-fuchsia-950 flex items-center gap-1.5">
                    <Landmark size={13} className="text-fuchsia-600" />
                    NIRF Table 5.1 &amp; NBA Criterion 4 Projection
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-900">
                    NIRF GO: 84.6 / 100
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-surface border border-line">
                    <span className="text-[10px] text-ink-muted uppercase block font-semibold">Cross-Campus Median CTC</span>
                    <span className="font-mono font-semibold text-fuchsia-800 text-xs">₹14.2 LPA</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-line">
                    <span className="text-[10px] text-ink-muted uppercase block font-semibold">NBA Placement Index</span>
                    <span className="font-mono font-semibold text-emerald-700 text-xs">92 / 100 Points</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const q = 'Audit NIRF 2025-26 graduation outcomes and median salary KPIs across campuses';
                      setQueryInput(q);
                      handleSubmitRag(undefined, q);
                    }}
                    className="macos-press-sm text-[11px] font-semibold text-fuchsia-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Audit Statutory Outcomes</span>
                    <ArrowRight size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const q = 'Generate executive placement and statutory governance briefing digest for Academic Senate and Chancellor review';
                      setQueryInput(q);
                      handleSubmitRag(undefined, q);
                    }}
                    className="macos-press-sm text-[11px] font-semibold text-fuchsia-900 hover:underline cursor-pointer"
                  >
                    Senate Digest &rarr;
                  </button>
                </div>
              </div>
            )}

            {activeLens === 'admin' && (
              <div className="rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-800 to-black p-3.5 space-y-3 text-white shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Shield size={13} className="text-cyan-400" />
                    Zero-Injection Security &amp; Token Telemetry
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    PIP Defense: ACTIVE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Quota Consumed</span>
                    <span className="font-mono font-semibold text-cyan-400">16.8% (42.1k / 250k)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Blocked PIP Threats</span>
                    <span className="font-mono font-semibold text-rose-400">14 Vectors Prevented</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono text-[10px]">
                    {adminMerkleVerified ? '✓ Merkle Root Verified (SHA-256)' : '1,248 Traces Stored'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdminMerkleVerified(true)}
                    className="macos-press-sm px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-semibold hover:bg-cyan-500/30 cursor-pointer"
                  >
                    {adminMerkleVerified ? 'Ledger Untampered' : 'Verify Merkle Hash'}
                  </button>
                </div>
              </div>
            )}

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
              <div className="copilot-reveal rounded-xl border border-line bg-surface p-4 shadow-sm space-y-3">
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

                {/* Fluid Groundedness Gauge */}
                <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full copilot-gauge-fill"
                    style={{ width: `${Math.round(ragResult.groundedness_score * 100)}%` }}
                  />
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
          Grounded with role persona &bull; {displayName} ({activeLens} profile locked)
        </span>
        <span className="text-emerald-700 font-medium shrink-0">
          DPDP 2023 Shield: Active
        </span>
      </div>
    </aside>
  );
};

export default CampusCopilotDrawer;
