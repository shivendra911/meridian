import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api';
import { AgentRun } from '../types';
import { History, Activity, Bot } from 'lucide-react';

interface AgentRunsPageProps {
  onOpenCopilot?: () => void;
}

export const AgentRunsPage: React.FC<AgentRunsPageProps> = ({ onOpenCopilot: propOnOpenCopilot }) => {
  const context = useOutletContext<{ onOpenCopilot?: () => void }>();
  const onOpenCopilot = propOnOpenCopilot || context?.onOpenCopilot;
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [totalTools, setTotalTools] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAgentRuns()
      .then((res) => {
        setRuns(res.runs);
        setTotalRuns(res.total_runs);
        setTotalTools(res.total_tools_executed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
        <Activity className="animate-spin mr-2" size={18} />
        Loading Agent Execution Trace Telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-l-cardinal border border-slate-200 rounded p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-1">
            SECTION 10 &bull; AUTONOMOUS AGENT TRACE TELEMETRY
          </div>
          <h1 className="text-xl font-bold  text-slate-900 m-0">
            Agent Execution Audit Ledger
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Immutable execution trace logs for autonomous multi-agent assistants (AG-01, AG-02, AG-10). Every prompt plan, typed MCP tool invocation, payload, and response is recorded for regulatory auditability.
          </p>
        </div>

        <button
          onClick={onOpenCopilot}
          className="px-3.5 py-1.5 bg-cardinal text-white text-xs font-semibold rounded hover:bg-cardinal-dark shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Bot size={13} />
          <span>Launch Copilot Console</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Agent Invocations</div>
          <div className="text-2xl font-bold  text-slate-900 mt-1">{totalRuns}</div>
          <div className="text-xs text-slate-400 mt-0.5">Recorded in agent_runs</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500 uppercase">MCP Tools Executed</div>
          <div className="text-2xl font-bold  text-slate-900 mt-1">{totalTools}</div>
          <div className="text-xs text-slate-400 mt-0.5">Scoped through typed tools</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500 uppercase">Governed Autonomy</div>
          <div className="text-2xl font-bold  text-slate-900 mt-1">L0 &ndash; L2</div>
          <div className="text-xs text-slate-400 mt-0.5">Human approval required for L1/L2</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500 uppercase">Security Quarantine</div>
          <div className="text-2xl font-bold  text-emerald-700 mt-1">0 Violations</div>
          <div className="text-xs text-slate-400 mt-0.5">Prompt injection defense active</div>
        </div>
      </div>

      {/* Execution Trace Table */}
      <div className="bg-white border border-slate-200 rounded shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={14} className="text-slate-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide m-0">
              Execution Trace Records ({runs.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Immutable Audit Trail
          </span>
        </div>

        {runs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No agent runs logged yet. Execute queries in the Autonomous Copilot Hub to generate execution traces.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Run ID</th>
                  <th className="py-2.5 px-4">Agent Identity</th>
                  <th className="py-2.5 px-4">Autonomy</th>
                  <th className="py-2.5 px-4">User Goal / Prompt</th>
                  <th className="py-2.5 px-4">MCP Tools Called</th>
                  <th className="py-2.5 px-4">Timestamp (UTC)</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((r) => (
                  <tr key={r.run_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-navy-900">
                      {r.run_id}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900">{r.agent_id}</div>
                      <div className="text-[10.5px] text-slate-500">{r.agent_name}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold border ${
                          r.autonomy_level === 'L0'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : r.autonomy_level === 'L1'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {r.autonomy_level}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 max-w-xs">
                      <div className="text-slate-900 font-medium truncate" title={r.goal}>
                        "{r.goal}"
                      </div>
                      {r.plan && r.plan.length > 0 && (
                        <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                          Plan: {r.plan.join(' • ')}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {r.tool_calls && r.tool_calls.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.tool_calls.map((tc, tidx) => (
                            <span
                              key={tidx}
                              className="px-1.5 py-0.5 rounded font-mono text-xs bg-slate-100 text-slate-800 border border-slate-200"
                            >
                              {tc.tool}()
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Direct Synthesis</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">
                      {new Date(r.executed_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10.5px] font-semibold">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

