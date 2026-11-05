import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { NirfMetrics } from '../types';
import { Calculator, Award, TrendingUp, Shield, Activity, Download } from 'lucide-react';

export const NirfPage: React.FC = () => {
  const [metrics, setMetrics] = useState<NirfMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getNirfMetrics()
      .then((res) => {
        setMetrics(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
        <Activity className="animate-spin mr-2" size={18} />
        Computing NIRF Graduation Outcome Accreditation Metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-l-[#0B1B3D] border border-slate-200 rounded p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
            SECTION 8 &bull; NIRF GRADUATION OUTCOME (GO) ACCREDITATION
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 m-0">
            NIRF Graduation Outcome Calculator
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Official institutional accreditation metrics: 3-year rolling window placement rate, higher studies progression, median graduate CTC, and recruiter salary dispersion with &lt;5 small-cell privacy masking.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-1.5 bg-[#0B1B3D] text-white text-xs font-semibold rounded hover:bg-[#071126] shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Download size={13} />
          <span>Print NIRF Dossier</span>
        </button>
      </div>

      {/* NIRF Scorecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* GPH Score */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle border-t-3 border-t-[#8C1515]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              GPH Score (Placement &amp; Higher Studies)
            </span>
            <Award className="text-[#8C1515]" size={16} />
          </div>
          <div className="text-3xl font-bold font-serif text-[#8C1515]">
            {metrics.gph_score_40}{' '}
            <span className="text-base font-sans font-normal text-slate-400">/ 40.0</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 space-y-1">
            <div>
              Placement Rate: <strong className="font-mono">{metrics.placement_pct}%</strong> ({metrics.placed_count} candidates)
            </div>
            <div>
              Higher Studies: <strong className="font-mono">{metrics.higher_studies_pct}%</strong> ({metrics.higher_studies_count} candidates)
            </div>
          </div>
        </div>

        {/* GMS Score */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle border-t-3 border-t-emerald-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              GMS Score (Graduate Median Salary)
            </span>
            <TrendingUp className="text-emerald-600" size={16} />
          </div>
          <div className="text-3xl font-bold font-serif text-emerald-700">
            {metrics.gms_score_40}{' '}
            <span className="text-base font-sans font-normal text-slate-400">/ 40.0</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 space-y-1 font-mono">
            <div>
              Median CTC: <strong className="text-slate-900">₹{metrics.salary_stats.median_lpa} LPA</strong>
            </div>
            <div className="text-slate-500 text-[11px]">
              Range: ₹{metrics.salary_stats.min_lpa} &ndash; ₹{metrics.salary_stats.max_lpa} LPA (Mean: ₹{metrics.salary_stats.mean_lpa} LPA)
            </div>
          </div>
        </div>

        {/* Total NIRF GO */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-subtle border-t-3 border-t-[#0B1B3D]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Combined NIRF GO Score
            </span>
            <Calculator className="text-[#0B1B3D]" size={16} />
          </div>
          <div className="text-3xl font-bold font-serif text-[#0B1B3D]">
            {metrics.total_nirf_go_80}{' '}
            <span className="text-base font-sans font-normal text-slate-400">/ 80.0</span>
          </div>
          <div className="text-xs text-slate-600 mt-2">
            <div>
              Total Graduating Cohort: <strong className="font-mono">{metrics.cohort_size}</strong>
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Combined Positive Outcome:{' '}
              <strong className="font-mono text-slate-800">{metrics.combined_outcome_pct}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Salary Dispersion Table */}
      <div className="bg-white border border-slate-200 rounded shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide m-0">
              Company-Wise Recruiter Salary Dispersion Table (FR-ANL-021)
            </h2>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Detailed salary distribution across corporate hiring partners
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            <Shield size={12} className="text-slate-600" />
            <span>&lt;5 Small-Cell Privacy Masking Active</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Corporate Recruiter</th>
                <th className="py-2.5 px-4">Offers Issued</th>
                <th className="py-2.5 px-4">Minimum CTC</th>
                <th className="py-2.5 px-4">Median CTC</th>
                <th className="py-2.5 px-4">Maximum CTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {metrics.company_table.map((row) => (
                <tr key={row.company_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-[#0B1B3D] font-sans">
                    {row.company_id}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        row.recruited_count === '<5'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {row.recruited_count}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">₹{row.min_salary_lpa} LPA</td>
                  <td className="py-2.5 px-4 text-[#8C1515] font-bold">
                    ₹{row.median_salary_lpa} LPA
                  </td>
                  <td className="py-2.5 px-4 text-emerald-700 font-semibold">
                    ₹{row.max_salary_lpa} LPA
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

