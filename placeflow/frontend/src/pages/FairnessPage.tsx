import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { ShieldCheck, AlertCircle, CheckCircle2, Activity, Database } from 'lucide-react';

export const FairnessPage: React.FC = () => {
  const [audit, setAudit] = useState<{
    total_cohort_evaluated: number;
    overall_selection_rate: number;
    disparate_impact_ratio: number;
    fairness_status: string;
    slice_reports: Array<{
      slice: string;
      sample_size: number;
      mean_cgpa: number;
      avg_predicted_probability: number;
      selection_rate_high_prob: number;
      actual_placement_rate: number;
    }>;
    prohibited_features_list: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getFairnessAudit()
      .then((res) => {
        setAudit(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !audit) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
        <Activity className="animate-spin mr-2" size={18} />
        Executing Section 9.3 Fairness &amp; Disparate Impact Audit...
      </div>
    );
  }

  const isCompliant = audit.fairness_status === 'COMPLIANT';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-l-[#0B1B3D] border border-slate-200 rounded p-5 shadow-subtle flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
            SECTION 9.3 &bull; AI GOVERNANCE FAIRNESS &amp; SENSITIVE ATTRIBUTE AUDITING
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 m-0">
            Demographic Slice Fairness &amp; Proxy Feature Audit
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Verifies that machine learning models strictly exclude sensitive or proxy features (gender, caste, religion, disability, home state) and evaluates selection-rate parity across academic departments.
          </p>
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold border ${
            isCompliant
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {isCompliant ? (
            <CheckCircle2 size={13} className="text-emerald-600" />
          ) : (
            <AlertCircle size={13} className="text-amber-600" />
          )}
          <span>{audit.fairness_status}</span>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500 uppercase">Evaluated Cohort</div>
          <div className="text-2xl font-bold font-serif text-slate-900 mt-1">
            {audit.total_cohort_evaluated} candidates
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all 7 engineering branches</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500 uppercase">Disparate Impact Ratio</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {audit.disparate_impact_ratio}x
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Four-fifths threshold (min/max ratio &ge; 0.65)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500 uppercase">Mean Selection Rate</div>
          <div className="text-2xl font-bold font-mono text-slate-800 mt-1">
            {(audit.overall_selection_rate * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">High probability (&ge; 70%) threshold</div>
        </div>
      </div>

      {/* Department Slice Parity Table */}
      <div className="bg-white border border-slate-200 rounded shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-slate-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide m-0">
              Departmental Slice Parity Report (FR-ML-002)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Calibrated Model Demographic Evaluation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Academic Slice</th>
                <th className="py-2.5 px-4">Sample Size (N)</th>
                <th className="py-2.5 px-4">Slice Mean CGPA</th>
                <th className="py-2.5 px-4">Avg Predicted Probability</th>
                <th className="py-2.5 px-4">High-Likelihood Selection Rate</th>
                <th className="py-2.5 px-4">Actual Placement Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {audit.slice_reports.map((s) => (
                <tr key={s.slice} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-[#0B1B3D] font-sans">{s.slice}</td>
                  <td className="py-2.5 px-4 text-slate-700">{s.sample_size}</td>
                  <td className="py-2.5 px-4 text-slate-800 font-semibold">{s.mean_cgpa.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-slate-800">{s.avg_predicted_probability}%</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-bold">
                    {(s.selection_rate_high_prob * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">{s.actual_placement_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prohibited Attributes Box */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle space-y-3">
        <h3 className="text-sm font-bold font-serif text-slate-900 m-0">
          Statutory Ban on Sensitive &amp; Proxy Attributes (FR-ML-001)
        </h3>
        <p className="text-xs text-slate-600 m-0 leading-relaxed">
          In strict accordance with the <strong>India AI Governance Guidelines</strong> and Section 9.1 Principle 4, models trained and deployed within PlaceFlow are strictly prohibited from consuming sensitive proxy attributes.
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {audit.prohibited_features_list.map((feat) => (
            <span
              key={feat}
              className="px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 rounded text-xs font-mono font-medium"
            >
              Prohibited: {feat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

