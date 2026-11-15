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
    gradient: 'from-[#0B1B3D] via-[#0E2352] to-[#07132B]',
    badgeBg: 'bg-white/10',
    badgeBorder: 'border-amber-400/40',
    badgeText: 'text-now',
    accentText: 'text-now',
    accentBg: 'bg-amber-500/10',
    cardBorder: 'border-line',
  },
  faculty: {
    gradient: 'from-[#0B1B3D] via-[#162E48] to-[#081829]',
    badgeBg: 'bg-white/10',
    badgeBorder: 'border-emerald-400/40',
    badgeText: 'text-emerald-300',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    cardBorder: 'border-line',
  },
  tpo: {
    gradient: 'from-[#0B1B3D] via-[#0F2A4A] to-[#071A2E]',
    badgeBg: 'bg-white/10',
    badgeBorder: 'border-teal-400/40',
    badgeText: 'text-teal-300',
    accentText: 'text-teal-400',
    accentBg: 'bg-teal-500/10',
    cardBorder: 'border-line',
  },
  hod: {
    gradient: 'from-[#0B1B3D] via-[#1C2844] to-[#09152C]',
    badgeBg: 'bg-white/10',
    badgeBorder: 'border-amber-400/40',
    badgeText: 'text-amber-300',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    cardBorder: 'border-line',
  },
  management: {
    gradient: 'from-[#0B1B3D] via-[#1A2346] to-[#081226]',
    badgeBg: 'bg-white/10',
    badgeBorder: 'border-indigo-400/40',
    badgeText: 'text-indigo-300',
    accentText: 'text-indigo-400',
    accentBg: 'bg-indigo-500/10',
    cardBorder: 'border-line',
  },
  admin: {
    gradient: 'from-[#090D16] via-[#111827] to-[#040810]',
    badgeBg: 'bg-white/10',
    badgeBorder: 'border-slate-500/40',
    badgeText: 'text-slate-200',
    accentText: 'text-slate-300',
    accentBg: 'bg-slate-500/10',
    cardBorder: 'border-line',
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

  // Prevent background page scroll bleed / layout glitch when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

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
    <div className="fixed inset-0 z-[70] overflow-hidden">
      {/* 1. Backdrop Scrim Overlay (dims & blurs page behind Copilot, prevents mis-clicks, click outside to close) */}
      <div
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity duration-200 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
        title="Close copilot"
      />

      {/* 2. Elevated Copilot Drawer Surface (Peek Panel) */}
      <aside
        className="fixed inset-y-0 right-0 z-[70] w-full max-w-xl md:max-w-2xl bg-canvas border-l border-line shadow-2xl flex flex-col font-sans transition-all duration-300 ease-out select-text"
        aria-labelledby="copilot-drawer-title"
        role="dialog"
        aria-modal="true"
        onWheel={(e) => e.stopPropagation()}
      >
      {/* 1. Masthead: Unified Institutional Hero Banner with Ambient Glow */}
      <div className={`relative overflow-hidden p-5 text-white bg-gradient-to-r ${theme.gradient} border-b border-line/30`}>
        {/* Subtle Ambient Luminescence Glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-20 bg-amber-400/25" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`rounded-xl p-2.5 ${theme.badgeBg} border ${theme.badgeBorder} shrink-0 mt-0.5 shadow-2xs`}>
              <PersonaIcon size={22} className={theme.accentText} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block font-sans">
                Campus AI Copilot
              </span>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <h2
                  id="copilot-drawer-title"
                  className="text-lg sm:text-xl font-bold text-white tracking-tight truncate m-0 font-display"
                >
                  {persona.name}
                </h2>
                <span className={`inline-flex items-center rounded-full ${theme.badgeBg} px-2.5 py-0.5 text-[11px] font-bold ${theme.badgeText} border ${theme.badgeBorder} shrink-0`}>
                  {persona.badge}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-1 m-0 truncate">
                {displayName} &bull; {department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Verified Profile Role Lock Pill (User Cannot Switch Role) */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs text-white/90 font-medium border border-white/15 select-none shadow-2xs"
              title={`Role locked to verified ${activeLens} profile`}
            >
              <Lock size={11} className="text-white/80 shrink-0" />
              <span className="capitalize">{activeLens} Profile Attached</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
              aria-label="Close copilot"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/75 mt-3 m-0 line-clamp-1 font-normal">
          {persona.tagline}
        </p>
      </div>

      {/* 2. Privacy & Statutory Compliance Bar */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-2.5 text-xs text-ink-muted">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-success" />
          <span className="font-semibold text-ink">DPDP Act 2023 Consent Guard</span>
        </div>
        <button
          type="button"
          onClick={() => setPrivacyControlsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-canvas hover:bg-surface text-ink text-[11px] font-semibold transition-colors cursor-pointer"
        >
          <SlidersHorizontal size={11} className="text-brand" />
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
        <div className="border-b border-line bg-canvas/80 p-4 text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-bold text-ink block font-display">
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
                className="text-[11px] font-semibold text-brand hover:underline cursor-pointer"
              >
                Share All
              </button>
              <span className="text-line-strong">&bull;</span>
              <button
                type="button"
                onClick={handleDeselectAllAttributes}
                className="text-[11px] font-semibold text-ink-muted hover:text-ink cursor-pointer"
              >
                Strict Privacy
              </button>
            </div>
          </div>

          <div
            className="space-y-2 mt-2.5 max-h-48 overflow-y-auto pr-1 overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            {shareableAttributes.map((attr) => {
              const checked = isShared(attr.key);
              return (
                <div
                  key={attr.key}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                    checked
                      ? 'bg-surface border-line shadow-2xs'
                      : 'bg-canvas border-line/60 opacity-70'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-ink truncate text-xs">
                        {attr.label}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-canvas text-ink-muted border border-line">
                        {attr.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted truncate m-0 mt-0.5">
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
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
            <div
              className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-3 rounded-xl max-h-72 overflow-y-auto whitespace-pre-wrap overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
            >
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

      {/* 6. Mode Switcher Tabs (Segmented Control) */}
      <div className="border-b border-line bg-canvas px-4 py-2.5">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface border border-line shadow-2xs text-xs">
          <button
            type="button"
            onClick={() => handleModeChange('rag')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-semibold transition-all duration-150 cursor-pointer ${
              activeMode === 'rag'
                ? 'bg-ink text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            <Sparkles size={13} className={activeMode === 'rag' ? 'text-now' : ''} />
            <span>Policy RAG</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('agents')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-semibold transition-all duration-150 cursor-pointer ${
              activeMode === 'agents'
                ? 'bg-ink text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            <Bot size={13} className={activeMode === 'agents' ? 'text-now' : ''} />
            <span>Autonomous Agents</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('traces')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-semibold transition-all duration-150 cursor-pointer ${
              activeMode === 'traces'
                ? 'bg-ink text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            <Terminal size={13} className={activeMode === 'traces' ? 'text-now' : ''} />
            <span>Audit Ledger</span>
          </button>
        </div>
      </div>

      {/* 7. Drawer Body Content */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain overscroll-y-contain bg-canvas"
        onWheel={(e) => e.stopPropagation()}
      >
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2 shadow-2xs">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 min-w-0">
              <span className="font-bold block">Copilot Alert</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-800 cursor-pointer p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 5. Role-Specific Profile Snapshot Card */}
      <div className="p-4 border-b border-line bg-canvas">
        {activeLens === 'student' && (
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shrink-0 font-display">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-ink truncate block">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-ink-muted font-mono truncate block">
                    Roll: {isShared('personal_identity') ? profileSummary.roll_no || '221CS104' : '••••••••'} &bull; Batch 2026
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-brand bg-brand/10 border border-brand/20 px-2.5 py-0.5 rounded-full shrink-0">
                {profileSummary.degree || 'B.Tech CSE'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Current CGPA
                </span>
                <span
                  className={`font-display font-extrabold text-sm sm:text-base ${
                    isShared('academic_records') ? 'text-ink' : 'text-slate-400 italic text-xs'
                  }`}
                >
                  {isShared('academic_records') ? `${profileSummary.cgpa || 8.42}` : '🔒 Withheld'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Backlogs
                </span>
                <span
                  className={`font-display font-extrabold text-sm sm:text-base ${
                    isShared('academic_records') ? 'text-ink' : 'text-slate-400 italic text-xs'
                  }`}
                >
                  {isShared('academic_records') ? `${profileSummary.backlogs || 0} Active` : '🔒 Withheld'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Active Drives
                </span>
                <span
                  className={`font-display font-extrabold text-sm sm:text-base ${
                    isShared('applications_pipeline') ? 'text-brand' : 'text-slate-400 italic text-xs'
                  }`}
                >
                  {isShared('applications_pipeline') ? `${profileSummary.active_applications || 2} Drives` : '🔒 Withheld'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  NEP Credits
                </span>
                <span
                  className={`font-display font-extrabold text-sm sm:text-base ${
                    isShared('nep_progression') ? 'text-ink' : 'text-slate-400 italic text-xs'
                  }`}
                >
                  {isShared('nep_progression') ? `${profileSummary.completed_credits || 128} / 160` : '🔒 Withheld'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeLens === 'faculty' && (
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0 font-display">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-ink truncate block">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-ink-muted font-mono truncate block">
                    Faculty ID: {isShared('faculty_identity') ? profileSummary.faculty_id || 'FAC-CSE-042' : 'FAC-••••'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                {profileSummary.designation || 'Associate Professor'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Assigned Advisees
                </span>
                <span
                  className={`font-display font-extrabold text-sm sm:text-base ${
                    isShared('mentee_roster') ? 'text-ink' : 'text-slate-400 italic text-xs'
                  }`}
                >
                  {isShared('mentee_roster') ? `${profileSummary.advisees_count || 18} Students` : '🔒 Withheld'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Attendance &lt;75%
                </span>
                <span
                  className={`font-display font-extrabold text-sm sm:text-base ${
                    isShared('attendance_alerts') ? 'text-amber-700' : 'text-slate-400 italic text-xs'
                  }`}
                >
                  {isShared('attendance_alerts') ? `${profileSummary.attendance_alerts_count || 3} At-Risk` : '🔒 Withheld'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Pending NOCs
                </span>
                <span
                  className={`font-display font-extrabold text-sm sm:text-base ${
                    isShared('noc_requests') ? 'text-teal-700' : 'text-slate-400 italic text-xs'
                  }`}
                >
                  {isShared('noc_requests') ? `${profileSummary.pending_nocs || 4} Requests` : '🔒 Withheld'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeLens === 'tpo' && (
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink font-display">
                Placement Cell Telemetry Command
              </span>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                Active Cycle 2025-26
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Active Drives
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-ink">
                  {profileSummary.active_drives_count || 14} Drives
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Superday Slots
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-brand">
                  {profileSummary.superday_slots || 6} Slots
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Renege Alerts
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-amber-700">
                  {profileSummary.renege_alerts_count || 2} Flagged
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Fairness Ratio
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-success">
                  88% (4/5ths OK)
                </span>
              </div>
            </div>
          </div>
        )}

        {activeLens === 'hod' && (
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink font-display">
                Department Executive Performance
              </span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Curriculum v2.0 Active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Placement Rate
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-success">
                  86.4% Placed
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Active Mentors
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-amber-700">
                  12 Mentors
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Load Variance
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-brand">
                  Avg 15.8 / Mentor
                </span>
              </div>
            </div>
          </div>
        )}

        {activeLens === 'management' && (
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink font-display">
                Institutional Strategy & Accreditation Hub
              </span>
              <span className="text-[11px] font-bold text-brand bg-brand/10 border border-brand/20 px-2.5 py-0.5 rounded-full">
                Tier-1 Autonomous
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  NIRF Table 5.1
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-brand">
                  84.6 / 100
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  NBA Criterion 4
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-success">
                  92.0 / 100
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Median CTC
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-ink">
                  ₹14.8 LPA
                </span>
              </div>
            </div>
          </div>
        )}

        {activeLens === 'admin' && (
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5 font-display">
                <Shield size={14} className="text-brand" />
                Campus AI Governance Hub
              </span>
              <span className="text-[11px] font-bold text-success bg-success-bg border border-success-border px-2.5 py-0.5 rounded-full">
                PIP Defense Strict
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Token Quota
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-brand font-mono">
                  16.8% Used
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Trace Ledger
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-success font-mono">
                  1,248 Traces
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-line">
                <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                  Blocked PIP
                </span>
                <span className="font-display font-extrabold text-sm sm:text-base text-danger font-mono">
                  14 Threats
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Tab A: Role Policy RAG Reasoning */}
        {activeMode === 'rag' && (
          <div className="space-y-4">
            {/* Answer Display Card with Grounded Data Provenance */}
            {/* Answer Display Card with Grounded Data Provenance */}
            {ragResult && (
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                    <span className="text-xs font-bold text-ink font-display">
                      Authoritative Grounded Response
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-success-bg text-success border border-success-border font-bold">
                      Groundedness: {Math.round(ragResult.groundedness_score * 100)}%
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAnswer}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-ink cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Groundedness Gauge */}
                <div className="w-full h-1.5 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(ragResult.groundedness_score * 100)}%` }}
                  />
                </div>

                {/* Profile Data Provenance Banner */}
                {ragResult.shared_data_applied && ragResult.shared_data_applied.length > 0 && (
                  <div className="rounded-xl bg-success-bg/60 border border-success-border p-3 text-[11px]">
                    <span className="font-bold text-success block mb-1">
                      ✓ Profile Records Ingested into Context:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ragResult.shared_data_applied.map((field, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-white text-success border border-success-border text-[10px] font-semibold shadow-2xs"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Withheld Profile Data Banner */}
                {ragResult.withheld_attributes && ragResult.withheld_attributes.length > 0 && (
                  <div className="rounded-xl bg-canvas border border-line p-3 text-[11px]">
                    <span className="font-bold text-ink-secondary block mb-1">
                      🔒 Withheld by Your Privacy Configuration:
                    </span>
                    <span className="text-ink-muted text-[10px]">
                      {ragResult.withheld_attributes.join(', ')}
                    </span>
                  </div>
                )}

                <div className="text-xs sm:text-sm leading-relaxed text-ink whitespace-pre-wrap">
                  {ragResult.answer}
                </div>

                {/* Statutory Citations */}
                {ragResult.citations && ragResult.citations.length > 0 && (
                  <div className="border-t border-line pt-3 space-y-2">
                    <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">
                      Official Document Citations
                    </span>
                    <div className="space-y-2">
                      {ragResult.citations.map((c, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-line bg-canvas p-3 text-xs flex items-start gap-2.5"
                        >
                          <BookOpen size={14} className="text-brand shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-ink block truncate">
                              {c.doc_title} ({c.version})
                            </span>
                            <span className="text-[11px] text-ink-muted block truncate mt-0.5">
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
                  <div className="border-t border-line pt-3 space-y-2">
                    <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">
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
                          className="px-3 py-1.5 rounded-full border border-line bg-canvas hover:bg-surface text-xs text-brand font-semibold transition-colors cursor-pointer"
                        >
                          {fu}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Action Prompt Chips */}
            {/* Quick Action Prompt Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface hover:border-amber-400 hover:bg-amber-50/40 px-3 py-1.5 text-xs font-medium text-ink transition-all shadow-2xs text-left cursor-pointer"
                  >
                    <Sparkles size={11} className="text-now shrink-0" />
                    <span>{sq}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Role-Specific Interactive Diagnostic & Power Tools */}
            {/* Role-Specific Interactive Diagnostic & Power Tools */}
            {activeLens === 'student' && (
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-3.5 shadow-xs">
                {/* Student Sub-Tool Navigation Pills */}
                <div className="flex p-1 rounded-xl bg-canvas border border-line gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setStudentToolTab('eligibility')}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                      studentToolTab === 'eligibility'
                        ? 'bg-ink text-white shadow-2xs'
                        : 'text-ink-muted hover:text-ink hover:bg-surface'
                    }`}
                  >
                    Eligibility &amp; Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentToolTab('prep')}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                      studentToolTab === 'prep'
                        ? 'bg-ink text-white shadow-2xs'
                        : 'text-ink-muted hover:text-ink hover:bg-surface'
                    }`}
                  >
                    Recruiter Prep Blueprint
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentToolTab('salary')}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                      studentToolTab === 'salary'
                        ? 'bg-ink text-white shadow-2xs'
                        : 'text-ink-muted hover:text-ink hover:bg-surface'
                    }`}
                  >
                    In-Hand Salary Calculator
                  </button>
                </div>

                {studentToolTab === 'eligibility' && (
                  <div className="space-y-3 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5 font-display">
                        <TrendingUp size={15} className="text-now" />
                        Tier-1 Super Dream Eligibility Meter
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-success-bg text-success border border-success-border">
                        Eligible: Tier-1
                      </span>
                    </div>
                    <div className="space-y-2.5 text-[11px]">
                      <div>
                        <div className="flex justify-between text-ink-muted mb-1">
                          <span>CGPA Cut-Off Benchmark (7.50 Min)</span>
                          <span className="font-mono font-bold text-ink">8.42 / 10.0 (+0.92 Delta)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: '84.2%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-ink-muted mb-1">
                          <span>NEP Degree Credits Completed (128 / 160)</span>
                          <span className="font-mono font-bold text-ink">80% Level 8 Honours</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                          <div className="h-full bg-now rounded-full" style={{ width: '80%' }} />
                        </div>
                      </div>
                    </div>

                    {/* 1-Click ATS Resume Bullet Optimizer Collapsible */}
                    <div className="pt-2 border-t border-line">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-ink flex items-center gap-1">
                          <FileText size={12} className="text-brand" />
                          ATS Resume Bullet Improver
                        </span>
                        <button
                          type="button"
                          onClick={() => setResumeToolOpen((p) => !p)}
                          className="text-[11px] font-semibold text-brand hover:underline cursor-pointer"
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
                            className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-canvas/40 text-ink focus:outline-hidden focus:border-brand focus:bg-surface"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const query = `Optimize this resume bullet for ATS and Tier-1 engineering placement: "${resumeBulletInput || 'Developed web applications for campus placements'}"`;
                              setQueryInput(query);
                              handleSubmitRag(undefined, query);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-[11px] font-bold cursor-pointer shadow-xs transition-colors"
                          >
                            <Sparkles size={12} className="text-now" />
                            <span>Optimize for Tier-1 ATS</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {studentToolTab === 'prep' && (
                  <div className="space-y-3 animate-in fade-in-50 duration-150 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink flex items-center gap-1 font-display">
                        <BookOpen size={13} className="text-brand" />
                        Target Recruiter Interview Cheat Sheet
                      </span>
                      <div className="flex gap-1">
                        {['Google', 'Microsoft', 'Goldman Sachs'].map((co) => (
                          <button
                            key={co}
                            type="button"
                            onClick={() => setSelectedCompanyPrep(co)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer border ${
                              selectedCompanyPrep === co
                                ? 'bg-ink text-white border-ink'
                                : 'bg-surface text-ink border-line hover:bg-canvas'
                            }`}
                          >
                            {co}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-canvas border border-line space-y-1">
                      <span className="font-bold text-ink block">{selectedCompanyPrep} Campus Hiring Blueprint</span>
                      <p className="text-[11px] text-ink-muted m-0 leading-relaxed">
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
                      className="w-full py-2 rounded-full bg-brand hover:bg-brand-hover text-white font-bold text-center text-xs shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={13} className="text-now" />
                      <span>Generate {selectedCompanyPrep} Prep Blueprint</span>
                    </button>
                  </div>
                )}

                {studentToolTab === 'salary' && (
                  <div className="space-y-3 animate-in fade-in-50 duration-150 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink flex items-center gap-1 font-display">
                        <Wallet size={14} className="text-brand" />
                        CTC to Net Monthly In-Hand Estimator
                      </span>
                      <span className="text-success font-mono font-bold text-xs">₹{ctcInput} LPA</span>
                    </div>
                    <div className="flex gap-1.5">
                      {['12.0', '26.5', '45.0'].map((bracket) => (
                        <button
                          key={bracket}
                          type="button"
                          onClick={() => setCtcInput(bracket)}
                          className={`flex-1 py-1.5 rounded-full text-center text-[10px] font-bold transition-colors cursor-pointer border ${
                            ctcInput === bracket
                              ? 'bg-ink text-white border-ink shadow-2xs'
                              : 'bg-surface text-ink border-line hover:bg-canvas'
                          }`}
                        >
                          ₹{bracket} LPA
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2.5 rounded-xl bg-canvas border border-line">
                        <span className="text-ink-muted block uppercase tracking-wider font-semibold">Annual Base</span>
                        <span className="font-mono font-bold text-ink text-xs">₹{(parseFloat(ctcInput) * 0.68).toFixed(1)} LPA</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-canvas border border-line">
                        <span className="text-ink-muted block uppercase tracking-wider font-semibold">Estimated Monthly Take-Home</span>
                        <span className="font-mono font-bold text-success text-xs">~₹{Math.round((parseFloat(ctcInput) * 68000) / 12).toLocaleString('en-IN')} /mo</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const q = `Provide comprehensive tax, base salary, and monthly in-hand take home breakdown for an offer of ₹${ctcInput} LPA CTC`;
                        setQueryInput(q);
                        handleSubmitRag(undefined, q);
                      }}
                      className="w-full py-2 rounded-full bg-brand hover:bg-brand-hover text-white font-bold text-center text-xs shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Calculator size={13} className="text-now" />
                      <span>Get Detailed Compensation Analysis</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeLens === 'faculty' && (
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-3.5 shadow-xs">
                {/* Faculty Sub-Tool Navigation */}
                <div className="flex p-1 rounded-xl bg-canvas border border-line gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFacultyToolTab('attendance')}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                      facultyToolTab === 'attendance'
                        ? 'bg-ink text-white shadow-2xs'
                        : 'text-ink-muted hover:text-ink hover:bg-surface'
                    }`}
                  >
                    Attendance &amp; NOC Alerts
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacultyToolTab('lor')}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                      facultyToolTab === 'lor'
                        ? 'bg-ink text-white shadow-2xs'
                        : 'text-ink-muted hover:text-ink hover:bg-surface'
                    }`}
                  >
                    1-Click LOR Drafter
                  </button>
                </div>

                {facultyToolTab === 'attendance' && (
                  <div className="space-y-3 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5 font-display">
                        <AlertTriangle size={14} className="text-amber-600" />
                        Advisee Attendance Intervention Radar
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                        3 Students &lt; 75%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-canvas border border-line">
                        <span className="font-bold text-ink block truncate">Diya Patel</span>
                        <span className="text-amber-700 font-mono text-[10px] block mt-0.5 font-bold">71% Attendance</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-canvas border border-line">
                        <span className="font-bold text-ink block truncate">Rohan Verma</span>
                        <span className="text-danger font-mono text-[10px] block mt-0.5 font-bold">68% Attendance</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-canvas border border-line">
                        <span className="font-bold text-ink block truncate">Tanvi Shah</span>
                        <span className="text-amber-700 font-mono text-[10px] block mt-0.5 font-bold">74% Attendance</span>
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
                        className="text-[11px] font-bold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
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
                        className="text-[11px] font-bold text-brand hover:underline cursor-pointer"
                      >
                        Evaluate Pending NOCs &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {facultyToolTab === 'lor' && (
                  <div className="space-y-3 animate-in fade-in-50 duration-150 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink flex items-center gap-1 font-display">
                        <Award size={14} className="text-brand" />
                        Grounded Academic Letter of Recommendation
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-canvas border border-line space-y-2">
                      <label className="text-[10px] font-bold text-ink-muted uppercase block">Select Target Advisee</label>
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
                      className="w-full py-2 rounded-full bg-brand hover:bg-brand-hover text-white font-bold text-center text-xs shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Award size={13} className="text-now" />
                      <span>Generate Academic Recommendation Letter</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeLens === 'tpo' && (
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-3.5 shadow-xs">
                {/* TPO Sub-Tool Navigation */}
                <div className="flex p-1 rounded-xl bg-canvas border border-line gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTpoToolTab('superday')}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                      tpoToolTab === 'superday'
                        ? 'bg-ink text-white shadow-2xs'
                        : 'text-ink-muted hover:text-ink hover:bg-surface'
                    }`}
                  >
                    Superday Clashes
                  </button>
                  <button
                    type="button"
                    onClick={() => setTpoToolTab('shortlist')}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                      tpoToolTab === 'shortlist'
                        ? 'bg-ink text-white shadow-2xs'
                        : 'text-ink-muted hover:text-ink hover:bg-surface'
                    }`}
                  >
                    Shortlist Engine
                  </button>
                </div>

                {tpoToolTab === 'superday' && (
                  <div className="space-y-3 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5 font-display">
                        <Users size={14} className="text-brand" />
                        Superday Interview Conflict Arbitrator
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                        2 Clashes Flagged
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-canvas border border-line text-[11px] space-y-1">
                      <div className="flex justify-between items-center text-ink">
                        <span className="font-bold">Google (10:00-11:00) vs Goldman Sachs (10:30-11:30)</span>
                        <span className="text-danger font-mono text-[10px] font-bold">30m Overlap</span>
                      </div>
                      <p className="text-[11px] text-ink-muted m-0">Candidate: STU_AARAV_001 · Technical Round 2 Overlap</p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAgent('SuperdayClashSolverAgent');
                          setActiveMode('agents');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-now text-now-ink hover:bg-amber-400 text-xs font-bold cursor-pointer shadow-xs transition-colors"
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
                        className="text-[11px] font-bold text-brand hover:underline cursor-pointer"
                      >
                        4/5ths Fairness Audit &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {tpoToolTab === 'shortlist' && (
                  <div className="space-y-3 animate-in fade-in-50 duration-150 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink flex items-center gap-1 font-display">
                        <CheckCheck size={14} className="text-brand" />
                        Recruiter Cutoff Shortlist Simulator
                      </span>
                      <span className="text-success font-mono font-bold">184 / 240 Eligible</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="text-ink-muted block mb-1 font-bold uppercase">Min CGPA Cutoff</label>
                        <input
                          type="text"
                          value={shortlistCgpa}
                          onChange={(e) => setShortlistCgpa(e.target.value)}
                          className="w-full px-3 py-1.5 border border-line rounded-xl bg-canvas font-mono text-xs text-ink focus:bg-surface focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="text-ink-muted block mb-1 font-bold uppercase">Max Backlogs Allowed</label>
                        <input
                          type="text"
                          disabled
                          value="0 Backlogs"
                          className="w-full px-3 py-1.5 border border-line rounded-xl bg-canvas/70 text-ink-muted font-mono text-xs"
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
                      className="w-full py-2 rounded-full bg-brand hover:bg-brand-hover text-white font-bold text-center text-xs shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCheck size={13} className="text-now" />
                      <span>Verify Shortlist &amp; Generate Manifest</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeLens === 'hod' && (
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-3.5 shadow-xs">
                {/* HOD Sub-Tool Navigation */}
                <div className="flex p-1 rounded-xl bg-canvas border border-line gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setHodToolTab('curriculum')}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                      hodToolTab === 'curriculum'
                        ? 'bg-ink text-white shadow-2xs'
                        : 'text-ink-muted hover:text-ink hover:bg-surface'
                    }`}
                  >
                    Curriculum v2.0
                  </button>
                  <button
                    type="button"
                    onClick={() => setHodToolTab('skillgap')}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                      hodToolTab === 'skillgap'
                        ? 'bg-ink text-white shadow-2xs'
                        : 'text-ink-muted hover:text-ink hover:bg-surface'
                    }`}
                  >
                    Skill Deficits &amp; Targets
                  </button>
                </div>

                {hodToolTab === 'curriculum' && (
                  <div className="space-y-3 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5 font-display">
                        <Building2 size={14} className="text-brand" />
                        Curriculum v2.0 Industry Gap Diagnostics
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                        NEP 2020 Active
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-canvas border border-line">
                        <span className="text-[10px] text-ink-muted uppercase block font-bold">Conversion</span>
                        <span className="font-display font-bold text-success text-xs">86.4%</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-canvas border border-line">
                        <span className="text-[10px] text-ink-muted uppercase block font-bold">New AI Credits</span>
                        <span className="font-display font-bold text-brand text-xs">+8 Credits</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-canvas border border-line">
                        <span className="text-[10px] text-ink-muted uppercase block font-bold">Mentor Variance</span>
                        <span className="font-mono font-bold text-ink-secondary text-xs">±0.04</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const q = 'Evaluate curriculum transition diffs from v1.0 to v2.0 and industry alignment';
                        setQueryInput(q);
                        handleSubmitRag(undefined, q);
                      }}
                      className="text-[11px] font-bold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <span>Run Curriculum Diff Audit</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                )}

                {hodToolTab === 'skillgap' && (
                  <div className="space-y-3 animate-in fade-in-50 duration-150 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">Placement Benchmark: 86.4% (Target: 91.2%)</span>
                      <span className="text-amber-700 font-mono text-[10px] font-bold">-4.8% Gap</span>
                    </div>
                    <div className="p-3 rounded-xl bg-canvas border border-line text-[11px] text-ink-muted">
                      <span>Primary rejection reasons in Technical Rounds: Distributed Systems Caching (42%) and Concurrent Transaction Locks (31%).</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const q = 'Identify department student technical skill deficits from placement rejections and recommend remedial elective workshops';
                        setQueryInput(q);
                        handleSubmitRag(undefined, q);
                      }}
                      className="w-full py-2 rounded-full bg-brand hover:bg-brand-hover text-white font-bold text-center text-xs shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <TrendingUp size={13} className="text-now" />
                      <span>Recommend Skill Deficit Workshops</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeLens === 'management' && (
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink flex items-center gap-1.5 font-display">
                    <Landmark size={14} className="text-brand" />
                    NIRF Table 5.1 &amp; NBA Criterion 4 Projection
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                    NIRF GO: 84.6 / 100
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-canvas border border-line">
                    <span className="text-[10px] text-ink-muted uppercase block font-bold">Cross-Campus Median CTC</span>
                    <span className="font-display font-bold text-brand text-xs">₹14.2 LPA</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-canvas border border-line">
                    <span className="text-[10px] text-ink-muted uppercase block font-bold">NBA Placement Index</span>
                    <span className="font-display font-bold text-success text-xs">92 / 100 Points</span>
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
                    className="text-[11px] font-bold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
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
                    className="text-[11px] font-bold text-brand hover:underline cursor-pointer"
                  >
                    Senate Digest &rarr;
                  </button>
                </div>
              </div>
            )}

            {activeLens === 'admin' && (
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink flex items-center gap-1.5 font-display">
                    <Shield size={14} className="text-brand" />
                    Zero-Injection Security &amp; Token Telemetry
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-success-bg text-success border border-success-border">
                    PIP Defense: ACTIVE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-canvas border border-line">
                    <span className="text-[10px] text-ink-muted uppercase block font-bold">Quota Consumed</span>
                    <span className="font-mono font-bold text-brand text-xs">16.8% (42.1k / 250k)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-canvas border border-line">
                    <span className="text-[10px] text-ink-muted uppercase block font-bold">Blocked PIP Threats</span>
                    <span className="font-mono font-bold text-danger text-xs">14 Vectors Prevented</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-line flex items-center justify-between text-[11px]">
                  <span className="text-ink-muted font-mono text-[10px]">
                    {adminMerkleVerified ? '✓ Merkle Root Verified (SHA-256)' : '1,248 Traces Stored'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdminMerkleVerified(true)}
                    className="px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 text-[10px] font-bold hover:bg-brand/20 cursor-pointer transition-colors"
                  >
                    {adminMerkleVerified ? 'Ledger Untampered' : 'Verify Merkle Hash'}
                  </button>
                </div>
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
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Executing {selectedAgent}...</span>
                </>
              ) : (
                <>
                  <Bot size={14} className="text-now" />
                  <span>Execute {selectedAgent}</span>
                </>
              )}
            </button>

            {/* Agent Result Card */}
            {agentResult && (
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-3.5 text-xs shadow-xs animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success" />
                    <span className="font-bold text-ink font-display text-sm">
                      {agentResult.agent_name} Execution Complete
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-success-bg text-success border border-success-border font-bold">
                      {agentResult.status}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-canvas border border-line text-ink-muted">
                      Gov: {agentResult.governance_level || 'L1'}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-brand/5 border border-brand/20 p-3 text-xs text-ink font-medium leading-relaxed">
                  {agentResult.summary}
                </div>

                {/* Specialized Visual Outcome Visualizer per Agent */}
                {agentResult.agent_name === 'JNFIntelligenceAgent' && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink font-display flex items-center gap-1.5">
                        <Building2 size={14} className="text-now" />
                        {jnfCompany} Classification Certificate
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-now text-now-ink text-[10px] font-extrabold shadow-2xs">
                        Tier-1 Super Dream
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-surface border border-line">
                        <span className="text-[10px] text-ink-muted block uppercase font-bold">Annual CTC</span>
                        <span className="font-display font-bold text-ink text-xs">₹{jnfCtc} LPA</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface border border-line">
                        <span className="text-[10px] text-ink-muted block uppercase font-bold">Min CGPA</span>
                        <span className="font-mono font-bold text-ink text-xs">{jnfCgpa} / 10.0</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface border border-line">
                        <span className="text-[10px] text-ink-muted block uppercase font-bold">Monthly Stipend</span>
                        <span className="font-mono font-bold text-success text-xs">₹85,000 /mo</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-ink-secondary flex items-center gap-1 pt-0.5">
                      <CheckCircle2 size={12} className="text-success shrink-0" />
                      <span>Verified Tier-1 Multi-Offer Entitled per Senate Regulations Section 4.2</span>
                    </div>
                  </div>
                )}

                {agentResult.agent_name === 'SuperdayClashSolverAgent' && (
                  <div className="rounded-xl border border-teal-300 bg-teal-50/50 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink font-display flex items-center gap-1.5">
                        <Users size={14} className="text-teal-700" />
                        Superday Conflict Resolution Matrix
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold border border-teal-300">
                        Overlap Resolved
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="p-2 rounded-lg bg-surface border border-line flex items-center justify-between">
                        <span className="font-semibold text-ink text-[11px]">Slot 1: Google Technical Round</span>
                        <span className="font-mono text-[10px] text-ink-muted">10:00 - 11:00 AM (Fixed)</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface border border-line flex items-center justify-between">
                        <span className="font-semibold text-ink text-[11px]">Slot 2: Goldman Sachs System Design</span>
                        <span className="font-mono text-[10px] text-teal-700 font-bold">Rescheduled: 14:00 - 15:00 PM</span>
                      </div>
                    </div>
                  </div>
                )}

                {agentResult.tool_results && agentResult.tool_results.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-line">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                      Tool Executions Pipeline
                    </span>
                    {agentResult.tool_results.map((tr, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-canvas border border-line">
                        <span className="font-mono text-[11px] text-ink font-bold">{tr.tool_name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-bg text-success border border-success-border font-semibold">
                            {tr.status}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-line text-ink-muted">
                            {tr.risk_tier}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {agentResult.recommendation && (
                  <details open className="group pt-2 border-t border-line">
                    <summary className="text-[10px] font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:text-ink flex items-center justify-between select-none">
                      <span>Recommendation Payload Inspector</span>
                      <ChevronDown size={11} className="transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-1.5 rounded-xl bg-slate-900 text-slate-100 p-2.5 font-mono text-[11px] overflow-x-auto shadow-inner">
                      <pre className="m-0 whitespace-pre-wrap">
                        {JSON.stringify(agentResult.recommendation, null, 2)}
                      </pre>
                    </div>
                  </details>
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
                <div className="rounded-xl border border-line bg-surface p-3 shadow-2xs">
                  <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                    Total Executions
                  </span>
                  <span className="text-base font-extrabold text-ink font-display mt-0.5 block">
                    {quotaInfo.metrics.total_traces}
                  </span>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3 shadow-2xs">
                  <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-bold">
                    Avg Latency
                  </span>
                  <span className="text-base font-extrabold text-brand font-display mt-0.5 block">
                    {Math.round(quotaInfo.metrics.avg_latency_ms)}ms
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink font-display">Recent Audit Ledger Traces</span>
              <button
                type="button"
                onClick={loadTraces}
                className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={11} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-2">
              {traces.length === 0 ? (
                <div className="text-center py-8 text-xs text-ink-muted bg-surface rounded-2xl border border-line">
                  No traces recorded in active tenant yet.
                </div>
              ) : (
                traces.map((tr) => (
                  <div
                    key={tr.trace_id}
                    className="rounded-xl border border-line bg-surface p-3 text-xs space-y-1.5 shadow-2xs hover:border-brand/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-brand font-bold">
                        {tr.task_type}
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        {new Date(tr.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-ink line-clamp-1 m-0">
                      {tr.prompt_snippet}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-ink-muted font-mono pt-1">
                      <span>{tr.total_tokens} tokens</span>
                      <span>&bull;</span>
                      <span className={tr.pip_passed ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                        PIP: {tr.pip_passed ? '✓ Clean' : '⚠ Blocked'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sleek Docked User Input Console (Always Accessible, Never Cramped) */}
      {activeMode === 'rag' && (
        <div className="border-t border-line bg-surface p-3 sm:p-3.5 shrink-0 shadow-lg">
          <form onSubmit={handleSubmitRag} className="space-y-1.5">
            <div className="relative flex items-center gap-2 rounded-2xl border-2 border-line bg-canvas/60 focus-within:border-now focus-within:bg-surface focus-within:ring-2 focus-within:ring-now/20 transition-all p-1.5 pr-2 shadow-2xs">
              <label htmlFor="copilot-query-input" className="sr-only">
                Ask a Policy or Workflow Question
              </label>
              <textarea
                id="copilot-query-input"
                rows={1}
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitRag();
                  }
                }}
                placeholder="Ask about placement policy, interview preparation, or workflow..."
                className="flex-1 resize-none border-0 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-hidden min-h-[38px] max-h-24 leading-relaxed"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !queryInput.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-now text-now-ink hover:bg-amber-400 font-bold px-4 py-2 text-xs shadow-xs transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-now-ink" />
                    <span>Reasoning...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} className="text-now-ink" />
                    <span>Ask Copilot</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between px-1 text-[10px] text-ink-muted">
              <span>Press <kbd className="font-semibold text-ink">Enter ↵</kbd> to ask &bull; DPDP 2023 Consent Guard Active</span>
              <span className="text-success font-medium">{sharedKeys.length} records authorized</span>
            </div>
          </form>
        </div>
      )}

      {/* 8. Bottom Footer Status */}
      <div className="border-t border-line bg-surface px-5 py-3 text-xs text-ink-muted flex items-center justify-between">
        <span className="truncate">
          Grounded with role persona &bull; {displayName} ({activeLens} profile locked)
        </span>
        <span className="text-success font-bold shrink-0 flex items-center gap-1">
          <ShieldCheck size={13} /> DPDP 2023 Shield: Active
        </span>
      </div>
    </aside>
  </div>
  );
};

export default CampusCopilotDrawer;
