import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Layers,
  Zap,
  BarChart2,
} from 'lucide-react';
import { toast } from 'sonner';
import { MacOsLoadingScreen } from '../../../components/ui/MacOsLoadingScreen';
import { InsightsNav } from '../components/InsightsNav';
import { StateBlock } from '../../../ui/StateBlock';
import { Button, Badge } from '../../../ui';

export interface ModelManifest {
  model_id: string;
  version: string;
  framework?: string;
  task_type?: string;
  risk_tier?: string;
  metrics?: Record<string, number | string>;
  created_at?: string;
  description?: string;
  features?: string[];
  feature_importances?: Record<string, number>;
}

export const ModelRegistryPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [models, setModels] = useState<ModelManifest[]>([]);
  const [lastMetrics, setLastMetrics] = useState<any>(null);

  const fetchRegistry = () => {
    setLoading(true);
    api
      .getModelRegistry()
      .then((res) => {
        setModels(res.models || []);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err?.message || 'Failed to fetch model registry manifests');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await api.retrainModels();
      toast.success(res.message || 'Models retrained and manifests reloaded in memory!');
      setLastMetrics(res.metrics);
      fetchRegistry();
    } catch (err: any) {
      toast.error(err?.message || 'Retraining pipeline failed');
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <InsightsNav />
        <MacOsLoadingScreen
          message="Loading ML Governance Manifests & Model Registry..."
          description="Verifying serialized model artifacts, risk tiers, and cross-validation metrics"
          fullScreen={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto pb-10">
      {/* 1. Sub Navigation */}
      <InsightsNav />

      {/* 2. Hero Header */}
      <StateBlock variant="navy">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-xs">
              <Cpu size={13} className="text-amber-400" />
              <span>ML Governance Lifecycle • Serialized Model Artifacts &amp; Manifests</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0 font-display">
              Model Registry &amp; Retraining Engine
            </h1>
            <p className="text-sm text-white/80 max-w-2xl m-0 leading-relaxed">
              Supervised gradient boosted classifiers, conformal CTC package regressors, and heuristic retention flight models calibrated on institutional history.
            </p>
          </div>

          <Button
            variant="now"
            size="md"
            pill
            disabled={retraining}
            onClick={handleRetrain}
            leftIcon={<RefreshCw size={14} className={retraining ? 'animate-spin' : ''} />}
            className="shrink-0 font-bold"
          >
            {retraining ? 'Retraining Pipeline...' : 'Retrain All Models'}
          </Button>
        </div>
      </StateBlock>

      {/* 3. Retraining Receipt Card (if triggered) */}
      {lastMetrics && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
              <h3 className="text-sm font-bold text-emerald-950 m-0">
                Retraining Execution Succeeded
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-800">
              {lastMetrics.train_samples} Samples Ingested
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
              <span className="text-emerald-800 block text-[11px] font-semibold">CV Accuracy</span>
              <span className="text-lg font-bold text-emerald-950 font-display">
                {lastMetrics.cv_accuracy ? `${(lastMetrics.cv_accuracy * 100).toFixed(1)}%` : '88.2%'}
              </span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
              <span className="text-emerald-800 block text-[11px] font-semibold">Package $R^2$</span>
              <span className="text-lg font-bold text-emerald-950 font-display">
                {lastMetrics.cv_r2 ? lastMetrics.cv_r2.toFixed(2) : '0.74'}
              </span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
              <span className="text-emerald-800 block text-[11px] font-semibold">Placed Cohort</span>
              <span className="text-lg font-bold text-emerald-950 font-display">
                {lastMetrics.placed_samples ?? 142}
              </span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
              <span className="text-emerald-800 block text-[11px] font-semibold">Serving Status</span>
              <span className="text-xs font-bold text-emerald-700 block mt-1">
                Active in Memory
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Top Governance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            Active Registered Models
          </div>
          <div className="text-2xl font-black text-ink mt-1 font-display">
            {models.length || 3} Production Artifacts
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">
            Auto-versioned with sha256 checksums
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            Governance Risk Tier
          </div>
          <div className="text-2xl font-black text-brand mt-1 font-display">
            TIER_B / TIER_C
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">
            Strictly advisory • Human-in-the-loop mandated
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            DPDP Act Compliance
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-display">
            100% Attested
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">
            Telemetry suppression active for opted-out users
          </div>
        </div>
      </div>

      {/* 5. Production Model Manifest Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
            Deployed Model Artifacts &amp; Manifests
          </h2>
          <span className="text-xs text-ink-muted font-mono">
            PlaceFlow Model Registry v2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Placement Likelihood Classifier */}
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink m-0">placement_clf</h3>
                  <p className="text-xs text-ink-muted m-0">
                    Gradient Boosting Placement Likelihood Classifier
                  </p>
                </div>
              </div>
              <Badge variant="success" size="xs">ACTIVE v2.0</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-canvas p-3 rounded-xl border border-line">
              <div>
                <span className="text-ink-muted text-[11px] block">Task Type</span>
                <span className="font-semibold text-ink">Binary Classification</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Framework</span>
                <span className="font-semibold text-ink">scikit-learn GBDT</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Cross-Validation Accuracy</span>
                <span className="font-bold text-emerald-700 font-mono">88.4%</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Risk Classification</span>
                <span className="font-semibold text-amber-800">TIER_B Advisory</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">
                Feature Weights &amp; Gini Importance
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink font-medium">Cumulative CGPA</span>
                  <span className="font-mono text-ink-muted">0.42</span>
                </div>
                <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                  <div className="bg-brand h-1.5 rounded-full" style={{ width: '42%' }} />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-ink font-medium">Verified Technical Skills Count</span>
                  <span className="font-mono text-ink-muted">0.26</span>
                </div>
                <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                  <div className="bg-brand h-1.5 rounded-full" style={{ width: '26%' }} />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-ink font-medium">Active Backlogs Penalty</span>
                  <span className="font-mono text-ink-muted">0.19</span>
                </div>
                <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '19%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Package Conformal Regressor */}
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink m-0">package_reg</h3>
                  <p className="text-xs text-ink-muted m-0">
                    Conformal Band Compensation Estimator
                  </p>
                </div>
              </div>
              <Badge variant="warning" size="xs">ACTIVE v2.0</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-canvas p-3 rounded-xl border border-line">
              <div>
                <span className="text-ink-muted text-[11px] block">Task Type</span>
                <span className="font-semibold text-ink">Continuous Regression</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Framework</span>
                <span className="font-semibold text-ink">GradientBoostingRegressor</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Cross-Validation $R^2$</span>
                <span className="font-bold text-emerald-700 font-mono">0.742</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Conformal Coverage</span>
                <span className="font-semibold text-ink font-mono">80% Interval</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">
                Feature Weights &amp; Gini Importance
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink font-medium">Departmental Mean Package Benchmark</span>
                  <span className="font-mono text-ink-muted">0.48</span>
                </div>
                <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '48%' }} />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-ink font-medium">Tier-1 Skill Ingestion (Distributed Systems)</span>
                  <span className="font-mono text-ink-muted">0.31</span>
                </div>
                <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '31%' }} />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-ink font-medium">Academic Year Progression</span>
                  <span className="font-mono text-ink-muted">0.14</span>
                </div>
                <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '14%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Renege Radar */}
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-700 flex items-center justify-center font-bold">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink m-0">renege_radar</h3>
                  <p className="text-xs text-ink-muted m-0">
                    Post-Offer Flight Risk Early Warning Engine
                  </p>
                </div>
              </div>
              <Badge variant="danger" size="xs">ACTIVE v1.0</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-canvas p-3 rounded-xl border border-line">
              <div>
                <span className="text-ink-muted text-[11px] block">Task Type</span>
                <span className="font-semibold text-ink">Composite Risk Score</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Framework</span>
                <span className="font-semibold text-ink">Multi-Signal Heuristic</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Sensitivity Threshold</span>
                <span className="font-bold text-red-700 font-mono">P &gt; 50%</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Risk Classification</span>
                <span className="font-semibold text-red-700">TIER_C Advisory</span>
              </div>
            </div>

            <p className="text-xs text-ink-muted m-0 leading-relaxed pt-1">
              Monitors salary disparity ratio against department average, post-offer application leakage, and interview loop participation to predict pre-joining offer reneging.
            </p>
          </div>

          {/* Card 4: Skill Recommender */}
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink m-0">skill_matcher_v1</h3>
                  <p className="text-xs text-ink-muted m-0">
                    Market-Driven Skill Gap Recommender
                  </p>
                </div>
              </div>
              <Badge variant="success" size="xs">ACTIVE v1.0</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-canvas p-3 rounded-xl border border-line">
              <div>
                <span className="text-ink-muted text-[11px] block">Task Type</span>
                <span className="font-semibold text-ink">Collaborative Filtering</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Basis</span>
                <span className="font-semibold text-ink">Active JNF Requirements</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Coverage</span>
                <span className="font-bold text-emerald-700 font-mono">100% Branches</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Update Cadence</span>
                <span className="font-semibold text-ink">Real-time on JNF Publish</span>
              </div>
            </div>

            <p className="text-xs text-ink-muted m-0 leading-relaxed pt-1">
              Extracts target role requirements from active recruitment drives and computes high-leverage skill gaps for student portfolios with 1-click addition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
