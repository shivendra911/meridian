import React, { useState } from 'react';
import { api } from '../api';
import { Bot, Send, ShieldCheck, Terminal, CheckCircle2, Activity } from 'lucide-react';

export const CopilotPage: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<'AG-01' | 'AG-02' | 'AG-10'>('AG-01');
  const [prompt, setPrompt] = useState('');
  const [studentId, setStudentId] = useState('STU001');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{
      sender: 'user' | 'agent';
      text: string;
      agentId?: string;
      plan?: string[];
      toolCalls?: Array<{ tool: string; args: Record<string, unknown> }>;
      autonomy?: string;
    }>
  >([
    {
      sender: 'agent',
      agentId: 'AG-01',
      autonomy: 'L0',
      text: 'Greetings. I am the PlaceFlow Student Career Assistant (AG-01). You can ask me to check your eligible drives, upcoming interview schedule, or placement tier upgrade rules.',
    },
  ]);

  const agentsMeta = {
    'AG-01': {
      name: 'AG-01 Student Assistant',
      role: 'Advisory Assistant',
      autonomy: 'L0 Advisory',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      desc: 'Zero side-effects. Answers drive eligibility queries, interview schedules & tier rules.',
      quickPrompts: [
        'Am I eligible for any campus jobs?',
        'When is my next interview round?',
        'Explain the Dream tier upgrade policy',
      ],
    },
    'AG-02': {
      name: 'AG-02 TPO Copilot',
      role: 'Placement Officer Assistant',
      autonomy: 'L1 Drafting',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      desc: 'Triage queues, collision alerts & administrative report selection for coordinator approval.',
      quickPrompts: [
        'List pending administrative tasks',
        'Check active schedule conflicts',
        'Generate department placement velocity report',
      ],
    },
    'AG-10': {
      name: 'AG-10 Scheduling Agent',
      role: 'Resource Optimizer',
      autonomy: 'L2 Approval',
      badgeColor: 'bg-red-50 text-red-800 border-red-200',
      desc: 'Evaluates Superday constraint satisfaction schedules and detects interview room collisions.',
      quickPrompts: [
        'Scan Superday schedule for collisions',
        'Propose clash-free slots for pending loops',
      ],
    },
  };

  const handleSend = async (userPromptText?: string) => {
    const textToSend = userPromptText || prompt;
    if (!textToSend.trim() || loading) return;

    const userMsg = { sender: 'user' as const, text: textToSend };
    setHistory((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await api.sendAgentChat(selectedAgent, textToSend, studentId);
      const agentMsg = {
        sender: 'agent' as const,
        agentId: res.agent_id,
        autonomy: res.autonomy_level,
        text: res.response,
        plan: res.plan,
        toolCalls: res.tool_calls.map((tc) => ({ tool: tc.tool, args: tc.args })),
      };
      setHistory((prev) => [...prev, agentMsg]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Agent invocation failed';
      setHistory((prev) => [
        ...prev,
        {
          sender: 'agent' as const,
          agentId: selectedAgent,
          text: `Error executing agent runtime: ${errorMsg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentMeta = agentsMeta[selectedAgent];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-l-[#8C1515] border border-slate-200 rounded p-5 shadow-subtle flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
            SECTION 10 &bull; AUTONOMOUS AGENT RUNTIME (TYPED MCP TOOLS)
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 m-0">
            Institutional Agent Copilot Hub
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Governed multi-agent assistants operating through typed MCP tools with graded autonomy (L0&ndash;L2). Untrusted user input is quarantined as literal data; all actions log immutable traces.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded text-xs font-semibold">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>3 Agents Active (L0&ndash;L2)</span>
        </div>
      </div>

      {/* Main Copilot Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Agent Selector Rail */}
        <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle space-y-3">
          <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
            Select Active Agent
          </div>

          {(Object.keys(agentsMeta) as Array<'AG-01' | 'AG-02' | 'AG-10'>).map((aid) => {
            const meta = agentsMeta[aid];
            const isSelected = selectedAgent === aid;
            return (
              <div
                key={aid}
                onClick={() => setSelectedAgent(aid)}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#8C1515] bg-[#FDF2F2] shadow-2xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-[#8C1515]' : 'text-slate-900'
                    }`}
                  >
                    {aid}
                  </span>
                  <span
                    className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border font-semibold ${meta.badgeColor}`}
                  >
                    {meta.autonomy}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">{meta.role}</div>
                <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{meta.desc}</div>
              </div>
            );
          })}

          <div className="pt-3 border-t border-slate-200">
            <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
              Active Candidate Context
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.toUpperCase())}
              placeholder="e.g. STU001"
              className="w-full px-2.5 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#8C1515]"
            />
          </div>
        </div>

        {/* Chat & Execution Panel */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded shadow-subtle flex flex-col h-[580px]">
          {/* Top Chat Bar */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#8C1515] text-white flex items-center justify-center font-bold text-xs">
                <Bot size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900">{currentMeta.name}</span>
                <span className="text-[11px] text-slate-500 ml-2">({currentMeta.role})</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${currentMeta.badgeColor}`}
            >
              {currentMeta.autonomy}
            </span>
          </div>

          {/* Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {history.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded p-3 text-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#0B1B3D] text-white'
                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                >
                  {/* Plan steps if agent */}
                  {msg.plan && msg.plan.length > 0 && (
                    <div className="mb-2 pb-2 border-b border-slate-200">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                        <Terminal size={11} />
                        <span>Execution Plan:</span>
                      </div>
                      <div className="space-y-1">
                        {msg.plan.map((step, sidx) => (
                          <div
                            key={sidx}
                            className="flex items-center gap-1.5 text-[10.5px] text-slate-600 font-mono"
                          >
                            <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool Call Badges */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {msg.toolCalls.map((tc, tidx) => (
                        <span
                          key={tidx}
                          className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-700 shadow-2xs"
                        >
                          {tc.tool}()
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded border border-slate-200 w-fit">
                <Activity className="animate-spin text-[#8C1515]" size={13} />
                <span>Executing plan and scoped MCP tools...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase mr-1">
              Suggestions:
            </span>
            {currentMeta.quickPrompts.map((qp, qidx) => (
              <button
                key={qidx}
                onClick={() => handleSend(qp)}
                className="text-[11px] text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Prompt Box */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Ask ${selectedAgent} (${currentMeta.role})...`}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#8C1515] focus:outline-hidden"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="px-4 py-2 bg-[#8C1515] hover:bg-[#701010] text-white text-xs font-semibold rounded flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <Send size={12} />
                <span>Execute</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

