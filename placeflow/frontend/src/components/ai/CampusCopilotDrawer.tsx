import React, { useState, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Shield,
  FileCheck2,
  Sparkles,
  Activity,
  AlertTriangle,
  History,
  CheckCircle2,
  Lock,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { api } from '../../api';

interface CampusCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CampusCopilotDrawer: React.FC<CampusCopilotDrawerProps> = ({ isOpen, onClose }) => {
  const [activeMode, setActiveMode] = useState<'rag' | 'agents' | 'traces'>('rag');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ragResult, setRagResult] = useState<any>(null);
  const [agentResult, setAgentResult] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState('JNFIntelligenceAgent');
  const [traces, setTraces] = useState<any[]>([]);
  const [quotaInfo, setQuotaInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load telemetry when switching to traces mode
  useEffect(() => {
    if (isOpen && activeMode === 'traces') {
      api.getAITraces(20).then((res) => setTraces(res?.traces || []));
      api.getAIQuotas().then((res) => setQuotaInfo(res));
    }
  }, [isOpen, activeMode]);

  const handleRunRAG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || loading) return;

    setLoading(true);
    setError(null);
    setRagResult(null);

    try {
      const res = await api.queryRAG(queryInput.trim());
      setRagResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete RAG query');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgent = async (agentName: string, customPayload?: any) => {
    setSelectedAgent(agentName);
    setLoading(true);
    setError(null);
    setAgentResult(null);

    let payload: Record<string, any> = customPayload || {};
    if (agentName === 'JNFIntelligenceAgent' && !customPayload) {
      payload = { company_name: 'Microsoft India', offered_ctc_lpa: 26.5, min_cgpa: 7.5 };
    } else if (agentName === 'SuperdayClashSolverAgent' && !customPayload) {
      payload = {
        student_id: 'STU004',
        slots: [
          { company: 'Google', start_time: '11:00 AM' },
          { company: 'Uber', start_time: '11:00 AM' },
        ],
      };
    } else if (agentName === 'AcademicAdvisorAgent' && !customPayload) {
      payload = { student_id: 'STU001', completed_credits: 135 };
    } else if (agentName === 'NIRFStatutoryAuditAgent' && !customPayload) {
      payload = {
        academic_year: '2025-26',
        graduated_count: 520,
        placed_count: 468,
        median_salary_lpa: 9.1,
      };
    }

    try {
      const res = await api.executeAIAgent(agentName, payload);
      setAgentResult(res);
    } catch (err: any) {
      setError(err?.message || 'Agent execution failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col font-sans transition-all">
      {/* Drawer Masthead */}
      <div className="p-4 bg-[#090D16] text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-cardinal flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="font-serif font-bold text-sm flex items-center gap-2">
              <span>Campus AI Copilot</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                CAMP-AI Live
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Cross-Platform Institutional Intelligence &bull; DPDP 2023 Masked
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Safety & Governance Banner */}
      <div className="bg-navy-900 text-slate-300 px-4 py-2 text-[11px] flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield size={12} className="text-emerald-400" />
          <span>PIP Protection: Strict Active</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock size={12} className="text-amber-400" />
          <span>DPDP Act PII Masking: Active</span>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
        <button
          onClick={() => setActiveMode('rag')}
          className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            activeMode === 'rag'
              ? 'border-cardinal text-cardinal bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen size={13} />
          <span>Policy RAG</span>
        </button>
        <button
          onClick={() => setActiveMode('agents')}
          className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            activeMode === 'agents'
              ? 'border-cardinal text-cardinal bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bot size={13} />
          <span>Domain Agents</span>
        </button>
        <button
          onClick={() => setActiveMode('traces')}
          className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            activeMode === 'traces'
              ? 'border-cardinal text-cardinal bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History size={13} />
          <span>Trace Ledger</span>
        </button>
      </div>

      {/* Body Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MODE 1: Institutional RAG */}
        {activeMode === 'rag' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
              Ask questions on institutional placement regulations, credit requirements, or interview policies.
              Answers are strictly grounded in verified documents with exact citations.
            </div>

            <form onSubmit={handleRunRAG} className="space-y-2">
              <div className="relative">
                <textarea
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="e.g. Can a student with a Dream offer apply for Super Dream roles?"
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-300 rounded focus:border-cardinal focus:outline-none font-mono"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setQueryInput('Can a student apply for an upgrade after getting a Dream offer?')
                    }
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200"
                  >
                    Dream Upgrades
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setQueryInput('What are the multiple exit credit requirements under NEP 2020?')
                    }
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200"
                  >
                    NEP Credits
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-cardinal hover:bg-cardinal-dark text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  {loading ? <Activity size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Ask Copilot</span>
                </button>
              </div>
            </form>

            {ragResult && (
              <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Grounded Institutional Answer</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    Score: {ragResult.groundedness_score * 100}%
                  </span>
                </div>

                <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {ragResult.answer}
                </div>

                {ragResult.citations && ragResult.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <FileCheck2 size={11} />
                      <span>Authoritative Sources Cited ({ragResult.citations.length})</span>
                    </div>
                    <div className="space-y-1">
                      {ragResult.citations.map((c: any, i: number) => (
                        <div
                          key={i}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 flex items-center justify-between font-mono"
                        >
                          <span className="font-semibold">{c.doc_title} (v{c.version})</span>
                          <span className="text-slate-500 text-[10px]">{c.section_heading}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: Autonomous Domain Agents */}
        {activeMode === 'agents' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleRunAgent('JNFIntelligenceAgent')}
                className={`p-2.5 text-left rounded border text-xs transition-colors ${
                  selectedAgent === 'JNFIntelligenceAgent'
                    ? 'border-cardinal bg-red-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-slate-900">JNF Intelligence</div>
                <div className="text-[10px] text-slate-500">Tier check & salary validation</div>
              </button>

              <button
                onClick={() => handleRunAgent('SuperdayClashSolverAgent')}
                className={`p-2.5 text-left rounded border text-xs transition-colors ${
                  selectedAgent === 'SuperdayClashSolverAgent'
                    ? 'border-cardinal bg-red-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-slate-900">Superday Clash Solver</div>
                <div className="text-[10px] text-slate-500">Interview overlap detection</div>
              </button>

              <button
                onClick={() => handleRunAgent('AcademicAdvisorAgent')}
                className={`p-2.5 text-left rounded border text-xs transition-colors ${
                  selectedAgent === 'AcademicAdvisorAgent'
                    ? 'border-cardinal bg-red-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-slate-900">Academic Advisor</div>
                <div className="text-[10px] text-slate-500">NEP 2020 exit credit checks</div>
              </button>

              <button
                onClick={() => handleRunAgent('NIRFStatutoryAuditAgent')}
                className={`p-2.5 text-left rounded border text-xs transition-colors ${
                  selectedAgent === 'NIRFStatutoryAuditAgent'
                    ? 'border-cardinal bg-red-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-slate-900">NIRF Statutory Audit</div>
                <div className="text-[10px] text-slate-500">Graduation outcome scoring</div>
              </button>
            </div>

            {loading && (
              <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <Activity size={16} className="animate-spin text-cardinal" />
                <span>Agent executing verified sandbox tools...</span>
              </div>
            )}

            {agentResult && !loading && (
              <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="font-semibold text-xs text-slate-900">
                    {agentResult.agent_name} Execution
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      agentResult.status === 'REQUIRES_APPROVAL'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {agentResult.status}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
                  {agentResult.summary}
                </div>

                {agentResult.tool_results && agentResult.tool_results.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Sandbox Tool Invocations
                    </div>
                    {agentResult.tool_results.map((tr: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 bg-white border border-slate-200 rounded text-xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="font-bold text-slate-800">{tr.tool_name}</span>
                          <span className="text-[9px] bg-slate-100 px-1 rounded text-slate-600">
                            {tr.risk_tier}
                          </span>
                        </div>
                        {tr.requires_human_approval && (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                            Human Sign-off Staged
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 3: Immutable Trace Ledger */}
        {activeMode === 'traces' && (
          <div className="space-y-3">
            {quotaInfo?.metrics && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-slate-400 text-[10px]">Total Traces</div>
                  <div className="font-bold text-slate-900">{quotaInfo.metrics.total_traces}</div>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-slate-400 text-[10px]">Tokens Used</div>
                  <div className="font-bold text-slate-900">{quotaInfo.metrics.total_prompt_tokens + quotaInfo.metrics.total_completion_tokens}</div>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-slate-400 text-[10px]">Avg Latency</div>
                  <div className="font-bold text-emerald-600">{Math.round(quotaInfo.metrics.avg_latency_ms)}ms</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {traces.length === 0 ? (
                <div className="text-center p-8 text-xs text-slate-400">
                  No interaction traces recorded for this tenant yet.
                </div>
              ) : (
                traces.map((tr) => (
                  <div
                    key={tr.trace_id}
                    className="p-3 bg-white border border-slate-200 rounded text-xs space-y-1 font-mono shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-bold text-slate-700">{tr.task_type}</span>
                      <span>{new Date(tr.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-800 truncate font-sans">
                      {tr.prompt_snippet}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Model: {tr.model_id}</span>
                      <span>Tokens: {tr.prompt_tokens + tr.completion_tokens}</span>
                      <span className={tr.pip_passed ? 'text-emerald-600' : 'text-red-600'}>
                        {tr.pip_passed ? 'PIP Passed' : 'PIP Blocked'}
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
  );
};

