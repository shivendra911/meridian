import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { BarChart3, Download, Activity, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<
    Record<string, { id: string; title: string; rows_count: number; sample: Record<string, unknown>[] }>
  >({});
  const [selectedReportId, setSelectedReportId] = useState<string>('branch');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = () => {
    setLoading(true);
    setError(null);
    api
      .getReports()
      .then((res) => {
        const reps = res?.reports || {};
        setReports(reps);
        const keys = Object.keys(reps);
        if (keys.length > 0) {
          setSelectedReportId((prev) => (reps[prev] ? prev : keys[0]));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load reports:', err);
        setError(err.message || 'Failed to aggregate reports from MongoDB pipelines');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const currentReport = reports[selectedReportId];
  const columns = currentReport?.sample && currentReport.sample.length > 0
    ? Object.keys(currentReport.sample[0])
    : [];

  const handleDownloadCsv = (rid: string) => {
    window.open(`http://127.0.0.1:8000/api/reports/${rid}/csv/`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 text-sm gap-3">
        <Activity className="animate-spin text-cardinal" size={24} />
        <span className="font-medium text-slate-700">Aggregating Institutional Datasets via MongoDB Pipelines...</span>
        <span className="text-xs text-slate-400 font-mono">Running $facet, $setWindowFields, and $bucket stages</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-l-navy-900 border border-slate-200 rounded p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-1">
            EXECUTIVE REGISTRAR &bull; 15 AGGREGATION PIPELINES
          </div>
          <h1 className="text-xl font-bold  text-slate-900 m-0">
            Institutional Placement Reports &amp; Aggregations
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Live reports computed using MongoDB aggregation pipelines ($facet, $setWindowFields, $bucket). Instant official CSV export for university statutory audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>

          {currentReport && (
            <button
              onClick={() => handleDownloadCsv(selectedReportId)}
              className="px-3.5 py-1.5 bg-cardinal text-white text-xs font-semibold rounded hover:bg-cardinal-dark shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download size={13} />
              <span>Download {currentReport.title} (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchReports}
            className="underline font-semibold hover:text-red-950 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Reports Selector Bar */}
      {Object.keys(reports).length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(reports).map(([rid, r]) => (
            <button
              key={rid}
              onClick={() => setSelectedReportId(rid)}
              className={`px-3 py-1.5 text-xs rounded font-medium border flex items-center gap-1.5 transition-all ${
                selectedReportId === rid
                  ? 'bg-navy-900 text-white border-navy-900 shadow-xs font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet size={13} />
              <span>{r.title}</span>
              <span className="font-mono text-xs opacity-75">({r.rows_count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Active Report Table */}
      {currentReport ? (
        <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-slate-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide m-0">
                {currentReport.title} ({currentReport.rows_count} records)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Live Pipeline Execution Result
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="py-2.5 px-4 capitalize">
                      {c.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentReport.sample && currentReport.sample.length > 0 ? (
                  currentReport.sample.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      {columns.map((c) => (
                        <td key={c} className="py-2.5 px-4 text-slate-800">
                          {typeof row[c] === 'number'
                            ? Number.isInteger(row[c])
                              ? row[c]
                              : (row[c] as number).toFixed(2)
                            : String(row[c] ?? '-')}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length || 1} className="p-6 text-center text-slate-400">
                      No records returned by pipeline for this metric.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !error && (
          <div className="bg-white border border-slate-200 rounded p-12 text-center text-slate-500 text-sm">
            No report data currently available. Click "Refresh" above to execute MongoDB pipelines.
          </div>
        )
      )}
    </div>
  );
};
