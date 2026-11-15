import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  Database,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { MacOsLoadingScreen } from '../../../components/ui/MacOsLoadingScreen';
import { InsightsNav } from '../components/InsightsNav';
import { StateBlock } from '../../../ui/StateBlock';

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

  const fetchAudit = () => {
    setLoading(true);
    api
      .getFairnessAudit()
      .then((res) => {
        setAudit(res);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err?.message || 'Failed to compute fairness audit');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  if (loading || !audit) {
    return (
      <div className="space-y-6">
        <InsightsNav />
        <MacOsLoadingScreen
          message="Executing Section 9.3 Fairness &amp; Disparate Impact Audit (ML-04)..."
          description="Auditing statistical parity and adverse impact ratios across demographic segments"
          fullScreen={false}
        />
      </div>
    );
  }

  const isCompliant = audit.fairness_status === 'COMPLIANT';

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto">
      {/* 1. Sub Navigation */}
      <InsightsNav />

      {/* 2. Hero Header */}
      <StateBlock variant="navy">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-xs">
              <Scale size={13} className="text-amber-400" />
              <span>Section 9.3 • AI Governance Fairness &amp; Sensitive Attribute Audit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0 font-display">
              Demographic Slice Fairness &amp; Proxy Feature Audit
            </h1>
            <p className="text-sm text-white/80 max-w-2xl m-0 leading-relaxed">
              Verifies that machine learning models strictly exclude sensitive or proxy features (gender, caste, religion, disability, home state) and evaluates selection-rate parity across academic departments.
            </p>
          </div>

          <div
            className={`px-4 py-2.5 rounded-2xl shrink-0 font-bold text-xs flex items-center gap-2 shadow-sm ${
              isCompliant
                ? 'bg-emerald-400 text-emerald-950'
                : 'bg-amber-400 text-amber-950'
            }`}
          >
            {isCompliant ? (
              <CheckCircle2 size={16} className="text-emerald-950" />
            ) : (
              <AlertCircle size={16} className="text-amber-950" />
            )}
            <span>Status: {audit.fairness_status} (4/5ths Compliant)</span>
          </div>
        </div>
      </StateBlock>

      {/* 3. KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            Evaluated Cohort
          </div>
          <div className="text-2xl font-black text-ink mt-1 font-display">
            {audit.total_cohort_evaluated} candidates
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">Across all engineering branches</div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            Disparate Impact Ratio
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-display">
            {audit.disparate_impact_ratio}x
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">
            Four-fifths threshold (min/max ratio &ge; 0.65 threshold)
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            Cohort Selection Rate
          </div>
          <div className="text-2xl font-black text-ink mt-1 font-display">
            {(audit.overall_selection_rate * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">High probability (&ge; 70%) threshold</div>
        </div>
      </div>

      {/* 4. Department Slice Parity Table */}
      <div className="bg-surface border border-line rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-line bg-canvas/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-brand" />
            <div>
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide m-0">
                Departmental Slice Parity Report (FR-ML-002)
              </h2>
              <p className="text-xs text-ink-muted m-0">
                Calibrated Model Demographic Evaluation across cohorts
              </p>
            </div>
          </div>
          <span className="text-xs text-ink-muted font-mono font-medium">
            4/5ths Rule Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas text-ink-muted font-semibold border-b border-line">
              <tr>
                <th className="py-3 px-4">Academic Slice</th>
                <th className="py-3 px-4">Sample Size (N)</th>
                <th className="py-3 px-4">Slice Mean CGPA</th>
                <th className="py-3 px-4">Avg Predicted Probability</th>
                <th className="py-3 px-4">High-Likelihood Rate</th>
                <th className="py-3 px-4">Actual Placement Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {audit.slice_reports.map((s) => (
                <tr key={s.slice} className="hover:bg-canvas/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-ink">{s.slice}</td>
                  <td className="py-3 px-4 text-ink-muted font-mono">{s.sample_size}</td>
                  <td className="py-3 px-4 text-ink font-semibold font-mono">{s.mean_cgpa.toFixed(2)}</td>
                  <td className="py-3 px-4 text-ink font-mono">{s.avg_predicted_probability}%</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold font-mono">
                    {(s.selection_rate_high_prob * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-ink-muted font-mono">{s.actual_placement_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Prohibited Attributes Exclusion Seal */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-ink m-0">
            Statutory Ban on Sensitive &amp; Proxy Attributes (FR-ML-001)
          </h3>
        </div>
        <p className="text-xs text-ink-muted m-0 leading-relaxed max-w-3xl">
          In strict accordance with the <strong>India AI Governance Guidelines</strong> and Section 9.1 Principle 4, models trained and deployed within PlaceFlow are strictly prohibited from consuming sensitive proxy attributes. Feature encoders enforce compile-time rejection of demographic bias vectors.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {audit.prohibited_features_list.map((feat) => (
            <span
              key={feat}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-800 border border-red-200/80 rounded-xl text-xs font-mono font-semibold"
            >
              <Lock size={11} className="text-red-600" />
              <span>Prohibited: {feat}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
