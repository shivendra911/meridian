import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { toast } from 'sonner';
import { SuperdayConflict, Interview } from '../types';
import { Zap, AlertTriangle, CheckCircle, Activity, Calendar } from 'lucide-react';

export const SuperdayPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [conflicts, setConflicts] = useState<SuperdayConflict[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    api
      .getSuperdayConflicts()
      .then((res) => {
        setConflicts(res.conflicts);
        setInterviews(res.interviews);
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolve = () => {
    setResolving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    api
      .resolveSuperdayConflicts()
      .then((res) => {
        setResolving(false);
        setSuccessMsg(res.message);
        toast.success(res.message || 'Superday interview conflicts resolved!');
        loadData();
      })
      .catch((err) => {
        setResolving(false);
        setErrorMsg(err.message);
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-l-cardinal border border-slate-200 rounded p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
            ENTERPRISE MOAT &bull; CONSTRAINT-SATISFACTION AUTO-SLOTTER
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 m-0">
            Superday Multi-Track Conflict Arbitrator
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Detects overlapping interview intervals across concurrent recruiter tracks. The 1-click constraint solver eliminates double-booking and room collisions in an ACID transaction.
          </p>
        </div>

        {/* 1-Click Resolve Button */}
        <div>
          <button
            onClick={handleResolve}
            disabled={resolving || conflicts.length === 0}
            className={`px-4 py-2 text-xs font-semibold rounded shadow-xs flex items-center gap-2 transition-colors ${
              conflicts.length > 0
                ? 'bg-cardinal hover:bg-cardinal-dark text-white'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {resolving ? <Activity className="animate-spin" size={13} /> : <Zap size={13} />}
            <span>1-Click Auto-Resolve Conflicts</span>
          </button>
        </div>
      </div>

      {/* Flash Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded text-xs flex items-center gap-2 font-medium">
          <CheckCircle size={15} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded text-xs flex items-center gap-2 font-medium">
          <AlertTriangle size={15} className="text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Collision Status Summary Card */}
      <div
        className={`p-4 rounded border ${
          conflicts.length > 0
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        } flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          {conflicts.length > 0 ? (
            <AlertTriangle className="text-amber-600" size={20} />
          ) : (
            <CheckCircle className="text-emerald-600" size={20} />
          )}
          <div>
            <div className="font-bold text-xs">
              {conflicts.length > 0
                ? `${conflicts.length} Concurrent Interview Collision(s) Detected`
                : 'Master Superday Schedule is Optimal'}
            </div>
            <div className="text-[11px] opacity-85">
              {conflicts.length > 0
                ? 'Candidate double-booking or room contention requires algorithmic slot arbitration.'
                : 'Zero panel or venue collisions across active recruitment tracks.'}
            </div>
          </div>
        </div>

        <span
          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
            conflicts.length > 0
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
          }`}
        >
          {conflicts.length > 0 ? 'COLLISIONS PRESENT' : 'OPTIMAL'}
        </span>
      </div>

      {/* Conflicts Breakdown if present */}
      {conflicts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle space-y-3">
          <h2 className="text-sm font-bold font-serif text-slate-900 m-0">
            Active Schedule Conflicts Matrix
          </h2>
          <div className="divide-y divide-slate-100">
            {conflicts.map((c, i) => (
              <div key={i} className="py-2.5 flex items-start justify-between text-xs">
                <div>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded mr-2 ${
                      c.type === 'CANDIDATE_CLASH'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {c.type}
                  </span>
                  <span className="font-semibold text-slate-800">{c.description}</span>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Interview A: {c.interview_a} &bull; Interview B: {c.interview_b}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-mono">
                  {c.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Master Interview Schedule Table */}
      <div className="bg-white border border-slate-200 rounded shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide m-0">
              Master Superday Interview Loop Ledger ({interviews.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Sorted chronologically by start time
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading interview schedules...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Interview ID</th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Round</th>
                  <th className="py-2.5 px-3">Scheduled Start</th>
                  <th className="py-2.5 px-3">Scheduled End</th>
                  <th className="py-2.5 px-3">Venue / Mode</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {interviews.map((iv) => (
                  <tr key={iv.interview_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-navy-900">
                      {iv.interview_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-bold">
                      {iv.student_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-sans">{iv.round}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {new Date(iv.scheduled_start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {new Date(iv.scheduled_end).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-sans">
                      {iv.venue || 'Main Hall'} ({iv.mode})
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 font-sans">
                        <span className="px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {iv.result}
                        </span>
                        {iv.was_rescheduled && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            Rescheduled
                          </span>
                        )}
                      </div>
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

