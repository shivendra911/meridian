import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { WhatIfResult } from '../types';
import { Sliders, Activity, AlertCircle, ArrowLeft, CheckCircle2, TrendingUp } from 'lucide-react';

interface WhatIfPageProps {
  studentId: string;
  onBack: () => void;
}

export const WhatIfPage: React.FC<WhatIfPageProps> = ({ studentId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form parameters
  const [targetCgpa, setTargetCgpa] = useState<number>(8.5);
  const [targetBacklogs, setTargetBacklogs] = useState<number>(0);
  const [addedSkills, setAddedSkills] = useState<string>('Docker, AWS, Kubernetes');

  const executeSimulation = (cgpa?: number, backlogs?: number, skills?: string[]) => {
    setComputing(true);
    api
      .runWhatIfSimulation({
        student_id: studentId,
        hypothetical_cgpa: cgpa !== undefined ? cgpa : targetCgpa,
        resolved_backlogs: backlogs !== undefined ? backlogs : targetBacklogs,
        additional_skills: skills || addedSkills.split(',').map((s) => s.trim()).filter(Boolean),
      })
      .then((res) => {
        setResult(res);
        setComputing(false);
        setLoading(false);
        if (res.simulated) {
          setTargetCgpa(res.simulated.cgpa);
          setTargetBacklogs(res.simulated.backlogs);
        }
      })
      .catch((err) => {
        setError(err.message);
        setComputing(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    executeSimulation();
  }, [studentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSimulation();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
        <Activity className="animate-spin mr-2" size={18} />
        Initializing ML-23 What-If Career Simulation Engine...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-cardinal transition-colors"
      >
        <ArrowLeft size={13} />
        <span>Return to Candidate Dossier ({studentId})</span>
      </button>

      {/* Header */}
      <div className="bg-white border-l-4 border-l-cardinal border border-slate-200 rounded p-5 shadow-subtle flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
            SECTION 9 &bull; ML-23 ADVISORY EXPLAINABILITY &amp; ML-07 CONFORMAL BANDS
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 m-0">
            What-If Career Simulator &amp; Competency Estimator
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Simulate incremental academic standing, backlog clearances, and cloud/engineering skill acquisitions under calibrated machine learning models.
          </p>
        </div>
        <div className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200 font-semibold">
          Candidate: {studentId}
        </div>
      </div>

      {result?.opted_out ? (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded text-amber-900 text-sm">
          <div className="font-bold flex items-center gap-2 mb-1">
            <AlertCircle size={16} />
            <span>Candidate Opted Out of Predictive Modeling</span>
          </div>
          <p className="text-xs text-amber-800 m-0">
            {result.message || 'Candidate has opted out of personalized predictive analytics under DPDP Notice v2026.1-DPDP.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle h-fit">
            <h2 className="text-sm font-bold font-serif text-slate-900 mb-1 flex items-center gap-2">
              <Sliders size={14} className="text-cardinal" />
              <span>Adjust Hypothetical Parameters</span>
            </h2>
            <div className="text-[11px] text-slate-500 mb-4">
              Test how profile modifications shift placement odds and unlock recruiters.
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Cumulative CGPA (0.00 &ndash; 10.00)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="10"
                  value={targetCgpa}
                  onChange={(e) => setTargetCgpa(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-cardinal font-mono"
                  required
                />
                {result?.baseline && (
                  <div className="text-[10.5px] text-slate-400 mt-1">
                    Current Baseline: <strong className="font-mono text-slate-700">{result.baseline.cgpa.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Active Backlogs Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={targetBacklogs}
                  onChange={(e) => setTargetBacklogs(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-cardinal font-mono"
                  required
                />
                {result?.baseline && (
                  <div className="text-[10.5px] text-slate-400 mt-1">
                    Current Baseline: <strong className="font-mono text-slate-700">{result.baseline.backlogs}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Technical Proficiencies
                </label>
                <input
                  type="text"
                  value={addedSkills}
                  onChange={(e) => setAddedSkills(e.target.value)}
                  placeholder="e.g. Go, Kubernetes, React"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-cardinal"
                />
                <div className="text-[10.5px] text-slate-400 mt-1">
                  Comma-separated competencies to simulate acquiring
                </div>
              </div>

              <button
                type="submit"
                disabled={computing}
                className="w-full py-2 bg-cardinal hover:bg-cardinal-dark text-white text-xs font-semibold rounded shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {computing ? <Activity className="animate-spin" size={13} /> : <TrendingUp size={13} />}
                <span>Recompute What-If Simulation</span>
              </button>
            </form>
          </div>

          {/* Results Panel */}
          {result?.simulated && result?.baseline && (
            <div className="lg:col-span-2 space-y-5">
              {/* Likelihood Shift Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded p-4 shadow-subtle">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">
                    Baseline Likelihood
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-700 mt-1">
                    {result.baseline.placement_probability}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Risk Band: <span className="font-semibold text-slate-700">{result.baseline.risk_level}</span>
                  </div>
                </div>

                <div className="bg-white border border-emerald-300 border-t-3 border-t-emerald-600 rounded p-4 shadow-subtle">
                  <div className="text-[11px] font-semibold text-emerald-800 uppercase">
                    Simulated Likelihood
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                    {result.simulated.placement_probability}%
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
                    Shift:{' '}
                    <span className="font-mono">
                      {result.simulated.placement_probability >= result.baseline.placement_probability ? '+' : ''}
                      {(result.simulated.placement_probability - result.baseline.placement_probability).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Conformal Package Band (ML-07) */}
              <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold font-serif text-slate-900 m-0">
                      Conformal Package Band Estimate (ML-07)
                    </h3>
                    <div className="text-[11px] text-slate-500">
                      Quantile gradient boosting with 80% coverage intervals
                    </div>
                  </div>
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                    80% Conformal Interval
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 p-4 rounded border border-slate-200">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Lower Bound (80%)</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mt-1">
                      ₹{result.simulated.package_band_80.lower_bound_lpa} LPA
                    </div>
                  </div>
                  <div className="border-x border-slate-200">
                    <div className="text-[10px] uppercase font-semibold text-cardinal">Median Expected CTC</div>
                    <div className="text-xl font-bold font-mono text-cardinal mt-1">
                      ₹{result.simulated.package_band_80.median_lpa} LPA
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-emerald-700">Upper Bound (80%)</div>
                    <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
                      ₹{result.simulated.package_band_80.upper_bound_lpa} LPA
                    </div>
                  </div>
                </div>
              </div>

              {/* Plain-Language Explanations (ML-23 / FR-ML-004) */}
              <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle">
                <h3 className="text-sm font-bold font-serif text-slate-900 mb-1">
                  Actionable Career Recommendations
                </h3>
                <div className="text-[11px] text-slate-500 mb-3">
                  Plain-language explainability without verdicts ("people first" AI governance)
                </div>

                <div className="space-y-2">
                  {result.explanations?.map((exp, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{exp}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[10.5px] text-slate-400 italic">
                  {result.disclaimer || 'Advisory only. No model decides selection; human placement coordinators make final selections.'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

