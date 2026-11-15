import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { RenegeCandidate } from '../../../types';
import {
  Radar,
  AlertTriangle,
  PhoneCall,
  X,
  FileCheck2,
} from 'lucide-react';
import { toast } from 'sonner';
import { MacOsLoadingScreen } from '../../../components/ui/MacOsLoadingScreen';
import { InsightsNav } from '../components/InsightsNav';
import { StateBlock } from '../../../ui/StateBlock';
import { Button, Badge, CompanyMark } from '../../../ui';

const INTERVENTION_ACTIONS = [
  { value: 'COUNSELING_HELD', label: 'TPO Retention Counseling Session Held' },
  { value: 'INCENTIVE_DISPATCHED', label: 'Expedited Joining Kit & Relocation Advance' },
  { value: 'TIER_OVERRIDE_REVIEW', label: 'Re-evaluate Tier-1 Entitlement Eligibility' },
  { value: 'HOD_ESCALATION', label: 'Escalated to Department HOD' },
  { value: 'OFFER_RESCINDED', label: 'Rescind Offer per Section 4.2 Policy' },
];

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

  // Modal intervention state
  const [selectedCandidate, setSelectedCandidate] = useState<RenegeCandidate | null>(null);
  const [actionType, setActionType] = useState('COUNSELING_HELD');
  const [actionNotes, setActionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRadar = () => {
    setLoading(true);
    api
      .getRenegeRadar()
      .then((res) => {
        setCandidates(res.candidates || []);
        setStats({
          total: res.total_placed_monitored,
          critical: res.critical_count,
          moderate: res.moderate_count,
          low: res.low_count,
          avg_prob: res.avg_renege_probability,
        });
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err?.message || 'Failed to fetch flight telemetry');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRadar();
  }, []);

  const handleOpenIntervene = (candidate: RenegeCandidate) => {
    setSelectedCandidate(candidate);
    setActionType('COUNSELING_HELD');
    setActionNotes('');
  };

  const handleCloseModal = () => {
    setSelectedCandidate(null);
    setActionNotes('');
  };

  const handleExecuteIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setSubmitting(true);
    try {
      await api.resolveRenege(selectedCandidate.student_id, actionType, actionNotes);
      toast.success(
        `Intervention logged for ${selectedCandidate.name} (${selectedCandidate.student_id})`
      );
      handleCloseModal();
      fetchRadar();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record intervention receipt');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <InsightsNav />
        <MacOsLoadingScreen
          message="Computing Post-Offer Flight Risk Telemetry (ML-02)..."
          description="Scanning engagement velocity, multi-offer overlaps, and attendance telemetry"
          fullScreen={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto">
      {/* 1. Sub Navigation */}
      <InsightsNav />

      {/* 2. Hero Header */}
      <StateBlock variant="navy">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-xs">
              <Radar size={13} className="text-amber-400" />
              <span>ML-02 Predictive Early Warning • Post-Offer Flight Radar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0 font-display">
              Post-Offer Retention &amp; Renege Radar
            </h1>
            <p className="text-sm text-white/80 max-w-2xl m-0 leading-relaxed">
              Detects candidate flight risk before joining day by evaluating department salary disparity ratios, post-offer interview loop leakage, and acceptance lag.
            </p>
          </div>

          <div className="bg-amber-400 text-amber-950 px-4 py-2.5 rounded-2xl shrink-0 font-bold text-xs flex items-center gap-2 shadow-sm">
            <AlertTriangle size={15} className="text-amber-950" />
            <span>{stats.critical} Critical Interventions Needed</span>
          </div>
        </div>
      </StateBlock>

      {/* 3. KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            Total Placed Monitored
          </div>
          <div className="text-2xl font-black text-ink mt-1 font-display">{stats.total}</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Active accepted offers</div>
        </div>

        <div className="bg-surface border border-red-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            <span>Critical Flight Risk</span>
          </div>
          <div className="text-2xl font-black text-red-700 mt-1 font-display">{stats.critical}</div>
          <div className="text-[11px] text-red-600/80 mt-0.5">Immediate counseling required</div>
        </div>

        <div className="bg-surface border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            Moderate Flight Risk
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-display">{stats.moderate}</div>
          <div className="text-[11px] text-amber-700/80 mt-0.5">Salary ratio &lt; 0.85x</div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            Cohort Mean Flight Risk
          </div>
          <div className="text-2xl font-black text-ink mt-1 font-display">{stats.avg_prob}%</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Statistical telemetry average</div>
        </div>
      </div>

      {/* 4. Candidates Telemetry Table */}
      <div className="bg-surface border border-line rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-line bg-canvas/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink uppercase tracking-wide m-0">
              Placed Candidate Flight Telemetry Table
            </h2>
            <p className="text-xs text-ink-muted m-0">
              Composite scoring across salary delta, post-offer interviews, and response lag
            </p>
          </div>
          <span className="text-xs text-ink-muted font-mono font-medium">
            Sorted by flight risk descending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas text-ink-muted font-semibold border-b border-line">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Placed Company</th>
                <th className="py-3 px-4">Offer CTC</th>
                <th className="py-3 px-4">Dept Avg</th>
                <th className="py-3 px-4">Salary Ratio</th>
                <th className="py-3 px-4">Post-Offer Leaks</th>
                <th className="py-3 px-4">Flight Risk</th>
                <th className="py-3 px-4">Prescribed Intervention</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-ink-muted">
                    No active placed candidates detected in current season cohort.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.student_id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-ink">{c.name}</div>
                      <div className="text-[10.5px] font-mono text-ink-muted">
                        {c.student_id} • {c.department}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <CompanyMark name={c.placed_company} size="sm" />
                        <span className="font-semibold text-ink">{c.placed_company}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-ink">
                      ₹{c.package_lpa} LPA
                    </td>
                    <td className="py-3 px-4 font-mono text-ink-muted">
                      ₹{c.dept_avg_package} LPA
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`font-semibold ${
                          c.salary_ratio < 0.8 ? 'text-red-600 font-bold' : 'text-ink'
                        }`}
                      >
                        {c.salary_ratio.toFixed(2)}x
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-center">
                      {c.post_offer_apps_count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[11px]">
                          {c.post_offer_apps_count} leaks
                        </span>
                      ) : (
                        <span className="text-ink-muted">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          c.risk_level === 'CRITICAL'
                            ? 'danger'
                            : c.risk_level === 'MODERATE'
                            ? 'warning'
                            : 'success'
                        }
                        size="xs"
                      >
                        {c.renege_probability}% ({c.risk_level})
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-ink text-[11.5px] max-w-xs">
                      {c.recommended_action}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant={c.risk_level === 'CRITICAL' ? 'now' : 'outline'}
                        size="sm"
                        pill
                        onClick={() => handleOpenIntervene(c)}
                        leftIcon={<PhoneCall size={12} />}
                      >
                        Intervene
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Intervention Modal Dialog */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-line rounded-3xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                  <PhoneCall size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink m-0">Log Retention Intervention</h3>
                  <p className="text-xs text-ink-muted m-0 font-mono">
                    {selectedCandidate.name} ({selectedCandidate.student_id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-ink-muted hover:text-ink p-1 rounded-lg hover:bg-canvas transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-line grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-ink-muted text-[11px] block">Placed Company</span>
                <span className="font-bold text-ink">{selectedCandidate.placed_company}</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Offer Package</span>
                <span className="font-bold text-ink">₹{selectedCandidate.package_lpa} LPA</span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Flight Risk Probability</span>
                <span className="font-bold text-red-600">
                  {selectedCandidate.renege_probability}% ({selectedCandidate.risk_level})
                </span>
              </div>
              <div>
                <span className="text-ink-muted text-[11px] block">Post-Offer Leaks</span>
                <span className="font-bold text-amber-700">
                  {selectedCandidate.post_offer_apps_count} interviews active
                </span>
              </div>
            </div>

            <form onSubmit={handleExecuteIntervention} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Prescribed Intervention Protocol
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-canvas border border-line text-ink focus:outline-none focus:border-brand"
                >
                  {INTERVENTION_ACTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Counseling Notes &amp; Action Receipts
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Record summary of discussion, candidate commitments, or joining confirmations..."
                  className="w-full text-xs p-3 rounded-xl bg-canvas border border-line text-ink placeholder-ink-muted focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="now"
                  size="sm"
                  pill
                  disabled={submitting}
                  leftIcon={<FileCheck2 size={13} />}
                >
                  {submitting ? 'Recording Receipt...' : 'Confirm Intervention'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
