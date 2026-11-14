import React, { useEffect, useState } from 'react';
import { managementApi } from '../api';
import { Calculator, Award, TrendingUp, Shield, Activity, Download } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';

export const ManagementAccreditationPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    managementApi
      .getNirfMetrics()
      .then((res) => {
        setMetrics(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load NIRF metrics');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
        <Activity className="animate-spin mr-2" size={18} />
        Computing NIRF Graduation Outcome Accreditation Metrics...
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="p-8">
        <EmptyState
          icon={Calculator}
          title="Accreditation data unavailable"
          description={error || 'Unable to compute NIRF Graduation Outcome metrics for the current academic cycle.'}
        />
      </Card>
    );
  }

  const companyTable = metrics.company_table || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-l-slate-900 border border-slate-200 rounded p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-1">
            Section 8 &bull; NIRF Graduation Outcome (GO) Accreditation
          </div>
          <h1 className="text-xl font-bold text-slate-900 m-0">
            NIRF Graduation Outcome Calculator
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Official institutional accreditation metrics: 3-year rolling window placement rate, higher studies progression, median graduate CTC, and recruiter salary dispersion with &lt;5 small-cell privacy masking.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <Download size={13} />
          <span>Print NIRF Dossier</span>
        </button>
      </div>

      {/* NIRF Scorecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* GPH Score */}
        <div className="bg-white border border-slate-200 rounded p-5 border-t-2 border-t-accent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              GPH Score (Placement &amp; Higher Studies)
            </span>
            <Award className="text-accent" size={16} />
          </div>
          <div className="text-3xl font-bold text-accent">
            {metrics.gph_score_40 ?? '—'}{' '}
            <span className="text-base font-normal text-slate-400">/ 40.0</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 space-y-1">
            <div>
              Placement Rate: <strong className="font-mono">{metrics.placement_pct ?? 0}%</strong> ({metrics.placed_count ?? 0} candidates)
            </div>
            <div>
              Higher Studies: <strong className="font-mono">{metrics.higher_studies_pct ?? 0}%</strong> ({metrics.higher_studies_count ?? 0} candidates)
            </div>
          </div>
        </div>

        {/* GMS Score */}
        <div className="bg-white border border-slate-200 rounded p-5 border-t-2 border-t-emerald-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              GMS Score (Graduate Median Salary)
            </span>
            <TrendingUp className="text-emerald-600" size={16} />
          </div>
          <div className="text-3xl font-bold text-emerald-700">
            {metrics.gms_score_40 ?? '—'}{' '}
            <span className="text-base font-normal text-slate-400">/ 40.0</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 space-y-1 font-mono">
            <div>
              Median CTC: <strong className="text-slate-900">₹{metrics.salary_stats?.median_lpa ?? 0} LPA</strong>
            </div>
            <div className="text-slate-500 text-xs">
              Range: ₹{metrics.salary_stats?.min_lpa ?? 0} &ndash; ₹{metrics.salary_stats?.max_lpa ?? 0} LPA (Mean: ₹{metrics.salary_stats?.mean_lpa ?? 0} LPA)
            </div>
          </div>
        </div>

        {/* Total NIRF GO */}
        <div className="bg-white border border-slate-200 rounded p-5 border-t-2 border-t-slate-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Combined NIRF GO Score
            </span>
            <Calculator className="text-slate-900" size={16} />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {metrics.total_nirf_go_80 ?? '—'}{' '}
            <span className="text-base font-normal text-slate-400">/ 80.0</span>
          </div>
          <div className="text-xs text-slate-600 mt-2">
            <div>
              Total Graduating Cohort: <strong className="font-mono">{metrics.cohort_size ?? 0}</strong>
            </div>
            <div className="text-slate-500 text-xs mt-0.5">
              Combined Positive Outcome:{' '}
              <strong className="font-mono text-slate-800">{metrics.combined_outcome_pct ?? 0}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Salary Dispersion Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider m-0">
              Company-Wise Recruiter Salary Dispersion Table (FR-ANL-021)
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Detailed salary distribution across corporate hiring partners
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            <Shield size={12} className="text-slate-600" />
            <span>&lt;5 Small-Cell Privacy Masking Active</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {companyTable.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={TrendingUp}
                title="No recruiter salary data"
                description="Salary dispersion will populate as corporate offers are recorded in this cycle."
              />
            </div>
          ) : (
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
                {companyTable.map((row: any) => (
                  <tr key={row.company_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 font-sans">
                      {row.company_id}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          row.recruited_count === '<5'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {row.recruited_count}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">₹{row.min_salary_lpa} LPA</td>
                    <td className="py-2.5 px-4 text-accent font-semibold">
                      ₹{row.median_salary_lpa} LPA
                    </td>
                    <td className="py-2.5 px-4 text-emerald-700 font-semibold">
                      ₹{row.max_salary_lpa} LPA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
