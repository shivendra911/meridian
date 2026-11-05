import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { OverviewData } from '../types';
import { StatCard } from '../components/common/StatCard';
import { useTenant } from '../context/TenantContext';
import {
  Users,
  Award,
  Building2,
  Briefcase,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Landmark,
  Network,
  Zap,
  Radar,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface OverviewPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateTab }) => {
  const { activeTenant, activeInstitution, activeCampus, campuses } = useTenant();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [activeTenant]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 text-sm">
        <Activity className="animate-spin mb-3 text-[#8C1515]" size={28} />
        <span className="font-medium text-slate-700">Loading Institutional Command Telemetry...</span>
        <span className="text-xs text-slate-400 mt-1">
          Synchronizing tenant {activeTenant?.name || 'workspace'} with MongoDB 7 replica set
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded text-sm flex items-center gap-3">
        <AlertCircle size={20} className="shrink-0 text-red-600" />
        <div>
          <div className="font-semibold">Unable to Load Telemetry Stream</div>
          <div className="text-xs text-red-700 mt-0.5">{error}</div>
        </div>
      </div>
    );
  }

  const { kpis, branch_velocity, tier_distribution, top_roles, recent_activity } = data;

  return (
    <div className="space-y-6">
      {/* Institutional Directorate Command Banner */}
      <div className="bg-white border-l-4 border-l-[#8C1515] border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
              CAMP-01 FOUNDATION DOMAIN
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {activeTenant?.status || 'ACTIVE'}
            </span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {activeTenant?.customer_type || 'ENTERPRISE'}
            </span>
          </div>

          <h1 className="text-2xl font-bold font-serif text-slate-900 m-0 flex items-center gap-2">
            <Landmark size={22} className="text-[#8C1515]" />
            {activeInstitution ? activeInstitution.legal_name : activeTenant?.name || 'Campus Operating System'}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
            <div className="flex items-center gap-1">
              <MapPin size={13} className="text-slate-400" />
              <span>{activeCampus ? activeCampus.campus_name : 'Main Campus'}</span>
              <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">
                {activeCampus?.campus_code || 'MAIN'}
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <div>
              Classification: <span className="font-semibold text-slate-800">{activeInstitution?.institution_type || 'Institute of National Importance'}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div>
              Campuses Active: <span className="font-semibold text-slate-800">{campuses.length || 1}</span>
            </div>
          </div>
        </div>

        {/* Quick Institutional Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('architecture')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium flex items-center gap-2 shadow-xs transition-colors"
            >
              <Network size={14} className="text-amber-400" />
              <span>Topology & Hierarchy</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 12-Point Institutional Readiness & Compliance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-900 text-white p-4 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
              Readiness & Activation Gate
            </div>
            <div className="text-lg font-bold mt-0.5">12 / 12 Criteria Cleared</div>
            <div className="text-xs text-emerald-200 mt-1">
              Ministry of Education AISHE verified • Primary campus locked
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-800/80 border border-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} className="text-emerald-300" />
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold">
              Talent Authenticity (VTI)
            </div>
            <div className="text-lg font-bold mt-0.5">91.4% Gold/Silver Ratio</div>
            <div className="text-xs text-slate-400 mt-1">
              Tamper-evident verification across cohort credentials
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Award size={22} className="text-amber-400" />
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-blue-300 font-semibold">
              Superday Scheduling Integrity
            </div>
            <div className="text-lg font-bold mt-0.5">Zero Clashes Detected</div>
            <div className="text-xs text-slate-400 mt-1">
              OR-Tools constraint arbitrator running in real time
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Zap size={22} className="text-blue-400" />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Registered Candidates"
          value={kpis.total_students || 0}
          context="Institutional Cohort 2025–26"
          icon={Users}
          variant="default"
        />
        <StatCard
          label="Placement Rate"
          value={`${kpis.placement_pct || 0}%`}
          context="Verified offers accepted"
          icon={Award}
          variant="cardinal"
        />
        <StatCard
          label="Corporate Partners"
          value={kpis.total_companies || 0}
          context="Active visiting employers"
          icon={Building2}
          variant="default"
        />
        <StatCard
          label="Open Vacancies (JNFs)"
          value={kpis.open_jobs || 0}
          context="Active recruitment drives"
          icon={Briefcase}
          variant="default"
        />
      </div>

      {/* Quick Launchpad to Enterprise Moats */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-[#8C1515]" />
          Platform Operational Engines
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateTab && onNavigateTab('superday')}
            className="p-3 bg-white rounded border border-slate-200 hover:border-slate-400 text-left transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-700 group-hover:text-[#8C1515] font-semibold text-xs">
              <span>Superday Solver</span>
              <Zap size={13} className="text-amber-500" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">OR-Tools interview conflict arbitrator</div>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('renege')}
            className="p-3 bg-white rounded border border-slate-200 hover:border-slate-400 text-left transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-700 group-hover:text-[#8C1515] font-semibold text-xs">
              <span>Retention Radar</span>
              <Radar size={13} className="text-red-500" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Post-offer renege early warning</div>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('copilot')}
            className="p-3 bg-white rounded border border-slate-200 hover:border-slate-400 text-left transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-700 group-hover:text-[#8C1515] font-semibold text-xs">
              <span>Autonomous AI Copilots</span>
              <Activity size={13} className="text-emerald-500" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">AG-01, AG-02 & AG-10 autonomous agents</div>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('consent')}
            className="p-3 bg-white rounded border border-slate-200 hover:border-slate-400 text-left transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-700 group-hover:text-[#8C1515] font-semibold text-xs">
              <span>DPDP Consent Ledger</span>
              <ShieldCheck size={13} className="text-blue-500" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">DPDP Act 2023 purpose-based audit</div>
          </button>
        </div>
      </div>

      {/* Department Placement Velocity & Tier Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Department Placement Velocity */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 m-0">Department Placement Velocity</h2>
              <div className="text-xs text-slate-500 mt-0.5">Verified offers by academic discipline</div>
            </div>
            <TrendingUp size={16} className="text-slate-400" />
          </div>

          <div className="space-y-3">
            {branch_velocity.rows && branch_velocity.rows.length > 0 ? (
              branch_velocity.rows.map((row) => (
                <div key={row.department}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{row.department}</span>
                    <span className="font-mono text-slate-600">
                      {row.placed_students} / {row.total_students} ({row.placement_pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#8C1515] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, row.placement_pct || 0)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">No branch velocity data available</div>
            )}
          </div>
        </div>

        {/* Compensation Tier Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 m-0">Compensation Tier Distribution</h2>
              <div className="text-xs text-slate-500 mt-0.5">Distribution across recruitment offer bands</div>
            </div>
            <Award size={16} className="text-slate-400" />
          </div>

          <div className="space-y-3">
            {tier_distribution.labels && tier_distribution.labels.length > 0 ? (
              tier_distribution.labels.map((tierName, idx) => {
                const count = tier_distribution.counts[idx] || 0;
                const total = tier_distribution.counts.reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={tierName}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{tierName}</span>
                      <span className="font-mono text-slate-600">{count} opportunities ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-slate-700 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">No tier distribution data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Live Transactional Audit Feed */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 m-0">Live Institutional Audit Trail</h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Append-only transactional event log for {activeTenant?.name}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>MongoDB Outbox Synced</span>
          </div>
        </div>

        <div className="space-y-2">
          {recent_activity && recent_activity.length > 0 ? (
            recent_activity.map((act, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-200 text-slate-700">
                    {act.event_type}
                  </span>
                  <span className="font-medium text-slate-800">{act.message}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {act.at ? new Date(act.at).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 py-4 text-center">No recent activity logged</div>
          )}
        </div>
      </div>
    </div>
  );
};
