import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  Sparkles,
  TrendingUp,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Wallet,
  Briefcase,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { studentApi, WhatIfSimulationResult } from '../api';
import { StateBlock } from '../../../ui/StateBlock';
import { MacOsLoadingScreen } from '../../../components/ui/MacOsLoadingScreen';

const COMMON_TARGET_SKILLS = [
  'Docker',
  'Kubernetes',
  'AWS',
  'System Design',
  'Kafka',
  'GraphQL',
  'React',
  'Node.js',
  'Golang',
  'Distributed Systems',
  'Microservices',
  'Redis',
];

export const StudentWhatIfPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<WhatIfSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [targetCgpa, setTargetCgpa] = useState<number>(8.5);
  const [targetBacklogs, setTargetBacklogs] = useState<number>(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Docker', 'AWS']);

  const executeSimulation = async (cgpa?: number, backlogs?: number, skills?: string[]) => {
    setSimulating(true);
    setError(null);
    try {
      const res = await studentApi.simulateWhatIf({
        target_cgpa: cgpa !== undefined ? cgpa : targetCgpa,
        target_backlogs: backlogs !== undefined ? backlogs : targetBacklogs,
        added_skills: skills || selectedSkills,
      });
      setResult(res);
      if (res.simulated) {
        setTargetCgpa(res.simulated.cgpa);
        setTargetBacklogs(res.simulated.backlogs);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to compute counterfactual simulation');
      toast.error('Simulation calculation failed');
    } finally {
      setSimulating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSimulation();
  }, []);

  const handleToggleSkill = (skill: string) => {
    const next = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(next);
  };

  if (loading) {
    return (
      <MacOsLoadingScreen
        message="Initializing What-If Career Simulation Engine..."
        description="Calibrating counterfactual academic and competency impact"
        fullScreen={false}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-ink">
      {/* Return to Journey Navigation */}
      <button
        type="button"
        onClick={() => navigate('/student/home')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Return to Candidate Journey</span>
      </button>

      {/* Hero Header */}
      <StateBlock variant="navy">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-xs">
            <Sparkles size={13} className="text-amber-400" />
            <span>ML-05 Predictive Engine • 80% Conformal Package Bands</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0 font-display">
            What-If Career Simulator
          </h1>
          <p className="text-sm text-white/80 max-w-2xl m-0 leading-relaxed">
            Explore hypothetical academic gains, backlog clearances, and skill additions under calibrated machine learning models.
          </p>
        </div>
      </StateBlock>

      {/* DPDP Opt-Out Alert State */}
      {result?.opted_out && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 text-amber-950 flex items-start gap-3.5 shadow-xs">
          <ShieldAlert size={20} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold font-display text-sm block">
              Automated AI Telemetry Suppressed (DPDP Act 2023)
            </span>
            <p className="text-xs text-amber-900 leading-relaxed m-0">
              You have opted out of automated machine learning profiling. Hypothetical projections are disabled to preserve your privacy preference. You can re-enable standard AI assistance anytime in your Profile Settings.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/student/profile')}
                className="text-xs font-bold text-amber-900 underline hover:text-black cursor-pointer"
              >
                Open Profile Privacy Settings &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Simulator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column (Left, 5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="font-bold text-xs uppercase tracking-wider text-ink-secondary flex items-center gap-1.5 font-display">
              <Sliders size={14} className="text-now" />
              Hypothetical Inputs
            </span>
            <span className="text-[10px] font-mono text-ink-muted">
              Adjust &amp; Recalculate
            </span>
          </div>

          {/* 1. Target CGPA Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="cgpa-slider" className="font-semibold text-ink">
                Simulated CGPA Benchmark
              </label>
              <span className="font-mono font-bold text-base text-brand">
                {targetCgpa.toFixed(1)} / 10.0
              </span>
            </div>
            <input
              id="cgpa-slider"
              type="range"
              min="6.0"
              max="10.0"
              step="0.1"
              value={targetCgpa}
              onChange={(e) => setTargetCgpa(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-ink-muted font-mono">
              <span>6.0 (Passing)</span>
              <span>7.5 (Tier-1 Cutoff)</span>
              <span>10.0 (Max)</span>
            </div>
          </div>

          {/* 2. Target Backlogs */}
          <div className="space-y-2 pt-2 border-t border-line/60">
            <label className="text-xs font-semibold text-ink block">
              Active Backlogs Standing
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTargetBacklogs(0)}
                className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                  targetBacklogs === 0
                    ? 'bg-ink text-white border-ink shadow-2xs'
                    : 'bg-canvas text-ink border-line hover:bg-surface'
                }`}
              >
                0 Backlogs (Cleared)
              </button>
              <button
                type="button"
                onClick={() => setTargetBacklogs(1)}
                className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                  targetBacklogs > 0
                    ? 'bg-ink text-white border-ink shadow-2xs'
                    : 'bg-canvas text-ink border-line hover:bg-surface'
                }`}
              >
                1 Active Backlog
              </button>
            </div>
          </div>

          {/* 3. Skill Acquisition Chips */}
          <div className="space-y-2 pt-2 border-t border-line/60">
            <label className="text-xs font-semibold text-ink block">
              Target Skills to Acquire
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TARGET_SKILLS.map((sk) => {
                const active = selectedSkills.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => handleToggleSkill(sk)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      active
                        ? 'bg-now text-now-ink border-amber-400 font-bold shadow-2xs'
                        : 'bg-canvas text-ink-muted border-line hover:border-ink-muted hover:text-ink'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {sk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            onClick={() => executeSimulation()}
            disabled={simulating}
            className="w-full py-2.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {simulating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Computing Simulation...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-now" />
                <span>Run What-If Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Results Column (Right, 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {result?.simulated ? (
            <>
              {/* Primary Comparison Scoreboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Placement Probability Delta */}
                <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-ink-muted font-bold uppercase tracking-wider">
                    <span>Readiness Probability</span>
                    <TrendingUp size={14} className="text-now" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-3xl text-ink">
                      {Math.round(result.simulated.placement_probability)}%
                    </span>
                    {result.baseline && (
                      <span className="text-xs font-mono font-bold text-success">
                        (+{(result.simulated.placement_probability - result.baseline.placement_probability).toFixed(0)}% delta)
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, result.simulated.placement_probability)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-ink-muted block">
                    Risk Category: <strong className="text-ink">{result.simulated.risk_level}</strong>
                  </span>
                </div>

                {/* Expected CTC Package & Conformal Band */}
                <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-ink-muted font-bold uppercase tracking-wider">
                    <span>Simulated CTC Band</span>
                    <Wallet size={14} className="text-success" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-3xl text-ink">
                      ₹{result.simulated.expected_package_lpa.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold text-ink-muted">LPA</span>
                  </div>
                  {result.simulated.package_band_80 && (
                    <div className="p-2 rounded-xl bg-canvas border border-line text-[11px] font-mono flex items-center justify-between">
                      <span className="text-ink-muted">80% Interval:</span>
                      <span className="font-bold text-ink">
                        ₹{result.simulated.package_band_80.lower_bound_lpa} - ₹{result.simulated.package_band_80.upper_bound_lpa} LPA
                      </span>
                    </div>
                  )}
                  <span className="text-[11px] text-ink-muted block">
                    Conformal Prediction Interval (Coverage: 80%)
                  </span>
                </div>
              </div>

              {/* Eligible Recruitment Drives Delta Card */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-brand/10 border border-brand/20 text-brand shrink-0">
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider text-ink-muted block font-display">
                      Recruitment Eligibility Unlocked
                    </span>
                    <span className="font-display font-extrabold text-2xl text-ink">
                      {result.simulated.eligible_drives_count} Active Drives
                    </span>
                    <span className="text-xs text-ink-muted block mt-0.5">
                      Meets cutoffs across Tier-1 Super Dream, Dream, and Core employers
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/opportunities')}
                  className="px-4 py-2 rounded-full border border-line bg-canvas hover:bg-surface text-xs font-bold text-brand transition-colors cursor-pointer shrink-0"
                >
                  View Qualifying Drives &rarr;
                </button>
              </div>

              {/* Directional Explainability Factor Cards */}
              {result.explanations && result.explanations.length > 0 && (
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary block font-display flex items-center gap-1.5">
                    <Layers size={14} className="text-brand" />
                    Model Decision Explanations &amp; Sensitivity Drivers
                  </span>
                  <div className="space-y-2">
                    {result.explanations.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-canvas border border-line text-xs flex items-start gap-2.5"
                      >
                        <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                        <span className="text-ink leading-relaxed font-medium">
                          {exp}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-ink-muted pt-1 m-0">
                    Calibrated via Gradient Boosting tree feature importances on verified institutional outcomes.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-8 text-center text-xs text-ink-muted">
              Select hypothetical parameters on the left and run the simulation to see your potential career gains.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentWhatIfPage;
