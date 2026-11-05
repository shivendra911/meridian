import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { RenegeCandidate } from '../types';
import { Radar, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export const RenegeRadarPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<RenegeCandidate[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    moderate: 0,
    low: 0,
    avg_prob: 0,
  });

  useEffect(() => {
    api
      .getRenegeRadar()
      .then((res) => {
        setCandidates(res.candidates);
        setStats({
          total: res.total_placed_monitored,
          critical: res.critical_count,
          moderate: res.moderate_count,
          low: res.low_count,
          avg_prob: res.avg_renege_probability,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
        <Activity className="animate-spin mr-2" size={18} />
        Computing Post-Offer Flight Risk Telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-l-cardinal border border-slate-200 rounded p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
            ENTERPRISE MOAT &bull; RETENTION &amp; RENEGE EARLY WARNING RADAR
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 m-0">
            Post-Offer Retention Radar
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Detects candidate flight risk before joining day by evaluating department salary disparity ratios, post-offer interview loop leakage, and acceptance lag.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded text-xs font-semibold">
          <Radar size={13} className="text-amber-700" />
          <span>{stats.critical} Critical Interventions Needed</span>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Placed Monitored</div>
          <div className="text-2xl font-bold font-serif text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active accepted offers</div>
        </div>
        <div className="bg-white border border-red-300 rounded p-4 shadow-subtle border-t-3 border-t-red-600">
          <div className="text-xs font-semibold text-red-800 uppercase">Critical Flight Risk</div>
          <div className="text-2xl font-bold font-serif text-red-700 mt-1">{stats.critical}</div>
          <div className="text-[11px] text-red-600 mt-0.5">Immediate TPO call required</div>
        </div>
        <div className="bg-white border border-amber-300 rounded p-4 shadow-subtle border-t-3 border-t-amber-600">
          <div className="text-xs font-semibold text-amber-800 uppercase">Moderate Flight Risk</div>
          <div className="text-2xl font-bold font-serif text-amber-700 mt-1">{stats.moderate}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Salary ratio &lt; 0.85</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500 uppercase">Cohort Avg Flight Risk</div>
          <div className="text-2xl font-bold font-mono text-slate-800 mt-1">{stats.avg_prob}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Telemetry mean likelihood</div>
        </div>
      </div>

      {/* Candidates Ledger */}
      <div className="bg-white border border-slate-200 rounded shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide m-0">
            Placed Candidate Flight Telemetry Table
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Sorted by flight risk descending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Candidate</th>
                <th className="py-2.5 px-4">Placed Company</th>
                <th className="py-2.5 px-4">Offer CTC</th>
                <th className="py-2.5 px-4">Dept Avg CTC</th>
                <th className="py-2.5 px-4">Salary Ratio</th>
                <th className="py-2.5 px-4">Post-Offer Leaks</th>
                <th className="py-2.5 px-4">Flight Risk %</th>
                <th className="py-2.5 px-4">Prescribed Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((c) => (
                <tr key={c.student_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="font-bold text-navy-900">{c.name}</div>
                    <div className="text-[10.5px] font-mono text-slate-400">
                      {c.student_id} &bull; {c.department}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{c.placed_company}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-cardinal">
                    ₹{c.package_lpa} LPA
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">
                    ₹{c.dept_avg_package} LPA
                  </td>
                  <td className="py-2.5 px-4 font-mono">
                    <span
                      className={`font-semibold ${
                        c.salary_ratio < 0.8 ? 'text-red-600' : 'text-slate-800'
                      }`}
                    >
                      {c.salary_ratio.toFixed(2)}x
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-center">
                    {c.post_offer_apps_count > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                        {c.post_offer_apps_count} leaks
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        c.risk_level === 'CRITICAL'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : c.risk_level === 'MODERATE'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {c.renege_probability}% ({c.risk_level})
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 text-[11.5px]">
                    {c.recommended_action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

