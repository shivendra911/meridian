import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export interface EligibilityRuleItem {
  id?: string;
  label: string;
  required: string;
  actual: string;
  met: boolean;
  remediable?: string;
}

export interface EligibilityLedgerProps {
  rules: EligibilityRuleItem[];
  overallEligible: boolean;
  className?: string;
}

export const EligibilityLedger: React.FC<EligibilityLedgerProps> = ({
  rules,
  overallEligible,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-xs ${className}`}
      role="region"
      aria-label="Eligibility Breakdown"
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
        <h3 className="text-sm font-semibold text-ink m-0">Eligibility Ledger</h3>
        <div className="flex items-center gap-1.5">
          {overallEligible ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-bg text-success border border-success-border">
              <CheckCircle2 size={13} /> Eligible to Apply
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-bg text-danger border border-danger-border">
              <XCircle size={13} /> Not Eligible
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-line/60">
        {rules.map((rule, idx) => (
          <div key={rule.id || idx} className="py-2.5 flex items-start justify-between gap-3 text-xs">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {rule.met ? (
                  <CheckCircle2 size={14} className="text-success shrink-0" aria-label="Met" />
                ) : (
                  <XCircle size={14} className="text-danger shrink-0" aria-label="Not Met" />
                )}
                <span className="font-semibold text-ink">{rule.label}</span>
              </div>
              <p className="text-ink-muted mt-0.5 ml-5 m-0">
                Requirement: <span className="font-medium text-ink">{rule.required}</span> (Your record: <span className="font-medium text-ink">{rule.actual}</span>)
              </p>
              {rule.remediable && !rule.met && (
                <p className="text-warning ml-5 mt-1 m-0 flex items-center gap-1 text-[11px] font-medium">
                  <AlertTriangle size={12} /> {rule.remediable}
                </p>
              )}
            </div>

            <span
              className={`shrink-0 font-medium px-2 py-0.5 rounded text-[11px] ${
                rule.met ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
              }`}
            >
              {rule.met ? 'Satisfied' : 'Action Needed'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
